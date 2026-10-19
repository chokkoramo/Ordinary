import { CharacterStats, type StatsData } from "../value-objects/CharacterStats.js";

export type MonsterRank = "NORMAL" | "ELITE" | "BOSS";

export interface MonsterData {
  id: string;
  name: string;
  level: number;
  rank: MonsterRank;
  stats: StatsData;
  baseXp: number;
  goldDropMin: number;
  goldDropMax: number;
  lootTableId: string;
}

export class Monster {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly rank: MonsterRank;
  readonly stats: CharacterStats;
  readonly baseXp: number;
  readonly goldDropMin: number;
  readonly goldDropMax: number;
  readonly lootTableId: string;

  constructor(data: MonsterData) {
    this.id = data.id;
    this.name = data.name;
    this.level = Math.max(1, data.level);
    this.rank = data.rank;
    this.stats = data.stats instanceof CharacterStats ? data.stats : new CharacterStats(data.stats);
    this.baseXp = Math.max(1, data.baseXp);
    this.goldDropMin = Math.max(0, data.goldDropMin);
    this.goldDropMax = Math.max(this.goldDropMin, data.goldDropMax);
    this.lootTableId = data.lootTableId;
  }

  public getRankMultiplier(): number {
    switch (this.rank) {
      case "BOSS":
        return 6.0;
      case "ELITE":
        return 2.5;
      case "NORMAL":
      default:
        return 1.0;
    }
  }

  public rollGoldDrop(): number {
    return Math.floor(Math.random() * (this.goldDropMax - this.goldDropMin + 1)) + this.goldDropMin;
  }

  public toJSON(): MonsterData {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      rank: this.rank,
      stats: this.stats.toJSON(),
      baseXp: this.baseXp,
      goldDropMin: this.goldDropMin,
      goldDropMax: this.goldDropMax,
      lootTableId: this.lootTableId,
    };
  }
}
