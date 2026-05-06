import { useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric";
import { FabricJSCanvas, useFabricJSEditor } from "fabricjs-react";
import { useNavigate } from "react-router-dom";
import {
  addImage,
  onAddCircle,
  onAddRectangle,
  onAddText,
  onDeleteAll,
  onDeleteSelected,
  onFillObject,
  onSelectAll,
} from "../components/fabricHooks";
import {
  BsCircle, BsChatLeftText, BsFillImageFill,
  BsPencilFill, BsVectorPen, BsArrowLeft,
  BsStar, BsBoundingBox, BsBoundingBoxCircles,
} from "react-icons/bs";
import { BiRectangle } from "react-icons/bi";
import { RxArrowDown, RxArrowUp } from "react-icons/rx";
import { FaBackspace } from "react-icons/fa";
import { RiDeleteBin5Line } from "react-icons/ri";
import { MdOutlineColorLens, MdRedo, MdUndo, MdFileUpload, MdFileDownload, MdMenu } from "react-icons/md";
import { GoDesktopDownload } from "react-icons/go";
import { TbArrowsLeftRight, TbDiamond, TbHexagon, TbTriangle, TbDatabase, TbShape, TbBorderRadius, TbChevronDown } from "react-icons/tb";
import { useDisclosure } from "@mantine/hooks";
import { Input, Modal } from "@mantine/core";
import { useModalStyles } from "../theme/modal";
import { useFont } from "../components/fontContext";
import { removeRulerOnMoveMarker, RULER_LINES } from "../ruler";
import ColorPicker from "react-pick-color";
import TextPanel from "../components/TextPanel";

// ─── Toolbar button helper ────────────────────────────────────────────────────
function ToolBtn({ title, active, onClick, disabled, children, danger }) {
  const base =
    "flex items-center justify-center w-9 h-9 rounded-lg transition-all text-lg";
  const colors = danger
    ? "text-red-400 hover:bg-red-500/15"
    : active
    ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40"
    : "text-white/60 hover:bg-white/8 hover:text-white";
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${colors} ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

// ─── Sidebar section divider ──────────────────────────────────────────────────
function SideSection({ label, children }) {
  return (
    <div className="flex flex-col gap-1 px-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25 px-1 mb-0.5">
        {label}
      </span>
      {children}
    </div>
  );
}

// ─── DIAGRAM SHAPES ──────────────────────────────────────────────────────────
function addDiamondShape(fabric, editor, color) {
  const points = [
    { x: 0, y: -40 },
    { x: 60, y: 0 },
    { x: 0, y: 40 },
    { x: -60, y: 0 },
  ];
  const diamond = new fabric.Polygon(points, {
    fill: "transparent",
    stroke: color?.hex ?? color,
    strokeWidth: 2,
    left: 200,
    top: 200,
  });
  editor?.canvas.add(diamond);
}

function addTriangleShape(fabric, editor, color) {
  const tri = new fabric.Triangle({
    width: 80,
    height: 70,
    fill: "transparent",
    stroke: color?.hex ?? color,
    strokeWidth: 2,
    left: 200,
    top: 200,
  });
  editor?.canvas.add(tri);
}

function addHexagonShape(fabric, editor, color) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push({ x: Math.cos(angle) * 45, y: Math.sin(angle) * 45 });
  }
  const hex = new fabric.Polygon(pts, {
    fill: "transparent",
    stroke: color?.hex ?? color,
    strokeWidth: 2,
    left: 200,
    top: 200,
  });
  editor?.canvas.add(hex);
}

function addArrowShape(fabric, editor, color) {
  const arrow = new fabric.Path(
    "M 0 0 L 60 0 M 45 -12 L 60 0 L 45 12",
    {
      stroke: color?.hex ?? color,
      strokeWidth: 2.5,
      fill: "transparent",
      left: 180,
      top: 200,
    }
  );
  editor?.canvas.add(arrow);
}

// ─── COLOR-AWARE BASIC SHAPES ───────────────────────────────────────────────
function addColoredCircle(fabric, editor, color) {
  const c = new fabric.Circle({
    radius: 35,
    fill: "transparent",
    stroke: color?.hex ?? color,
    strokeWidth: 2,
    left: 160,
    top: 160,
  });
  editor?.canvas.add(c);
  editor?.canvas.setActiveObject(c);
}

function addColoredRect(fabric, editor, color) {
  const r = new fabric.Rect({
    width: 100,
    height: 70,
    fill: "transparent",
    stroke: color?.hex ?? color,
    strokeWidth: 2,
    left: 140,
    top: 140,
  });
  editor?.canvas.add(r);
  editor?.canvas.setActiveObject(r);
}

// ─── EXTRA SHAPES ─────────────────────────────────────────────────────────────
function addStarShape(fabric, editor, color) {
  const pts = [];
  const outerR = 40, innerR = 17;
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  const star = new fabric.Polygon(pts, {
    fill: "transparent", stroke: color?.hex ?? color, strokeWidth: 2, left: 180, top: 170,
  });
  editor?.canvas.add(star);
  editor?.canvas.setActiveObject(star);
}

function addParallelogramShape(fabric, editor, color) {
  const pts = [{ x: 25, y: 0 }, { x: 105, y: 0 }, { x: 80, y: 50 }, { x: 0, y: 50 }];
  const p = new fabric.Polygon(pts, {
    fill: "transparent", stroke: color?.hex ?? color, strokeWidth: 2, left: 160, top: 200,
  });
  editor?.canvas.add(p);
  editor?.canvas.setActiveObject(p);
}

function addCylinderShape(fabric, editor, color) {
  // Two-subpath SVG path: body + inner-arc of top rim
  const cyl = new fabric.Path(
    "M 0 12 A 35 12 0 0 1 70 12 L 70 78 A 35 12 0 0 1 0 78 Z M 0 12 A 35 12 0 0 0 70 12",
    { fill: "transparent", stroke: color?.hex ?? color, strokeWidth: 2, left: 180, top: 160 }
  );
  editor?.canvas.add(cyl);
  editor?.canvas.setActiveObject(cyl);
}

function addRoundedRectShape(fabric, editor, color) {
  const r = new fabric.Rect({
    width: 110, height: 55, rx: 27, ry: 27,
    fill: "transparent", stroke: color?.hex ?? color, strokeWidth: 2, left: 160, top: 200,
  });
  editor?.canvas.add(r);
  editor?.canvas.setActiveObject(r);
}

// ─── SNAP-TO-CONNECTION-POINT helpers ────────────────────────────────────────
const SNAP_RADIUS = 18;

/** Returns the 5 standard anchor points of a Fabric object (center + 4 edge midpoints),
 *  computed from aCoords which already account for rotation/scaling. */
function getConnectionPoints(obj) {
  const ac = obj.aCoords;
  if (!ac) return [];
  return [
    { x: (ac.tl.x + ac.tr.x + ac.bl.x + ac.br.x) / 4, y: (ac.tl.y + ac.tr.y + ac.bl.y + ac.br.y) / 4 },
    { x: (ac.tl.x + ac.tr.x) / 2, y: (ac.tl.y + ac.tr.y) / 2 }, // top-mid
    { x: (ac.bl.x + ac.br.x) / 2, y: (ac.bl.y + ac.br.y) / 2 }, // bottom-mid
    { x: (ac.tl.x + ac.bl.x) / 2, y: (ac.tl.y + ac.bl.y) / 2 }, // left-mid
    { x: (ac.tr.x + ac.br.x) / 2, y: (ac.tr.y + ac.br.y) / 2 }, // right-mid
  ];
}

/** Returns the nearest snap point within SNAP_RADIUS, or null. */
function findSnapPoint(canvas, pointer, excludeObjects) {
  const excl = excludeObjects || [];
  for (const obj of canvas.getObjects()) {
    if (excl.includes(obj)) continue;
    if (obj._isSnapIndicator) continue;
    if (!obj.selectable) continue;
    for (const pt of getConnectionPoints(obj)) {
      const dx = pt.x - pointer.x;
      const dy = pt.y - pointer.y;
      if (Math.sqrt(dx * dx + dy * dy) <= SNAP_RADIUS) return pt;
    }
  }
  return null;
}

/** Returns `{ obj, pointIndex, pt }` for the nearest snap anchor within SNAP_RADIUS, or null. */
function findSnapInfo(canvas, pointer, excludeObjects) {
  const excl = excludeObjects || [];
  for (const obj of canvas.getObjects()) {
    if (excl.includes(obj)) continue;
    if (obj._isSnapIndicator) continue;
    if (!obj.selectable) continue;
    const pts = getConnectionPoints(obj);
    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i];
      const dx = pt.x - pointer.x;
      const dy = pt.y - pointer.y;
      if (Math.sqrt(dx * dx + dy * dy) <= SNAP_RADIUS) return { obj, pointIndex: i, pt };
    }
  }
  return null;
}

/** Re-positions all connector lines whose endpoints are anchored to movedObj. */
function updateConnectedLines(canvas, movedObj) {
  movedObj.setCoords();
  const pts = getConnectionPoints(movedObj);
  canvas.getObjects().forEach((obj) => {
    if (!obj._isConnector) return;
    let changed = false;
    if (obj._connStartObj === movedObj) {
      const pt = pts[obj._connStartIdx];
      if (pt) { obj.set({ x1: pt.x, y1: pt.y }); changed = true; }
    }
    if (obj._connEndObj === movedObj) {
      const pt = pts[obj._connEndIdx];
      if (pt) { obj.set({ x2: pt.x, y2: pt.y }); changed = true; }
    }
    if (changed) obj.setCoords();
  });
}

// ─── MAIN EDITOR PAGE ─────────────────────────────────────────────────────────
export default function EditorPage() {
  const navigate = useNavigate();
  const [objectImage, setObjectImage] = useState(null);
  const [text, setText] = useState("");
  const [currentSelectedElements, setCurrentSelectedElements] = useState(null);
  const [color, setColor] = useState("#6366f1");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [activeTab, setActiveTab] = useState("tools"); // "tools" | "diagrams"
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle"); // "idle" | "saving" | "saved"
  const containerRef = useRef(null);
  const { editor, onReady } = useFabricJSEditor();
  const {
    fontName, setFontName,
    isBold, isItalic, setIsBold, setIsItalic,
    setIsUnderline, setFontWeight,
    isUnderline, fontWeight, selectedFontColor, setSelectedFontColor,
  } = useFont();
  // ── Stable canvas ref (avoids stale closure in saveSnapshot) ─────────────
  const canvasRef = useRef(null);

  // ── Stable line-mode handler refs (so we remove only our own listeners) ─────
  const lineHandlersRef = useRef({ down: null, move: null, up: null });

  // ── Always-current refs — usable inside stable closures ─────────────────────
  const colorRef         = useRef(null); // tracks active color string
  const clipboardRef     = useRef(null); // Ctrl+C clipboard
  const snapIndicatorRef = useRef(null); // snap indicator circle (line connector mode)
  const colorPickerRef   = useRef(null); // container for click-outside detection
  const exportMenuRef    = useRef(null);  // export dropdown container
  const tempLineRef      = useRef(null);  // in-progress line (click-to-click mode)
  const autoSaveTimerRef = useRef(null);  // auto-save debounce timer

  // ── Ref bag updated every render – lets keyboard effect avoid stale closures
  const liveRef = useRef({});
  // ── Canvas resize ───────────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    if (editor && containerRef.current) {
      const container = containerRef.current;
      editor.canvas.setWidth(container.clientWidth);
      editor.canvas.setHeight(container.clientHeight);
      editor.canvas.renderAll();
    }
  }, [editor]);

  useEffect(() => {
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // ── Undo / Redo ─────────────────────────────────────────────────
  const historyRef = useRef({ undo: [], redo: [] });
  const [historyState, setHistoryState] = useState({ undoLen: 0, redoLen: 0 });
  const isLoadingHistory = useRef(false);

  // saveSnapshot uses canvasRef so it stays valid even before `editor` settles
  const saveSnapshot = useCallback(() => {
    if (!canvasRef.current || isLoadingHistory.current) return;
    const snap = JSON.stringify(canvasRef.current.toJSON());
    historyRef.current.undo.push(snap);
    historyRef.current.redo = [];
    setHistoryState({ undoLen: historyRef.current.undo.length, redoLen: 0 });
  }, []);

  function undo() {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.undo.length === 0) return;
    isLoadingHistory.current = true;
    const current = JSON.stringify(canvas.toJSON());
    const prev = historyRef.current.undo.pop();
    historyRef.current.redo.unshift(current);
    canvas.loadFromJSON(prev, () => {
      canvas.renderAll();
      isLoadingHistory.current = false;
      setHistoryState({
        undoLen: historyRef.current.undo.length,
        redoLen: historyRef.current.redo.length,
      });
    });
  }

  function redo() {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.redo.length === 0) return;
    isLoadingHistory.current = true;
    const current = JSON.stringify(canvas.toJSON());
    const next = historyRef.current.redo.shift();
    historyRef.current.undo.push(current);
    canvas.loadFromJSON(next, () => {
      canvas.renderAll();
      isLoadingHistory.current = false;
      setHistoryState({
        undoLen: historyRef.current.undo.length,
        redoLen: historyRef.current.redo.length,
      });
    });
  }

  // ── Canvas ready ────────────────────────────────────────────────
  const _onReady = (canvas) => {
    canvasRef.current = canvas;
    canvas.set("backgroundColor", "#1e2128");
    canvas.on("selection:created", (e) => setCurrentSelectedElements(e.selected));
    canvas.on("selection:updated", (e) => {
      e?.deselected
        ?.filter((item) => Object.values(RULER_LINES).includes(item.data?.type))
        .forEach((item) => item.set({ stroke: "#D92D20", fill: "#D92D20" }));
      removeRulerOnMoveMarker(canvas);
      setCurrentSelectedElements((arr) => {
        if (!arr) return null;
        if (e?.e?.shiftKey) {
          if (e.selected?.length > 0) return [...arr, ...e.selected];
          if (e.deselected?.length > 0) return arr.filter((i) => !e.deselected?.includes(i));
        }
        return e.selected;
      });
    });
    canvas.on("selection:cleared", () => setCurrentSelectedElements([]));
    canvas.on("mouse:dblclick", (e) => {
      const target = e.target;
      if (target?.type === "text") {
        setSelectedModal("editText");
        openModal();
        setText(target.text);
        setActiveTextObject(target);
      }
    });
    // snapshot hooks
    canvas.on("object:modified", saveSnapshot);
    canvas.on("object:added", saveSnapshot);
    canvas.on("object:removed", saveSnapshot);
    canvas.renderAll();
    onReady(canvas);
    setIsEditorReady(true);

    // ── Move connected lines when a shape is transformed ─────────────
    const handleConnMove = (e) => {
      const target = e.target;
      if (!target) return;
      if (target.type === "activeSelection") {
        target.getObjects().forEach((obj) => updateConnectedLines(canvas, obj));
      } else {
        updateConnectedLines(canvas, target);
      }
      canvas.requestRenderAll();
    };
    canvas.on("object:moving",   handleConnMove);
    canvas.on("object:scaling",  handleConnMove);
    canvas.on("object:rotating", handleConnMove);

    // ── Auto-save to localStorage on canvas mutations ─────────────
    const scheduleAutoSave = () => {
      if (isLoadingHistory.current) return;
      clearTimeout(autoSaveTimerRef.current);
      setAutoSaveStatus("saving");
      autoSaveTimerRef.current = setTimeout(() => {
        if (canvasRef.current) {
          try {
            localStorage.setItem("pixora-canvas", JSON.stringify(canvasRef.current.toJSON()));
          } catch (_) {}
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2500);
        }
      }, 1200);
    };
    canvas.on("object:modified", scheduleAutoSave);
    canvas.on("object:added",    scheduleAutoSave);
    canvas.on("object:removed",  scheduleAutoSave);

    // ── Restore canvas from previous session ──────────────────────
    const savedJSON = localStorage.getItem("artboard-canvas");
    if (savedJSON) {
      try {
        const parsed = JSON.parse(savedJSON);
        isLoadingHistory.current = true;
        canvas.loadFromJSON(parsed, () => {
          canvas.renderAll();
          isLoadingHistory.current = false;
        });
      } catch (_) { /* ignore corrupted data */ }
    }
  };

  // ── Layer order ─────────────────────────────────────────────────
  function bringForward() {
    currentSelectedElements?.forEach((obj) => editor?.canvas.bringForward(obj));
    editor?.canvas.requestRenderAll();
  }
  function sendBackward() {
    currentSelectedElements?.forEach((obj) => editor?.canvas.sendBackwards(obj));
    editor?.canvas.requestRenderAll();
  }

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    if (!isEditorReady || !editor) return;

    const isTyping = () => {
      const el = document.activeElement;
      if (!el) return false;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return true;
      if (el.isContentEditable) return true;
      // fabric IText in editing mode
      if (canvasRef.current?.getActiveObject()?.isEditing) return true;
      return false;
    };

    const handleKeyDown = (e) => {
      const { undo, redo, drawing, lineMaking, toggleDrawingMode, toggleLineMode } =
        liveRef.current;

      // Allow Escape to bubble even from inputs
      if (e.key !== "Escape" && isTyping()) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // ── Delete selected ───────────────────────────────────────
      if ((e.key === "Delete" || e.key === "Backspace") && !ctrl) {
        onDeleteSelected(editor);
        return;
      }

      // ── Escape: exit active mode ──────────────────────────────
      if (e.key === "Escape") {
        if (drawing) toggleDrawingMode();
        if (lineMaking) toggleLineMode();
        return;
      }

      // ── Undo / Redo ───────────────────────────────────────────
      if (e.key.toLowerCase() === "z" && ctrl && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.key.toLowerCase() === "y" && ctrl) || (e.key.toLowerCase() === "z" && ctrl && e.shiftKey)) {
        e.preventDefault();
        redo();
        return;
      }

      // ── Select all ────────────────────────────────────────────
      if (e.key.toLowerCase() === "a" && ctrl) {
        e.preventDefault();
        onSelectAll(editor, fabric);
        return;
      }

      // ── Copy (Ctrl+C) ─────────────────────────────────────────
      if (e.key.toLowerCase() === "c" && ctrl) {
        e.preventDefault();
        const active = canvasRef.current?.getActiveObject();
        if (active) {
          active.clone((cloned) => { clipboardRef.current = cloned; });
        }
        return;
      }

      // ── Paste (Ctrl+V) ────────────────────────────────────────
      if (e.key.toLowerCase() === "v" && ctrl) {
        e.preventDefault();
        const clipped = clipboardRef.current;
        if (!clipped || !canvasRef.current) return;
        clipped.clone((cloned) => {
          canvasRef.current.discardActiveObject();
          cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 });
          if (cloned.type === "activeSelection") {
            cloned.canvas = canvasRef.current;
            cloned.forEachObject((obj) => canvasRef.current.add(obj));
            cloned.setCoords();
          } else {
            canvasRef.current.add(cloned);
          }
          // Shift clipboard so repeated pastes cascade
          clipboardRef.current = cloned;
          canvasRef.current.setActiveObject(cloned);
          canvasRef.current.requestRenderAll();
        });
        return;
      }

      // ── Duplicate (Ctrl+D) ────────────────────────────────────
      if (e.key.toLowerCase() === "d" && ctrl) {
        e.preventDefault();
        const active = canvasRef.current?.getActiveObject();
        if (active) {
          active.clone((cloned) => {
            cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 });
            canvasRef.current.add(cloned);
            canvasRef.current.setActiveObject(cloned);
            canvasRef.current.requestRenderAll();
          });
        }
        return;
      }

      // ── Group (Ctrl+G) ───────────────────────────────────────────────────
      if (e.key.toLowerCase() === "g" && ctrl && !e.shiftKey) {
        e.preventDefault();
        const active = canvasRef.current?.getActiveObject();
        if (active?.type === "activeSelection") {
          active.toGroup();
          canvasRef.current.requestRenderAll();
        }
        return;
      }

      // ── Ungroup (Ctrl+Shift+G) ────────────────────────────────────────────
      if (e.key.toLowerCase() === "g" && ctrl && e.shiftKey) {
        e.preventDefault();
        const active = canvasRef.current?.getActiveObject();
        if (active?.type === "group") {
          active.toActiveSelection();
          canvasRef.current.requestRenderAll();
        }
        return;
      }

      // Single-key shortcuts (no ctrl/meta)
      if (!ctrl) {
        // ── Tool hotkeys ─────────────────────────────────────────
        if (e.key.toLowerCase() === "b") { toggleDrawingMode(); return; }
        if (e.key.toLowerCase() === "l") { toggleLineMode();    return; }

        // ── Arrow nudge (1 px; hold Shift for 10 px) ─────────────
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
          const active = canvasRef.current?.getActiveObject();
          if (!active) return;
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          if (e.key === "ArrowLeft")  active.set({ left: (active.left ?? 0) - step });
          if (e.key === "ArrowRight") active.set({ left: (active.left ?? 0) + step });
          if (e.key === "ArrowUp")    active.set({ top:  (active.top  ?? 0) - step });
          if (e.key === "ArrowDown")  active.set({ top:  (active.top  ?? 0) + step });
          active.setCoords();
          canvasRef.current.requestRenderAll();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditorReady, editor]);

  // ── Drawing mode ─────────────────────────────────────────────────────────────
  const [drawing, setDrawing] = useState(false);
  const toggleDrawingMode = (persist = false) => {
    if (!editor) return;
    const canvas = editor.canvas;
    if (persist) {
      if (drawing) {
        canvas.freeDrawingBrush.color = colorRef.current;
        canvas.freeDrawingBrush.width = 2;
      }
      return;
    }
    // Deactivate line mode — only one drawing mode at a time
    if (lineMaking) {
      const { down, move, up } = lineHandlersRef.current;
      if (down) canvas.off("mouse:down", down);
      if (move) canvas.off("mouse:move", move);
      if (up)   canvas.off("mouse:up",   up);
      lineHandlersRef.current = { down: null, move: null, up: null };
      canvas.defaultCursor = "default";
      canvas.hoverCursor   = "move";
      setLineMaking(false);
    }
    if (!drawing) {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = colorRef.current;
      canvas.freeDrawingBrush.width = 2;
    } else {
      canvas.isDrawingMode = false;
    }
    setDrawing((d) => !d);
  };

  // Keep brush color in sync whenever the active color changes while drawing
  useEffect(() => {
    if (!editor?.canvas?.freeDrawingBrush || !drawing) return;
    editor.canvas.freeDrawingBrush.color = colorRef.current;
  }, [color, drawing, editor]);

  // Live-apply the active color to currently selected objects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const actives = canvas.getActiveObjects();
    if (!actives.length) return;
    const hexColor = color?.hex ?? color;
    actives.forEach((obj) => {
      if (obj.type === "text" || obj.type === "i-text") {
        obj.set({ fill: hexColor });
      } else {
        if (obj.stroke && obj.stroke !== "transparent") obj.set({ stroke: hexColor });
        if (obj.fill && obj.fill !== "transparent" && obj.fill !== "") obj.set({ fill: hexColor });
      }
    });
    canvas.requestRenderAll();
  }, [color]);

  // ── Line / connector tool ─────────────────────────────────────────────────────
  const [lineMaking, setLineMaking] = useState(false);
  function toggleLineMode() {
    if (!editor) return;
    const canvas = editor.canvas;

    // Deactivate drawing mode — only one active drawing mode at a time
    if (drawing) { canvas.isDrawingMode = false; setDrawing(false); }

    if (lineMaking) {
      // Turn off — clean up handlers + snap indicator
      setLineMaking(false);
      const { down, move, up } = lineHandlersRef.current;
      if (down) canvas.off("mouse:down", down);
      if (move) canvas.off("mouse:move", move);
      if (up)   canvas.off("mouse:up",   up);
      lineHandlersRef.current = { down: null, move: null, up: null };
      canvas.defaultCursor  = "default";
      canvas.hoverCursor    = "move";
      canvas.selection      = true;
      canvas.skipTargetFind = false;
      if (snapIndicatorRef.current) {
        canvas.remove(snapIndicatorRef.current);
        snapIndicatorRef.current = null;
      }
      if (tempLineRef.current) {
        canvas.remove(tempLineRef.current);
        tempLineRef.current = null;
      }
      return;
    }

    // Turn on
    setLineMaking(true);
    canvas.defaultCursor  = "crosshair";
    canvas.hoverCursor    = "crosshair";
    canvas.selection      = false;
    // Disable Fabric's own target-finding so clicking ON a shape starts the
    // line rather than selecting / moving that shape.
    canvas.skipTargetFind = true;

    let phase         = 0;    // 0 = waiting for first click, 1 = line started
    let snapPoint     = null;
    let startSnapInfo = null; // connection snap info for the first endpoint

    /** Show (or reposition) the snap indicator dot at a canvas point. */
    function showSnap(pt) {
      if (snapIndicatorRef.current) {
        snapIndicatorRef.current.set({ left: pt.x - 6, top: pt.y - 6 });
        canvas.requestRenderAll();
        return;
      }
      const c = new fabric.Circle({
        radius: 6,
        fill: "rgba(99,102,241,0.3)",
        stroke: "#6366f1",
        strokeWidth: 2,
        left: pt.x - 6,
        top:  pt.y - 6,
        selectable:       false,
        evented:          false,
        _isSnapIndicator: true,
      });
      snapIndicatorRef.current = c;
      canvas.add(c);
      canvas.bringToFront(c);
      canvas.requestRenderAll();
    }

    function hideSnap() {
      if (snapIndicatorRef.current) {
        canvas.remove(snapIndicatorRef.current);
        snapIndicatorRef.current = null;
      }
    }

    const onMouseDown = (opt) => {
      const p    = canvas.getPointer(opt.e);
      const excl = [snapIndicatorRef.current, tempLineRef.current].filter(Boolean);
      const info = findSnapInfo(canvas, p, excl);
      const pt   = info ? info.pt : p;
      hideSnap();

      if (phase === 0) {
        // First click — start the line; record which anchor was snapped
        startSnapInfo = info;
        phase = 1;
        tempLineRef.current = new fabric.Line([pt.x, pt.y, pt.x, pt.y], {
          stroke:        colorRef.current,
          strokeWidth:   2,
          strokeUniform: true,
          selectable:    false,
          evented:       false,
          hasBorders:    false,
          hasControls:   false,
          _isConnector:  true,
        });
        canvas.add(tempLineRef.current);
      } else {
        // Second click — finalize; attach connection metadata so lines follow shapes
        phase = 0;
        tempLineRef.current.set({ x2: pt.x, y2: pt.y });
        const dx = tempLineRef.current.x2 - tempLineRef.current.x1;
        const dy = tempLineRef.current.y2 - tempLineRef.current.y1;
        if (Math.sqrt(dx * dx + dy * dy) < 4) {
          canvas.remove(tempLineRef.current);
          tempLineRef.current = null;
          startSnapInfo = null;
          snapPoint     = null;
          return;
        }
        if (startSnapInfo) {
          tempLineRef.current._connStartObj = startSnapInfo.obj;
          tempLineRef.current._connStartIdx = startSnapInfo.pointIndex;
        }
        if (info) {
          tempLineRef.current._connEndObj = info.obj;
          tempLineRef.current._connEndIdx = info.pointIndex;
        }
        tempLineRef.current.setCoords();
        tempLineRef.current.set({ selectable: true, evented: true, hasBorders: true, hasControls: true });
        canvas.setActiveObject(tempLineRef.current);
        canvas.requestRenderAll();
        tempLineRef.current = null;
        startSnapInfo      = null;
        snapPoint          = null;
      }
    };

    const onMouseMove = (opt) => {
      const p    = canvas.getPointer(opt.e);
      const excl = [snapIndicatorRef.current, tempLineRef.current].filter(Boolean);
      const snap = findSnapPoint(canvas, p, excl);
      if (snap) { snapPoint = snap; showSnap(snap); }
      else      { snapPoint = null; hideSnap(); }
      if (phase === 1 && tempLineRef.current) {
        const ep = snapPoint || p;
        tempLineRef.current.set({ x2: ep.x, y2: ep.y });
        canvas.requestRenderAll();
      }
    };

    lineHandlersRef.current = { down: onMouseDown, move: onMouseMove, up: null };
    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
  }

  // ── Remove background ───────────────────────────────────────────
  const [loadingRemoveBg, setLoadingRemoveBg] = useState(false);
  const handleRemoveBackground = async () => {
    if (!objectImage?.file) return;
    setLoadingRemoveBg(true);
    const apiKey = import.meta.env.VITE_APP_BG_KEY;
    const formData = new FormData();
    formData.append("image_file", objectImage.file, `upload-${Math.random()}.png`);
    formData.append("size", "auto");
    try {
      const res = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: formData,
      });
      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      setObjectImage((prev) => ({ ...prev, url: imageUrl, file: blob }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRemoveBg(false);
    }
  };

  // ── Download ────────────────────────────────────────────────────
  function download() {
    if (!editor) return;
    const dataURL = editor.canvas.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "pixora-canvas.png";
    a.click();
  }

  // ── JSON Export / Import ─────────────────────────────────────────────────
  function exportJSON() {
    if (!canvasRef.current) return;
    const json = JSON.stringify(canvasRef.current.toJSON(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "pixora-canvas.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    if (!file || !canvasRef.current) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        isLoadingHistory.current = true;
        canvasRef.current.loadFromJSON(json, () => {
          canvasRef.current.renderAll();
          isLoadingHistory.current = false;
          saveSnapshot();
        });
      } catch (err) {
        console.error("Invalid JSON file:", err);
      }
    };
    reader.readAsText(file);
  }

  // ── Group / Ungroup ──────────────────────────────────────────────────────
  function groupSelected() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== "activeSelection") return;
    active.toGroup();
    canvas.requestRenderAll();
  }

  function ungroupSelected() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== "group") return;
    active.toActiveSelection();
    canvas.requestRenderAll();
  }

  // ── Modal ───────────────────────────────────────────────────────
  const [selectedModal, setSelectedModal] = useState(null);
  const [activeTextObject, setActiveTextObject] = useState(null);
  const { classes: modalClasses } = useModalStyles();
  const [isModalOpen, { open: openModal, close: closeModal }] = useDisclosure();

  useEffect(() => {
    if (drawing) toggleDrawingMode();
    if (lineMaking) toggleLineMode();
  }, [isModalOpen]);

  // Keep refs current every render so stable closures always read fresh values
  colorRef.current = color?.hex ?? color;
  liveRef.current  = { undo, redo, drawing, lineMaking, toggleDrawingMode, toggleLineMode };

  function initFontSetup() {
    setIsBold(false); setIsItalic(false); setIsUnderline(false);
    setFontWeight("regular"); setSelectedFontColor("#000000"); setFontName("");
  }

  const modalOptions = {
    uploadImage: {
      title: "Upload Image",
      children: (
        <fieldset className="flex flex-col justify-start items-center gap-x-1 w-full">
          <input
            className="text-sm text-slate-400 w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30"
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) {
                const imgURL = URL.createObjectURL(e.target.files[0]);
                setObjectImage({ url: imgURL, file: e.target.files[0] });
              }
            }}
          />
          {!!objectImage?.url && (
            <>
              <img src={objectImage.url} alt="Uploaded" className="block my-4 max-h-[400px] rounded-lg" />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className={`border border-white/10 bg-white/5 rounded-full px-6 py-2 text-sm hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/50 transition-all ${loadingRemoveBg ? "opacity-50" : ""}`}
                  onClick={() => { addImage(fabric, editor, objectImage.url); setObjectImage(null); closeModal(); }}
                  disabled={loadingRemoveBg}
                >
                  Upload
                </button>
                <button
                  className={`border border-white/10 bg-white/5 rounded-full px-6 py-2 text-sm hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/50 transition-all ${loadingRemoveBg ? "opacity-50" : ""}`}
                  onClick={handleRemoveBackground}
                  disabled={loadingRemoveBg}
                >
                  {loadingRemoveBg ? "Removing…" : "Remove Background"}
                </button>
              </div>
            </>
          )}
        </fieldset>
      ),
    },
    editText: {
      title: "Add / Edit Text",
      children: (
        <fieldset className="flex w-full justify-start items-center gap-x-1 flex-col">
          <Input
            className="w-full text-sm mb-5"
            name="text"
            type="text"
            value={text}
            placeholder="Your text here…"
            onChange={(e) => setText(e.target.value)}
          />
          <TextPanel
            canvas={editor?.canvas}
            currentSelectedElements={currentSelectedElements}
            text={text}
          />
          <button
            className={`mt-5 border border-white/10 bg-white/5 rounded-full px-6 py-2 text-sm transition-all ${text ? "hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/50" : "opacity-40"}`}
            onClick={() => {
              onAddText(fabric, editor, text, setText, {
                fontFamily: fontName,
                fontStyle: isItalic ? "italic" : "normal",
                fill: selectedFontColor,
                fontWeight: isBold ? "bold" : fontWeight === "regular" ? "normal" : fontWeight,
                underline: isUnderline,
              }, activeTextObject, setActiveTextObject);
              initFontSetup();
              closeModal();
            }}
            disabled={!text}
          >
            {activeTextObject ? "Update Text" : "Add Text"}
          </button>
        </fieldset>
      ),
    },
    fillObject: {
      title: "Fill Color",
      children: (
        <fieldset className="flex flex-col justify-start items-center gap-x-1 w-full">
          <ColorPicker className="!w-full" color={color?.hex ?? color} onChange={setColor} />
          <button
            className="mt-4 border border-white/10 bg-white/5 rounded-full px-8 py-2 text-sm hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/50 transition-all"
            onClick={() => {
              onFillObject(editor, color);
              if (drawing) toggleDrawingMode(true);
              if (lineMaking) toggleLineMode(null, true);
              closeModal();
            }}
          >
            Apply Fill
          </button>
        </fieldset>
      ),
    },
  };

  // ── Stroke color picker ─────────────────────────────────────────
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showExportMenu, setShowExportMenu]   = useState(false);

  // Close inline color picker when the user clicks outside its container
  useEffect(() => {
    if (!showColorPicker) return;
    const handleOutside = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showColorPicker]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!showExportMenu) return;
    const handleOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showExportMenu]);

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] text-white overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 h-12 bg-[#16181e] border-b border-white/[0.07] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            title="Toggle tools sidebar"
            onClick={() => setSidebarOpen((v) => !v)}
            className="sm:hidden flex items-center justify-center w-7 h-7 text-white/40 hover:text-white transition-colors"
          >
            <MdMenu size={18} />
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
            title="Back to home"
          >
            <BsArrowLeft size={14} />
            <span className="hidden sm:inline">Home</span>
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center">
              <BsPencilFill size={10} />
            </div>
            <span className="font-semibold text-sm tracking-tight">Pixora</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToolBtn title="Undo (Ctrl+Z)" onClick={undo} disabled={historyState.undoLen === 0}>
            <MdUndo />
          </ToolBtn>
          <ToolBtn title="Redo (Ctrl+Y)" onClick={redo} disabled={historyState.redoLen === 0}>
            <MdRedo />
          </ToolBtn>
          <div className="hidden sm:block w-px h-4 bg-white/10 mx-1" />
          <div className="hidden sm:flex">
            <ToolBtn title="Delete all" onClick={() => onDeleteAll(editor, setText)}>
              <FaBackspace />
            </ToolBtn>
          </div>
          {/* JSON import */}
          <label
            title="Import canvas from JSON"
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <MdFileUpload size={14} />
            <span className="hidden sm:inline">Import</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) { importJSON(e.target.files[0]); e.target.value = ""; }
              }}
            />
          </label>
          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <GoDesktopDownload size={14} />
              <span className="hidden sm:inline">Export</span>
              <TbChevronDown size={12} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[#1e2128] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden min-w-[140px]">
                <button
                  onClick={() => { download(); setShowExportMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <GoDesktopDownload size={13} />
                  Export PNG
                </button>
                <button
                  onClick={() => { exportJSON(); setShowExportMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <MdFileDownload size={13} />
                  Export JSON
                </button>
                <div className="border-t border-white/[0.06] my-0.5" />
                <button
                  onClick={() => { localStorage.removeItem("pixora-canvas"); localStorage.removeItem("artboard-canvas"); setShowExportMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <RiDeleteBin5Line size={13} />
                  Clear saved
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Mobile backdrop — tap to close sidebar */}
        {sidebarOpen && (
          <div
            className="sm:hidden absolute inset-0 z-20 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* ── Left sidebar ─────────────────────────────────────── */}
        <aside className={`shrink-0 bg-[#16181e] border-r border-white/[0.07] flex-col items-center py-3 gap-1 overflow-y-auto ${
          sidebarOpen
            ? "flex w-14 absolute inset-y-0 left-0 z-30 shadow-xl sm:relative sm:shadow-none"
            : "hidden sm:flex sm:w-14"
        }`}>
          {/* Tab toggle */}
          <button
            title="Tools"
            onClick={() => setActiveTab("tools")}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${activeTab === "tools" ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40" : "text-white/40 hover:text-white"}`}
          >
            T
          </button>
          <button
            title="Diagrams"
            onClick={() => setActiveTab("diagrams")}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${activeTab === "diagrams" ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40" : "text-white/40 hover:text-white"}`}
          >
            D
          </button>

          <div className="w-6 h-px bg-white/10 my-1" />

          {/* ── TOOLS TAB ─ general drawing & editing ── */}
          {activeTab === "tools" && (
            <>
              {/* Basic shapes */}
              <ToolBtn title="Circle" onClick={() => addColoredCircle(fabric, editor, color)}><BsCircle /></ToolBtn>
              <ToolBtn title="Rectangle" onClick={() => addColoredRect(fabric, editor, color)}><BiRectangle /></ToolBtn>
              <ToolBtn title="Star" onClick={() => addStarShape(fabric, editor, color)}><BsStar /></ToolBtn>
              <div className="w-6 h-px bg-white/10 my-1" />
              {/* Drawing & editing tools */}
              <ToolBtn title="Add / edit text" onClick={() => { setSelectedModal("editText"); openModal(); }}>
                <BsChatLeftText />
              </ToolBtn>
              <ToolBtn title="Pencil brush (B)" active={drawing} onClick={() => toggleDrawingMode()}>
                <BsPencilFill />
              </ToolBtn>
              <ToolBtn title="Line tool (L)" active={lineMaking} onClick={toggleLineMode}>
                <BsVectorPen />
              </ToolBtn>
              <ToolBtn title="Active color" onClick={() => { setSelectedModal("fillObject"); openModal(); }}>
                <MdOutlineColorLens style={{ color: color?.hex ?? color }} />
              </ToolBtn>
              <ToolBtn title="Upload image" onClick={() => { setSelectedModal("uploadImage"); openModal(); }}>
                <BsFillImageFill />
              </ToolBtn>
            </>
          )}

          {/* ── DIAGRAMS TAB ─ flowchart / diagram shapes ── */}
          {activeTab === "diagrams" && (
            <>
              {/* Base shapes */}
              <ToolBtn title="Rect · Process" onClick={() => addColoredRect(fabric, editor, color)}><BiRectangle /></ToolBtn>
              <ToolBtn title="Oval · Start / End" onClick={() => addColoredCircle(fabric, editor, color)}><BsCircle /></ToolBtn>
              <ToolBtn title="Rounded rect · Terminal" onClick={() => addRoundedRectShape(fabric, editor, color)}><TbBorderRadius /></ToolBtn>
              {/* Decision / process shapes */}
              <div className="w-6 h-px bg-white/10 my-1" />
              <ToolBtn title="Diamond · Decision" onClick={() => addDiamondShape(fabric, editor, color)}><TbDiamond /></ToolBtn>
              <ToolBtn title="Hexagon · Preparation" onClick={() => addHexagonShape(fabric, editor, color)}><TbHexagon /></ToolBtn>
              <ToolBtn title="Parallelogram · Input / Output" onClick={() => addParallelogramShape(fabric, editor, color)}><TbShape /></ToolBtn>
              <ToolBtn title="Triangle · Off-page connector" onClick={() => addTriangleShape(fabric, editor, color)}><TbTriangle /></ToolBtn>
              <ToolBtn title="Cylinder · Database" onClick={() => addCylinderShape(fabric, editor, color)}><TbDatabase /></ToolBtn>
              {/* Connectors & labels */}
              <div className="w-6 h-px bg-white/10 my-1" />
              <ToolBtn title="Arrow · Flow direction" onClick={() => addArrowShape(fabric, editor, color)}><TbArrowsLeftRight /></ToolBtn>
              <ToolBtn title="Smart line connector — snaps to anchor points (L)" active={lineMaking} onClick={toggleLineMode}><BsVectorPen /></ToolBtn>
              <ToolBtn title="Text label" onClick={() => { setSelectedModal("editText"); openModal(); }}><BsChatLeftText /></ToolBtn>
            </>
          )}

          {/* ── Selection-dependent actions — visible in BOTH tabs ── */}
          {!!currentSelectedElements?.length && (
            <>
              <div className="w-6 h-px bg-white/10 my-1" />
              {currentSelectedElements.length > 1 && (
                <ToolBtn title="Group selection (Ctrl+G)" onClick={groupSelected}><BsBoundingBox /></ToolBtn>
              )}
              {currentSelectedElements.length === 1 && currentSelectedElements[0]?.type === "group" && (
                <ToolBtn title="Ungroup (Ctrl+Shift+G)" onClick={ungroupSelected}><BsBoundingBoxCircles /></ToolBtn>
              )}
              <ToolBtn title="Bring forward" onClick={bringForward}><RxArrowUp /></ToolBtn>
              <ToolBtn title="Send backward" onClick={sendBackward}><RxArrowDown /></ToolBtn>
              <ToolBtn title="Delete selected (Del)" danger onClick={() => onDeleteSelected(editor)}>
                <RiDeleteBin5Line />
              </ToolBtn>
            </>
          )}
        </aside>

        {/* ── Canvas area ──────────────────────────────────────── */}
        <main ref={containerRef} className="flex-1 overflow-hidden relative bg-dotted">
          <FabricJSCanvas
            id="canvas-container"
            className="w-full h-full"
            onReady={_onReady}
          />
          {/* color swatch + inline picker — wraps both so click-outside works */}
          <div ref={colorPickerRef} className="absolute bottom-4 left-4 z-20 flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowColorPicker((v) => !v)}
                className="w-7 h-7 rounded-full border-2 border-white/20 shadow-md hover:scale-110 transition-transform"
                style={{ background: color?.hex ?? color }}
                title="Active stroke / fill color — click to open picker"
              />
              <span className="text-xs text-white/30 font-mono">{color?.hex ?? color}</span>
            </div>
            {showColorPicker && (
              <div className="shadow-2xl rounded-xl overflow-hidden" style={{ width: 300 }}>
                <ColorPicker
                  color={color?.hex ?? color}
                  onChange={(c) => setColor(c)}
                  style={{ width: "300px" }}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Status bar ───────────────────────────────────────────── */}
      <footer className="h-7 px-4 bg-[#16181e] border-t border-white/[0.07] flex items-center gap-4 text-[11px] text-white/25 shrink-0">
        <span>{activeTab === "diagrams" ? "Diagram mode" : "Canvas mode"}</span>
        {drawing && <span className="text-indigo-400">● Drawing</span>}
        {lineMaking && <span className="text-violet-400">● Line tool</span>}
        {!!currentSelectedElements?.length && (
          <span>{currentSelectedElements.length} selected</span>
        )}
        {autoSaveStatus === "saving" && <span className="text-white/30">● saving…</span>}
        {autoSaveStatus === "saved"  && <span className="text-green-400/60">✓ saved</span>}
        <span className="ml-auto hidden sm:block">Ctrl+Z/Y undo/redo · Ctrl+C/V copy/paste · Ctrl+D dup · Ctrl+G group · Ctrl+A all · Del delete · B brush · L line · Esc exit · ↑↓←→ nudge</span>
      </footer>

      {/* ── Modal ────────────────────────────────────────────────── */}
      <Modal
        opened={isModalOpen && !!selectedModal}
        onClose={() => {
          closeModal();
          setObjectImage(null);
          setText("");
          initFontSetup();
        }}
        title={modalOptions[selectedModal]?.title ?? ""}
        centered
        classNames={{
          content: modalClasses?.content,
          title: modalClasses?.title,
        }}
        size="xl"
      >
        {modalOptions[selectedModal]?.children}
      </Modal>
    </div>
  );
}
