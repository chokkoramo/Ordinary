import { CharacterStats, type StatsData } from "../value-objects/CharacterStats.js";
import { EquipmentSlot } from "../value-objects/EquipmentSlot.js";
import { ItemRarity, RARITY_CONFIGS } from "../value-objects/ItemRarity.js";
import type { ItemAffix } from "../value-objects/ItemAffix.js";

export interface ItemData {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  itemLevel: number;
  levelRequirement: number;
  baseStats: StatsData;
  affixes: ItemAffix[];
  legendaryEffect?: string | undefined;
  goldValue: number;
}

export class Item {
  readonly id: string;
  readonly name: string;
  readonly slot: EquipmentSlot;
  readonly rarity: ItemRarity;
  readonly itemLevel: number;
  readonly levelRequirement: number;
  readonly baseStats: CharacterStats;
  readonly affixes: readonly ItemAffix[];
  readonly legendaryEffect?: string | undefined;
  readonly goldValue: number;

  constructor(data: ItemData) {
    this.id = data.id;
    this.name = data.name;
    this.slot = data.slot;
    this.rarity = data.rarity;
    this.itemLevel = Math.max(1, data.itemLevel);
    this.levelRequirement = Math.max(1, data.levelRequirement);
    this.baseStats = data.baseStats instanceof CharacterStats ? data.baseStats : new CharacterStats(data.baseStats);
    this.affixes = Object.freeze([...data.affixes]);
    this.legendaryEffect = data.legendaryEffect;
    this.goldValue = Math.max(1, data.goldValue);
  }

  /**
   * Computes aggregated stats: base intrinsic stats + rolled procedural affixes
   */
  public getTotalStats(): CharacterStats {
    let combined = this.baseStats;

    for (const affix of this.affixes) {
      combined = combined.add({
        [affix.stat]: affix.value,
      });
    }

    return combined;
  }

  /**
   * Calculates salvage yields when broken down at the forge
   */
  public getSalvageReward(): { material: string; amount: number; gold: number } {
    const config = RARITY_CONFIGS[this.rarity];
    const [minMat, maxMat] = config.salvageAmountRange;
    const amount = Math.floor(Math.random() * (maxMat - minMat + 1)) + minMat;
    const gold = Math.floor(this.goldValue * 0.4);

    return {
      material: config.salvageMaterial,
      amount,
      gold,
    };
  }

  public toJSON(): ItemData {
    return {
      id: this.id,
      name: this.name,
      slot: this.slot,
      rarity: this.rarity,
      itemLevel: this.itemLevel,
      levelRequirement: this.levelRequirement,
      baseStats: this.baseStats.toJSON(),
      affixes: [...this.affixes],
      legendaryEffect: this.legendaryEffect,
      goldValue: this.goldValue,
    };
  }
}
