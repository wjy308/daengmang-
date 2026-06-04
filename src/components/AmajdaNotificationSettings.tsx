"use client";

import { useMemo, useState } from "react";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import {
  MAX_INTERVAL_MINUTES,
  MAX_BROWSER_USERS,
  MIN_INTERVAL_MINUTES,
  type AmajdaNotifyTrigger,
  type BrowserProfile,
} from "@/lib/amajda-notify";
import type { User } from "@/lib/types";

const NOTIFY_OPTIONS: {
  id: AmajdaNotifyTrigger;
  label: string;
  description: string;
  available: boolean;
}[] = [
  {
    id: "onPartyClear",
    label: "레이드 직접 클리어 체크 시",
    description: "내 계정 캐릭을 직접 클리어 체크하면 아맞다 목록을 띄워요.",
    available: true,
  },
  {
    id: "onInterval",
    label: "일정 시간마다 반복",
    description: "설정한 분마다 아맞다 목록을 띄워요. (미완료 항목만)",
    available: true,
  },
];

export default function AmajdaNotificationSettings({
  users,
  profile,
  onProfileChange,
}: {
  users: User[];
  profile: BrowserProfile;
  onProfileChange: (profile: BrowserProfile) => void;
}) {
  const slots = Array.from({ length: MAX_BROWSER_USERS }, (_, i) => {
    return profile.browserUserIds[i] ?? null;
  });

  const setSlotUserId = (index: number, userId: string | null) => {
    const nextSlots: (string | null)[] = [
      profile.browserUserIds[0] ?? null,
      profile.browserUserIds[1] ?? null,
    ];
    nextSlots[index] = userId;
    if (userId) {
      const otherIndex = index === 0 ? 1 : 0;
      if (nextSlots[otherIndex] === userId) nextSlots[otherIndex] = null;
    }
    onProfileChange({
      ...profile,
      browserUserIds: nextSlots.filter((id): id is string => !!id),
    });
  };

  const toggleNotify = (key: AmajdaNotifyTrigger, enabled: boolean) => {
    onProfileChange({
      ...profile,
      notify: { ...profile.notify, [key]: enabled },
    });
  };

  const setIntervalMinutes = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    const minutes = Math.min(
      MAX_INTERVAL_MINUTES,
      Math.max(MIN_INTERVAL_MINUTES, parsed),
    );
    onProfileChange({ ...profile, intervalMinutes: minutes });
  };

  const usedIds = new Set(profile.browserUserIds);
  const [open, setOpen] = useState(false);

  const anyNotifyEnabled =
    profile.notify.onPartyClear || profile.notify.onInterval;

  const subtitle = useMemo(() => {
    const names = profile.browserUserIds
      .map((id) => users.find((u) => u.id === id)?.nickname)
      .filter((name): name is string => !!name);
    if (names.length === 0) return "브라우저 사용자 미설정";

    const hints: string[] = [];
    if (profile.notify.onPartyClear) hints.push("직접 클리어");
    if (profile.notify.onInterval) {
      hints.push(`${profile.intervalMinutes}분마다`);
    }
    const notifyHint =
      hints.length > 0 ? hints.join(", ") : "알림 꺼짐";
    return `${names.join(", ")} · ${notifyHint}`;
  }, [profile, users]);

  return (
    <CollapsiblePanel
      title="알림 설정"
      subtitle={subtitle}
      open={open}
      onToggle={() => setOpen((v) => !v)}
    >
      <p className="text-xs text-muted">
        이 브라우저를 쓰는 사람을 등록하면, 직접 클리어 체크 시 내 계정의 아맞다
        목록을 보여줘요. (최대 {MAX_BROWSER_USERS}명)
      </p>

      <div className="mt-4 space-y-3">
        <p className="text-xs font-semibold tracking-wide text-muted">
          이 브라우저 사용자
        </p>
        {users.length === 0 ? (
          <p className="text-xs text-muted-subtle">
            레이드 정리에 유저를 먼저 추가해 주세요.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {slots.map((selectedId, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-card p-2.5"
              >
                <label className="mb-1.5 block text-[10px] text-muted">
                  {index + 1}번
                </label>
                <select
                  value={selectedId ?? ""}
                  onChange={(e) =>
                    setSlotUserId(index, e.target.value || null)
                  }
                  className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-2.5 py-2 text-sm outline-none focus:border-border-strong"
                >
                  <option value="">선택 안 함</option>
                  {users.map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                      disabled={
                        usedIds.has(user.id) && user.id !== selectedId
                      }
                    >
                      {user.nickname}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-xs font-semibold tracking-wide text-muted">
          알림 방식
        </p>
        {NOTIFY_OPTIONS.map((option) => {
          const checked = profile.notify[option.id];
          const isInterval = option.id === "onInterval";

          return (
            <div
              key={option.id}
              className={`rounded-lg border transition ${
                option.available
                  ? "border-border bg-card"
                  : "border-border bg-card opacity-60"
              }`}
            >
              <label
                className={`flex gap-3 px-3 py-2.5 ${
                  option.available
                    ? "cursor-pointer hover:border-border-strong"
                    : "cursor-not-allowed"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!option.available}
                  onChange={(e) => toggleNotify(option.id, e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-[var(--accent)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {option.description}
                  </span>
                </span>
              </label>

              {isInterval && checked && option.available && (
                <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
                  <label
                    htmlFor="amajda-interval-minutes"
                    className="shrink-0 text-xs text-muted"
                  >
                    반복 간격
                  </label>
                  <input
                    id="amajda-interval-minutes"
                    type="number"
                    min={MIN_INTERVAL_MINUTES}
                    max={MAX_INTERVAL_MINUTES}
                    value={profile.intervalMinutes}
                    onChange={(e) => setIntervalMinutes(e.target.value)}
                    className="w-20 rounded-lg border border-border bg-[var(--input-bg)] px-2.5 py-1.5 text-sm outline-none focus:border-border-strong"
                  />
                  <span className="text-xs text-muted">분</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-muted-subtle">
        항목을 모두 체크하면 이후 알림은 뜨지 않아요.
      </p>

      {profile.browserUserIds.length === 0 && anyNotifyEnabled && (
        <p
          className="mt-3 rounded-lg border px-3 py-2 text-xs"
          style={{
            borderColor: "var(--danger-border)",
            background: "var(--danger-surface)",
            color: "var(--danger-text)",
          }}
        >
          알림을 쓰려면 위에서 브라우저 사용자를 선택해 주세요.
        </p>
      )}
    </CollapsiblePanel>
  );
}
