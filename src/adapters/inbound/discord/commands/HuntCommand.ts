import {
  ChatInputCommandInteraction,
  Message,
  SlashCommandBuilder,
} from "discord.js";
import type { HuntMonsterUseCase } from "../../../../application/use-cases/HuntMonsterUseCase.js";
import { CombatEmbedPresenter } from "../presenters/CombatEmbedPresenter.js";

export class HuntCommand {
  public readonly data = new SlashCommandBuilder()
    .setName("hunt")
    .setDescription("Venture into the cursed wilderness to hunt aberrations for XP, gold, and relics.");

  constructor(private readonly huntUseCase: HuntMonsterUseCase) {}

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const result = await this.huntUseCase.execute({
        discordId: interaction.user.id,
        username: interaction.user.username,
      });

      const embed = CombatEmbedPresenter.present(result);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("[ORDINARY]: Error executing /hunt:", error);
      await interaction.editReply({
        content: "† An anomalous disruption manifested in the depths of battle. †",
      });
    }
  }

  public async executeMessage(message: Message): Promise<void> {
    try {
      const result = await this.huntUseCase.execute({
        discordId: message.author.id,
        username: message.author.username,
      });

      const embed = CombatEmbedPresenter.present(result);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[ORDINARY]: Error executing hunt text command:", error);
      await message.reply("† An anomalous disruption manifested in the depths of battle. †");
    }
  }
}
