import { NextResponse } from "next/server";
import { addCategory } from "@/lib/server/leader-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: unknown };
    const data = await addCategory(body.name);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
