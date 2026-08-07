import { NextResponse } from "next/server";
import type { RaidDefinition } from "@/lib/raids";
import {
  getRaidDefinitions,
  resetRaidDefinitions,
  upsertRaidDefinition,
} from "@/lib/server/raid-store";

export async function GET() {
  try {
    const raids = await getRaidDefinitions();
    return NextResponse.json({ raids });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "레이드 정보를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { raid?: unknown; reset?: boolean };

    if (body.reset) {
      const raids = await resetRaidDefinitions();
      return NextResponse.json({ raids });
    }

    const r = body.raid as Record<string, unknown> | undefined;
    if (!r || typeof r.id !== "string" || typeof r.group !== "string") {
      return NextResponse.json({ error: "잘못된 레이드 데이터입니다." }, { status: 400 });
    }

    const def: RaidDefinition = {
      id: r.id.trim(),
      group: (r.group as string).trim(),
      difficulty: typeof r.difficulty === "string" ? r.difficulty.trim() : "",
      label: typeof r.label === "string" ? r.label.trim() : r.id.trim(),
      requiredLevel: typeof r.requiredLevel === "number" ? r.requiredLevel : 0,
      boundGold: typeof r.boundGold === "number" ? r.boundGold : 0,
      normalGold: typeof r.normalGold === "number" ? r.normalGold : 0,
      bonusCost: typeof r.bonusCost === "number" ? r.bonusCost : 0,
      soloRaid: r.soloRaid === true,
    };

    if (!def.id) {
      return NextResponse.json({ error: "레이드 ID를 입력해주세요." }, { status: 400 });
    }
    if (!def.group) {
      return NextResponse.json({ error: "그룹명을 입력해주세요." }, { status: 400 });
    }

    const raids = await upsertRaidDefinition(def);
    return NextResponse.json({ raids });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
