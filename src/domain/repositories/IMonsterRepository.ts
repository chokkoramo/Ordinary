import type { Monster, MonsterRank } from "../entities/Monster.js";

export interface IMonsterRepository {
  findById(id: string): Promise<Monster | null>;
  findRandomForLevel(targetLevel: number, rank?: MonsterRank): Promise<Monster>;
}
