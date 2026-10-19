export interface StatsData {
  maxHp: number;
  currentHp?: number | undefined;
  mana: number;
  strength: number;      // Scales Physical Damage and Armor
  dexterity: number;     // Scales Crit Chance, Evasion and Speed
  intelligence: number;  // Scales Magic Damage and Resistance
  vitality: number;      // Scales Health (1 Vit = 10 HP)
  armor: number;         // Flat physical mitigation
  magicResist: number;   // Flat magic mitigation
  minDamage: number;     // Weapon minimum damage
  maxDamage: number;     // Weapon maximum damage
  critChance: number;    // Decimal (e.g., 0.05 = 5%)
  critMultiplier: number;// Multiplier (e.g., 1.50 = 150%)
  speed: number;         // Combat initiative and attack cadence
}

export class CharacterStats {
  readonly maxHp: number;
  readonly currentHp: number;
  readonly mana: number;
  readonly strength: number;
  readonly dexterity: number;
  readonly intelligence: number;
  readonly vitality: number;
  readonly armor: number;
  readonly magicResist: number;
  readonly minDamage: number;
  readonly maxDamage: number;
  readonly critChance: number;
  readonly critMultiplier: number;
  readonly speed: number;

  constructor(data: StatsData) {
    this.strength = Math.max(0, data.strength);
    this.dexterity = Math.max(0, data.dexterity);
    this.intelligence = Math.max(0, data.intelligence);
    this.vitality = Math.max(0, data.vitality);

    // Attribute scaling inspired by classic ARPGs
    const bonusHpFromVit = this.vitality * 10;
    this.maxHp = Math.max(1, (data.maxHp || 50) + bonusHpFromVit);
    this.currentHp = data.currentHp !== undefined ? Math.min(this.maxHp, data.currentHp) : this.maxHp;
    this.mana = Math.max(0, (data.mana || 20) + this.intelligence * 5);

    const bonusArmorFromStr = Math.floor(this.strength * 0.5);
    this.armor = Math.max(0, (data.armor || 0) + bonusArmorFromStr);

    const bonusResistFromInt = Math.floor(this.intelligence * 0.5);
    this.magicResist = Math.max(0, (data.magicResist || 0) + bonusResistFromInt);

    // Physical damage: +1% bonus per STR point
    const strDmgMultiplier = 1 + this.strength * 0.01;
    this.minDamage = Math.max(1, Math.round((data.minDamage || 5) * strDmgMultiplier));
    this.maxDamage = Math.max(this.minDamage, Math.round((data.maxDamage || 10) * strDmgMultiplier));

    // Critical Strike: 5% base + 0.05% per DEX point (capped at 75%)
    const bonusCritFromDex = this.dexterity * 0.0005;
    this.critChance = Math.min(0.75, Math.max(0.01, (data.critChance || 0.05) + bonusCritFromDex));
    this.critMultiplier = Math.max(1.2, data.critMultiplier || 1.5);

    // Speed: 10 base + 0.1 per DEX point
    this.speed = Math.max(1, Math.round((data.speed || 10) + this.dexterity * 0.1));
  }

  public static zero(): CharacterStats {
    return new CharacterStats({
      maxHp: 0,
      mana: 0,
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      vitality: 0,
      armor: 0,
      magicResist: 0,
      minDamage: 0,
      maxDamage: 0,
      critChance: 0,
      critMultiplier: 0,
      speed: 0,
    });
  }

  public add(other: Partial<StatsData> | CharacterStats): CharacterStats {
    return new CharacterStats({
      maxHp: this.maxHp + (other.maxHp ?? 0),
      currentHp: this.currentHp + (other.currentHp ?? 0),
      mana: this.mana + (other.mana ?? 0),
      strength: this.strength + (other.strength ?? 0),
      dexterity: this.dexterity + (other.dexterity ?? 0),
      intelligence: this.intelligence + (other.intelligence ?? 0),
      vitality: this.vitality + (other.vitality ?? 0),
      armor: this.armor + (other.armor ?? 0),
      magicResist: this.magicResist + (other.magicResist ?? 0),
      minDamage: this.minDamage + (other.minDamage ?? 0),
      maxDamage: this.maxDamage + (other.maxDamage ?? 0),
      critChance: this.critChance + (other.critChance ?? 0),
      critMultiplier: this.critMultiplier + (other.critMultiplier ?? 0),
      speed: this.speed + (other.speed ?? 0),
    });
  }

  public toJSON(): StatsData {
    return {
      maxHp: this.maxHp,
      currentHp: this.currentHp,
      mana: this.mana,
      strength: this.strength,
      dexterity: this.dexterity,
      intelligence: this.intelligence,
      vitality: this.vitality,
      armor: this.armor,
      magicResist: this.magicResist,
      minDamage: this.minDamage,
      maxDamage: this.maxDamage,
      critChance: this.critChance,
      critMultiplier: this.critMultiplier,
      speed: this.speed,
    };
  }
}
