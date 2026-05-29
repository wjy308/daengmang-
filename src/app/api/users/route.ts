import { NextResponse } from "next/server";
import { getUsers, addUser } from "@/lib/server/raid-store";

export async function GET() {
  const users = await getUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { nickname?: string };
    const nickname = body.nickname ?? "";
    const user = await addUser(nickname);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "유저 추가에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
