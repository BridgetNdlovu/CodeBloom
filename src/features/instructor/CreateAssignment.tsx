import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ErrorMessage, Field, PageHeader, TextInput } from "../../components/ui/inputs";
import {
  createAssignment,
  getInstructorClasses,
  getWorlds,
  getWorldMissions,
  type ClassDto,
  type MissionDto,
  type WorldDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";

interface MissionOption extends MissionDto {
  worldName: string;
}

export function CreateAssignment() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState<string>("");
  const [missionIds, setMissionIds] = useState<number[]>([]);
  const [deadline, setDeadline] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [missions, setMissions] = useState<MissionOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [classData, worldData] = await Promise.all([
          getInstructorClasses(),
          getWorlds(),
        ]);
        const publishedWorlds = (Array.isArray(worldData) ? worldData : []).filter(
          (w: WorldDto) => w.isPublished,
        );
        const missionGroups = await Promise.all(
          publishedWorlds.map(async (world) => {
            const list = await getWorldMissions(world.id).catch(() => []);
            return (Array.isArray(list) ? list : [])
              .filter((m) => m.isPublished && !m.isArchived)
              .map((m) => ({ ...m, worldName: world.name }));
          }),
        );
        if (cancelled) return;
        setClasses(Array.isArray(classData) ? classData : []);
        setMissions(missionGroups.flat());
      } catch (err) {
        if (!cancelled) {
          setOptionsError(toAuthError(err, "Unable to load classes and missions.").message);
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (title.trim().length < 1) next.title = "Please enter an assignment title.";
    if (missionIds.length === 0) next.missions = "Select at least one mission.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const toggleMission = (id: number) => {
    setMissionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(undefined);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createAssignment({
        title: title.trim(),
        description: description.trim() || undefined,
        classId: classId ? Number(classId) : undefined,
        missionIds,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
      navigate("/app/instructor/assignments");
    } catch (err) {
      setFormError(toAuthError(err, "Unable to create assignment.").message);
    } finally {
      setSubmitting(false);
    }
  };

  const grouped = missions.reduce<Record<string, MissionOption[]>>((acc, mission) => {
    (acc[mission.worldName] ??= []).push(mission);
    return acc;
  }, {});

  return (
    <div className="cb-page-pad">
      <div className="cb-container" style={{ maxWidth: 760 }}>
        <PageHeader
          title="Create Assignment"
          subtitle="Choose real published missions and assign them to one of your classes."
          actions={
            <Link to="/app/instructor/assignments" className="cb-btn cb-btn-secondary cb-btn-sm">
              Back to assignments
            </Link>
          }
        />

        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <Field label="Title" required error={errors.title}>
            <TextInput
              id="assignment-title"
              name="title"
              autoComplete="off"
              placeholder="e.g. Week 1: Sequencing Basics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <Field label="Description">
            <TextInput
              id="assignment-description"
              name="description"
              autoComplete="off"
              placeholder="What should students complete?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <Field label="Class" hint="Optional. Leave blank for all of your classes.">
            <select
              id="assignment-class"
              name="classId"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="cb-input"
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.studentCount} student{c.studentCount === 1 ? "" : "s"})
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Missions"
            hint="Select one or more published missions for this assignment."
            error={errors.missions}
          >
            {loadingOptions ? (
              <p className="cb-body-text">Loading missions…</p>
            ) : optionsError ? (
              <p className="cb-field-error" role="alert">{optionsError}</p>
            ) : missions.length === 0 ? (
              <p className="cb-body-text">
                No published missions are available yet. An administrator can publish missions
                from the administration dashboard.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "var(--cb-space-4)" }}>
                {Object.entries(grouped).map(([worldName, list]) => (
                  <div key={worldName}>
                    <div className="cb-field-label" style={{ marginBottom: "var(--cb-space-2)" }}>
                      {worldName}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--cb-space-3)" }}>
                      {list.map((m) => (
                        <label
                          key={m.id}
                          className={`cb-char-option${missionIds.includes(m.id) ? " selected" : ""}`}
                          style={{ flexDirection: "row", justifyContent: "space-between", padding: "var(--cb-space-3) var(--cb-space-4)" }}
                        >
                          <span>
                            {m.title}
                            <span className="cb-muted" style={{ display: "block", fontSize: "0.78rem" }}>
                              {m.learningConcept ?? "Coding"} · {m.difficulty}
                            </span>
                          </span>
                          <input
                            type="checkbox"
                            checked={missionIds.includes(m.id)}
                            onChange={() => toggleMission(m.id)}
                            aria-label={`Include ${m.title}`}
                            style={{ width: 18, height: 18 }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <Field label="Deadline (optional)" hint="Students cannot submit after this local date and time.">
            <TextInput
              id="assignment-deadline"
              name="deadline"
              type="datetime-local"
              autoComplete="off"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>

          {formError ? <ErrorMessage message={formError} /> : null}

          <div className="cb-hero-actions" style={{ marginTop: "var(--cb-space-6)", gap: "var(--cb-space-3)" }}>
            <Button
              type="submit"
              size="lg"
              loading={submitting}
              disabled={submitting || loadingOptions || missions.length === 0}
            >
              <Compass size={18} aria-hidden />
              Publish Assignment
            </Button>
            <Link to="/app/instructor/assignments" className="cb-btn cb-btn-secondary cb-btn-sm">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
