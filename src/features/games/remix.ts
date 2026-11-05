import { createProject, type GameDto } from "../../services/apiClient";
import { projectFromGame, serializeGameProject } from "../../game/templates";

/**
 * Turn a library game into an editable studio project owned by the learner.
 * The project is persisted through the normal StudentProject API, so it shows
 * up in My Projects alongside everything else.
 */
export async function createRemixProject(game: GameDto): Promise<number> {
  const project = projectFromGame({
    title: game.title,
    tagline: game.tagline ?? game.description,
    description: game.description,
    sceneJson: game.sceneJson,
    starterBlocksJson: game.starterBlocksJson,
  });
  const result = await createProject({
    title: project.title,
    description: project.description,
    content: serializeGameProject(project),
  });
  return result.id;
}
