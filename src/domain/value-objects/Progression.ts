export class Progression {
  /**
   * Polynomial-exponential progression formula inspired by Diablo II & Path of Exile:
   * XP(L) = floor(100 * L^2.3 + 50 * L)
   *
   * Targets:
   * Level 1 -> 2: 150 XP (1-2 quick skirmishes)
   * Level 5 -> 6: ~4,200 XP
   * Level 10 -> 11: ~20,500 XP
   * Level 20 -> 21: ~104,000 XP
   * Level 50 -> 51: ~910,000 XP
   * Level 99 -> 100: ~5,200,000 XP (Endgame pinnacle)
   */
  public static getRequiredXpForLevel(level: number): number {
    if (level < 1) return 150;
    return Math.floor(100 * Math.pow(level, 2.3) + 50 * level);
  }

  /**
   * Calculates experience gained upon slaying a monster.
   * Features an anti-overfarming dampener and a high-risk level bonus.
   */
  public static calculateMonsterXp(
    monsterLevel: number,
    playerLevel: number,
    rankMultiplier: number = 1.0
  ): number {
    const baseXP = Math.floor(25 * Math.pow(monsterLevel, 1.45) * rankMultiplier);
    const levelDiff = monsterLevel - playerLevel;

    let scalingMultiplier = 1.0;

    if (levelDiff >= -2 && levelDiff <= 2) {
      // Equal level threshold (+/- 2 levels): 100% full experience
      scalingMultiplier = 1.0;
    } else if (levelDiff < -2) {
      // Monster is lower level (prevents trivial farming of low level mobs)
      const penaltySteps = Math.abs(levelDiff) - 2;
      scalingMultiplier = Math.max(0.10, 1.0 - (penaltySteps * 0.15));
    } else {
      // Monster is higher level (rewards taking on deadlier foes)
      const bonusSteps = levelDiff - 2;
      scalingMultiplier = Math.min(1.50, 1.0 + (bonusSteps * 0.10));
    }

    return Math.max(1, Math.floor(baseXP * scalingMultiplier));
  }

  /**
   * Dungeon completion bonus experience.
   * Large payout on full clear; minimal consolation upon demise.
   */
  public static calculateDungeonBonusXp(dungeonTier: number, bossDefeated: boolean): number {
    const tierBase = Math.floor(500 * Math.pow(dungeonTier, 1.6));
    return bossDefeated ? tierBase : Math.floor(tierBase * 0.15);
  }
}
