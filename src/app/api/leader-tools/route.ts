import { NextResponse } from "next/server";
import { loadLeaderTools } from "@/lib/server/leader-store";

export async function GET() {
  try {
    const data = await loadLeaderTools();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "공대장 도구를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
