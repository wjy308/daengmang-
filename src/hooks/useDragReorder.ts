"use client";

import { useCallback, useState, type DragEvent } from "react";
import { moveItem } from "@/lib/reorder";

export function setDragGhost(event: DragEvent, sourceElement: HTMLElement) {
  const rect = sourceElement.getBoundingClientRect();
  const ghost = sourceElement.cloneNode(true) as HTMLElement;
  ghost.style.position = "fixed";
  ghost.style.top = "-9999px";
  ghost.style.left = "-9999px";
  ghost.style.width = `${rect.width}px`;
  ghost.style.opacity = "0.72";
  ghost.style.pointerEvents = "none";
  ghost.style.transform = "rotate(1deg)";
  ghost.style.boxShadow = "0 10px 28px rgb(0 0 0 / 0.22)";
  document.body.appendChild(ghost);
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;
  event.dataTransfer.setDragImage(ghost, offsetX, offsetY);
  requestAnimationFrame(() => ghost.remove());
}

export function useDragReorder<T extends string>() {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback(
    (index: number, sourceElement?: HTMLElement | null) =>
      (event: DragEvent) => {
        setDragIndex(index);
        setOverIndex(index);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
        if (sourceElement) {
          setDragGhost(event, sourceElement);
        }
      },
    [],
  );

  const handleDragOver = useCallback((event: DragEvent, index?: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (index !== undefined) {
      setOverIndex(index);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const createDropHandler = useCallback(
    (toIndex: number, ids: T[], onCommit: (nextIds: T[]) => void) =>
      (event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const fromRaw = event.dataTransfer.getData("text/plain");
        const fromIndex = fromRaw ? Number(fromRaw) : dragIndex;
        if (fromIndex === null || Number.isNaN(fromIndex)) return;
        const nextIds = moveItem(ids, fromIndex, toIndex).map(String) as T[];
        onCommit(nextIds);
        setDragIndex(null);
        setOverIndex(null);
      },
    [dragIndex],
  );

  return {
    dragIndex,
    overIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    createDropHandler,
  };
}
