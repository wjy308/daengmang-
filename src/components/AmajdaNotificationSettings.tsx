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

      {/*
        설정 몇 개짜리라 화면 폭 전체로 펼치지 않는다 — 사용자 선택은 작은 select 두 개,
        알림 방식은 고정 폭 카드. 넓은 화면에선 둘을 옆으로 나란히 둔다.
      */}
      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:gap-10">
        <div className="shrink-0">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted">
            이 브라우저 사용자
          </p>
          {users.length === 0 ? (
            <p className="text-xs text-muted-subtle">
              레이드 정리에 유저를 먼저 추가해 주세요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((selectedId, index) => (
                <label key={index} className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted">{index + 1}번</span>
                  <select
                    value={selectedId ?? ""}
                    onChange={(e) => setSlotUserId(index, e.target.value || null)}
                    className="w-36 rounded-lg border border-border bg-[var(--input-bg)] px-2 py-1.5 text-sm outline-none focus:border-border-strong"
                  >
                    <option value="">선택 안 함</option>
                    {users.map((user) => (
                      <option
                        key={user.id}
                        value={user.id}
                        disabled={usedIds.has(user.id) && user.id !== selectedId}
                      >
                        {user.nickname}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted">
            알림 방식
          </p>
          <div className="flex flex-wrap gap-2">
            {NOTIFY_OPTIONS.map((option) => {
              const checked = profile.notify[option.id];
              const isInterval = option.id === "onInterval";

              return (
                <div
                  key={option.id}
                  className={`w-full rounded-lg border border-border bg-card transition sm:w-72 ${
                    option.available ? "" : "opacity-60"
                  }`}
                >
                  <label
                    className={`flex gap-2.5 px-3 py-2 ${
                      option.available ? "cursor-pointer" : "cursor-not-allowed"
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
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {option.description}
                      </span>
                    </span>
                  </label>

                  {isInterval && checked && option.available && (
                    <div className="flex items-center gap-2 border-t border-border px-3 py-2">
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
                        className="w-20 rounded-lg border border-border bg-[var(--input-bg)] px-2.5 py-1 text-sm outline-none focus:border-border-strong"
                      />
                      <span className="text-xs text-muted">분</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted-subtle">
        항목을 모두 체크하면 이후 알림은 뜨지 않아요.
      </p>

      {profile.browserUserIds.length === 0 && anyNotifyEnabled && (
        <p
          className="mt-2 w-fit rounded-lg border px-3 py-1.5 text-xs"
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
