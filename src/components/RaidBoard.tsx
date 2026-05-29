"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import PartyPlanner from "@/components/PartyPlanner";
import RaidManager from "@/components/RaidManager";
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
      <header className="sticky top-0 z-10 border-b border-stone-800 bg-stone-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="font-mono text-xs tracking-widest text-accent uppercase">
              daengmang
            </p>
            <h1 className="text-xl font-semibold">레이드 정리</h1>
          </div>
          <button
            type="button"
            onClick={scrollToManage}
            className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs text-muted transition hover:border-stone-500 hover:text-foreground"
          >
            관리 ↓
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <Dashboard
          users={store.users}
          partyPlanner={<PartyPlanner users={store.users} />}
          onEditUser={handleEditUser}
          onEditCharacter={handleEditCharacter}
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
          userNickname={userNickname}
          onUserNicknameChange={setUserNickname}
          charName={charName}
          onCharNameChange={setCharName}
        />
      </main>
    </div>
  );
}
