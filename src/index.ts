import * as dotenv from "dotenv";
import { DiscordClient } from "./infrastructure/discord/DiscordClient.js";

dotenv.config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("[ABYSS]: Discord bot token is not defined in the environment variables.");
}

const discordClient = new DiscordClient(token);
discordClient.start();
