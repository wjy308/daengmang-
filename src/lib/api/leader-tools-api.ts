import { request } from "@/lib/api/raid-api";
import type { LeaderToolsData } from "@/lib/leader-tools";

const BASE = "/api/leader-tools";

export function fetchLeaderTools() {
  return request<LeaderToolsData>(BASE);
}

export function createCategory(name: string) {
  return request<LeaderToolsData>(`${BASE}/categories`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function renameCategory(categoryId: string, name: string) {
  return request<LeaderToolsData>(
    `${BASE}/categories/${encodeURIComponent(categoryId)}`,
    { method: "PATCH", body: JSON.stringify({ name }) },
  );
}

export function deleteCategory(categoryId: string) {
  return request<LeaderToolsData>(
    `${BASE}/categories/${encodeURIComponent(categoryId)}`,
    { method: "DELETE" },
  );
}

export function createPhrase(categoryId: string, title: string, text: string) {
  return request<LeaderToolsData>(`${BASE}/phrases`, {
    method: "POST",
    body: JSON.stringify({ categoryId, title, text }),
  });
}

export function updatePhrase(phraseId: string, title: string, text: string) {
  return request<LeaderToolsData>(
    `${BASE}/phrases/${encodeURIComponent(phraseId)}`,
    { method: "PATCH", body: JSON.stringify({ title, text }) },
  );
}

export function deletePhrase(phraseId: string) {
  return request<LeaderToolsData>(
    `${BASE}/phrases/${encodeURIComponent(phraseId)}`,
    { method: "DELETE" },
  );
}
