import { NextResponse } from "next/server";
import { reorderCharacters } from "@/lib/server/raid-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const body = (await request.json()) as { characterIds?: string[] };

    if (!Array.isArray(body.characterIds)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    await reorderCharacters(userId, body.characterIds.map(String));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "순서 변경에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
