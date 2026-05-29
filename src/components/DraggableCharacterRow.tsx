"use client";

import { useRef, type ReactNode } from "react";
import { useDragReorder } from "@/hooks/useDragReorder";
import ReorderGrip from "@/components/ui/ReorderGrip";

export default function DraggableCharacterRow({
  index,
  characterIds,
  onReorder,
  drag,
  children,
}: {
  index: number;
  characterIds: string[];
  onReorder: (nextIds: string[]) => void;
  drag: ReturnType<typeof useDragReorder<string>>;
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
      } ${isOver ? "ring-2 ring-accent/35 ring-offset-1 ring-offset-background" : ""}`}
      onDragOver={(event) => drag.handleDragOver(event, index)}
      onDrop={drag.createDropHandler(index, characterIds, onReorder)}
    >
      <div className="flex items-center self-center">
        <ReorderGrip
          label="캐릭터 순서 변경"
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
