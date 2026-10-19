import type { CharacterStats } from "../value-objects/CharacterStats.js";
import type { Monster } from "../entities/Monster.js";

export interface CombatRoundLog {
  round: number;
  attacker: string;
  defender: string;
  action: "HIT" | "CRIT" | "MISS";
  damage: number;
  mitigated: number;
  defenderRemainingHp: number;
}

export interface CombatResult {
  victory: boolean;
  totalRounds: number;
  playerInitialHp: number;
  playerRemainingHp: number;
  monsterInitialHp: number;
  monsterRemainingHp: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  logs: CombatRoundLog[];
}

export class CombatEngine {
  private readonly maxRounds = 30; // Safety threshold against stalemates

  /**
   * Simulates a round-based ARPG skirmish between player and adversary.
   * Completely deterministic given random seeds; 100% decoupled from Discord.
   */
  public simulate(
    playerName: string,
    playerStats: CharacterStats,
    playerLevel: number,
    monster: Monster
  ): CombatResult {
    let playerHp = playerStats.maxHp;
    let monsterHp = monster.stats.maxHp;
    const playerInitialHp = playerHp;
    const monsterInitialHp = monsterHp;

    let totalDamageDealt = 0;
    let totalDamageTaken = 0;
    const logs: CombatRoundLog[] = [];

    // Initiative: combatant with superior speed strikes first
    const playerFirst = playerStats.speed >= monster.stats.speed;

    let round = 1;
    while (playerHp > 0 && monsterHp > 0 && round <= this.maxRounds) {
      if (playerFirst) {
        // Player assault
        const pAttack = this.resolveAttack(
          round,
          playerName,
          playerStats,
          playerLevel,
          monster.name,
          monster.stats,
          monster.level,
          monsterHp
        );
        logs.push(pAttack.log);
        monsterHp = pAttack.defenderRemainingHp;
        totalDamageDealt += pAttack.log.damage;

        if (monsterHp <= 0) break;

        // Monster retaliation
        const mAttack = this.resolveAttack(
          round,
          monster.name,
          monster.stats,
          monster.level,
          playerName,
          playerStats,
          playerLevel,
          playerHp
        );
        logs.push(mAttack.log);
        playerHp = mAttack.defenderRemainingHp;
        totalDamageTaken += mAttack.log.damage;
      } else {
        // Monster ambushes first
        const mAttack = this.resolveAttack(
          round,
          monster.name,
          monster.stats,
          monster.level,
          playerName,
          playerStats,
          playerLevel,
          playerHp
        );
        logs.push(mAttack.log);
        playerHp = mAttack.defenderRemainingHp;
        totalDamageTaken += mAttack.log.damage;

        if (playerHp <= 0) break;

        // Player counter-assault
        const pAttack = this.resolveAttack(
          round,
          playerName,
          playerStats,
          playerLevel,
          monster.name,
          monster.stats,
          monster.level,
          monsterHp
        );
        logs.push(pAttack.log);
        monsterHp = pAttack.defenderRemainingHp;
        totalDamageDealt += pAttack.log.damage;
      }

      round++;
    }

    const victory = monsterHp <= 0;

    return {
      victory,
      totalRounds: Math.min(round, this.maxRounds),
      playerInitialHp,
      playerRemainingHp: Math.max(0, playerHp),
      monsterInitialHp,
      monsterRemainingHp: Math.max(0, monsterHp),
      totalDamageDealt,
      totalDamageTaken,
      logs,
    };
  }

  private resolveAttack(
    round: number,
    attackerName: string,
    attackerStats: CharacterStats,
    attackerLevel: number,
    defenderName: string,
    defenderStats: CharacterStats,
    defenderLevel: number,
    defenderCurrentHp: number
  ): { log: CombatRoundLog; defenderRemainingHp: number } {
    // 1. Accuracy vs Evasion calculation
    const hitChance = Math.min(
      0.95,
      Math.max(
        0.60,
        attackerStats.dexterity / (attackerStats.dexterity + defenderStats.dexterity * 0.5)
      )
    );

    if (Math.random() > hitChance) {
      return {
        log: {
          round,
          attacker: attackerName,
          defender: defenderName,
          action: "MISS",
          damage: 0,
          mitigated: 0,
          defenderRemainingHp: defenderCurrentHp,
        },
        defenderRemainingHp: defenderCurrentHp,
      };
    }

    // 2. Base Damage Generation
    const rawDamage =
      Math.floor(
        Math.random() * (attackerStats.maxDamage - attackerStats.minDamage + 1)
      ) + attackerStats.minDamage;

    // 3. Critical Strike Determination
    const isCrit = Math.random() <= attackerStats.critChance;
    const finalRaw = isCrit ? Math.floor(rawDamage * attackerStats.critMultiplier) : rawDamage;

    // 4. Armor Mitigation Formula (Diminishing returns)
    // Mitigation % = Armor / (Armor + 50 * AttackerLevel)
    const mitigationPercent = defenderStats.armor / (defenderStats.armor + 50 * attackerLevel);
    const mitigated = Math.floor(finalRaw * mitigationPercent);
    const damage = Math.max(1, finalRaw - mitigated);

    const remainingHp = Math.max(0, defenderCurrentHp - damage);

    return {
      log: {
        round,
        attacker: attackerName,
        defender: defenderName,
        action: isCrit ? "CRIT" : "HIT",
        damage,
        mitigated,
        defenderRemainingHp: remainingHp,
      },
      defenderRemainingHp: remainingHp,
    };
  }
}
