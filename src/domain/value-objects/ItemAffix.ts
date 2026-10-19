import type { StatsData } from "./CharacterStats.js";

export type AffixType = "PREFIX" | "SUFFIX";

export interface ItemAffix {
  id: string;
  name: string;
  type: AffixType;
  stat: keyof StatsData;
  value: number;
  tier: number; // Tier 1 (Apex) to Tier 5 (Initiate)
}

export interface AffixTemplate {
  name: string;
  type: AffixType;
  stat: keyof StatsData;
  baseMin: number;
  baseMax: number;
  levelReq: number;
  isPercentage?: boolean;
}

// Procedural affixes inspired by Diablo II & dark fantasy ARPGs
export const AFFIX_POOL: AffixTemplate[] = [
  // Prefixes (Offensive / Damage / Dominance)
  { name: "Savage", type: "PREFIX", stat: "strength", baseMin: 3, baseMax: 8, levelReq: 1 },
  { name: "Cruel", type: "PREFIX", stat: "minDamage", baseMin: 4, baseMax: 10, levelReq: 5 },
  { name: "Ruthless", type: "PREFIX", stat: "maxDamage", baseMin: 8, baseMax: 16, levelReq: 10 },
  { name: "Deadly", type: "PREFIX", stat: "critChance", baseMin: 0.02, baseMax: 0.06, levelReq: 8, isPercentage: true },
  { name: "Colossal", type: "PREFIX", stat: "armor", baseMin: 15, baseMax: 35, levelReq: 5 },
  { name: "Nether", type: "PREFIX", stat: "intelligence", baseMin: 3, baseMax: 9, levelReq: 1 },
  { name: "Precise", type: "PREFIX", stat: "dexterity", baseMin: 3, baseMax: 8, levelReq: 1 },

  // Suffixes (Attributes / Fortitude / Blood)
  { name: "of the Bear", type: "SUFFIX", stat: "vitality", baseMin: 4, baseMax: 10, levelReq: 1 },
  { name: "of the Hawk", type: "SUFFIX", stat: "speed", baseMin: 2, baseMax: 6, levelReq: 5 },
  { name: "of the Tortoise", type: "SUFFIX", stat: "armor", baseMin: 10, baseMax: 25, levelReq: 1 },
  { name: "of Fury", type: "SUFFIX", stat: "critMultiplier", baseMin: 0.15, baseMax: 0.35, levelReq: 12, isPercentage: true },
  { name: "of the Bastion", type: "SUFFIX", stat: "maxHp", baseMin: 30, baseMax: 80, levelReq: 10 },
  { name: "of the Sage", type: "SUFFIX", stat: "mana", baseMin: 20, baseMax: 50, levelReq: 3 },
  { name: "of the Tempest", type: "SUFFIX", stat: "dexterity", baseMin: 4, baseMax: 9, levelReq: 5 },
];
