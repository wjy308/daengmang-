"use client";

import { useEffect, useState } from "react";
import { DEFAULT_RAID_DEFINITIONS, type RaidDefinition } from "@/lib/raids";
import { formatGold } from "@/lib/gold";

interface FormState {
  id: string;
  group: string;
  difficulty: string;
  label: string;
  requiredLevel: string;
  boundGold: string;
  normalGold: string;
  bonusCost: string;
  soloRaid: boolean;
}

const EMPTY_FORM: FormState = {
  id: "",
  group: "",
  difficulty: "",
  label: "",
  requiredLevel: "0",
  boundGold: "0",
  normalGold: "0",
  bonusCost: "0",
  soloRaid: false,
};

function raidToForm(r: RaidDefinition): FormState {
  return {
    id: r.id,
    group: r.group,
    difficulty: r.difficulty,
    label: r.label,
    requiredLevel: String(r.requiredLevel),
    boundGold: String(r.boundGold),
    normalGold: String(r.normalGold),
    bonusCost: String(r.bonusCost),
    soloRaid: r.soloRaid ?? false,
  };
}

function formToRaid(f: FormState): RaidDefinition {
  const group = f.group.trim();
  const difficulty = f.difficulty.trim();
  const label = f.label.trim() || (difficulty ? `${group} · ${difficulty}` : group);
  return {
    id: f.id.trim(),
    group,
    difficulty,
    label,
    requiredLevel: parseInt(f.requiredLevel, 10) || 0,
    boundGold: parseInt(f.boundGold, 10) || 0,
    normalGold: parseInt(f.normalGold, 10) || 0,
    bonusCost: parseInt(f.bonusCost, 10) || 0,
    soloRaid: f.soloRaid || undefined,
  };
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted">{label}</span>
      <input
        type="number"
        min="0"
        step="100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}

function TextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}

function RaidForm({
  initial,
  raids,
  onSave,
  onCancel,
}: {
  initial: FormState;
  raids: RaidDefinition[];
  onSave: (def: RaidDefinition) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isNew = !raids.some((r) => r.id === initial.id);
  const existingGroups = [...new Set(raids.map((r) => r.group))];

  const set = (key: keyof FormState) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [key]: v }));

  const handleSave = async () => {
    setErr(null);
    const def = formToRaid(form);
    if (!def.id) { setErr("레이드 ID를 입력해주세요."); return; }
    if (!def.group) { setErr("그룹명을 입력해주세요."); return; }
    if (isNew && raids.some((r) => r.id === def.id)) {
      setErr("이미 존재하는 레이드 ID입니다."); return;
    }
    setSaving(true);
    try {
      await onSave(def);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // label 자동 완성: group + difficulty 기반
  useEffect(() => {
    if (!form.label || form.label === initial.label) {
      const auto = form.difficulty ? `${form.group} · ${form.difficulty}` : form.group;
      setForm((f) => ({ ...f, label: auto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.group, form.difficulty]);

  const bound = parseInt(form.boundGold, 10) || 0;
  const normal = parseInt(form.normalGold, 10) || 0;
  const cost = parseInt(form.bonusCost, 10) || 0;
  const preview = bound + normal;
  const afterBonus = Math.max(0, bound - Math.min(bound, cost)) + Math.max(0, normal - Math.max(0, cost - bound));

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface-muted p-4">
      <p className="text-sm font-semibold">{isNew ? "새 레이드 추가" : "레이드 수정"}</p>

      <div className="grid grid-cols-2 gap-3">
        <TextInput label="레이드 ID *" value={form.id} placeholder="예: serca-hard" onChange={set("id")} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted">그룹 *</span>
          <input
            list="group-suggestions"
            value={form.group}
            onChange={(e) => set("group")(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm outline-none focus:border-accent"
            placeholder="예: 세르카"
          />
          <datalist id="group-suggestions">
            {existingGroups.map((g) => <option key={g} value={g} />)}
          </datalist>
        </div>
        <TextInput label="난이도" value={form.difficulty} placeholder="예: 하드" onChange={set("difficulty")} />
        <TextInput label="표시 이름" value={form.label} placeholder="자동 생성" onChange={set("label")} />
        <NumberInput label="요구 아이템 레벨" value={form.requiredLevel} onChange={set("requiredLevel")} />
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.soloRaid}
              onChange={(e) => set("soloRaid")(e.target.checked)}
              className="size-3.5 rounded accent-[var(--accent)]"
            />
            <span className="text-xs text-muted">솔로 레이드</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumberInput label="귀속 골드" value={form.boundGold} onChange={set("boundGold")} />
        <NumberInput label="일반 골드" value={form.normalGold} onChange={set("normalGold")} />
        <NumberInput label="더보기 비용" value={form.bonusCost} onChange={set("bonusCost")} />
      </div>

      <p className="text-[11px] text-muted">
        총 골드 {formatGold(preview)}
        {cost > 0 && ` · 더보기 후 ${formatGold(afterBonus)}`}
      </p>

      {err && (
        <p className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--danger-border)", color: "var(--danger-text)", background: "var(--danger-surface)" }}>
          {err}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg border border-accent/50 bg-[var(--chip-gold-bg)] px-4 py-1.5 text-sm font-semibold text-accent-soft transition hover:opacity-80 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-1.5 text-sm text-muted transition hover:border-border-strong hover:text-foreground"
        >
          취소
        </button>
      </div>
    </div>
  );
}

export default function RaidDefinitionModal({
  raids,
  isDefault,
  onUpsert,
  onDelete,
  onReset,
  onClose,
}: {
  raids: RaidDefinition[];
  isDefault: boolean;
  onUpsert: (def: RaidDefinition) => Promise<void>;
  onDelete: (raidId: string) => Promise<void>;
  onReset: () => Promise<void>;
  onClose: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const handleDelete = async (raidId: string) => {
    setErr(null);
    setDeletingId(raidId);
    try {
      await onDelete(raidId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleReset = async () => {
    if (!confirm("레이드 목록을 기본값으로 초기화할까요? 모든 커스텀 설정이 사라집니다.")) return;
    setResetting(true);
    try {
      await onReset();
    } finally {
      setResetting(false);
    }
  };

  // 그룹별로 묶기
  const groups = [...new Set(raids.map((r) => r.group))];
  const defaultIds = new Set(DEFAULT_RAID_DEFINITIONS.map((r) => r.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl">
        {/* 헤더 */}
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">레이드 관리</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              레이드 추가·수정·삭제 · 변경은 모든 사용자에게 적용됩니다
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isDefault && (
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:text-[var(--danger-text)] disabled:opacity-50"
              >
                {resetting ? "초기화 중…" : "기본값으로"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-foreground"
            >
              닫기
            </button>
          </div>
        </header>

        {/* 본문 */}
        <div className="daengmang-scroll flex-1 overflow-y-auto p-4 space-y-4">
          {err && (
            <p className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--danger-border)", color: "var(--danger-text)", background: "var(--danger-surface)" }}>
              {err}
            </p>
          )}

          {/* 추가 폼 */}
          {adding ? (
            <RaidForm
              initial={EMPTY_FORM}
              raids={raids}
              onSave={async (def) => { await onUpsert(def); setAdding(false); }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm text-muted transition hover:border-accent/50 hover:text-accent-soft"
            >
              + 새 레이드 추가
            </button>
          )}

          {/* 레이드 목록 */}
          {groups.map((group) => (
            <div key={group}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-accent-soft">
                {group}
              </p>
              <div className="space-y-1.5">
                {raids.filter((r) => r.group === group).map((raid) => (
                  <div key={raid.id}>
                    {editingId === raid.id ? (
                      <RaidForm
                        initial={raidToForm(raid)}
                        raids={raids}
                        onSave={async (def) => { await onUpsert(def); setEditingId(null); }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{raid.label}</p>
                          <p className="text-[10px] text-muted">
                            {raid.id}
                            {raid.requiredLevel > 0 && ` · ${raid.requiredLevel.toLocaleString()}`}
                            {" · "}
                            {formatGold(raid.boundGold + raid.normalGold)}
                            {!defaultIds.has(raid.id) && (
                              <span className="ml-1 rounded bg-accent/10 px-1 text-accent-soft">커스텀</span>
                            )}
                            {raid.soloRaid && (
                              <span className="ml-1 text-muted-subtle">솔로</span>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingId(raid.id)}
                            className="rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:border-border-strong hover:text-foreground"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === raid.id}
                            onClick={() => handleDelete(raid.id)}
                            className="rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:border-[var(--danger-border)] hover:text-[var(--danger-text)] disabled:opacity-50"
                          >
                            {deletingId === raid.id ? "…" : "삭제"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
