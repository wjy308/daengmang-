import { NextResponse } from "next/server";
import { deletePhrase, updatePhrase } from "@/lib/server/leader-store";

type Params = { params: Promise<{ phraseId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { phraseId } = await params;
    const body = (await request.json()) as { title?: unknown; text?: unknown };
    const data = await updatePhrase(decodeURIComponent(phraseId), body);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { phraseId } = await params;
    const data = await deletePhrase(decodeURIComponent(phraseId));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
