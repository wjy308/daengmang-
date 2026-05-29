import type { Character, User } from "./types";

export interface RosterEntry {
  userId: string;
  userNickname: string;
  character: Character;
}

export function buildRoster(users: User[]): RosterEntry[] {
  return users.flatMap((user) =>
    user.characters.map((character) => ({
      userId: user.id,
      userNickname: user.nickname,
      character,
    })),
  );
}
