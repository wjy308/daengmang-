import { NextResponse } from "next/server";
import {
  addUserAmajdaItem,
  removeUser,
  removeUserAmajdaItem,
  setUserAmajdaItemResetWeekly,
  toggleUserAmajdaChecked,
} from "@/lib/server/raid-store";

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
        | "setAmajdaResetWeekly";
      label?: string;
      period?: string;
      itemId?: string;
      resetWeekly?: boolean;
    };

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
