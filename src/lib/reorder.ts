export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/**
 * 저장된 순서를 현재 목록에 입힌다. 저장본에 없는 새 항목은 원래 순서대로 뒤에 붙고,
 * 이미 사라진 항목은 버린다.
 */
export function applySavedOrder(saved: string[], ids: string[]): string[] {
  const present = new Set(ids);
  const seen = new Set<string>();
  const head = saved.filter((id) => present.has(id) && !seen.has(id) && seen.add(id));
  return [...head, ...ids.filter((id) => !seen.has(id))];
}

/**
 * 전체 순서 중 일부(화면에 보이는 것들)만 새 순서로 바꾼다.
 * 보이는 항목이 차지하던 자리에 새 순서대로 채워 넣어서, 안 보이는 항목의 위치는 그대로 둔다.
 */
export function reorderSubset(full: string[], nextSubset: string[]): string[] {
  const subset = new Set(nextSubset);
  let i = 0;
  return full.map((id) => (subset.has(id) ? nextSubset[i++] : id));
}

export function sameIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}
