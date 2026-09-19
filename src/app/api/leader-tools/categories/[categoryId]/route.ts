import { NextResponse } from "next/server";
import { deleteCategory, renameCategory } from "@/lib/server/leader-store";

type Params = { params: Promise<{ categoryId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { categoryId } = await params;
    const body = (await request.json()) as { name?: unknown };
    const data = await renameCategory(decodeURIComponent(categoryId), body.name);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { categoryId } = await params;
    const data = await deleteCategory(decodeURIComponent(categoryId));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
