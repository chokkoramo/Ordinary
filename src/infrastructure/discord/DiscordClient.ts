import { Client, GatewayIntentBits, Message } from "discord.js";
import type { ICommand } from "./commands/ICommand.js";

export class DiscordClient {
    private client: Client;
    private token: string;
    private commands: Map<string, ICommand> = new Map();
    private prefix: string = "?";

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

    public registerCommand(command: ICommand) {
        this.commands.set(command.name.toLowerCase(), command);
    }

    private registerEvents() {
        this.client.once("clientReady", (clientReady: Client<true>) => {
            console.log(`[ABYSS]: Bot ${clientReady.user.tag} wake up and ready to serve!`);
            console.log(this.client);
        });
        this.client.on("messageCreate", async (message: Message) => {
            if (message.author.bot) return;
            if (!message.content.startsWith(this.prefix)) return;

            const args = message.content.slice(this.prefix.length).trim().split(/ +/);
            const commandName = args.shift()?.toLowerCase();

            if (!commandName) return;

            if (commandName === "ping") {
                await message.reply("The echo of the Abyss answers: Pong!");
                return;
            }

            const command = this.commands.get(commandName);
            if (command) {
                try {
                    await command.execute(message, args);
                } catch (error) {
                    console.error(`[ABYSS]: Error executing command ${commandName}:`, error);
                    await message.reply("An error occurred while executing that command.");
                }
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