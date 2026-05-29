import { NextResponse } from "next/server";
import { removeUser } from "@/lib/server/raid-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    await removeUser(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "유저 삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
