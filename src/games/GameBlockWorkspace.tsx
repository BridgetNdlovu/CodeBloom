import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ForwardedRef,
} from "react";
import * as Blockly from "blockly";
import {
  compileWorkspace,
  ensureGameBlocks,
  loadXml,
  starterXmlFor,
  toolboxXmlFor,
  workspaceToXml,
  type CompiledProgram,
} from "./blocks";

/**
 * React wrapper around the CodeBloom game Blockly workspace.
 *
 * The toolbox is rebuilt for each game mode so learners only see blocks the
 * runtime can actually execute.
 */

export interface GameBlockWorkspaceHandle {
  compile: () => CompiledProgram;
  getXml: () => string;
  loadXml: (xml: string) => void;
  loadStarter: () => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  resize: () => void;
}

export interface GameBlockWorkspaceProps {
  mode: string;
  initialXml?: string;
  readOnly?: boolean;
  className?: string;
  onDirty?: () => void;
}

function GameBlockWorkspaceInner(
  {
    mode,
    initialXml,
    readOnly = false,
    className = "",
    onDirty,
  }: GameBlockWorkspaceProps,
  ref: ForwardedRef<GameBlockWorkspaceHandle>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const loadedRef = useRef<string>("");
  const suppressRef = useRef(false);
  const dirtyRef = useRef(onDirty);
  useEffect(() => {
    dirtyRef.current = onDirty;
  }, [onDirty]);

  useEffect(() => {
    ensureGameBlocks();
    const container = containerRef.current;
    if (!container) return;

    const workspace = Blockly.inject(container, {
      toolbox: toolboxXmlFor(mode),
      renderer: "zelos",
      sounds: false,
      readOnly,
      maxBlocks: 400,
      trashcan: true,
      grid: { spacing: 24, length: 2, colour: "#d7f0e0", snap: false },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.78,
        minScale: 0.4,
        maxScale: 1.6,
      },
      move: { scrollbars: true, drag: true, wheel: true },
    });
    workspaceRef.current = workspace;

    const onChange = (event: Blockly.Events.Abstract) => {
      if (event.isUiEvent || suppressRef.current) return;
      dirtyRef.current?.();
    };
    workspace.addChangeListener(onChange);

    const observer = new ResizeObserver(() => Blockly.svgResize(workspace));
    observer.observe(container);
    const timer = window.setTimeout(() => Blockly.svgResize(workspace), 80);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      workspace.removeChangeListener(onChange);
      workspace.dispose();
      workspaceRef.current = null;
      loadedRef.current = "";
    };
    // Rebuild when the mission/mode changes.
  }, [mode, readOnly]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const initial = initialXml ?? starterXmlFor(mode);
    if (initial === loadedRef.current) return;
    suppressRef.current = true;
    loadXml(workspace, initial);
    loadedRef.current = initial;
    window.setTimeout(() => {
      suppressRef.current = false;
    }, 0);
  }, [initialXml, mode]);

  useImperativeHandle(
    ref,
    () => ({
      compile: () => {
        const workspace = workspaceRef.current;
        if (!workspace) {
          return {
            main: [],
            onClick: [],
            onKey: [],
            functions: {},
            blockCount: 0,
            xml: "",
            summary: "",
          };
        }
        return compileWorkspace(workspace);
      },
      getXml: () => {
        const workspace = workspaceRef.current;
        return workspace ? workspaceToXml(workspace) : initialXml ?? "";
      },
      loadXml: (xml: string) => {
        const workspace = workspaceRef.current;
        if (!workspace) return;
        suppressRef.current = true;
        loadXml(workspace, xml);
        loadedRef.current = xml;
        window.setTimeout(() => {
          suppressRef.current = false;
        }, 0);
        Blockly.svgResize(workspace);
      },
      loadStarter: () => {
        const workspace = workspaceRef.current;
        if (!workspace) return;
        suppressRef.current = true;
        loadXml(workspace, starterXmlFor(mode));
        window.setTimeout(() => {
          suppressRef.current = false;
        }, 0);
        Blockly.svgResize(workspace);
      },
      clear: () => {
        workspaceRef.current?.clear();
      },
      undo: () => {
        workspaceRef.current?.undo(false);
      },
      redo: () => {
        workspaceRef.current?.undo(true);
      },
      resize: () => {
        if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
      },
    }),
    [initialXml, mode],
  );

  return (
    <div
      ref={containerRef}
      className={`cb-blockly-host cb-game-blockly${className ? ` ${className}` : ""}`}
      aria-label="Game block workspace"
    />
  );
}

export const GameBlockWorkspace = forwardRef(GameBlockWorkspaceInner);
