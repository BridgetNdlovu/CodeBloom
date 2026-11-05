import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Gamepad2,
  Puzzle,
  Search,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/inputs";
import {
  getGames,
  getGamesProgress,
  type GameDto,
  type GameProgressDto,
} from "../../services/apiClient";
import { toAuthError } from "../../services/authService";
import {
  CATEGORY_TABS,
  GAMES,
  type GameCategory,
  type GameSpec,
} from "../../games/catalogue";

type TabKey = "all" | GameCategory | "recent" | "completed";

interface LiveGame {
  dto: GameDto;
  spec: GameSpec;
  progress?: GameProgressDto;
}

export function GameLibrary() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameDto[]>([]);
  const [progress, setProgress] = useState<GameProgressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getGames(), getGamesProgress()])
      .then(([catalogue, progressRows]) => {
        if (cancelled) return;
        setGames(catalogue);
        setProgress(progressRows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(toAuthError(err, "Unable to load the game library.").message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const live = useMemo<LiveGame[]>(() => {
    const progressByGame = new Map(progress.map((row) => [row.gameId, row]));
    const byKey = new Map(games.map((game) => [game.key, game]));
    return GAMES.flatMap((spec) => {
      const dto = byKey.get(spec.key);
      if (!dto) return [];
      return [{ dto, spec, progress: progressByGame.get(dto.id) }];
    });
  }, [games, progress]);

  const recent = useMemo(
    () =>
      [...live]
        .filter((entry) => entry.progress)
        .sort(
          (a, b) =>
            new Date(b.progress?.lastPlayedAt ?? 0).getTime() -
            new Date(a.progress?.lastPlayedAt ?? 0).getTime(),
        )
        .slice(0, 4),
    [live],
  );

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return live.filter(({ dto, spec, progress: row }) => {
      if (tab === "recent" && !row) return false;
      if (tab === "completed" && (row?.missionsCompleted ?? 0) === 0) return false;
      if (
        tab !== "all" &&
        tab !== "recent" &&
        tab !== "completed" &&
        spec.category !== tab
      ) {
        return false;
      }
      if (!search) return true;
      return (
        dto.title.toLowerCase().includes(search) ||
        dto.description.toLowerCase().includes(search) ||
        spec.categoryLabel.toLowerCase().includes(search) ||
        dto.difficulty.toLowerCase().includes(search) ||
        dto.skills.some((skill) => skill.toLowerCase().includes(search))
      );
    });
  }, [live, tab, query]);

  const featured =
    live.find((entry) => entry.dto.isFeatured) ?? live[0] ?? null;

  const totals = useMemo(() => {
    const stars = progress.reduce((sum, row) => sum + row.totalStars, 0);
    const missions = progress.reduce((sum, row) => sum + row.missionsCompleted, 0);
    const played = progress.length;
    return { stars, missions, played };
  }, [progress]);

  return (
    <div className="cb-library">
      <PageHeader
        title="Game Library"
        subtitle="Pick a ready-made game, open a mission and build real code with blocks. Stars, scores and progress are saved to your account."
        actions={
          <Button
            icon={<ArrowRight size={16} />}
            onClick={() => featured && navigate(`/app/games/${featured.dto.id}`)}
            disabled={!featured}
          >
            Play featured
          </Button>
        }
      />

      <section className="cb-library-hero">
        <div className="cb-library-hero-copy">
          <span className="cb-eyebrow">
            <Sparkles size={14} aria-hidden /> {GAMES.length} games ·{" "}
            {GAMES.reduce((sum, game) => sum + game.missions.length, 0)} missions
          </span>
          <h2>Learn to code by playing.</h2>
          <p>
            Every game runs the blocks you build. Collect treasure, solve mazes,
            race, jump and catch stars — then watch your progress, stars and
            points save automatically.
          </p>
          <div className="cb-hero-points">
            <span>
              <Gamepad2 size={16} aria-hidden /> Real playable Phaser worlds
            </span>
            <span>
              <Puzzle size={16} aria-hidden /> Functional Blockly coding
            </span>
            <span>
              <Trophy size={16} aria-hidden /> Persistent points and badges
            </span>
          </div>
          <div className="cb-library-stats">
            <div>
              <strong>{GAMES.length}</strong>
              <span>games</span>
            </div>
            <div>
              <strong>{totals.stars}</strong>
              <span>stars earned</span>
            </div>
            <div>
              <strong>{totals.missions}</strong>
              <span>missions done</span>
            </div>
            <div>
              <strong>{totals.played}</strong>
              <span>games played</span>
            </div>
          </div>
        </div>
        {featured ? (
          <div className="cb-featured-card">
            <div
              className="cb-featured-thumb cb-cover"
              style={{ background: featured.spec.cover }}
            >
              <span className="cb-cover-emoji" aria-hidden>
                {featured.spec.emoji}
              </span>
              <span className="cb-cover-label">Featured</span>
            </div>
            <div className="cb-featured-body">
              <span className="cb-eyebrow">{featured.spec.categoryLabel}</span>
              <h3>{featured.spec.title}</h3>
              <p>{featured.spec.tagline}</p>
              <div className="cb-game-meta">
                <span>{featured.spec.difficulty}</span>
                <span>{featured.spec.missions.length} missions</span>
                <span>
                  <Clock size={13} aria-hidden /> {featured.spec.estimatedMinutes} min
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/app/games/${featured.dto.id}`)}
              >
                Play now
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {recent.length > 0 ? (
        <section className="cb-recent-strip" aria-label="Recently played">
          <div className="cb-section-head">
            <h2>Continue playing</h2>
            <span>{recent.length} recent</span>
          </div>
          <div className="cb-recent-row">
            {recent.map(({ dto, spec, progress: row }) => (
              <Link
                key={dto.id}
                to={`/app/games/${dto.id}`}
                className="cb-recent-card"
              >
                <div
                  className="cb-recent-thumb cb-cover cb-cover-sm"
                  style={{ background: spec.cover }}
                >
                  <span aria-hidden>{spec.emoji}</span>
                </div>
                <div>
                  <strong>{spec.title}</strong>
                  <span>
                    {row?.missionsCompleted ? (
                      <CheckCircle2 size={13} aria-hidden />
                    ) : null}
                    {row?.missionsCompleted ?? 0}/{spec.missions.length} missions ·{" "}
                    {row?.totalStars ?? 0} stars
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="cb-library-catalogue">
        <div className="cb-section-head">
          <h2>All games</h2>
          <span>{visible.length} showing</span>
        </div>

        <div className="cb-game-filters">
          <div className="cb-drawer-search cb-library-search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              value={query}
              placeholder="Search games, skills or categories"
              aria-label="Search games"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="cb-chip-row cb-library-tabs" role="tablist">
            {CATEGORY_TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                className={tab === item.key ? "active" : ""}
                onClick={() => setTab(item.key as TabKey)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="cb-loading-inline">
            <span className="cb-spinner" aria-hidden /> Loading games…
          </p>
        ) : error ? (
          <div className="cb-card cb-card-pad">
            <p className="cb-body-text">{error}</p>
            <Button size="sm" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        ) : live.length === 0 ? (
          <div className="cb-card cb-card-pad">
            <p className="cb-body-text">
              The game catalogue is not available yet. Ask an instructor to check
              that the database seed has run.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="cb-card cb-card-pad">
            <p className="cb-body-text">
              No games match those filters. Try clearing the search or choosing
              “All Games”.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery("");
                setTab("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="cb-game-grid">
            {visible.map(({ dto, spec, progress: row }) => {
              const completed = (row?.missionsCompleted ?? 0) > 0;
              const totalStars = spec.missions.length * 3;
              return (
                <article key={dto.id} className="cb-game-card">
                  <div
                    className="cb-game-thumb cb-cover"
                    style={{ background: spec.cover }}
                  >
                    <span className="cb-cover-emoji" aria-hidden>
                      {spec.emoji}
                    </span>
                    <span className="cb-cover-category">{spec.categoryLabel}</span>
                    {completed ? (
                      <span className="cb-game-done">
                        <CheckCircle2 size={14} aria-hidden />{" "}
                        {row?.missionsCompleted}/{spec.missions.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="cb-game-info">
                    <div className="cb-game-title-row">
                      <h3>{spec.title}</h3>
                      <span
                        className={`cb-difficulty difficulty-${spec.difficulty.toLowerCase()}`}
                      >
                        {spec.difficulty}
                      </span>
                    </div>
                    <p>{spec.tagline}</p>
                    <div className="cb-game-meta">
                      <span>{spec.missions.length} missions</span>
                      <span>
                        <Star size={12} aria-hidden /> {row?.totalStars ?? 0}/
                        {totalStars}
                      </span>
                      <span>
                        <Clock size={13} aria-hidden /> {spec.estimatedMinutes} min
                      </span>
                    </div>
                    <div className="cb-game-actions">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/app/games/${dto.id}`)}
                      >
                        {row ? "Continue" : "Play"}
                      </Button>
                      {row?.totalScore ? (
                        <span className="cb-game-played">
                          Best score {row.totalScore}
                        </span>
                      ) : (
                        <span className="cb-game-played">{spec.objective}</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
