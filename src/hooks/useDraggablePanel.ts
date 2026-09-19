"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Pos = { x: number; y: number };

/** 창 머리가 화면 밖으로 완전히 나가지 않도록 남겨 둘 최소 폭·높이 */
const KEEP_VISIBLE_PX = 48;

/**
 * 여러 팝업이 겹칠 때 마지막으로 만진 창만 한 단계 위로 올린다 (z-40 → 41).
 * 숫자를 계속 올리면 공지·알림 모달(z-50)까지 덮어버린다.
 */
let frontPanel: HTMLElement | null = null;

function clamp(pos: Pos, el: HTMLElement | null): Pos {
  if (typeof window === "undefined") return pos;
  const width = el?.offsetWidth ?? 0;
  const maxX = Math.max(0, window.innerWidth - Math.min(width, window.innerWidth));
  const maxY = Math.max(0, window.innerHeight - KEEP_VISIBLE_PX);
  return {
    x: Math.min(Math.max(0, pos.x), maxX),
    y: Math.min(Math.max(0, pos.y), maxY),
  };
}

/**
 * 머리 부분을 잡고 끌어 옮기는 떠 있는 창.
 * - 끄는 동안에는 리렌더 없이 ref로 left/top만 직접 바꾸고, 놓을 때 한 번 저장한다
 *   (등장 애니메이션이 transform을 쓰므로 위치는 left/top으로 잡는다)
 * - 위치는 이 브라우저에 저장(`daengmang-panel-pos:<id>`), 머리를 더블클릭하면 기본 위치로
 */
export function useDraggablePanel(id: string, fallback: Pos, open: boolean) {
  const storageKey = `daengmang-panel-pos:${id}`;
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos>(fallback);
  const drag = useRef<{ pointerX: number; pointerY: number; start: Pos; last: Pos } | null>(
    null,
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const saved = raw ? (JSON.parse(raw) as Partial<Pos>) : null;
      if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
        setPos({ x: saved.x, y: saved.y });
      }
    } catch {
      // 저장값이 없거나 깨졌으면 기본 위치
    }
  }, [storageKey]);

  const commit = useCallback(
    (next: Pos) => {
      setPos(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // 저장 실패해도 이번 세션 위치에는 지장 없음
      }
    },
    [storageKey],
  );

  // 열릴 때·창 크기가 바뀔 때 화면 안으로 끌어온다 (다른 해상도에서 저장된 위치 대비)
  useLayoutEffect(() => {
    if (!open) return;
    const fit = () =>
      setPos((prev) => {
        const next = clamp(prev, panelRef.current);
        return next.x === prev.x && next.y === prev.y ? prev : next;
      });
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [open]);

  const bringToFront = () => {
    const el = panelRef.current;
    if (!el || frontPanel === el) return;
    if (frontPanel) frontPanel.style.zIndex = "";
    el.style.zIndex = "41";
    frontPanel = el;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    // 머리 안의 닫기 버튼 등은 그대로 눌려야 한다
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerX: e.clientX, pointerY: e.clientY, start: pos, last: pos };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    const el = panelRef.current;
    if (!d || !el) return;
    const next = clamp(
      { x: d.start.x + e.clientX - d.pointerX, y: d.start.y + e.clientY - d.pointerY },
      el,
    );
    d.last = next;
    el.style.left = `${next.x}px`;
    el.style.top = `${next.y}px`;
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (d.last.x !== d.start.x || d.last.y !== d.start.y) commit(d.last);
  };

  return {
    panelRef,
    panelProps: {
      ref: panelRef,
      style: { left: pos.x, top: pos.y },
      onPointerDownCapture: bringToFront,
    },
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onDoubleClick: (e: ReactMouseEvent<HTMLElement>) => {
        if ((e.target as HTMLElement).closest("button, a, input")) return;
        commit(clamp(fallback, panelRef.current));
      },
      title: "끌어서 옮기기 · 더블클릭하면 원래 자리로",
      className: "cursor-grab touch-none select-none active:cursor-grabbing",
    },
  };
}
