import type { Player } from "../entities/Player.js";

export interface IPlayerRepository {
  findById(id: string): Promise<Player | null>;
  findByDiscordId(discordId: string): Promise<Player | null>;
  save(player: Player): Promise<void>;
}
