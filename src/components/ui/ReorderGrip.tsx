import type { DragEvent } from "react";

export default function ReorderGrip({
  label = "순서 변경",
  asHandle = true,
  onDragStart,
  onDragEnd,
}: {
  label?: string;
  asHandle?: boolean;
  onDragStart?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
}) {
  return (
    <span
      draggable={asHandle}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={label}
      aria-label={label}
      className="inline-flex shrink-0 cursor-grab touch-none select-none rounded px-0.5 text-sm leading-none text-muted-subtle active:cursor-grabbing"
      onClick={(e) => e.stopPropagation()}
    >
      ⠿
    </span>
  );
}
