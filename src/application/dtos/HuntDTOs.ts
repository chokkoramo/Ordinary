import type { CombatResult } from "../../domain/services/CombatEngine.js";
import type { ItemData } from "../../domain/entities/Item.js";
import type { LevelUpResult } from "../../domain/entities/Player.js";

export interface HuntInputDTO {
  discordId: string;
  username: string;
}

export interface HuntOutputDTO {
  success: boolean;
  message?: string | undefined;
  retryAfterSeconds?: number | undefined;
  combat?: CombatResult | undefined;
  monsterName?: string | undefined;
  monsterLevel?: number | undefined;
  monsterRank?: string | undefined;
  xpGained?: number | undefined;
  goldGained?: number | undefined;
  levelUp?: LevelUpResult | undefined;
  droppedItem?: ItemData | null | undefined;
  remainingEnergy?: number | undefined;
  maxEnergy?: number | undefined;
}
