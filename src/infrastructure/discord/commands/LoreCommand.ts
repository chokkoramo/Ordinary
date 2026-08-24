import { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { GetLorePagesUseCase } from '../../../application/useCases/GetLorePagesUseCase.js';
import type { ICommand } from './ICommand.js';

export class LoreCommand implements ICommand {
    public readonly name = "lore";
    public readonly description = "Shows the lore of the game";

    constructor(private getLorePagesUseCases: GetLorePagesUseCase) { }

    async execute(message: Message, args: string[]) {
        const pages = this.getLorePagesUseCases.execute();
        let currentPage = 0;

        const generateEmbed = (pageIndex: number) => {
            return new EmbedBuilder()
                .setTitle("L∅re")
                .setDescription(pages[pageIndex] ?? null)
                .setFooter({ text: `Page ${pageIndex + 1} of ${pages.length}` })
                .setColor("#2b2d31");
        };

        const generateButtons = (pageIndex: number) => {
            return new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId("lore_previous")
                    .setLabel("<- Previous")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(pageIndex === 0),
                new ButtonBuilder()
                    .setCustomId("lore_next")
                    .setLabel("Next ->")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(pageIndex === pages.length - 1)
            );
        };

        const response = await message.reply({
            embeds: [generateEmbed(currentPage)],
            components: [generateButtons(currentPage)]
        });

        // Esto escucha los botones por 60 segundos y espera a que alguien presione un boton
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on("collect", async (i) => {
            if (i.user.id !== message.author.id) {
                await i.reply({ content: "You are not worthy of interacting with the menu", ephemeral: true });
                return;
            }

            if (i.customId === "lore_previous") currentPage--;
            if (i.customId === "lore_next") currentPage++;

            await i.update({
                embeds: [generateEmbed(currentPage)],
                components: [generateButtons(currentPage)]
            });
        });

        collector.on("end", async () => {
            await response.edit({
                components: []
            });
        });
    }
}