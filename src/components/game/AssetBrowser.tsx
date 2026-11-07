import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  ASSET_CATEGORIES,
  AssetArt,
  allAssets,
  getAsset,
} from "../../game/assets";
import {
  BACKGROUND_CATEGORIES,
  BackgroundArt,
  backgroundList,
} from "../../game/backgrounds";
import type { AssetCategory, SpriteRole } from "../../game/types";

/**
 * Library drawer for adding sprites and picking backgrounds.
 * Everything in here is original SVG art generated in the browser.
 */

const ROLES: Array<{ value: SpriteRole; label: string; hint: string }> = [
  { value: "player", label: "Player", hint: "Controlled by your code" },
  { value: "collectible", label: "Collectible", hint: "Scores 50 points" },
  { value: "goal", label: "Goal", hint: "Reach it to win" },
  { value: "obstacle", label: "Obstacle", hint: "Costs a heart" },
  { value: "decoration", label: "Scenery", hint: "No rules" },
  { value: "npc", label: "Character", hint: "For stories and clicks" },
];

export interface AssetBrowserProps {
  open: boolean;
  onClose: () => void;
  onAddSprite: (assetKey: string, role: SpriteRole) => void;
  onChooseBackground: (backgroundKey: string) => void;
  currentBackground?: string;
  initialTab?: "sprites" | "backgrounds";
}

export function AssetBrowser({
  open,
  onClose,
  onAddSprite,
  onChooseBackground,
  currentBackground,
  initialTab = "sprites",
}: AssetBrowserProps) {
  const [tab, setTab] = useState<"sprites" | "backgrounds">(initialTab);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AssetCategory | "All">("All");
  const [backgroundCategory, setBackgroundCategory] = useState<string>("All");
  const [role, setRole] = useState<SpriteRole>("decoration");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Opening the drawer syncs its tab to the parent's selected section.
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  const assets = useMemo(() => {
    const search = query.trim().toLowerCase();
    return allAssets().filter((asset) => {
      if (category !== "All" && asset.category !== category) return false;
      if (!search) return true;
      return (
        asset.name.toLowerCase().includes(search) ||
        asset.key.toLowerCase().includes(search) ||
        asset.category.toLowerCase().includes(search) ||
        asset.tags.some((tag) => tag.includes(search))
      );
    });
  }, [query, category]);

  const backgrounds = useMemo(() => {
    const search = query.trim().toLowerCase();
    return backgroundList().filter((background) => {
      if (backgroundCategory !== "All" && background.category !== backgroundCategory)
        return false;
      if (!search) return true;
      return (
        background.name.toLowerCase().includes(search) ||
        background.category.toLowerCase().includes(search) ||
        background.tags.some((tag) => tag.includes(search))
      );
    });
  }, [query, backgroundCategory]);

  if (!open) return null;

  return (
    <div className="cb-drawer-backdrop" role="presentation" onClick={onClose}>
      <section
        className="cb-asset-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Sprite and background library"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cb-drawer-head">
          <div>
            <h2>Creative library</h2>
            <p>
              {allAssets().length} original characters, animals, objects and effects,
              plus {backgroundList().length} painted backgrounds.
            </p>
          </div>
          <button
            type="button"
            className="cb-icon-btn"
            onClick={onClose}
            aria-label="Close library"
          >
            <X size={20} />
          </button>
        </header>

        <div className="cb-drawer-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "sprites"}
            className={tab === "sprites" ? "active" : ""}
            onClick={() => setTab("sprites")}
          >
            Sprites
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "backgrounds"}
            className={tab === "backgrounds" ? "active" : ""}
            onClick={() => setTab("backgrounds")}
          >
            Backgrounds
          </button>
        </div>

        <div className="cb-drawer-search">
          <Search size={16} aria-hidden />
          <input
            type="search"
            value={query}
            placeholder={
              tab === "sprites" ? "Search cats, rockets, candy..." : "Search forest, city, space..."
            }
            aria-label="Search the library"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="cb-icon-btn"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {tab === "sprites" ? (
          <>
            <div className="cb-role-picker" role="group" aria-label="Add as role">
              <span>Add as</span>
              {ROLES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={role === item.value ? "active" : ""}
                  title={item.hint}
                  onClick={() => setRole(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="cb-chip-row" role="group" aria-label="Sprite category">
              <button
                type="button"
                className={category === "All" ? "active" : ""}
                onClick={() => setCategory("All")}
              >
                All
              </button>
              {ASSET_CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="cb-chip-row" role="group" aria-label="Background category">
            <button
              type="button"
              className={backgroundCategory === "All" ? "active" : ""}
              onClick={() => setBackgroundCategory("All")}
            >
              All
            </button>
            {BACKGROUND_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                className={backgroundCategory === item ? "active" : ""}
                onClick={() => setBackgroundCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <div className="cb-drawer-body">
          {tab === "sprites" ? (
            assets.length === 0 ? (
              <p className="cb-empty-note">No sprites match that search.</p>
            ) : (
              <div className="cb-asset-grid">
                {assets.map((asset) => (
                  <button
                    key={asset.key}
                    type="button"
                    className="cb-asset-card"
                    onClick={() => onAddSprite(asset.key, role)}
                    title={`Add ${asset.name} as ${role}`}
                  >
                    <span className="cb-asset-thumb">
                      <AssetArt assetKey={asset.key} costume={0} />
                    </span>
                    <span className="cb-asset-name">{asset.name}</span>
                    <span className="cb-asset-meta">
                      {getAsset(asset.key)?.category}
                      {asset.costumes > 1 ? ` · ${asset.costumes} costumes` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : backgrounds.length === 0 ? (
            <p className="cb-empty-note">No backgrounds match that search.</p>
          ) : (
            <div className="cb-background-grid">
              {backgrounds.map((background) => (
                <button
                  key={background.key}
                  type="button"
                  className={`cb-background-card${currentBackground === background.key ? " active" : ""}`}
                  onClick={() => onChooseBackground(background.key)}
                  title={`Use ${background.name}`}
                >
                  <span className="cb-background-thumb">
                    <BackgroundArt background={background.key} />
                  </span>
                  <span className="cb-asset-name">{background.name}</span>
                  <span className="cb-asset-meta">{background.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
