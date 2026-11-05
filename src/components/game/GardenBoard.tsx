import { memo } from "react";
import { AssetArt } from "../../game/assets";
import { BackgroundArt } from "../../game/backgrounds";
import type { GameState } from "./gameEngine";

interface GardenBoardProps {
  state: GameState;
  running: boolean;
}

/**
 * The guided-mission board. The grid engine and scoring are unchanged; this is
 * the same state rendered with the studio artwork so missions and free play
 * feel like one product.
 */
export const GardenBoard = memo(function GardenBoard({
  state,
  running,
}: GardenBoardProps) {
  const { cols, rows } = state;
  const inBloomCell = state.x === state.start.x && state.y === state.start.y;
  const obstacles = state.obstacles ?? [];

  const posStyle = (x: number, y: number) => ({
    left: `${((x + 0.5) / cols) * 100}%`,
    top: `${((y + 0.5) / rows) * 100}%`,
  });

  const cells = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const key = `${x}-${y}`;
      const isGoal = key === `${state.goal.x}-${state.goal.y}`;
      const isStart = key === `${state.start.x}-${state.start.y}`;
      const isBloom = key === `${state.x}-${state.y}`;
      const isObstacle = obstacles.some((o) => o.x === x && o.y === y);
      const classes = ["cb-garden-cell"];
      if (isGoal) classes.push("cb-garden-cell-goal");
      if (isStart) classes.push("cb-garden-cell-start");
      if (isBloom) classes.push("cb-garden-cell-bloom");
      if (isObstacle) classes.push("cb-garden-cell-obstacle");
      cells.push(
        <div
          key={key}
          className={classes.join(" ")}
          data-testid={`garden-cell-${x}-${y}`}
        >
          {isObstacle ? (
            <span className="cb-garden-obstacle-art" aria-hidden>
              <AssetArt assetKey="hedge" costume={1} />
            </span>
          ) : null}
        </div>,
      );
    }
  }

  return (
    <div
      className="cb-garden-board"
      data-running={running}
      role="img"
      aria-label={`Bloom's garden game board. Bloom is at column ${state.x + 1}, row ${state.y + 1}. The sunflower is at column ${state.goal.x + 1}, row ${state.goal.y + 1}.`}
    >
      <div className="cb-garden-backdrop" aria-hidden>
        <BackgroundArt background="garden-day" />
      </div>
      <div
        className="cb-garden-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          aspectRatio: `${cols} / ${rows}`,
        }}
        aria-hidden
      >
        {cells}
      </div>

      <div
        className="cb-garden-entity cb-garden-goal"
        style={posStyle(state.goal.x, state.goal.y)}
        data-testid="garden-goal"
      >
        <span className="cb-garden-goal-art" aria-hidden>
          <AssetArt assetKey="sunflower" costume={0} />
        </span>
      </div>

      <div
        className={`cb-garden-entity cb-garden-bloom${inBloomCell ? " cb-bloom-start" : ""}`}
        style={posStyle(state.x, state.y)}
        data-testid="garden-bloom"
      >
        <span className="cb-garden-bloom-art" aria-hidden>
          <AssetArt assetKey="bloom" costume={inBloomCell ? 2 : 0} />
        </span>
      </div>

      {!inBloomCell ? (
        <div
          className="cb-garden-entity cb-garden-start-marker"
          style={posStyle(state.start.x, state.start.y)}
        >
          <span className="cb-garden-start-flag" aria-hidden />
        </div>
      ) : null}
    </div>
  );
});
