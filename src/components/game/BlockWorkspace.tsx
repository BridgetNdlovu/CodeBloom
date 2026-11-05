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
  serializeWorkspace,
  toolboxXml,
  xmlToWorkspace,
} from "../../game/blocks";
import type { BlockNode } from "../../game/types";

/**
 * Thin React wrapper around Blockly. The studio and the game player share it so
 * the blocks a learner sees are exactly the blocks the runtime executes.
 */

export interface BlockWorkspaceHandle {
  getXml: () => string;
  getProgram: () => BlockNode[];
  loadXml: (xml: string) => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  resize: () => void;
}

export interface BlockWorkspaceProps {
  initialXml?: string;
  allowedBlocks?: string[] | null;
  readOnly?: boolean;
  className?: string;
  onDirty?: () => void;
}

function BlockWorkspaceInner(
  {
    initialXml,
    allowedBlocks = null,
    readOnly = false,
    className = "",
    onDirty,
  }: BlockWorkspaceProps,
  ref: ForwardedRef<BlockWorkspaceHandle>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const loadedRef = useRef<string>("");
  const suppressRef = useRef(false);
  const dirtyRef = useRef(onDirty);
  dirtyRef.current = onDirty;
  const allowedKey = allowedBlocks ? allowedBlocks.join("|") : "";

  useEffect(() => {
    ensureGameBlocks();
    const container = containerRef.current;
    if (!container) return;

    const workspace = Blockly.inject(container, {
      toolbox: toolboxXml(allowedBlocks),
      renderer: "zelos",
      sounds: false,
      readOnly,
      maxBlocks: 400,
      trashcan: true,
      grid: { spacing: 24, length: 2, colour: "#d7f0e0", snap: false },
      zoom: { controls: true, wheel: true, startScale: 0.8, minScale: 0.4, maxScale: 1.6 },
      move: { scrollbars: true, drag: true, wheel: true },
    });
    workspaceRef.current = workspace;

    const onChange = (event: Blockly.Events.Abstract) => {
      if (event.isUiEvent || suppressRef.current) return;
      dirtyRef.current?.();
    };
    workspace.addChangeListener(onChange);

    const loadInitial = (xml: string) => {
      suppressRef.current = true;
      xmlToWorkspace(xml, workspace);
      loadedRef.current = xml;
      window.setTimeout(() => {
        suppressRef.current = false;
      }, 0);
    };

    if (initialXml) {
      loadInitial(initialXml);
    }

    const observer = new ResizeObserver(() => {
      Blockly.svgResize(workspace);
    });
    observer.observe(container);
    // Blockly measures the container on a later frame; nudge it once mounted.
    const timer = window.setTimeout(() => Blockly.svgResize(workspace), 60);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      workspace.removeChangeListener(onChange);
      workspace.dispose();
      workspaceRef.current = null;
      loadedRef.current = "";
    };
  }, [allowedKey, readOnly]);

  // Reload when a different project or mission is opened.
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || !initialXml || initialXml === loadedRef.current) return;
    suppressRef.current = true;
    workspace.clear();
    xmlToWorkspace(initialXml, workspace);
    loadedRef.current = initialXml;
    window.setTimeout(() => {
      suppressRef.current = false;
    }, 0);
  }, [initialXml]);

  useImperativeHandle(
    ref,
    () => ({
      getXml: () => {
        const workspace = workspaceRef.current;
        if (!workspace) return initialXml ?? "";
        return serializeWorkspace(workspace);
      },
      getProgram: () => {
        const workspace = workspaceRef.current;
        return workspace ? compileWorkspace(workspace) : [];
      },
      loadXml: (xml: string) => {
        const workspace = workspaceRef.current;
        if (!workspace) return;
        suppressRef.current = true;
        workspace.clear();
        xmlToWorkspace(xml, workspace);
        loadedRef.current = xml;
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
    [initialXml],
  );

  return (
    <div
      ref={containerRef}
      className={`cb-blockly-host${className ? ` ${className}` : ""}`}
      aria-label="Block workspace"
    />
  );
}

export const BlockWorkspace = forwardRef(BlockWorkspaceInner);
