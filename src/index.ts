import * as dotenv from "dotenv";
import { DiscordClient } from "./infrastructure/discord/DiscordClient.js";
import { GetLorePagesUseCase } from "./application/useCases/GetLorePagesUseCase.js";
import { LoreCommand } from "./infrastructure/discord/commands/LoreCommand.js";

dotenv.config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("[ABYSS]: Discord bot token is not defined in the environment variables.");
}

const getLorePagesUseCase = new GetLorePagesUseCase();
const loreCommand = new LoreCommand(getLorePagesUseCase);
const discordClient = new DiscordClient(token);
discordClient.registerCommand(loreCommand);
discordClient.start();
