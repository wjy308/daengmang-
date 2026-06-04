import { NextResponse } from "next/server";
import {
  addCharacterAmajdaItem,
  removeCharacter,
  removeCharacterAmajdaItem,
  reorderCharacterRaids,
  setCharacterRole,
  setCharacterAmajdaItemResetWeekly,
  toggleCharacterAmajdaChecked,
  toggleCharacterBonus,
  toggleCharacterGoldIncluded,
  toggleCharacterNoGold,
  toggleCharacterRaid,
} from "@/lib/server/raid-store";
import type { RaidId } from "@/lib/raids";
import type { CharacterRole } from "@/lib/types";

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ userId: string; characterId: string }> },
) {
  try {
    const { userId, characterId } = await params;
    await removeCharacter(userId, characterId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "캐릭터 삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ userId: string; characterId: string }> },
) {
  try {
    const { userId, characterId } = await params;
    const body = (await request.json()) as {
      role?: CharacterRole;
      action?:
        | "toggleRaid"
        | "toggleNoGold"
        | "toggleBonus"
        | "toggleGoldIncluded"
        | "reorderRaids"
        | "addAmajdaItem"
        | "removeAmajdaItem"
        | "toggleAmajdaChecked"
        | "setAmajdaResetWeekly";
      raidId?: RaidId;
      raidIds?: RaidId[];
      label?: string;
      period?: string;
      itemId?: string;
      resetWeekly?: boolean;
    };

    if (body.action === "addAmajdaItem" && body.label) {
      const item = await addCharacterAmajdaItem(
        userId,
        characterId,
        body.label,
        body.period,
      );
      return NextResponse.json({ item });
    }

    if (body.action === "removeAmajdaItem" && body.itemId) {
      await removeCharacterAmajdaItem(userId, characterId, body.itemId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "toggleAmajdaChecked" && body.itemId) {
      await toggleCharacterAmajdaChecked(userId, characterId, body.itemId);
      return NextResponse.json({ ok: true });
    }

    if (
      body.action === "setAmajdaResetWeekly" &&
      body.itemId &&
      typeof body.resetWeekly === "boolean"
    ) {
      await setCharacterAmajdaItemResetWeekly(
        userId,
        characterId,
        body.itemId,
        body.resetWeekly,
      );
      return NextResponse.json({ ok: true });
    }

    if (body.action === "reorderRaids" && Array.isArray(body.raidIds)) {
      await reorderCharacterRaids(userId, characterId, body.raidIds);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "toggleRaid" && body.raidId) {
      await toggleCharacterRaid(userId, characterId, body.raidId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "toggleNoGold" && body.raidId) {
      await toggleCharacterNoGold(userId, characterId, body.raidId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "toggleBonus" && body.raidId) {
      await toggleCharacterBonus(userId, characterId, body.raidId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "toggleGoldIncluded") {
      await toggleCharacterGoldIncluded(userId, characterId);
      return NextResponse.json({ ok: true });
    }

    if (body.role === "dealer" || body.role === "support") {
      await setCharacterRole(userId, characterId, body.role);
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
