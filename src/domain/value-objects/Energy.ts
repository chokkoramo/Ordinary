export interface EnergyData {
  current: number;
  max: number;
  lastRegenAt: string; // ISO 8601 string for serialization
  regenIntervalSeconds: number; // Cadence: seconds per 1 stamina point
}

export class Energy {
  readonly current: number;
  readonly max: number;
  readonly lastRegenAt: Date;
  readonly regenIntervalSeconds: number;

  constructor(
    current = 100,
    max = 100,
    lastRegenAt = new Date(),
    regenIntervalSeconds = 180 // 3 minutes per point (20 points / hour)
  ) {
    this.max = Math.max(1, max);
    this.regenIntervalSeconds = Math.max(1, regenIntervalSeconds);
    this.lastRegenAt = lastRegenAt instanceof Date ? lastRegenAt : new Date(lastRegenAt);

    // Lazy mathematical evaluation up to the current moment
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - this.lastRegenAt.getTime()) / 1000));
    const pointsGained = Math.floor(elapsedSeconds / this.regenIntervalSeconds);

    if (pointsGained > 0) {
      this.current = Math.min(this.max, current + pointsGained);
      // Advance lastRegenAt by the exact consumed chunks of time to retain remainder
      const remainderSeconds = elapsedSeconds % this.regenIntervalSeconds;
      this.lastRegenAt = this.current >= this.max ? new Date(now) : new Date(now - remainderSeconds * 1000);
    } else {
      this.current = Math.min(this.max, Math.max(0, current));
    }
  }

  public hasEnough(amount: number): boolean {
    return this.current >= amount;
  }

  public consume(amount: number): { success: boolean; newEnergy: Energy; missingEnergy: number } {
    if (this.current < amount) {
      return {
        success: false,
        newEnergy: this,
        missingEnergy: amount - this.current,
      };
    }

    const updatedEnergy = new Energy(
      this.current - amount,
      this.max,
      this.lastRegenAt,
      this.regenIntervalSeconds
    );

    return {
      success: true,
      newEnergy: updatedEnergy,
      missingEnergy: 0,
    };
  }

  public restore(amount: number): Energy {
    return new Energy(
      Math.min(this.max, this.current + amount),
      this.max,
      this.lastRegenAt,
      this.regenIntervalSeconds
    );
  }

  public getSecondsUntilNextPoint(): number {
    if (this.current >= this.max) return 0;
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - this.lastRegenAt.getTime()) / 1000));
    return Math.max(0, this.regenIntervalSeconds - (elapsedSeconds % this.regenIntervalSeconds));
  }

  public getSecondsUntilFull(): number {
    if (this.current >= this.max) return 0;
    const missingPoints = this.max - this.current;
    return (missingPoints - 1) * this.regenIntervalSeconds + this.getSecondsUntilNextPoint();
  }

  public toJSON(): EnergyData {
    return {
      current: this.current,
      max: this.max,
      lastRegenAt: this.lastRegenAt.toISOString(),
      regenIntervalSeconds: this.regenIntervalSeconds,
    };
  }

  public static fromData(data: EnergyData): Energy {
    return new Energy(
      data.current,
      data.max,
      new Date(data.lastRegenAt),
      data.regenIntervalSeconds
    );
  }
}
