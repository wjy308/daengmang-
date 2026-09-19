import type { Metadata } from "next";
import LeaderTools from "@/components/LeaderTools";

export const metadata: Metadata = {
  title: "댕망 · 공대장 도구",
  description: "방제·브리핑 문구를 눌러서 바로 복사",
};

export default function LeaderPage() {
  return <LeaderTools />;
}
