import { NextResponse } from "next/server";
import { deleteRaidDefinition } from "@/lib/server/raid-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ raidId: string }> },
) {
  try {
    const { raidId } = await params;
    const raids = await deleteRaidDefinition(decodeURIComponent(raidId));
    return NextResponse.json({ raids });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
