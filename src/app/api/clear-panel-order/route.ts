import { NextResponse } from "next/server";
import { getClearPanelOrder, setClearPanelOrder } from "@/lib/server/raid-store";

export async function GET() {
  try {
    const order = await getClearPanelOrder();
    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "순서를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { raidIds?: unknown; userIds?: unknown };
    const order = await setClearPanelOrder(body);
    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "순서 저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
