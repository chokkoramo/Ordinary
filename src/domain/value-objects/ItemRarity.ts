export enum ItemRarity {
  COMMON = "COMMON",
  MAGIC = "MAGIC",
  RARE = "RARE",
  LEGENDARY = "LEGENDARY",
}

export interface RarityConfig {
  displayName: string;
  colorHex: string;
  colorDiscord: number;
  minAffixes: number;
  maxAffixes: number;
  statMultiplier: number;
  dropWeight: number; // Base weight in loot generator
  salvageMaterial: string;
  salvageAmountRange: [number, number];
}

export const RARITY_CONFIGS: Record<ItemRarity, RarityConfig> = {
  [ItemRarity.COMMON]: {
    displayName: "Common",
    colorHex: "#B8B8B8",
    colorDiscord: 0xB8B8B8, // Ash White / Bone
    minAffixes: 0,
    maxAffixes: 0,
    statMultiplier: 1.0,
    dropWeight: 6500, // 65% base
    salvageMaterial: "Scrap Iron",
    salvageAmountRange: [1, 3],
  },
  [ItemRarity.MAGIC]: {
    displayName: "Magic",
    colorHex: "#4C6B94",
    colorDiscord: 0x4C6B94, // Gloom Arcane Blue
    minAffixes: 1,
    maxAffixes: 2,
    statMultiplier: 1.25,
    dropWeight: 2600, // 26% base
    salvageMaterial: "Enchanted Dust",
    salvageAmountRange: [2, 5],
  },
  [ItemRarity.RARE]: {
    displayName: "Rare",
    colorHex: "#C2A649",
    colorDiscord: 0xC2A649, // Tarnished Gothic Gold
    minAffixes: 3,
    maxAffixes: 4,
    statMultiplier: 1.6,
    dropWeight: 800, // 8% base
    salvageMaterial: "Veiled Crystal",
    salvageAmountRange: [3, 7],
  },
  [ItemRarity.LEGENDARY]: {
    displayName: "Legendary",
    colorHex: "#A84C1E",
    colorDiscord: 0xA84C1E, // Smoldering Cinder / Deep Orange
    minAffixes: 4,
    maxAffixes: 6,
    statMultiplier: 2.2,
    dropWeight: 100, // 1% base
    salvageMaterial: "Forgotten Soul",
    salvageAmountRange: [1, 2],
  },
};
