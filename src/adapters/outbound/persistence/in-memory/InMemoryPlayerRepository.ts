import type { IPlayerRepository } from "../../../../domain/repositories/IPlayerRepository.js";
import { Player } from "../../../../domain/entities/Player.js";

export class InMemoryPlayerRepository implements IPlayerRepository {
  private playersById = new Map<string, Player>();
  private playersByDiscordId = new Map<string, string>(); // discordId -> id

  public async findById(id: string): Promise<Player | null> {
    const player = this.playersById.get(id);
    return player ? new Player(player.toJSON()) : null;
  }

  public async findByDiscordId(discordId: string): Promise<Player | null> {
    const id = this.playersByDiscordId.get(discordId);
    if (!id) return null;
    return this.findById(id);
  }

  public async save(player: Player): Promise<void> {
    // Clone via JSON to simulate database isolation
    this.playersById.set(player.id, new Player(player.toJSON()));
    this.playersByDiscordId.set(player.discordId, player.id);
  }
}
