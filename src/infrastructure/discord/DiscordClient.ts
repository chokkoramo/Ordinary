import { Client, GatewayIntentBits } from "discord.js";

export class DiscordClient {
  private client: Client;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.registerEvents();
  }
  
  private registerEvents() {
        this.client.once("ready", (readyClient) => {
            console.log(`[ABYSS]: Bot ${readyClient.user.tag} wake up and ready to serve!`);
        });
        this.client.on("messageCreate", (message) => {
        if (message.author.bot) return;
        if (message.content === "?ping") {
            message.reply("The echo of the Abyss answers: Pong!");
        }
        });
    }

    public async start(): Promise<void> {
        try {
            await this.client.login(this.token);
        } catch (error) {
            console.error("[ABYSS]: Failed to login to the void (Discord):", error);
        }
    }
}