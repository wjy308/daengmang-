import { NextResponse } from "next/server";
import { markPartyCleared, unmarkPartyCleared } from "@/lib/server/raid-store";
import type { RaidId } from "@/lib/raids";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      raidId?: RaidId;
      members?: { userId: string; characterId: string }[];
      action?: "mark" | "cancel";
    };

    if (
      !body.raidId ||
      !Array.isArray(body.members) ||
      body.members.length === 0
    ) {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 },
      );
    }

    const members = body.members.map((m) => ({
      userId: String(m.userId),
      characterId: String(m.characterId),
    }));

    if (body.action === "cancel") {
      await unmarkPartyCleared(body.raidId, members);
    } else {
      await markPartyCleared(body.raidId, members);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "클리어 처리에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
