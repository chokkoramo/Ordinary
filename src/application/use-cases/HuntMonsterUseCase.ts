import type { IPlayerRepository } from "../../domain/repositories/IPlayerRepository.js";
import type { IMonsterRepository } from "../../domain/repositories/IMonsterRepository.js";
import { Player } from "../../domain/entities/Player.js";
import { CombatEngine } from "../../domain/services/CombatEngine.js";
import { LootGenerator } from "../../domain/services/LootGenerator.js";
import { Progression } from "../../domain/value-objects/Progression.js";
import type { HuntInputDTO, HuntOutputDTO } from "../dtos/HuntDTOs.js";

export class HuntMonsterUseCase {
  private readonly huntEnergyCost = 10;
  private readonly huntCooldownMs = 60 * 1000; // 60s micro-cooldown
  private readonly combatEngine: CombatEngine;
  private readonly lootGenerator: LootGenerator;

  constructor(
    private readonly playerRepository: IPlayerRepository,
    private readonly monsterRepository: IMonsterRepository
  ) {
    this.combatEngine = new CombatEngine();
    this.lootGenerator = new LootGenerator();
  }

  public async execute(input: HuntInputDTO): Promise<HuntOutputDTO> {
    // 1. Retrieve or instantiate wandering player aggregate
    let player = await this.playerRepository.findByDiscordId(input.discordId);

    if (!player) {
      player = Player.createNew(
        `ply_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        input.discordId,
        input.username
      );
    }

    // 2. Validate cooldown and stamina constraints
    const actionCheck = player.canExecuteAction("hunt", this.huntCooldownMs, this.huntEnergyCost);
    if (!actionCheck.allowed) {
      return {
        success: false,
        message: actionCheck.reason,
        retryAfterSeconds: actionCheck.retryAfterSeconds,
        remainingEnergy: player.energy.current,
        maxEnergy: player.energy.max,
      };
    }

    // 3. Procure an adversary scaling with player level
    const monster = await this.monsterRepository.findRandomForLevel(player.level);

    // 4. Calculate aggregated attributes and simulate skirmish
    const playerStats = player.calculateEffectiveStats();
    const combatResult = this.combatEngine.simulate(
      player.username,
      playerStats,
      player.level,
      monster
    );

    // 5. Deduct stamina and establish micro-cooldown
    player.executeAction("hunt", this.huntCooldownMs, this.huntEnergyCost);

    let xpGained = 0;
    let goldGained = 0;
    let levelUpResult = undefined;
    let droppedItem = null;

    if (combatResult.victory) {
      // 6. Calculate progression experience
      xpGained = Progression.calculateMonsterXp(
        monster.level,
        player.level,
        monster.getRankMultiplier()
      );
      levelUpResult = player.gainExperience(xpGained);

      // 7. Reaped gold
      goldGained = monster.rollGoldDrop();
      player.addGold(goldGained);

      // 8. Generate procedural relic drop
      droppedItem = this.lootGenerator.generateDrop(monster.level, monster.getRankMultiplier());
      if (droppedItem) {
        player.addItemToInventory(droppedItem);
      }
    }

    // 9. Persist updated aggregate state
    await this.playerRepository.save(player);

    return {
      success: true,
      combat: combatResult,
      monsterName: monster.name,
      monsterLevel: monster.level,
      monsterRank: monster.rank,
      xpGained,
      goldGained,
      levelUp: levelUpResult,
      droppedItem: droppedItem ? droppedItem.toJSON() : null,
      remainingEnergy: player.energy.current,
      maxEnergy: player.energy.max,
    };
  }
}
