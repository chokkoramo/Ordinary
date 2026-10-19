import { CharacterStats, type StatsData } from "../value-objects/CharacterStats.js";
import { EquipmentSlot } from "../value-objects/EquipmentSlot.js";
import { Energy, type EnergyData } from "../value-objects/Energy.js";
import { Progression } from "../value-objects/Progression.js";
import { Item, type ItemData } from "./Item.js";

export interface PlayerData {
  id: string;
  discordId: string;
  username: string;
  level: number;
  currentXp: number;
  energy: EnergyData;
  gold: number;
  materials: Record<string, number>;
  baseStats: StatsData;
  attributePoints: number;
  equipment: Partial<Record<EquipmentSlot, ItemData>>;
  inventory: ItemData[];
  cooldowns: Record<string, number>; // actionName -> timestamp in ms when available
}

export interface LevelUpResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  pointsAwarded: number;
  currentXp: number;
  requiredXp: number;
}

export class Player {
  readonly id: string;
  readonly discordId: string;
  private _username: string;
  private _level: number;
  private _currentXp: number;
  private _energy: Energy;
  private _gold: number;
  private _materials: Map<string, number>;
  private _baseStats: CharacterStats;
  private _attributePoints: number;
  private _equipment: Map<EquipmentSlot, Item>;
  private _inventory: Item[];
  private _cooldowns: Map<string, number>;
  private readonly _maxInventorySize = 25;

  constructor(data: PlayerData) {
    this.id = data.id;
    this.discordId = data.discordId;
    this._username = data.username;
    this._level = Math.max(1, data.level);
    this._currentXp = Math.max(0, data.currentXp);
    this._energy = Energy.fromData(data.energy);
    this._gold = Math.max(0, data.gold);
    this._materials = new Map(Object.entries(data.materials || {}));
    this._baseStats = data.baseStats instanceof CharacterStats ? data.baseStats : new CharacterStats(data.baseStats);
    this._attributePoints = Math.max(0, data.attributePoints || 0);

    this._equipment = new Map();
    if (data.equipment) {
      for (const [slotStr, itemData] of Object.entries(data.equipment)) {
        if (itemData) {
          this._equipment.set(slotStr as EquipmentSlot, new Item(itemData));
        }
      }
    }

    this._inventory = (data.inventory || []).map((i) => (i instanceof Item ? i : new Item(i)));
    this._cooldowns = new Map(Object.entries(data.cooldowns || {}));
  }

  // Getters
  public get username(): string { return this._username; }
  public get level(): number { return this._level; }
  public get currentXp(): number { return this._currentXp; }
  public get energy(): Energy { return this._energy; }
  public get gold(): number { return this._gold; }
  public get materials(): ReadonlyMap<string, number> { return this._materials; }
  public get baseStats(): CharacterStats { return this._baseStats; }
  public get attributePoints(): number { return this._attributePoints; }
  public get equipment(): ReadonlyMap<EquipmentSlot, Item> { return this._equipment; }
  public get inventory(): readonly Item[] { return this._inventory; }
  public get cooldowns(): ReadonlyMap<string, number> { return this._cooldowns; }

  /**
   * Factory method to instantiate a new wandering Nephalem
   */
  public static createNew(id: string, discordId: string, username: string): Player {
    return new Player({
      id,
      discordId,
      username,
      level: 1,
      currentXp: 0,
      energy: new Energy(100, 100).toJSON(),
      gold: 50,
      materials: {},
      baseStats: {
        maxHp: 100,
        mana: 50,
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        vitality: 10,
        armor: 5,
        magicResist: 5,
        minDamage: 5,
        maxDamage: 10,
        critChance: 0.05,
        critMultiplier: 1.5,
        speed: 10,
      },
      attributePoints: 0,
      equipment: {},
      inventory: [],
      cooldowns: {},
    });
  }

  /**
   * Calculates total combat stats aggregating player's base attributes and equipped gear
   */
  public calculateEffectiveStats(): CharacterStats {
    let aggregated = this._baseStats;

    for (const item of this._equipment.values()) {
      aggregated = aggregated.add(item.getTotalStats());
    }

    return aggregated;
  }

  /**
   * Awards experience and handles single or cascading level advancements
   */
  public gainExperience(amount: number): LevelUpResult {
    const oldLevel = this._level;
    this._currentXp += Math.max(0, amount);
    let leveledUp = false;
    let pointsAwarded = 0;

    let requiredXp = Progression.getRequiredXpForLevel(this._level);

    while (this._currentXp >= requiredXp) {
      this._currentXp -= requiredXp;
      this._level += 1;
      this._attributePoints += 5; // 5 attribute points awarded per level
      pointsAwarded += 5;
      leveledUp = true;
      requiredXp = Progression.getRequiredXpForLevel(this._level);
    }

    return {
      leveledUp,
      oldLevel,
      newLevel: this._level,
      pointsAwarded,
      currentXp: this._currentXp,
      requiredXp,
    };
  }

  /**
   * Validates cooldown and stamina requirements
   */
  public canExecuteAction(
    actionName: string,
    cooldownDurationMs: number,
    energyCost: number
  ): { allowed: boolean; reason?: string | undefined; retryAfterSeconds?: number | undefined } {
    // 1. Check Cooldown
    const availableAt = this._cooldowns.get(actionName) ?? 0;
    const now = Date.now();

    if (now < availableAt) {
      const retryAfterSeconds = Math.ceil((availableAt - now) / 1000);
      return {
        allowed: false,
        reason: `Action '${actionName}' is currently on cooldown. Available in ${retryAfterSeconds}s.`,
        retryAfterSeconds,
      };
    }

    // 2. Check Energy / Stamina
    if (!this._energy.hasEnough(energyCost)) {
      const secondsUntilPoint = this._energy.getSecondsUntilNextPoint();
      return {
        allowed: false,
        reason: `Insufficient stamina (${this._energy.current}/${this._energy.max} pts). Requires ${energyCost} pts. Next recharge in ${secondsUntilPoint}s.`,
        retryAfterSeconds: secondsUntilPoint,
      };
    }

    return { allowed: true };
  }

  /**
   * Applies cooldown timestamp and deducts stamina
   */
  public executeAction(actionName: string, cooldownDurationMs: number, energyCost: number): void {
    const check = this.canExecuteAction(actionName, cooldownDurationMs, energyCost);
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    if (energyCost > 0) {
      const energyResult = this._energy.consume(energyCost);
      this._energy = energyResult.newEnergy;
    }

    if (cooldownDurationMs > 0) {
      this._cooldowns.set(actionName, Date.now() + cooldownDurationMs);
    }
  }

  /**
   * Equips an item from the inventory into the corresponding gear slot
   */
  public equipItem(item: Item): { success: boolean; unequipped?: Item | undefined; error?: string | undefined } {
    if (this._level < item.levelRequirement) {
      return {
        success: false,
        error: `Level requirement not met. Requires level ${item.levelRequirement} (Your level: ${this._level}).`,
      };
    }

    const index = this._inventory.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      this._inventory.splice(index, 1);
    }

    const existing = this._equipment.get(item.slot);
    if (existing) {
      this._inventory.push(existing);
    }

    this._equipment.set(item.slot, item);

    return {
      success: true,
      unequipped: existing,
    };
  }

  /**
   * Unequips gear back into inventory
   */
  public unequipItem(slot: EquipmentSlot): Item | null {
    const equipped = this._equipment.get(slot);
    if (!equipped) return null;

    if (this._inventory.length >= this._maxInventorySize) {
      throw new Error("Inventory is full. Salvage or sell items before unequipping.");
    }

    this._equipment.delete(slot);
    this._inventory.push(equipped);
    return equipped;
  }

  /**
   * Adds an item to the player's satchel
   */
  public addItemToInventory(item: Item): boolean {
    if (this._inventory.length >= this._maxInventorySize) {
      return false;
    }
    this._inventory.push(item);
    return true;
  }

  /**
   * Salvages an item at the forge into crafting dust and gold
   */
  public salvageItem(itemId: string): { success: boolean; material?: string | undefined; amount?: number | undefined; gold?: number | undefined; error?: string | undefined } {
    const index = this._inventory.findIndex((i) => i.id === itemId);
    if (index === -1) {
      return { success: false, error: "Item was not found in your inventory." };
    }

    const item = this._inventory[index]!;
    this._inventory.splice(index, 1);

    const reward = item.getSalvageReward();
    this._gold += reward.gold;

    const currentMatCount = this._materials.get(reward.material) || 0;
    this._materials.set(reward.material, currentMatCount + reward.amount);

    return {
      success: true,
      material: reward.material,
      amount: reward.amount,
      gold: reward.gold,
    };
  }

  public addGold(amount: number): void {
    this._gold += Math.max(0, amount);
  }

  public toJSON(): PlayerData {
    const equipmentObj: Partial<Record<EquipmentSlot, ItemData>> = {};
    for (const [slot, item] of this._equipment.entries()) {
      equipmentObj[slot] = item.toJSON();
    }

    const cooldownsObj: Record<string, number> = {};
    for (const [action, time] of this._cooldowns.entries()) {
      cooldownsObj[action] = time;
    }

    const materialsObj: Record<string, number> = {};
    for (const [mat, count] of this._materials.entries()) {
      materialsObj[mat] = count;
    }

    return {
      id: this.id,
      discordId: this.discordId,
      username: this._username,
      level: this._level,
      currentXp: this._currentXp,
      energy: this._energy.toJSON(),
      gold: this._gold,
      materials: materialsObj,
      baseStats: this._baseStats.toJSON(),
      attributePoints: this._attributePoints,
      equipment: equipmentObj,
      inventory: this._inventory.map((i) => i.toJSON()),
      cooldowns: cooldownsObj,
    };
  }
}
