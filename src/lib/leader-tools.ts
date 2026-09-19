/** 공대장 도구 — 방제·브리핑 등 복사해서 쓰는 문구 모음 (공용 데이터) */

export interface LeaderCategory {
  id: string;
  name: string;
}

export interface LeaderPhrase {
  id: string;
  categoryId: string;
  /** 비어 있으면 본문 첫 줄을 제목처럼 보여준다 */
  title: string;
  text: string;
}

export interface LeaderToolsData {
  categories: LeaderCategory[];
  phrases: LeaderPhrase[];
}

export const LEADER_CATEGORY_NAME_MAX = 20;
export const LEADER_PHRASE_TITLE_MAX = 40;
export const LEADER_PHRASE_TEXT_MAX = 2000;

export const EMPTY_LEADER_TOOLS: LeaderToolsData = { categories: [], phrases: [] };

export function parseLeaderToolsData(raw: unknown): LeaderToolsData {
  if (!raw || typeof raw !== "object") return { categories: [], phrases: [] };
  const record = raw as Record<string, unknown>;

  const categories: LeaderCategory[] = [];
  if (Array.isArray(record.categories)) {
    for (const item of record.categories) {
      if (!item || typeof item !== "object") continue;
      const c = item as Record<string, unknown>;
      if (typeof c.id !== "string" || typeof c.name !== "string") continue;
      categories.push({ id: c.id, name: c.name });
    }
  }

  const categoryIds = new Set(categories.map((c) => c.id));
  const phrases: LeaderPhrase[] = [];
  if (Array.isArray(record.phrases)) {
    for (const item of record.phrases) {
      if (!item || typeof item !== "object") continue;
      const p = item as Record<string, unknown>;
      if (
        typeof p.id !== "string" ||
        typeof p.categoryId !== "string" ||
        typeof p.text !== "string" ||
        !categoryIds.has(p.categoryId)
      ) {
        continue;
      }
      phrases.push({
        id: p.id,
        categoryId: p.categoryId,
        title: typeof p.title === "string" ? p.title : "",
        text: p.text,
      });
    }
  }

  return { categories, phrases };
}

/** 카드에 보여줄 제목: 제목이 없으면 본문 첫 줄 */
export function phraseDisplayTitle(phrase: LeaderPhrase): string {
  return phrase.title.trim() || phrase.text.trim().split("\n")[0] || "(빈 문구)";
}
