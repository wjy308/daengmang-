import { NextResponse } from "next/server";
import { addPhrase } from "@/lib/server/leader-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      categoryId?: unknown;
      title?: unknown;
      text?: unknown;
    };
    const data = await addPhrase(body);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
