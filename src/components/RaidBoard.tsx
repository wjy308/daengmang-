"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import PartyPlanner from "@/components/PartyPlanner";
import CustomClearPanel from "@/components/CustomClearPanel";
import RaidManager from "@/components/RaidManager";
import RaidOverview from "@/components/RaidOverview";
import ThemeToggle from "@/components/ThemeToggle";
import type { CharacterRole } from "@/lib/types";
import { useRaidStore } from "@/hooks/useRaidStore";

export default function RaidBoard() {
  const store = useRaidStore();
  const [userNickname, setUserNickname] = useState("");
  const [charName, setCharName] = useState("");
  const [charRole, setCharRole] = useState<CharacterRole>("dealer");
  const [highlightCharacterId, setHighlightCharacterId] = useState<string | null>(
    null,
  );

  const scrollToManage = () => {
    document.getElementById("manage")?.scrollIntoView({ behavior: "smooth" });
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

        <RaidOverview users={store.users} />

        <Dashboard
          users={store.users}
          actions={
            <PartyPlanner
              users={store.users}
              onMarkPartyCleared={store.markPartyCleared}
            />
          }
          customClear={
            <CustomClearPanel
              users={store.users}
              onMarkPartyCleared={store.markPartyCleared}
            />
          }
          onEditUser={handleEditUser}
          onEditCharacter={handleEditCharacter}
          onReorderCharacters={store.reorderCharacters}
          onReorderCharacterRaids={store.reorderCharacterRaids}
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
          onReorderCharacters={store.reorderCharacters}
          onReorderCharacterRaids={store.reorderCharacterRaids}
          userNickname={userNickname}
          onUserNicknameChange={setUserNickname}
          charName={charName}
          onCharNameChange={setCharName}
        />
      </main>
    </div>
  );
}
