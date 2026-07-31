import type { Metadata } from "next";
import Playground from "@/components/Playground";

export const metadata: Metadata = {
  title: "댕망 · 놀이터",
  description: "숙제와 상관없는 놀이 모음",
};

export default function PlaygroundPage() {
  return <Playground />;
}
