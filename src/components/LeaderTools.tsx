"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import DraggableReorderRow from "@/components/DraggableReorderRow";
import ThemeToggle from "@/components/ThemeToggle";
import { useDragReorder } from "@/hooks/useDragReorder";
import { usePersistedOrder } from "@/hooks/usePersistedOrder";
import * as api from "@/lib/api/leader-tools-api";
import {
  LEADER_CATEGORY_NAME_MAX,
  LEADER_PHRASE_TEXT_MAX,
  LEADER_PHRASE_TITLE_MAX,
  phraseDisplayTitle,
  type LeaderCategory,
  type LeaderPhrase,
  type LeaderToolsData,
} from "@/lib/leader-tools";

/** 순서는 사람마다 다르게 쓰므로 서버가 아니라 이 브라우저에 저장한다 */
const CATEGORY_ORDER_KEY = "daengmang-leader-category-order";
const phraseOrderKey = (categoryId: string) => `daengmang-leader-phrase-order:${categoryId}`;

/** 복사됨 표시가 남아 있는 시간 */
const COPIED_FEEDBACK_MS = 1400;

/** 처음 들어왔을 때 한 번에 만들 수 있게 보여주는 카테고리 */
const STARTER_CATEGORIES = ["방제", "브리핑"];

type RunAction = (action: () => Promise<LeaderToolsData>) => Promise<boolean>;

const inputClass =
  "w-full rounded-lg border border-border bg-[var(--input-bg)] px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-accent";
const subtleButton =
  "rounded-md border border-border px-2 py-0.5 text-[11px] text-muted transition hover:border-border-strong hover:text-foreground disabled:opacity-40";
const primaryButton =
  "rounded-lg border border-accent/50 bg-[var(--chip-gold-bg)] px-3 py-1.5 text-xs font-semibold text-accent-soft transition hover:border-accent disabled:opacity-40";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // clipboard API가 막힌 환경(비보안 컨텍스트 등) 대비
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export default function LeaderTools() {
  const [data, setData] = useState<LeaderToolsData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    api
      .fetchLeaderTools()
      .then(setData)
      .catch((error: unknown) =>
        setLoadError(error instanceof Error ? error.message : "불러오지 못했습니다."),
      );
  }, []);

  const run: RunAction = useCallback(async (action) => {
    try {
      setData(await action());
      setActionError(null);
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "요청에 실패했습니다.");
      return false;
    }
  }, []);

  const categories = data?.categories ?? [];
  const [categoryOrder, setCategoryOrder] = usePersistedOrder(
    CATEGORY_ORDER_KEY,
    categories.map((c) => c.id),
  );
  const categoryDrag = useDragReorder<string>();
  const orderedCategories = categoryOrder
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is LeaderCategory => !!c);

  const addCategory = async (name: string) => {
    if (await run(() => api.createCategory(name))) setNewCategory("");
  };

  return (
    <div className="min-h-dvh bg-background">
      <header
        className="sticky top-0 z-10 border-b border-border backdrop-blur"
        style={{ background: "var(--header-bg)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 lg:max-w-[1600px] lg:px-8">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-accent">daengmang</p>
            <h1 className="text-lg font-semibold tracking-tight">공대장 도구</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-foreground"
            >
              ← 레이드 정리
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:max-w-[1600px] lg:px-8 lg:py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight lg:text-xl">공대장 도구</h2>
            <p className="mt-0.5 text-sm text-muted">
              카드를 누르면 바로 복사됩니다 · ⠿ 로 끌어서 순서 변경 (순서는 이 브라우저에만 저장)
            </p>
          </div>
          {data && (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (newCategory.trim()) void addCategory(newCategory);
              }}
            >
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                maxLength={LEADER_CATEGORY_NAME_MAX}
                placeholder="새 카테고리 이름"
                className={`${inputClass} w-44`}
              />
              <button type="submit" disabled={!newCategory.trim()} className={primaryButton}>
                카테고리 추가
              </button>
            </form>
          )}
        </div>

        {actionError && (
          <p className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-surface)] px-3 py-2 text-xs text-[var(--danger-text)]">
            {actionError}
          </p>
        )}

        {loadError ? (
          <p className="text-sm text-[var(--danger-text)]">{loadError}</p>
        ) : !data ? (
          <p className="text-sm text-muted">불러오는 중…</p>
        ) : orderedCategories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-dashed-border px-4 py-10 text-center">
            <p className="text-sm text-muted">아직 카테고리가 없습니다.</p>
            <div className="mt-3 flex justify-center gap-2">
              {STARTER_CATEGORIES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => void addCategory(name)}
                  className={subtleButton}
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orderedCategories.map((category, index) => (
              <DraggableReorderRow
                key={category.id}
                index={index}
                itemIds={categoryOrder}
                onReorder={setCategoryOrder}
                drag={categoryDrag}
                label="카테고리 순서 변경"
              >
                <CategorySection
                  category={category}
                  phrases={data.phrases.filter((p) => p.categoryId === category.id)}
                  run={run}
                />
              </DraggableReorderRow>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CategorySection({
  category,
  phrases,
  run,
}: {
  category: LeaderCategory;
  phrases: LeaderPhrase[];
  run: RunAction;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(category.name);
  const [adding, setAdding] = useState(false);

  const [phraseOrder, setPhraseOrder] = usePersistedOrder(
    phraseOrderKey(category.id),
    phrases.map((p) => p.id),
  );
  const phraseDrag = useDragReorder<string>();
  const orderedPhrases = phraseOrder
    .map((id) => phrases.find((p) => p.id === id))
    .filter((p): p is LeaderPhrase => !!p);

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === category.name) {
      setName(category.name);
      setRenaming(false);
      return;
    }
    if (await run(() => api.renameCategory(category.id, trimmed))) setRenaming(false);
  };

  const remove = () => {
    const warning =
      phrases.length > 0
        ? `"${category.name}" 카테고리와 안에 든 문구 ${phrases.length}개를 삭제할까요?`
        : `"${category.name}" 카테고리를 삭제할까요?`;
    if (confirm(warning)) void run(() => api.deleteCategory(category.id));
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-3 lg:p-4">
      <header className="flex flex-wrap items-center gap-2">
        {renaming ? (
          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              void saveName();
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setName(category.name);
                  setRenaming(false);
                }
              }}
              maxLength={LEADER_CATEGORY_NAME_MAX}
              className={`${inputClass} w-40 py-1`}
            />
            <button type="submit" className={subtleButton}>저장</button>
          </form>
        ) : (
          <h3 className="text-base font-semibold tracking-tight">
            {category.name}
            <span className="ml-1.5 text-xs font-normal text-muted-subtle">
              {phrases.length}
            </span>
          </h3>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={() => setAdding(true)} className={subtleButton}>
            + 문구
          </button>
          {!renaming && (
            <button
              type="button"
              onClick={() => {
                setName(category.name);
                setRenaming(true);
              }}
              className={subtleButton}
            >
              이름 변경
            </button>
          )}
          <button type="button" onClick={remove} className={subtleButton}>
            삭제
          </button>
        </div>
      </header>

      {adding && (
        <div className="mt-3">
          <PhraseForm
            submitLabel="추가"
            onCancel={() => setAdding(false)}
            onSubmit={async (title, text) => {
              if (await run(() => api.createPhrase(category.id, title, text))) {
                setAdding(false);
              }
            }}
          />
        </div>
      )}

      {orderedPhrases.length === 0 && !adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 w-full rounded-lg border border-dashed border-dashed-border py-5 text-xs text-muted transition hover:border-border-strong"
        >
          문구 추가
        </button>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {orderedPhrases.map((phrase, index) => (
            <DraggableReorderRow
              key={phrase.id}
              index={index}
              itemIds={phraseOrder}
              onReorder={setPhraseOrder}
              drag={phraseDrag}
              label="문구 순서 변경"
              className="min-w-0"
            >
              <PhraseCard phrase={phrase} run={run} />
            </DraggableReorderRow>
          ))}
        </div>
      )}
    </section>
  );
}

function PhraseCard({ phrase, run }: { phrase: LeaderPhrase; run: RunAction }) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    if (!(await copyText(phrase.text))) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  };

  if (editing) {
    return (
      <PhraseForm
        initialTitle={phrase.title}
        initialText={phrase.text}
        submitLabel="저장"
        onCancel={() => setEditing(false)}
        onSubmit={async (title, text) => {
          if (await run(() => api.updatePhrase(phrase.id, title, text))) setEditing(false);
        }}
      />
    );
  }

  const showTitle = phrase.title.trim().length > 0;

  return (
    <div
      className={`flex h-full flex-col rounded-lg border transition ${
        copied
          ? "border-[var(--success-border)] bg-[var(--success-surface)]"
          : "border-border bg-card hover:border-border-strong hover:bg-card-hover"
      }`}
    >
      <button
        type="button"
        onClick={() => void copy()}
        title="눌러서 복사"
        className="flex-1 px-3 pt-2.5 pb-1.5 text-left"
      >
        {showTitle && (
          <p className="truncate text-sm font-semibold text-foreground">
            {phraseDisplayTitle(phrase)}
          </p>
        )}
        <p
          className={`whitespace-pre-wrap break-words text-sm ${
            showTitle ? "mt-1 line-clamp-4 text-muted" : "line-clamp-5 text-foreground"
          }`}
        >
          {phrase.text}
        </p>
      </button>
      <div className="flex items-center gap-1.5 px-3 pb-2">
        <span
          className={`text-[11px] font-semibold ${
            copied ? "text-[var(--success-text)]" : "text-muted-subtle"
          }`}
        >
          {copied ? "복사됨 ✓" : "누르면 복사"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => setEditing(true)} className={subtleButton}>
            수정
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`"${phraseDisplayTitle(phrase)}" 문구를 삭제할까요?`)) {
                void run(() => api.deletePhrase(phrase.id));
              }
            }}
            className={subtleButton}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function PhraseForm({
  initialTitle = "",
  initialText = "",
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialTitle?: string;
  initialText?: string;
  submitLabel: string;
  onSubmit: (title: string, text: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    await onSubmit(title, text);
    setSaving(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void submit();
  };

  return (
    <div className="space-y-2 rounded-lg border border-border-strong bg-card p-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={LEADER_PHRASE_TITLE_MAX}
        placeholder="제목 (선택) — 예: 카멘 하드 방제"
        className={inputClass}
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={LEADER_PHRASE_TEXT_MAX}
        rows={4}
        placeholder="복사될 문구"
        className={`${inputClass} resize-y`}
      />
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-subtle">Ctrl+Enter 저장 · Esc 취소</span>
        <div className="ml-auto flex gap-1.5">
          <button type="button" onClick={onCancel} className={subtleButton}>
            취소
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!text.trim() || saving}
            className={primaryButton}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
