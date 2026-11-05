import { useEffect, useState } from "react";
import {
  Archive,
  BarChart3,
  CheckCircle,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge, EmptyState, PageHeader } from "../../components/ui/inputs";
import {
  archiveMission,
  changeUserRole,
  changeUserStatus,
  getAdminAnalytics,
  getAdminMissions,
  getAdminUsers,
  getAdminWorlds,
  getAuditLogs,
  getPlatformSettings,
  publishMission,
  updatePlatformSetting,
  type AnalyticsDto,
  type AuditLogDto,
  type MissionAdminDto,
  type PlatformSettingDto,
  type UserListDto,
  type WorldDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const ROLES = ["student", "instructor", "admin"];

export function AdminDashboard() {
  const { learner } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const [analytics, setAnalytics] = useState<AnalyticsDto | null>(null);
  const [users, setUsers] = useState<UserListDto[]>([]);
  const [worlds, setWorlds] = useState<WorldDto[]>([]);
  const [missions, setMissions] = useState<MissionAdminDto[]>([]);
  const [settings, setSettings] = useState<PlatformSettingDto[]>([]);
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [workingUser, setWorkingUser] = useState<string | null>(null);
  const [savingSetting, setSavingSetting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [analyticsData, usersData, worldsData, missionsData, settingsData, logsData] =
          await Promise.all([
            getAdminAnalytics(),
            getAdminUsers(),
            getAdminWorlds(),
            getAdminMissions(),
            getPlatformSettings(),
            getAuditLogs().catch(() => []),
          ]);
        if (cancelled) return;
        setAnalytics(analyticsData);
        setUsers(usersData);
        setWorlds(worldsData);
        setMissions(missionsData);
        setSettings(settingsData);
        setLogs(Array.isArray(logsData) ? logsData : []);
      } catch (err) {
        if (!cancelled) setError(toAuthError(err, "Unable to load admin data.").message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const changeRole = async (user: UserListDto, role: string) => {
    setWorkingUser(user.id);
    setError(undefined);
    try {
      await changeUserRole(user.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
      setNotice(`Updated ${user.username} to ${role}.`);
    } catch (err) {
      setError(toAuthError(err, "Unable to change this user's role.").message);
    } finally {
      setWorkingUser(null);
    }
  };

  const toggleStatus = async (user: UserListDto) => {
    const next = user.accountStatus === "active" ? "suspended" : "active";
    setWorkingUser(user.id);
    setError(undefined);
    try {
      await changeUserStatus(user.id, next);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, accountStatus: next } : u)),
      );
      setNotice(`${user.username} is now ${next}.`);
    } catch (err) {
      setError(toAuthError(err, "Unable to change this account's status.").message);
    } finally {
      setWorkingUser(null);
    }
  };

  const togglePublish = async (mission: MissionAdminDto) => {
    setError(undefined);
    try {
      await publishMission(mission.id, !mission.isPublished);
      setMissions((prev) =>
        prev.map((m) =>
          m.id === mission.id ? { ...m, isPublished: !m.isPublished } : m,
        ),
      );
    } catch (err) {
      setError(toAuthError(err, "Unable to update mission publishing.").message);
    }
  };

  const handleArchive = async (mission: MissionAdminDto) => {
    if (!window.confirm(`Archive "${mission.title}"? Students will lose access.`)) return;
    setError(undefined);
    try {
      await archiveMission(mission.id);
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? { ...m, isArchived: true, isPublished: false } : m)),
      );
    } catch (err) {
      setError(toAuthError(err, "Unable to archive this mission.").message);
    }
  };

  const saveSetting = async (setting: PlatformSettingDto, value: string) => {
    setSavingSetting(setting.key);
    setError(undefined);
    try {
      const result = await updatePlatformSetting(setting.key, value);
      setSettings((prev) =>
        prev.map((s) => (s.key === setting.key ? { ...s, value: result.value } : s)),
      );
      setNotice(`Saved setting ${setting.key}.`);
    } catch (err) {
      setError(toAuthError(err, "Unable to save this setting.").message);
    } finally {
      setSavingSetting(null);
    }
  };

  if (loading) {
    return (
      <div className="cb-page-pad">
        <div className="cb-container" style={{ paddingBlock: "var(--cb-space-12)" }}>
          <div className="cb-loading" role="status">
            <span className="cb-spinner" aria-hidden />
            <span>Loading administration…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cb-page-pad">
      <div className="cb-container">
        <PageHeader
          title="Administration"
          subtitle={`Signed in as ${learner?.displayName ?? "administrator"}. Manage accounts, content and platform settings.`}
        />

        {error ? (
          <p className="cb-field-error" role="alert" style={{ marginBottom: "var(--cb-space-4)" }}>
            {error}
          </p>
        ) : null}
        {notice ? (
          <p style={{ color: "var(--cb-green-dark)", marginBottom: "var(--cb-space-4)" }} role="status">
            {notice}
          </p>
        ) : null}

        {analytics ? (
          <section className="cb-dash-section" aria-label="Platform analytics">
            <div className="cb-stat-grid">
              {[
                { label: "Total users", value: analytics.totalUsers, icon: Users },
                { label: "Students", value: analytics.totalStudents, icon: Users },
                { label: "Missions", value: analytics.totalMissions, icon: BarChart3 },
                { label: "Completions", value: analytics.totalMissionCompletions, icon: CheckCircle },
                { label: "Attempts", value: analytics.totalAttempts, icon: BarChart3 },
                { label: "Points awarded", value: analytics.totalPointsAwarded, icon: ShieldCheck },
              ].map((card) => (
                <div key={card.label} className="cb-stat-card">
                  <div className="cb-flex cb-flex-between">
                    <span className="cb-stat-value">{card.value}</span>
                    <card.icon size={22} aria-hidden style={{ color: "var(--cb-green)" }} />
                  </div>
                  <span className="cb-stat-label">{card.label}</span>
                </div>
              ))}
            </div>
            {Object.keys(analytics.completionsByWorld ?? {}).length > 0 ? (
              <div className="cb-card cb-card-pad" style={{ marginTop: "var(--cb-space-4)" }}>
                <h3 className="cb-section-title" style={{ fontSize: "1.05rem" }}>Completions by world</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {Object.entries(analytics.completionsByWorld).map(([world, count]) => (
                    <li key={world} className="cb-flex cb-flex-between" style={{ padding: "var(--cb-space-2) 0" }}>
                      <span>{world}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="cb-dash-section" aria-label="User management">
          <h2 className="cb-section-title">Users</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--cb-border)" }}>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--cb-border)" }}>
                    <td style={tdStyle}>
                      <strong>{user.displayName || user.username}</strong>
                      <div className="cb-muted" style={{ fontSize: "0.8rem" }}>
                        {user.email}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <select
                        className="cb-input"
                        value={user.role}
                        disabled={workingUser === user.id}
                        onChange={(e) => void changeRole(user, e.target.value)}
                        aria-label={`Role for ${user.username}`}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <Badge variant={user.accountStatus === "active" ? "default" : "warning"}>
                        {user.accountStatus}
                      </Badge>
                    </td>
                    <td style={tdStyle}>{user.totalPoints}</td>
                    <td style={tdStyle}>
                      <Button
                        size="sm"
                        variant={user.accountStatus === "active" ? "danger" : "secondary"}
                        disabled={workingUser === user.id}
                        onClick={() => void toggleStatus(user)}
                      >
                        {user.accountStatus === "active" ? "Suspend" : "Reactivate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 ? <p className="cb-body-text">No users found.</p> : null}
        </section>

        <section className="cb-dash-section" aria-label="Mission management">
          <h2 className="cb-section-title">Missions</h2>
          <p className="cb-body-text">
            Worlds: {worlds.map((w) => w.name).join(" · ") || "No worlds"}
          </p>
          <div style={{ display: "grid", gap: "var(--cb-space-3)" }}>
            {missions.map((mission) => (
              <article key={mission.id} className="cb-card cb-card-pad">
                <div className="cb-flex cb-flex-between" style={{ flexWrap: "wrap", gap: "var(--cb-space-3)" }}>
                  <div>
                    <strong>{mission.title}</strong>
                    <div className="cb-muted" style={{ fontSize: "0.85rem" }}>
                      {mission.worldKey} · {mission.key} · {mission.difficulty} · v{mission.version}
                    </div>
                  </div>
                  <div className="cb-flex" style={{ gap: "var(--cb-space-2)", flexWrap: "wrap" }}>
                    <Badge variant={mission.isArchived ? "soft" : mission.isPublished ? "default" : "warning"}>
                      {mission.isArchived ? "archived" : mission.isPublished ? "published" : "draft"}
                    </Badge>
                    {!mission.isArchived ? (
                      <Button size="sm" variant="secondary" onClick={() => void togglePublish(mission)}>
                        {mission.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                    ) : null}
                    {!mission.isArchived ? (
                      <Button size="sm" variant="danger" onClick={() => void handleArchive(mission)}>
                        <Archive size={15} aria-hidden />
                        Archive
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
            {missions.length === 0 ? <p className="cb-body-text">No missions found.</p> : null}
          </div>
        </section>

        <section className="cb-dash-section" aria-label="Platform settings">
          <h2 className="cb-section-title">
            <SettingsIcon size={18} aria-hidden /> Platform settings
          </h2>
          {settings.length === 0 ? (
            <p className="cb-body-text">No platform settings are configured.</p>
          ) : (
            <div style={{ display: "grid", gap: "var(--cb-space-3)" }}>
              {settings.map((setting) => (
                <SettingRow
                  key={setting.key}
                  setting={setting}
                  saving={savingSetting === setting.key}
                  onSave={(value) => void saveSetting(setting, value)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="cb-dash-section" aria-label="Audit log">
          <h2 className="cb-section-title">Recent audit events</h2>
          {logs.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck size={40} aria-hidden style={{ color: "var(--cb-green)" }} />}
              title="No audit events yet"
              message="Administrative and learning events will appear here as they happen."
            />
          ) : (
            <div className="cb-card cb-card-pad">
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "var(--cb-space-2)" }}>
                {logs.slice(0, 50).map((log) => (
                  <li key={log.id} className="cb-flex cb-flex-between" style={{ gap: "var(--cb-space-3)" }}>
                    <span>
                      <strong>{log.eventType}</strong>
                      {log.target ? <span className="cb-muted"> · {log.target}</span> : null}
                    </span>
                    <span className="cb-muted" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SettingRow({
  setting,
  saving,
  onSave,
}: {
  setting: PlatformSettingDto;
  saving: boolean;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(setting.value ?? "");
  return (
    <div className="cb-card cb-card-pad">
      <div className="cb-flex cb-flex-between" style={{ flexWrap: "wrap", gap: "var(--cb-space-3)" }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <strong>{setting.key}</strong>
          {setting.description ? (
            <div className="cb-muted" style={{ fontSize: "0.85rem" }}>{setting.description}</div>
          ) : null}
        </div>
        <div className="cb-flex" style={{ gap: "var(--cb-space-2)", flex: 1, minWidth: 220 }}>
          <input
            className="cb-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`Value for ${setting.key}`}
          />
          <Button size="sm" loading={saving} disabled={saving} onClick={() => onSave(value)}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "var(--cb-space-3)",
  color: "var(--cb-muted)",
  fontSize: "0.85rem",
  fontWeight: 700,
};

const tdStyle = { padding: "var(--cb-space-3)", verticalAlign: "middle" };
