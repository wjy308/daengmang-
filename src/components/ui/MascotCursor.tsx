"use client";

import { useEffect, useRef } from "react";

/** 마스코트 왼쪽 위 모서리가 커서 기준 어디에 놓일지 (기존 커서 핫스팟 20 70과 동일) */
const OFFSET_X = -20;
const OFFSET_Y = -70;

/**
 * OS 커서를 숨긴 자리에 대신 붙는 마스코트.
 * 위치는 리렌더 없이 ref로 직접 transform만 갈아끼워 깜빡임/지연을 없앤다.
 * `pos`는 진입 지점(mouseenter 좌표)이고 이후 이동은 이 컴포넌트가 직접 처리한다.
 */
export default function MascotCursor({
  pos,
  variant,
}: {
  pos: { x: number; y: number } | null;
  /** 배경 이미지 클래스 (mascot-cursor-lets-go | mascot-cursor-run) */
  variant: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const active = pos !== null;

  useEffect(() => {
    if (!active) return;
    const move = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      el.style.transform = `translate3d(${e.clientX + OFFSET_X}px, ${
        e.clientY + OFFSET_Y
      }px, 0)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [active]);

  if (!pos) return null;

  return (
    // 바깥은 위치, 안쪽은 등장 애니메이션 — 둘 다 transform이라 레이어를 나눈다
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[70] select-none"
      style={{
        transform: `translate3d(${pos.x + OFFSET_X}px, ${
          pos.y + OFFSET_Y
        }px, 0)`,
      }}
    >
      <div className={`mascot-cursor mascot-cursor-pop ${variant}`} />
    </div>
  );
}
