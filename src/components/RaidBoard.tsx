"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import AmajdaChecklist from "@/components/AmajdaChecklist";
import AmajdaNotifyModal from "@/components/AmajdaNotifyModal";
import Dashboard from "@/components/Dashboard";
import PartyPlanner from "@/components/PartyPlanner";
import CustomClearPanel, {
  type PartyClearSubmitPayload,
} from "@/components/CustomClearPanel";
import RaidManager from "@/components/RaidManager";
import RiceCalculator from "@/components/RiceCalculator";
import AccessoryQualityCalculator, {
  AccessoryButtonArt,
} from "@/components/AccessoryQualityCalculator";
import ThemeToggle from "@/components/ThemeToggle";
import {
  filterUsersNeedingAmajdaNotify,
  getMatchingBrowserUserIds,
} from "@/lib/amajda-notify";
import { useAmajdaIntervalNotify } from "@/hooks/useAmajdaIntervalNotify";
import { useBrowserProfile } from "@/hooks/useBrowserProfile";
import { useGoldOverrides } from "@/hooks/useGoldOverrides";
import { useRaidStore } from "@/hooks/useRaidStore";
import GoldTableModal from "@/components/GoldTableModal";
import LeaderTools from "@/components/LeaderTools";
import RaidDefinitionModal from "@/components/RaidDefinitionModal";
import AnnouncementModal from "@/components/AnnouncementModal";
import { DEFAULT_RAID_DEFINITIONS } from "@/lib/raids";

type BoardTab = "raid" | "leader";

const BOARD_TABS: { id: BoardTab; label: string }[] = [
  { id: "raid", label: "레이드 정리" },
  { id: "leader", label: "공대장 도구" },
];

export default function RaidBoard() {
  const store = useRaidStore();
  const { profile: browserProfile, updateProfile: updateBrowserProfile } =
    useBrowserProfile();
  const { overrides: goldOverrides, setOverride: setGoldOverride, resetOverride: resetGoldOverride, resetAll: resetAllGold } = useGoldOverrides();
  const [goldTableOpen, setGoldTableOpen] = useState(false);
  const [raidMgrOpen, setRaidMgrOpen] = useState(false);
  const [amajdaNotifyUserIds, setAmajdaNotifyUserIds] = useState<string[]>([]);
  const [pendingPartyClear, setPendingPartyClear] =
    useState<PartyClearSubmitPayload | null>(null);
  const pendingPartyClearRef = useRef(pendingPartyClear);
  pendingPartyClearRef.current = pendingPartyClear;

  const [userNickname, setUserNickname] = useState("");
  const [highlightCharacterId, setHighlightCharacterId] = useState<string | null>(
    null,
  );

  /** 쌀산기 — 헤더 "우끼끼" 버튼과 오른쪽 아래 원숭이 버튼이 같이 쓴다 */
  const [riceOpen, setRiceOpen] = useState(false);
  const [accessoryOpen, setAccessoryOpen] = useState(false);
  const [tab, setTab] = useState<BoardTab>("raid");
  /** 탭마다 보던 스크롤 위치 — 돌아왔을 때 제자리로 */
  const tabScrollRef = useRef<Record<BoardTab, number>>({ raid: 0, leader: 0 });

  // 주소의 ?tab= 으로 첫 탭을 정한다. 서버 렌더와 맞추려고 마운트 후에 반영한다.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("tab");
    if (initial === "leader") setTab("leader");
  }, []);

  // Next 메타데이터가 첫 로딩 중에 제목을 덮어쓰므로 데이터 로딩이 끝난 뒤에도 다시 건다
  useEffect(() => {
    document.title = `댕망 · ${BOARD_TABS.find((t) => t.id === tab)?.label}`;
  }, [tab, store.hydrated]);

  const switchTab = (next: BoardTab) => {
    if (next === tab) return;
    tabScrollRef.current[tab] = window.scrollY;
    setTab(next);
    // 라우터 이동 없이 주소만 바꿔서 새로고침·공유 시 같은 탭으로 열리게 한다
    const url = new URL(window.location.href);
    if (next === "raid") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
    requestAnimationFrame(() => window.scrollTo(0, tabScrollRef.current[next]));
  };

  const scrollToManage = () => {
    document.getElementById("manage")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToAmajda = () => {
    document.getElementById("amajda")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEditUser = (userId: string) => {
    store.selectUser(userId);
    setHighlightCharacterId(null);
    scrollToManage();
  };

  const handleEditCharacter = (userId: string, characterId: string) => {
    store.selectUser(userId);
    setHighlightCharacterId(characterId);
    scrollToManage();
  };

  const openAmajdaModal = useCallback((userIds: string[]) => {
    if (userIds.length === 0) return;
    setAmajdaNotifyUserIds(userIds);
  }, []);

  const showAmajdaNotify = useCallback(
    (candidateUserIds: string[]) => {
      const needing = filterUsersNeedingAmajdaNotify(
        store.users,
        candidateUserIds,
      );
      openAmajdaModal(needing);
    },
    [store.users, openAmajdaModal],
  );

  const applyPartyClear = useCallback(
    (payload: PartyClearSubmitPayload) => {
      if (payload.toMark.length > 0) {
        store.markPartyCleared(payload.raidId, payload.toMark);
      }
      if (payload.toCancel.length > 0) {
        store.cancelPartyCleared(payload.raidId, payload.toCancel);
      }
    },
    [store],
  );

  const handlePartyClearSubmit = useCallback(
    (payload: PartyClearSubmitPayload) => {
      const { toMark, toCancel } = payload;

      if (toMark.length === 0) {
        applyPartyClear(payload);
        return;
      }

      const canDefer =
        browserProfile.notify.onPartyClear &&
        browserProfile.browserUserIds.length > 0;

      if (!canDefer) {
        applyPartyClear(payload);
        return;
      }

      const matching = getMatchingBrowserUserIds(
        browserProfile,
        toMark.map((m) => m.userId),
      );

      if (matching.length === 0) {
        applyPartyClear(payload);
        return;
      }

      setPendingPartyClear(payload);
      openAmajdaModal(matching);
    },
    [browserProfile, applyPartyClear, openAmajdaModal],
  );

  const amajdaModalOpen = amajdaNotifyUserIds.length > 0;

  const handleAmajdaModalClose = useCallback(() => {
    const pending = pendingPartyClearRef.current;
    if (pending) {
      applyPartyClear(pending);
      setPendingPartyClear(null);
    }
    setAmajdaNotifyUserIds([]);
  }, [applyPartyClear]);

  useAmajdaIntervalNotify({
    enabled: browserProfile.notify.onInterval,
    intervalMinutes: browserProfile.intervalMinutes,
    browserUserIds: browserProfile.browserUserIds,
    users: store.users,
    modalOpen: amajdaModalOpen,
    onNotify: showAmajdaNotify,
  });

  const amajdaNotifyUsers = store.users.filter((user) =>
    amajdaNotifyUserIds.includes(user.id),
  );

  if (!store.hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header
        className="sticky top-0 z-10 border-b border-border backdrop-blur"
        style={{ background: "var(--header-bg)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 lg:max-w-[1600px] lg:px-8">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-accent">
                daengmang
              </p>
              <div role="tablist" className="flex items-center gap-3">
                {BOARD_TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => switchTab(t.id)}
                      className={`border-b-2 text-lg font-semibold tracking-tight transition ${
                        active
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-subtle hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRiceOpen((v) => !v)}
              aria-expanded={riceOpen}
              title="쌀산기"
              className={`flex items-center gap-1.5 rounded-xl border bg-surface py-1 pl-1 pr-3 text-sm font-semibold transition hover:border-border-strong hover:text-foreground ${
                riceOpen ? "border-border-strong text-foreground" : "border-border text-muted"
              }`}
            >
              <Image
                src="/rice-calculator-fab.webp"
                alt=""
                width={36}
                height={36}
                className="size-9 object-contain"
              />
              우끼끼
            </button>
            <button
              type="button"
              onClick={() => setAccessoryOpen((v) => !v)}
              aria-expanded={accessoryOpen}
              title="악세 품질"
              className={`flex items-center gap-1.5 rounded-xl border bg-surface py-1 pl-1 pr-3 text-sm font-semibold transition hover:border-border-strong hover:text-foreground ${
                accessoryOpen ? "border-border-strong text-foreground" : "border-border text-muted"
              }`}
            >
              <AccessoryButtonArt className="size-9" />
              악세 품질
            </button>
            <Link
              href="/playground"
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface py-1 pl-1 pr-3 text-sm font-semibold text-muted transition hover:border-border-strong hover:text-foreground"
            >
              <Image src="/play.png" alt="" width={36} height={36} />
              놀이터
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {tab === "raid" && (
              <>
                <button
                  type="button"
                  onClick={() => setRaidMgrOpen(true)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-foreground"
                >
                  레이드 관리
                </button>
                <button
                  type="button"
                  onClick={() => setGoldTableOpen(true)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-foreground"
                >
                  골드표
                </button>
                <a
                  href="https://overlaid-six.vercel.app/#/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-accent/40 bg-[var(--chip-gold-bg)] px-3 py-1.5 text-xs font-semibold text-accent-soft transition hover:opacity-80"
                >
                  오버레이드 ↗
                </a>
                <button
                  type="button"
                  onClick={scrollToAmajda}
                  className="hidden rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-foreground sm:inline-block"
                >
                  아맞다 ↓
                </button>
                <button
                  type="button"
                  onClick={scrollToManage}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-foreground"
                >
                  관리 ↓
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 두 탭 모두 마운트해 두고 보이기만 바꾼다 — 즉시 전환, 상태 유지 */}
      <LeaderTools hidden={tab !== "leader"} />

      <main
        className={`mx-auto max-w-5xl space-y-8 px-4 py-8 lg:max-w-[1600px] lg:space-y-10 lg:px-8 lg:py-6 ${
          tab === "raid" ? "" : "hidden"
        }`}
      >
        {store.error && (
          <div
            role="alert"
            className="rounded-lg border px-4 py-3 text-sm"
            style={{
              borderColor: "var(--danger-border)",
              background: "var(--danger-surface)",
              color: "var(--danger-text)",
            }}
          >
            {store.error}
          </div>
        )}

        <Dashboard
          users={store.users}
          raids={store.raids}
          goldOverrides={goldOverrides}
          actions={
            <PartyPlanner users={store.users} raids={store.raids} />
          }
          customClear={
            <CustomClearPanel
              users={store.users}
              goldOverrides={goldOverrides}
              raids={store.raids}
              onPartyClearSubmit={handlePartyClearSubmit}
            />
          }
          onEditUser={handleEditUser}
          onEditCharacter={handleEditCharacter}
          onReorderCharacters={store.reorderCharacters}
          onReorderCharacterRaids={store.reorderCharacterRaids}
          onToggleCharacterGoldIncluded={store.toggleCharacterGoldIncluded}
          onSetUserGoldPriority={(userId, priority) =>
            store.setUserGoldPriority(userId, priority, goldOverrides)
          }
        />

        {goldTableOpen && (
          <GoldTableModal
            overrides={goldOverrides}
            raids={store.raids}
            onSet={setGoldOverride}
            onReset={resetGoldOverride}
            onResetAll={resetAllGold}
            onClose={() => setGoldTableOpen(false)}
          />
        )}

        {raidMgrOpen && (
          <RaidDefinitionModal
            raids={store.raids}
            isDefault={
              JSON.stringify(store.raids) ===
              JSON.stringify(DEFAULT_RAID_DEFINITIONS)
            }
            onUpsert={store.upsertRaid}
            onDelete={store.deleteRaid}
            onReset={store.resetRaids}
            onClose={() => setRaidMgrOpen(false)}
          />
        )}

        <AmajdaChecklist
          users={store.users}
          browserProfile={browserProfile}
          onBrowserProfileChange={updateBrowserProfile}
          onAddUserAmajdaItem={store.addUserAmajdaItem}
          onRemoveUserAmajdaItem={store.removeUserAmajdaItem}
          onToggleUserAmajdaChecked={store.toggleUserAmajdaChecked}
          onSetUserAmajdaItemResetWeekly={store.setUserAmajdaItemResetWeekly}
          onAddCharacterAmajdaItem={store.addCharacterAmajdaItem}
          onRemoveCharacterAmajdaItem={store.removeCharacterAmajdaItem}
          onToggleCharacterAmajdaChecked={store.toggleCharacterAmajdaChecked}
          onSetCharacterAmajdaItemResetWeekly={
            store.setCharacterAmajdaItemResetWeekly
          }
        />

        <RaidManager
          users={store.users}
          selectedUser={store.selectedUser}
          highlightCharacterId={highlightCharacterId}
          goldOverrides={goldOverrides}
          raids={store.raids}
          onSelectUser={(id) => {
            store.selectUser(id);
            setHighlightCharacterId(null);
          }}
          onAddUser={store.addUser}
          onRemoveUser={store.removeUser}
          onSetUserGoldPriority={(userId, priority) =>
            store.setUserGoldPriority(userId, priority, goldOverrides)
          }
          onAddCharacter={store.addCharacter}
          onSetCharacterRole={store.setCharacterRole}
          onRemoveCharacter={store.removeCharacter}
          onToggleCharacterRaid={store.toggleCharacterRaid}
          onToggleCharacterNoGold={store.toggleCharacterNoGold}
          onToggleCharacterBonus={store.toggleCharacterBonus}
          onReorderCharacters={store.reorderCharacters}
          onReorderCharacterRaids={store.reorderCharacterRaids}
          userNickname={userNickname}
          onUserNicknameChange={setUserNickname}
        />
      </main>

      {/* 어느 탭에 있든 떠야 하는 모달은 탭 본문 밖에 둔다 */}
      <AnnouncementModal />
      <AmajdaNotifyModal
        users={amajdaNotifyUsers}
        open={amajdaModalOpen}
        onClose={handleAmajdaModalClose}
        awaitingPartyClear={pendingPartyClear !== null}
        onToggleUserAmajdaChecked={store.toggleUserAmajdaChecked}
        onToggleCharacterAmajdaChecked={store.toggleCharacterAmajdaChecked}
      />

      {/* 두 계산기는 따로 열려서 동시에 볼 수 있다 */}
      <RiceCalculator open={riceOpen} onOpenChange={setRiceOpen} />
      <AccessoryQualityCalculator open={accessoryOpen} onOpenChange={setAccessoryOpen} />
    </div>
  );
}
