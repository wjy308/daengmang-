import { randomUUID } from "crypto";
import {
  LEADER_CATEGORY_NAME_MAX,
  LEADER_PHRASE_TEXT_MAX,
  LEADER_PHRASE_TITLE_MAX,
  type LeaderToolsData,
} from "@/lib/leader-tools";
import { loadLeaderTools, saveLeaderTools } from "@/lib/server/storage";

export { loadLeaderTools };

function cleanCategoryName(name: unknown): string {
  const value = typeof name === "string" ? name.trim() : "";
  if (!value) throw new Error("카테고리 이름을 입력해주세요.");
  if (value.length > LEADER_CATEGORY_NAME_MAX) {
    throw new Error(`카테고리 이름은 ${LEADER_CATEGORY_NAME_MAX}자까지 쓸 수 있습니다.`);
  }
  return value;
}

function cleanPhrase(input: { title?: unknown; text?: unknown }) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  // 본문 안쪽 공백·줄바꿈은 붙여넣기 결과에 그대로 나가야 하므로 앞뒤 빈 줄만 걷는다
  const text =
    typeof input.text === "string"
      ? input.text.replace(/^(\s*\n)+/, "").replace(/(\n\s*)+$/, "")
      : "";
  if (!text.trim()) throw new Error("문구 내용을 입력해주세요.");
  if (title.length > LEADER_PHRASE_TITLE_MAX) {
    throw new Error(`제목은 ${LEADER_PHRASE_TITLE_MAX}자까지 쓸 수 있습니다.`);
  }
  if (text.length > LEADER_PHRASE_TEXT_MAX) {
    throw new Error(`문구는 ${LEADER_PHRASE_TEXT_MAX}자까지 쓸 수 있습니다.`);
  }
  return { title, text };
}

async function mutate(
  fn: (data: LeaderToolsData) => LeaderToolsData,
): Promise<LeaderToolsData> {
  const next = fn(await loadLeaderTools());
  await saveLeaderTools(next);
  return next;
}

export function addCategory(name: unknown) {
  const clean = cleanCategoryName(name);
  return mutate((data) => ({
    ...data,
    categories: [...data.categories, { id: randomUUID(), name: clean }],
  }));
}

export function renameCategory(categoryId: string, name: unknown) {
  const clean = cleanCategoryName(name);
  return mutate((data) => {
    if (!data.categories.some((c) => c.id === categoryId)) {
      throw new Error("카테고리를 찾을 수 없습니다.");
    }
    return {
      ...data,
      categories: data.categories.map((c) =>
        c.id === categoryId ? { ...c, name: clean } : c,
      ),
    };
  });
}

/** 카테고리를 지우면 안에 든 문구도 같이 지운다. */
export function deleteCategory(categoryId: string) {
  return mutate((data) => ({
    categories: data.categories.filter((c) => c.id !== categoryId),
    phrases: data.phrases.filter((p) => p.categoryId !== categoryId),
  }));
}

export function addPhrase(input: { categoryId?: unknown; title?: unknown; text?: unknown }) {
  const clean = cleanPhrase(input);
  const categoryId = typeof input.categoryId === "string" ? input.categoryId : "";
  return mutate((data) => {
    if (!data.categories.some((c) => c.id === categoryId)) {
      throw new Error("카테고리를 찾을 수 없습니다.");
    }
    return {
      ...data,
      phrases: [...data.phrases, { id: randomUUID(), categoryId, ...clean }],
    };
  });
}

export function updatePhrase(phraseId: string, input: { title?: unknown; text?: unknown }) {
  const clean = cleanPhrase(input);
  return mutate((data) => {
    if (!data.phrases.some((p) => p.id === phraseId)) {
      throw new Error("문구를 찾을 수 없습니다.");
    }
    return {
      ...data,
      phrases: data.phrases.map((p) => (p.id === phraseId ? { ...p, ...clean } : p)),
    };
  });
}

export function deletePhrase(phraseId: string) {
  return mutate((data) => ({
    ...data,
    phrases: data.phrases.filter((p) => p.id !== phraseId),
  }));
}
