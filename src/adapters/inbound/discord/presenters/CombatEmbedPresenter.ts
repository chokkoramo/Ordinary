import { EmbedBuilder } from "discord.js";
import type { HuntOutputDTO } from "../../../../application/dtos/HuntDTOs.js";
import { RARITY_CONFIGS, ItemRarity } from "../../../../domain/value-objects/ItemRarity.js";

export class CombatEmbedPresenter {
  public static present(result: HuntOutputDTO): EmbedBuilder {
    if (!result.success) {
      return new EmbedBuilder()
        .setColor(0x3B1F1F) // Deep somber ash/umber
        .setTitle("† REST RESTRICTION †")
        .setDescription(
          `\`\`\`fix\n[RECOVERY REQUIRED]\n${result.message || "Your flesh requires recuperation before taking up arms."}\n\`\`\``
        )
        .setFooter({
          text: `ORDINARY • Stamina: ${result.remainingEnergy ?? 0}/${result.maxEnergy ?? 100}`,
        });
    }

    const combat = result.combat!;
    const embed = new EmbedBuilder();

    if (combat.victory) {
      embed
        .setColor(0x6A1A1A) // Blood-stone gothic crimson
        .setTitle(`† SLAIN: ${result.monsterName?.toUpperCase()} [LVL ${result.monsterLevel}] †`)
        .setDescription(
          `\`\`\`ini\n[COMBAT LOG]\n` +
          `Exchanges        : ${combat.totalRounds} rounds\n` +
          `Damage Dealt     : ${combat.totalDamageDealt} HP\n` +
          `Vitality Left    : ${combat.playerRemainingHp} / ${combat.playerInitialHp} HP\n\`\`\``
        )
        .addFields(
          {
            name: "— SPOILS REAPED —",
            value:
              `\`\`\`yaml\n` +
              `Experience : +${result.xpGained} XP\n` +
              `Gold       : +${result.goldGained} coins\n` +
              `Stamina    : ${result.remainingEnergy} / ${result.maxEnergy}\n` +
              `\`\`\``,
            inline: false,
          }
        );

      if (result.levelUp?.leveledUp) {
        embed.addFields({
          name: "† ASCENSION †",
          value:
            `\`\`\`diff\n` +
            `+ Attained Level ${result.levelUp.newLevel}\n` +
            `+ Attribute Points: +${result.levelUp.pointsAwarded}\n` +
            `\`\`\``,
          inline: false,
        });
      }

      if (result.droppedItem) {
        const item = result.droppedItem;
        const rarityCfg = RARITY_CONFIGS[item.rarity as ItemRarity] || RARITY_CONFIGS[ItemRarity.COMMON];

        const affixLines = item.affixes.length > 0
          ? item.affixes.map((a) => `  › +${a.value} ${a.stat} (${a.name})`).join("\n")
          : "  › Pure base relic without modifiers";

        const legendaryLine = item.legendaryEffect ? `\n  † ${item.legendaryEffect}` : "";

        embed.addFields({
          name: `◈ RELIC UNEARTHED [${rarityCfg.displayName.toUpperCase()}] ◈`,
          value:
            `\`\`\`md\n# ${item.name}\n` +
            `< Slot: ${item.slot} | iLvl: ${item.itemLevel} | Req: Level ${item.levelRequirement} >\n` +
            `${affixLines}${legendaryLine}\n\`\`\``,
          inline: false,
        });
      }
    } else {
      embed
        .setColor(0x1C1C1E) // Stygian charcoal
        .setTitle(`† SLAIN BY ${result.monsterName?.toUpperCase()} †`)
        .setDescription(
          `\`\`\`diff\n- YOUR FLESH WAS BROKEN\n` +
          `The adversary proved insurmountable.\n` +
          `Adversary Vitality: ${combat.monsterRemainingHp} / ${combat.monsterInitialHp} HP\n\`\`\``
        )
        .addFields({
          name: "— EXHAUSTION —",
          value: `\`\`\`yaml\nStamina : ${result.remainingEnergy} / ${result.maxEnergy}\n\`\`\``,
          inline: false,
        });
    }

    embed.setFooter({ text: "ORDINARY • Sanctuary of the Damned" });
    return embed;
  }
}
