import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { AssetArt } from "../../game/assets";
import { BackgroundArt } from "../../game/backgrounds";
import type {
  RuntimeSprite,
  RuntimeState,
  Scene,
} from "../../game/types";

/**
 * The shared stage used by the game library preview, the player and the studio.
 *
 * It draws the same scene in three modes:
 *  - thumbnails and previews render the saved scene;
 *  - play mode renders the live RuntimeState;
 *  - studio mode allows selecting and dragging sprites.
 */

export interface SceneStageProps {
  scene: Scene;
  state?: RuntimeState | null;
  selectedId?: string | null;
  editable?: boolean;
  thumbnail?: boolean;
  className?: string;
  label?: string;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onSpriteClick?: (id: string) => void;
  onStagePointer?: (x: number, y: number, down: boolean) => void;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  pointerX: number;
  pointerY: number;
  moved: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function spriteStyle(sprite: RuntimeSprite): CSSProperties {
  const style: CSSProperties = {
    left: `${(sprite.x / 960) * 100}%`,
    top: `${(sprite.y / 540) * 100}%`,
    width: `${Math.max(5, 9 * sprite.size)}%`,
    zIndex: Math.round(sprite.layer * 10) + 10,
    opacity: sprite.visible === false ? 0 : (sprite.opacity ?? 1),
    transform: `translate(-50%, -50%) scaleX(${sprite.flip ? -1 : 1})`,
    filter: sprite.effect
      ? `hue-rotate(${sprite.effect}deg)`
      : undefined,
  };
  return style;
}

export function SceneStage({
  scene,
  state,
  selectedId,
  editable = false,
  thumbnail = false,
  className = "",
  label,
  onSelect,
  onMove,
  onSpriteClick,
  onStagePointer,
}: SceneStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dragging, setDragging] = useState(false);

  const sprites: RuntimeSprite[] = state?.sprites ?? scene.sprites;
  const background = state?.background ?? scene.background;

  const pointToStage = (event: PointerEvent): { x: number; y: number } | null => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 960, 0, 960),
      y: clamp(((event.clientY - rect.top) / rect.height) * 540, 0, 540),
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const point = pointToStage(event);
    if (!point) return;
    onStagePointer?.(point.x, point.y, dragRef.current !== null);
    const drag = dragRef.current;
    if (!drag || !onMove) return;
    const dx = point.x - drag.pointerX;
    const dy = point.y - drag.pointerY;
    if (Math.abs(dx) + Math.abs(dy) > 1) drag.moved = true;
    if (drag.moved) {
      onMove(drag.id, clamp(drag.startX + dx, 16, 944), clamp(drag.startY + dy, 16, 524));
    }
  };

  const endDrag = (event?: PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setDragging(false);
    if (event && onStagePointer) {
      const point = pointToStage(event);
      if (point) onStagePointer(point.x, point.y, false);
    }
  };

  const handleSpriteDown = (sprite: RuntimeSprite) => (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onSelect?.(sprite.id);
    if (!editable) {
      const point = pointToStage(event);
      if (point) onStagePointer?.(point.x, point.y, true);
      onSpriteClick?.(sprite.id);
      return;
    }
    const point = pointToStage(event);
    if (!point) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      id: sprite.id,
      startX: sprite.x,
      startY: sprite.y,
      pointerX: point.x,
      pointerY: point.y,
      moved: false,
    };
    setDragging(true);
  };

  const handleStageDown = (event: PointerEvent<HTMLDivElement>) => {
    if (editable) onSelect?.(null);
    const point = pointToStage(event);
    if (point) onStagePointer?.(point.x, point.y, true);
  };

  return (
    <div
      ref={stageRef}
      className={`cb-scene-stage${thumbnail ? " cb-scene-thumb" : ""}${editable ? " cb-scene-editable" : ""}${dragging ? " cb-scene-dragging" : ""}${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={label ?? `Scene: ${scene.sprites.length} sprites on ${background}`}
      onPointerDown={handleStageDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
      onContextMenu={(event) => {
        if (editable) event.preventDefault();
      }}
    >
      <div className="cb-scene-backdrop" aria-hidden>
        <BackgroundArt background={background} />
      </div>

      {sprites
        .slice()
        .sort((a, b) => a.layer - b.layer)
        .map((sprite) => {
          const isSelected = editable && selectedId === sprite.id;
          const speaking = sprite.speaking;
          const thinking = sprite.thinking;
          return (
            <div
              key={sprite.id}
              className={`cb-stage-sprite cb-anim-${sprite.animation}${isSelected ? " selected" : ""}${sprite.collected ? " collected" : ""}${sprite.visible === false ? " hidden" : ""}`}
              style={spriteStyle(sprite)}
              data-sprite={sprite.id}
              onPointerDown={handleSpriteDown(sprite)}
              title={sprite.name}
            >
              <AssetArt
                assetKey={sprite.asset}
                costume={sprite.costume}
                tint={sprite.tint}
              />
              {isSelected ? <span className="cb-sprite-handle" aria-hidden /> : null}
              {speaking ? (
                <span className="cb-speech-bubble" role="status">
                  {speaking}
                </span>
              ) : null}
              {thinking ? (
                <span className="cb-think-bubble" role="status">
                  {thinking}
                  <i aria-hidden />
                </span>
              ) : null}
            </div>
          );
        })}

      {editable ? (
        <div className="cb-stage-hint" aria-hidden>
          Drag sprites to move them
        </div>
      ) : null}
    </div>
  );
}
