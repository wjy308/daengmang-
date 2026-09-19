"use client";

import { useRef, type ReactNode } from "react";
import { useDragReorder } from "@/hooks/useDragReorder";
import ReorderGrip from "@/components/ui/ReorderGrip";

/** ⠿ 손잡이를 옆에 두고 드래그로 순서를 바꾸는 행 (캐릭터·유저 공용) */
export default function DraggableReorderRow({
  index,
  itemIds,
  onReorder,
  drag,
  label = "순서 변경",
  className = "",
  children,
}: {
  index: number;
  itemIds: string[];
  onReorder: (nextIds: string[]) => void;
  drag: ReturnType<typeof useDragReorder<string>>;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isDragging = drag.dragIndex === index;
  const isOver = drag.overIndex === index && drag.dragIndex !== index;

  return (
    <div
      ref={rowRef}
      className={`flex items-stretch gap-1 rounded-lg transition-all duration-150 ${
        isDragging ? "scale-[0.98] opacity-35" : ""
      } ${isOver ? "ring-2 ring-accent/35 ring-offset-1 ring-offset-background" : ""} ${className}`}
      // 목록이 겹쳐 있을 때(카테고리 안의 문구 등) 이 목록에서 시작한 드래그만 받는다.
      // 아니면 무시해서 바깥 목록이 이벤트를 받게 둔다.
      onDragOver={(event) => {
        if (drag.dragIndex !== null) drag.handleDragOver(event, index);
      }}
      onDrop={(event) => {
        if (drag.dragIndex !== null) drag.createDropHandler(index, itemIds, onReorder)(event);
      }}
    >
      <div className="flex items-center self-center">
        <ReorderGrip
          label={label}
          onDragStart={(event) => {
            drag.handleDragStart(index, rowRef.current)(event);
          }}
          onDragEnd={drag.handleDragEnd}
        />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
