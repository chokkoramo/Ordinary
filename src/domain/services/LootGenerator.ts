import { Item } from "../entities/Item.js";
import { EquipmentSlot } from "../value-objects/EquipmentSlot.js";
import { ItemRarity, RARITY_CONFIGS } from "../value-objects/ItemRarity.js";
import { AFFIX_POOL, type ItemAffix } from "../value-objects/ItemAffix.js";
import type { StatsData } from "../value-objects/CharacterStats.js";

interface BaseItemTemplate {
  name: string;
  slot: EquipmentSlot;
  levelReq: number;
  baseStats: Partial<StatsData>;
}

const BASE_ITEMS: BaseItemTemplate[] = [
  // Weapons (MAIN_HAND)
  { name: "Shortsword", slot: EquipmentSlot.MAIN_HAND, levelReq: 1, baseStats: { minDamage: 4, maxDamage: 8, speed: 2 } },
  { name: "Broadsword", slot: EquipmentSlot.MAIN_HAND, levelReq: 5, baseStats: { minDamage: 8, maxDamage: 18, strength: 3 } },
  { name: "Assassin Stiletto", slot: EquipmentSlot.MAIN_HAND, levelReq: 10, baseStats: { minDamage: 12, maxDamage: 22, critChance: 0.08, speed: 4 } },
  { name: "Abyssal Cleaver", slot: EquipmentSlot.MAIN_HAND, levelReq: 20, baseStats: { minDamage: 28, maxDamage: 55, strength: 12 } },

  // Offhand
  { name: "Oak Buckler", slot: EquipmentSlot.OFF_HAND, levelReq: 1, baseStats: { armor: 12, vitality: 2 } },
  { name: "Tower Shield", slot: EquipmentSlot.OFF_HAND, levelReq: 10, baseStats: { armor: 35, vitality: 6 } },

  // Helmet
  { name: "Leather Cowl", slot: EquipmentSlot.HELMET, levelReq: 1, baseStats: { armor: 5 } },
  { name: "Bascinet", slot: EquipmentSlot.HELMET, levelReq: 8, baseStats: { armor: 22, strength: 2 } },

  // Chest
  { name: "Tattered Shroud", slot: EquipmentSlot.CHEST, levelReq: 1, baseStats: { armor: 8, mana: 10 } },
  { name: "Studded Cuirass", slot: EquipmentSlot.CHEST, levelReq: 10, baseStats: { armor: 45, maxHp: 30 } },

  // Boots
  { name: "Worn Leather Boots", slot: EquipmentSlot.BOOTS, levelReq: 1, baseStats: { speed: 3 } },
  { name: "Plated Greaves", slot: EquipmentSlot.BOOTS, levelReq: 8, baseStats: { armor: 15, speed: 4 } },

  // Jewelry
  { name: "Iron Band", slot: EquipmentSlot.RING, levelReq: 1, baseStats: { critChance: 0.02 } },
  { name: "Bone Talisman", slot: EquipmentSlot.AMULET, levelReq: 3, baseStats: { maxHp: 20, mana: 15 } },
];

const RARE_NAMES_PREFIX = ["Shadow", "Wrath", "Bane", "Torment", "Nether", "Doom", "Grim", "Soul", "Gloom", "Carrion"];
const RARE_NAMES_SUFFIX = ["of Sorrow", "of Ruin", "of Anguish", "of Bones", "of Cinders", "of the Abyss", "of Blight"];

const LEGENDARY_EFFECTS = [
  "Condemned Strike: Critical hits immolate the foe for 25% bonus holy-fire devastation.",
  "Shroud of Anguish: A lethal blow is defied once, bestowing 50% evasion for 1 combat exchange.",
  "Soul Hunger: Reaping an adversary siphons 6% of your maximum vitality back into your body.",
  "Tempest Celerity: 30% chance to unleash an immediate second strike in the same exchange.",
];

export class LootGenerator {
  /**
   * Generates a procedural dark fantasy item based on monster level and rank
   */
  public generateDrop(monsterLevel: number, rankMultiplier: number = 1.0): Item | null {
    const dropChance = Math.min(1.0, 0.60 * rankMultiplier);
    if (Math.random() > dropChance) {
      return null;
    }

    const rarity = this.rollRarity(rankMultiplier);
    const itemLevel = monsterLevel;
    const baseItem = this.selectBaseItem(itemLevel);

    const affixes = this.rollAffixes(rarity, itemLevel);
    const name = this.generateItemName(baseItem.name, rarity, affixes);
    const legendaryEffect = rarity === ItemRarity.LEGENDARY ? this.pickRandomLegendaryEffect() : undefined;

    // Scale base statistics with item level
    const scaledBaseStats: StatsData = {
      maxHp: baseItem.baseStats.maxHp ? Math.round(baseItem.baseStats.maxHp * (1 + itemLevel * 0.08)) : 0,
      mana: baseItem.baseStats.mana ? Math.round(baseItem.baseStats.mana * (1 + itemLevel * 0.06)) : 0,
      strength: baseItem.baseStats.strength ? Math.round(baseItem.baseStats.strength * (1 + itemLevel * 0.05)) : 0,
      dexterity: baseItem.baseStats.dexterity ? Math.round(baseItem.baseStats.dexterity * (1 + itemLevel * 0.05)) : 0,
      intelligence: baseItem.baseStats.intelligence ? Math.round(baseItem.baseStats.intelligence * (1 + itemLevel * 0.05)) : 0,
      vitality: baseItem.baseStats.vitality ? Math.round(baseItem.baseStats.vitality * (1 + itemLevel * 0.05)) : 0,
      armor: baseItem.baseStats.armor ? Math.round(baseItem.baseStats.armor * (1 + itemLevel * 0.08)) : 0,
      magicResist: baseItem.baseStats.magicResist ? Math.round(baseItem.baseStats.magicResist * (1 + itemLevel * 0.08)) : 0,
      minDamage: baseItem.baseStats.minDamage ? Math.round(baseItem.baseStats.minDamage * (1 + itemLevel * 0.09)) : 0,
      maxDamage: baseItem.baseStats.maxDamage ? Math.round(baseItem.baseStats.maxDamage * (1 + itemLevel * 0.09)) : 0,
      critChance: baseItem.baseStats.critChance ?? 0,
      critMultiplier: baseItem.baseStats.critMultiplier ?? 0,
      speed: baseItem.baseStats.speed ?? 0,
    };

    const goldValue = this.calculateGoldValue(itemLevel, rarity, affixes.length);

    return new Item({
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      slot: baseItem.slot,
      rarity,
      itemLevel,
      levelRequirement: Math.max(1, baseItem.levelReq),
      baseStats: scaledBaseStats,
      affixes,
      legendaryEffect,
      goldValue,
    });
  }

  private rollRarity(rankMultiplier: number): ItemRarity {
    const commonWeight = RARITY_CONFIGS[ItemRarity.COMMON].dropWeight / rankMultiplier;
    const magicWeight = RARITY_CONFIGS[ItemRarity.MAGIC].dropWeight;
    const rareWeight = RARITY_CONFIGS[ItemRarity.RARE].dropWeight * rankMultiplier;
    const legendaryWeight = RARITY_CONFIGS[ItemRarity.LEGENDARY].dropWeight * rankMultiplier;

    const totalWeight = commonWeight + magicWeight + rareWeight + legendaryWeight;
    let roll = Math.random() * totalWeight;

    if (roll < legendaryWeight) return ItemRarity.LEGENDARY;
    roll -= legendaryWeight;

    if (roll < rareWeight) return ItemRarity.RARE;
    roll -= rareWeight;

    if (roll < magicWeight) return ItemRarity.MAGIC;
    return ItemRarity.COMMON;
  }

  private selectBaseItem(itemLevel: number): BaseItemTemplate {
    const candidates = BASE_ITEMS.filter((item) => item.levelReq <= itemLevel);
    if (candidates.length === 0) return BASE_ITEMS[0]!;
    return candidates[Math.floor(Math.random() * candidates.length)]!;
  }

  private rollAffixes(rarity: ItemRarity, itemLevel: number): ItemAffix[] {
    const config = RARITY_CONFIGS[rarity];
    if (config.maxAffixes === 0) return [];

    const affixCount =
      Math.floor(Math.random() * (config.maxAffixes - config.minAffixes + 1)) + config.minAffixes;

    const availablePool = AFFIX_POOL.filter((a) => a.levelReq <= itemLevel);
    if (availablePool.length === 0) return [];

    const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
    const selectedTemplates = shuffled.slice(0, affixCount);

    return selectedTemplates.map((template, idx) => {
      const ilvlFactor = 1 + itemLevel * 0.05;
      const rawVal =
        (Math.random() * (template.baseMax - template.baseMin) + template.baseMin) * ilvlFactor;
      const value = template.isPercentage
        ? Math.round(rawVal * 100) / 100
        : Math.round(rawVal);

      return {
        id: `affix_${idx}_${Date.now()}`,
        name: template.name,
        type: template.type,
        stat: template.stat,
        value,
        tier: Math.max(1, 5 - Math.floor(itemLevel / 10)),
      };
    });
  }

  private generateItemName(baseName: string, rarity: ItemRarity, affixes: ItemAffix[]): string {
    if (rarity === ItemRarity.COMMON) {
      return baseName;
    }

    if (rarity === ItemRarity.MAGIC) {
      const prefix = affixes.find((a) => a.type === "PREFIX");
      const suffix = affixes.find((a) => a.type === "SUFFIX");

      const pStr = prefix ? `${prefix.name} ` : "";
      const sStr = suffix ? ` ${suffix.name}` : "";
      return `${pStr}${baseName}${sStr}`.trim();
    }

    if (rarity === ItemRarity.RARE) {
      const p = RARE_NAMES_PREFIX[Math.floor(Math.random() * RARE_NAMES_PREFIX.length)];
      const s = RARE_NAMES_SUFFIX[Math.floor(Math.random() * RARE_NAMES_SUFFIX.length)];
      return `${p} ${s} (${baseName})`;
    }

    // Legendary
    return `† ${baseName} of the Forgotten Herald †`;
  }

  private pickRandomLegendaryEffect(): string {
    return LEGENDARY_EFFECTS[Math.floor(Math.random() * LEGENDARY_EFFECTS.length)]!;
  }

  private calculateGoldValue(itemLevel: number, rarity: ItemRarity, affixCount: number): number {
    const config = RARITY_CONFIGS[rarity];
    const baseVal = Math.max(10, Math.floor(itemLevel * 12 * config.statMultiplier));
    return baseVal + affixCount * 25;
  }
}
