import { NextResponse } from "next/server";
import { addCharacter } from "@/lib/server/raid-store";
import type { CharacterRole } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const body = (await request.json()) as {
      name?: string;
      role?: CharacterRole;
    };
    const name = body.name ?? "";
    const role: CharacterRole = body.role === "support" ? "support" : "dealer";
    const character = await addCharacter(userId, name, role);
    return NextResponse.json({ character }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "캐릭터 추가에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
