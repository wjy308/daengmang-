import { NextResponse } from "next/server";
import type { GoldOverrides } from "@/lib/gold-overrides";
import type { RaidId } from "@/lib/raids";
import {
  addUserAmajdaItem,
  getRaidDefinitions,
  removeUser,
  removeUserAmajdaItem,
  setUserAmajdaItemResetWeekly,
  setUserGoldPriority,
  setUserGoldTiePreference,
  toggleUserAmajdaChecked,
} from "@/lib/server/raid-store";

async function parseRaidIds(raw: unknown[]): Promise<RaidId[]> {
  const raids = await getRaidDefinitions();
  const known = new Set<string>(raids.map((r) => r.id));
  return raw.filter(
    (id): id is RaidId => typeof id === "string" && known.has(id),
  );
}

/** 골드 표는 브라우저 localStorage에 있어 요청으로 받는다 */
function parseGoldOverrides(raw: unknown): GoldOverrides | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const parsed: GoldOverrides = {};
  for (const [raidId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const { boundGold, normalGold, bonusCost } = value as Record<
      string,
      unknown
    >;
    if (
      typeof boundGold !== "number" ||
      typeof normalGold !== "number" ||
      typeof bonusCost !== "number"
    ) {
      continue;
    }
    parsed[raidId as RaidId] = { boundGold, normalGold, bonusCost };
  }
  return parsed;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const body = (await request.json()) as {
      action?:
        | "addAmajdaItem"
        | "removeAmajdaItem"
        | "toggleAmajdaChecked"
        | "setAmajdaResetWeekly"
        | "setGoldPriority"
        | "setGoldTiePreference";
      label?: string;
      period?: string;
      itemId?: string;
      resetWeekly?: boolean;
      goldPriority?: string;
      goldTiePreference?: unknown;
      goldOverrides?: unknown;
    };

    if (
      body.action === "setGoldPriority" &&
      (body.goldPriority === "total" || body.goldPriority === "normal")
    ) {
      await setUserGoldPriority(
        userId,
        body.goldPriority,
        parseGoldOverrides(body.goldOverrides),
      );
      return NextResponse.json({ ok: true });
    }

    if (
      body.action === "setGoldTiePreference" &&
      Array.isArray(body.goldTiePreference)
    ) {
      await setUserGoldTiePreference(
        userId,
        await parseRaidIds(body.goldTiePreference),
        parseGoldOverrides(body.goldOverrides),
      );
      return NextResponse.json({ ok: true });
    }

    if (body.action === "addAmajdaItem" && body.label) {
      const item = await addUserAmajdaItem(userId, body.label, body.period);
      return NextResponse.json({ item });
    }

    if (body.action === "removeAmajdaItem" && body.itemId) {
      await removeUserAmajdaItem(userId, body.itemId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "toggleAmajdaChecked" && body.itemId) {
      await toggleUserAmajdaChecked(userId, body.itemId);
      return NextResponse.json({ ok: true });
    }

    if (
      body.action === "setAmajdaResetWeekly" &&
      body.itemId &&
      typeof body.resetWeekly === "boolean"
    ) {
      await setUserAmajdaItemResetWeekly(
        userId,
        body.itemId,
        body.resetWeekly,
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "수정에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

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
