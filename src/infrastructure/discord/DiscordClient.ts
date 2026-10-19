import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  EmbedBuilder,
  SlashCommandBuilder,
  type Interaction,
  type Message,
} from "discord.js";
import { InMemoryPlayerRepository } from "../../adapters/outbound/persistence/in-memory/InMemoryPlayerRepository.js";
import { InMemoryMonsterRepository } from "../../adapters/outbound/persistence/in-memory/InMemoryMonsterRepository.js";
import { HuntMonsterUseCase } from "../../application/use-cases/HuntMonsterUseCase.js";
import { HuntCommand } from "../../adapters/inbound/discord/commands/HuntCommand.js";

export class DiscordClient {
  private client: Client;
  private token: string;
  private huntCommand: HuntCommand;

  constructor(token: string) {
    this.token = token;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    // Dependency Injection (Hexagonal Architecture wiring)
    const playerRepository = new InMemoryPlayerRepository();
    const monsterRepository = new InMemoryMonsterRepository();
    const huntUseCase = new HuntMonsterUseCase(playerRepository, monsterRepository);
    this.huntCommand = new HuntCommand(huntUseCase);

    this.registerEvents();
  }

  private registerEvents(): void {
    // clientReady event replaces legacy ready
    this.client.once("clientReady", async (readyClient) => {
      console.log(`[ORDINARY]: Bound and listening as ${readyClient.user.tag}.`);

      // Register Slash Commands globally
      try {
        console.log("[ORDINARY]: Deploying slash commands (/hunt, /cazar)...");
        const rest = new REST({ version: "10" }).setToken(this.token);

        const huntCmdData = this.huntCommand.data.toJSON();
        const cazarAliasData = new SlashCommandBuilder()
          .setName("cazar")
          .setDescription("Venture into the cursed wilderness to hunt aberrations (Alias for /hunt).")
          .toJSON();

        await rest.put(
          Routes.applicationCommands(readyClient.user.id),
          { body: [huntCmdData, cazarAliasData] }
        );
        console.log("[ORDINARY]: Slash commands deployed successfully.");
      } catch (err) {
        console.error("[ORDINARY]: Failed to deploy slash commands:", err);
      }
    });

    // Handle Slash Commands
    this.client.on("interactionCreate", async (interaction: Interaction) => {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === "hunt" || interaction.commandName === "cazar") {
        await this.huntCommand.execute(interaction);
      }
    });

    // Handle Prefix Commands (?hunt, ?cazar, ?ping, ?help)
    this.client.on("messageCreate", async (message: Message) => {
      if (message.author.bot) return;

      const content = message.content.trim().toLowerCase();

      if (
        content === "?hunt" ||
        content === "!hunt" ||
        content === "?cazar" ||
        content === "!cazar"
      ) {
        await this.huntCommand.executeMessage(message);
      } else if (content === "?ping" || content === "!ping") {
        const ping = this.client.ws.ping;
        await message.reply(`† Abyssal gateway pulse: \`${ping}ms\` †`);
      } else if (
        content === "?help" ||
        content === "!help" ||
        content === "?ayuda" ||
        content === "!ayuda"
      ) {
        const helpEmbed = new EmbedBuilder()
          .setColor(0x2B1D1D) // Dark sepia/charcoal
          .setTitle("† ORDINARY RPG — SANCTUARY TOMES †")
          .setDescription(
            `\`\`\`asciidoc\n=== CODEX OF COMMANDS ===\n` +
            `/hunt or ?hunt   :: Slay roaming fiends for XP, gold, and procedural relics.\n` +
            `                    Cost: 10 Stamina | Cooldown: 60s\n` +
            `?ping            :: Measure latency with the abyssal gateway.\n` +
            `?help            :: Consult this ancient tome of commands.\n\`\`\``
          )
          .addFields({
            name: "— THE PATH OF PERDITION —",
            value:
              `\`\`\`fix\n` +
              `• Stamina regenerates lazily at 1 pt every 3 minutes (20/hr).\n` +
              `• Procedural drops scale with adversary level and rank.\n` +
              `• High-risk battles against superior foes grant bonus experience.\n` +
              `\`\`\``,
          })
          .setFooter({ text: "ORDINARY • Clean Architecture & Gothic Dungeon Crawler" });

        await message.reply({ embeds: [helpEmbed] });
      }
    });
  }

  public async start(): Promise<void> {
    try {
      console.log("[ORDINARY]: Awakening abyssal gatekeeper (Discord)...");
      await this.client.login(this.token);
    } catch (error) {
      console.error("[ORDINARY]: Failed to bind to the abyssal gateway:", error);
      throw error;
    }
  }
}