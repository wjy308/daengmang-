"use client";

import { useCallback, useEffect, useState } from "react";

function cloneStylesheets(target: Window) {
  target.document.documentElement.className =
    document.documentElement.className;
  document
    .querySelectorAll<HTMLElement>("style, link[rel='stylesheet']")
    .forEach((el) => target.document.head.appendChild(el.cloneNode(true)));
  target.document.body.style.margin = "0";
}

export function usePip(width = 420, height = 640) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [opacity, setOpacity] = useState(1);

  const open = useCallback(async () => {
    if (!("documentPictureInPicture" in window)) {
      alert("Chrome 116+ 이상에서만 지원해요.");
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pip: Window = await (window as any).documentPictureInPicture.requestWindow({
        width,
        height,
      });
      cloneStylesheets(pip);
      pip.addEventListener("pagehide", () => setPipWindow(null));
      setPipWindow(pip);
    } catch {
      // 사용자 취소
    }
  }, [width, height]);

  const close = useCallback(() => {
    pipWindow?.close();
    setPipWindow(null);
  }, [pipWindow]);

  // 테마 변경 → PiP 창 동기화
  useEffect(() => {
    if (!pipWindow) return;
    const observer = new MutationObserver(() => {
      pipWindow.document.documentElement.className =
        document.documentElement.className;
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [pipWindow]);

  // 투명도 → PiP body 적용
  useEffect(() => {
    if (!pipWindow) return;
    pipWindow.document.body.style.opacity = String(opacity);
  }, [pipWindow, opacity]);

  return { pipWindow, open, close, opacity, setOpacity };
}
