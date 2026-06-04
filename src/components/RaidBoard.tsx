"use client";

import { useCallback, useRef, useState } from "react";
import AmajdaChecklist from "@/components/AmajdaChecklist";
import AmajdaNotifyModal from "@/components/AmajdaNotifyModal";
import Dashboard from "@/components/Dashboard";
import PartyPlanner from "@/components/PartyPlanner";
import CustomClearPanel, {
  type PartyClearSubmitPayload,
} from "@/components/CustomClearPanel";
import RaidManager from "@/components/RaidManager";
import RiceCalculator from "@/components/RiceCalculator";
import ThemeToggle from "@/components/ThemeToggle";
import {
  filterUsersNeedingAmajdaNotify,
  getMatchingBrowserUserIds,
} from "@/lib/amajda-notify";
import type { CharacterRole } from "@/lib/types";
import { useAmajdaIntervalNotify } from "@/hooks/useAmajdaIntervalNotify";
import { useBrowserProfile } from "@/hooks/useBrowserProfile";
import { useRaidStore } from "@/hooks/useRaidStore";

export default function RaidBoard() {
  const store = useRaidStore();
  const { profile: browserProfile, updateProfile: updateBrowserProfile } =
    useBrowserProfile();
  const [amajdaNotifyUserIds, setAmajdaNotifyUserIds] = useState<string[]>([]);
  const [pendingPartyClear, setPendingPartyClear] =
    useState<PartyClearSubmitPayload | null>(null);
  const pendingPartyClearRef = useRef(pendingPartyClear);
  pendingPartyClearRef.current = pendingPartyClear;

  const [userNickname, setUserNickname] = useState("");
  const [charName, setCharName] = useState("");
  const [charRole, setCharRole] = useState<CharacterRole>("dealer");
  const [highlightCharacterId, setHighlightCharacterId] = useState<string | null>(
    null,
  );

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
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-accent">
              daengmang
            </p>
            <h1 className="text-lg font-semibold tracking-tight">레이드 정리</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 lg:max-w-[1600px] lg:space-y-10 lg:px-8 lg:py-6">
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
          actions={
            <PartyPlanner users={store.users} />
          }
          customClear={
            <CustomClearPanel
              users={store.users}
              onPartyClearSubmit={handlePartyClearSubmit}
            />
          }
          onEditUser={handleEditUser}
          onEditCharacter={handleEditCharacter}
          onReorderCharacters={store.reorderCharacters}
          onReorderCharacterRaids={store.reorderCharacterRaids}
          onToggleCharacterGoldIncluded={store.toggleCharacterGoldIncluded}
        />

        <AmajdaNotifyModal
          users={amajdaNotifyUsers}
          open={amajdaModalOpen}
          onClose={handleAmajdaModalClose}
          awaitingPartyClear={pendingPartyClear !== null}
          onToggleUserAmajdaChecked={store.toggleUserAmajdaChecked}
          onToggleCharacterAmajdaChecked={store.toggleCharacterAmajdaChecked}
        />

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
          onSelectUser={(id) => {
            store.selectUser(id);
            setHighlightCharacterId(null);
          }}
          onAddUser={store.addUser}
          onRemoveUser={store.removeUser}
          onAddCharacter={store.addCharacter}
          onSetCharacterRole={store.setCharacterRole}
          charRole={charRole}
          onCharRoleChange={setCharRole}
          onRemoveCharacter={store.removeCharacter}
          onToggleCharacterRaid={store.toggleCharacterRaid}
          onToggleCharacterNoGold={store.toggleCharacterNoGold}
          onToggleCharacterBonus={store.toggleCharacterBonus}
          onReorderCharacters={store.reorderCharacters}
          onReorderCharacterRaids={store.reorderCharacterRaids}
          userNickname={userNickname}
          onUserNicknameChange={setUserNickname}
          charName={charName}
          onCharNameChange={setCharName}
        />
      </main>

      <RiceCalculator />
    </div>
  );
}
