import type { IMonsterRepository } from "../../../../domain/repositories/IMonsterRepository.js";
import { Monster, type MonsterRank } from "../../../../domain/entities/Monster.js";
import { CharacterStats } from "../../../../domain/value-objects/CharacterStats.js";

interface MonsterTemplate {
  name: string;
  baseHp: number;
  baseDmg: number;
  baseArmor: number;
  baseSpeed: number;
}

const MONSTER_TEMPLATES: MonsterTemplate[] = [
  { name: "Starving Fallen", baseHp: 45, baseDmg: 6, baseArmor: 2, baseSpeed: 11 },
  { name: "Reanimated Skeleton", baseHp: 60, baseDmg: 8, baseArmor: 6, baseSpeed: 8 },
  { name: "Quill Fiend", baseHp: 75, baseDmg: 10, baseArmor: 8, baseSpeed: 9 },
  { name: "Gloom Stalker", baseHp: 70, baseDmg: 14, baseArmor: 4, baseSpeed: 13 },
  { name: "Flayed Executioner", baseHp: 130, baseDmg: 18, baseArmor: 15, baseSpeed: 6 },
  { name: "Void Cultist", baseHp: 85, baseDmg: 22, baseArmor: 5, baseSpeed: 10 },
];

export class InMemoryMonsterRepository implements IMonsterRepository {
  public async findById(id: string): Promise<Monster | null> {
    return this.findRandomForLevel(1);
  }

  public async findRandomForLevel(targetLevel: number, rank: MonsterRank = "NORMAL"): Promise<Monster> {
    const template = MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)]!;
    const levelFactor = 1 + (targetLevel - 1) * 0.22;

    let rankMult = 1.0;
    let rankPrefix = "";
    if (rank === "ELITE") {
      rankMult = 2.2;
      rankPrefix = "[Elite] ";
    } else if (rank === "BOSS") {
      rankMult = 5.0;
      rankPrefix = "† [Lord of Anguish] ";
    }

    const maxHp = Math.round(template.baseHp * levelFactor * rankMult);
    const minDmg = Math.round(template.baseDmg * levelFactor * rankMult * 0.8);
    const maxDmg = Math.round(template.baseDmg * levelFactor * rankMult * 1.3);
    const armor = Math.round(template.baseArmor * levelFactor * rankMult);

    const stats = new CharacterStats({
      maxHp,
      currentHp: maxHp,
      mana: 50,
      strength: Math.round(10 * levelFactor),
      dexterity: Math.round(8 * levelFactor),
      intelligence: Math.round(8 * levelFactor),
      vitality: Math.round(10 * levelFactor),
      armor,
      magicResist: Math.round(armor * 0.5),
      minDamage: Math.max(1, minDmg),
      maxDamage: Math.max(minDmg, maxDmg),
      critChance: 0.05,
      critMultiplier: 1.5,
      speed: template.baseSpeed,
    });

    return new Monster({
      id: `mon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${rankPrefix}${template.name}`,
      level: targetLevel,
      rank,
      stats,
      baseXp: 30,
      goldDropMin: Math.round(10 * levelFactor * rankMult),
      goldDropMax: Math.round(30 * levelFactor * rankMult),
      lootTableId: "standard_mob_table",
    });
  }
}
