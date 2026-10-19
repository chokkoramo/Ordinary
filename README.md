# Ordinary RPG

> A minimalist, dark fantasy Action RPG and dungeon crawler Discord bot inspired by the *Diablo* series. Built strictly adhering to **Clean Architecture** and **Hexagonal Architecture (Ports and Adapters)** in TypeScript.

---

## Overview

**Ordinary** delivers deep character progression, procedural gear hunting, and high-stakes combat encounters directly inside Discord. The core business rules and game mechanics are **100% decoupled** from Discord.js and persistence libraries, ensuring high testability, zero vendor lock-in, and instant simulation speed.

### Core Pillars
* **Clean & Hexagonal Architecture:** Domain and Application layers are isolated from external dependencies.
* **Gothic Dark-Fantasy Aesthetic:** Minimalist, solemn presentation without playful emoji spam. Uses clean typographic runes (`†`, `◈`, `›`, `—`) and ASCII/monospace character sheets.
* **Procedural Loot Generation:** Diablo-inspired itemization with affixes, rarity tiers, item levels ($iLvl$), and unique legendary powers.
* **Lazy Mathematical Stamina:** Real-time timestamp-based resource regeneration without polling loops or CPU-heavy background cron jobs.
* **Mathematical Progression:** Polynomial-exponential level scaling with risk/reward level differentials.

---

## Architectural Topography (Hexagonal / Ports & Adapters)

```
src/
├── domain/                                 # CORE BUSINESS RULES (Zero External Dependencies)
│   ├── entities/                           # Domain Entities & Aggregate Roots
│   │   ├── Player.ts                       # Player aggregate root: stats, gear, inventory, stamina
│   │   ├── Item.ts                         # Procedural item: affixes, stats, salvage value
│   │   └── Monster.ts                      # Adversary entity: rank, stats, loot table references
│   ├── value-objects/                      # Immutable Value Objects
│   │   ├── CharacterStats.ts               # Combat stats and attribute derivations (STR, DEX, INT, VIT)
│   │   ├── ItemRarity.ts                   # Rarity tiers (Common, Magic, Rare, Legendary) and drop weights
│   │   ├── EquipmentSlot.ts                # Gear slots (Main Hand, Off-Hand, Helm, Chest, Boots, Jewelry)
│   │   ├── ItemAffix.ts                    # Procedural prefix/suffix pool scaling with iLvl
│   │   ├── Energy.ts                       # Stamina pool with lazy evaluation regeneration
│   │   └── Progression.ts                  # Mathematical XP curves and level scaling
│   ├── services/                           # Pure Domain Services
│   │   ├── CombatEngine.ts                 # Turn simulation, accuracy vs evasion, armor mitigation
│   │   └── LootGenerator.ts                # Diablo-style procedural item generator
│   └── repositories/                       # Driven Ports (Domain Interfaces)
│       ├── IPlayerRepository.ts            # Persistence contract for player aggregates
│       ├── IMonsterRepository.ts           # Bestiary contract for level-scaled monsters
│       └── IItemRepository.ts               # Stash & item inventory contract
│
├── application/                            # APPLICATION LAYER (Use Cases & Orchestration)
│   ├── use-cases/                          # Application use cases
│   │   ├── HuntMonsterUseCase.ts           # Orchestrates cooldowns, combat, loot, XP, and persistence
│   │   ├── RaidDungeonUseCase.ts           # Multi-stage dungeon crawler orchestration
│   │   ├── EquipItemUseCase.ts             # Gear equipping and stat recalculation
│   │   └── SalvageItemUseCase.ts           # Breakdown of relics into crafting materials
│   ├── dtos/                               # Data Transfer Objects
│   │   ├── HuntDTOs.ts
│   │   └── PlayerDTOs.ts
│   └── ports/                              # Secondary Ports
│       └── IRandomGenerator.ts             # Seedable RNG interface for deterministic unit testing
│
├── adapters/                               # ADAPTERS (I/O & Boundary Implementations)
│   ├── inbound/                            # Driving Adapters (Input)
│   │   └── discord/
│   │       ├── commands/                   # Command handlers (/hunt, /cazar)
│   │       │   └── HuntCommand.ts
│   │       └── presenters/                 # Maps UseCase DTOs into Gothic Discord Embeds
│   │           └── CombatEmbedPresenter.ts
│   └── outbound/                           # Driven Adapters (Output)
│       └── persistence/
│           ├── in-memory/                  # Fast volatile storage for dev and unit tests
│           │   ├── InMemoryPlayerRepository.ts
│           │   └── InMemoryMonsterRepository.ts
│           └── postgres/                   # Relational persistence implementation (Prisma / SQL)
│
└── infrastructure/                         # INFRASTRUCTURE & FRAMEWORKS
    ├── discord/
    │   └── DiscordClient.ts                # Discord.js client, gateway connection, and event routing
    └── config/
        └── GameConfig.ts                   # Game balance tunables and environment variables
```

---

## Core Game Systems & Mathematics

### 1. Progression & Level Scaling
Levels scale according to a polynomial-exponential hybrid formula:
$$XP_{\text{required}}(L) = \left\lfloor 100 \cdot L^{2.3} + 50 \cdot L \right\rfloor$$

* **Level 1 $\to$ 2:** $150 \text{ XP}$ (1–2 encounters)
* **Level 5 $\to$ 6:** $\sim 4{,}200 \text{ XP}$
* **Level 10 $\to$ 11:** $\sim 20{,}500 \text{ XP}$ (Transition into rare items)
* **Level 50 $\to$ 51:** $\sim 910{,}000 \text{ XP}$
* **Level 99 $\to$ 100:** $\sim 5{,}200{,}000 \text{ XP}$ (Pinnacle achievement)

#### Adversary XP & Anti-Exploit Level Scaling
$$XP_{\text{base}} = \left\lfloor 25 \cdot M_{\text{level}}^{1.45} \right\rfloor \cdot \text{RankMultiplier}$$

$$\text{Multiplier}(\Delta L) = \begin{cases}
  1.0 & \text{if } |\Delta L| \le 2 \\
  \max\left(0.10, 1.0 - 0.15 \cdot (|\Delta L| - 2)\right) & \text{if } L_{\text{player}} > L_{\text{monster}} \text{ (Anti-overfarming penalty)} \\
  \min\left(1.50, 1.0 + 0.10 \cdot (\Delta L - 2)\right) & \text{if } L_{\text{monster}} > L_{\text{player}} \text{ (High-risk bonus)}
\end{cases}$$

### 2. Turn-Based Combat & Damage Mitigation
* **Initiative:** Combatant with superior `speed` strikes first.
* **Accuracy vs Evasion:**
  $$\text{HitChance} = \text{clamp}\left(0.60, 0.95, \frac{\text{Dexterity}_{\text{attacker}}}{\text{Dexterity}_{\text{attacker}} + \text{Dexterity}_{\text{defender}} \cdot 0.5}\right)$$
* **Diminishing Returns Armor Mitigation (Diablo formula):**
  $$\text{Mitigation} = \frac{\text{Armor}}{\text{Armor} + 50 \times \text{AttackerLevel}}$$
  $$\text{FinalDamage} = \max\left(1, \lfloor \text{RawDamage} \cdot (1 - \text{Mitigation}) \rfloor\right)$$

### 3. Lazy Stamina Regeneration
Stamina requires zero background polling:
* **Max Capacity:** 100 points.
* **Regeneration Rate:** 1 point per 180 seconds (20 points / hour $\implies$ 5 hours from 0 to 100).
* **Evaluation at Timestamp $t_{\text{now}}$:**
  $$E_{\text{current}} = \min\left(100, E_{\text{saved}} + \left\lfloor \frac{t_{\text{now}} - t_{\text{last}}}{180} \right\rfloor\right)$$

### 4. Procedural Relic Generation
* **Common (Ash White):** Base stats only. Salvages into *Scrap Iron*.
* **Magic (Arcane Blue):** 1–2 affixes ($1.25\times$ base stats). Salvages into *Enchanted Dust*.
* **Rare (Tarnished Gold):** 3–4 affixes ($1.60\times$ base stats). Salvages into *Veiled Crystal*.
* **Legendary (Smoldering Cinder):** 4–6 affixes ($2.20\times$ base stats) + **Unique Inherent Power**. Salvages into *Forgotten Soul*.

---

## Commands & Interaction

| Command | Type | Cost / Cooldown | Description |
| :--- | :--- | :---: | :--- |
| `/hunt` or `?hunt` | Slash / Prefix | **10 Stamina** / **60s** | Venture into the wilderness to slay aberrations for XP, gold, and relics. |
| `/cazar` or `?cazar` | Alias | **10 Stamina** / **60s** | Spanish localization alias for `/hunt`. |
| `?help` or `?ayuda` | Prefix | **None** / **0s** | Consult the ancient codex of commands. |
| `?ping` | Prefix | **None** / **0s** | Measure latency with the abyssal gateway. |

---

## Getting Started

### Prerequisites
* **Node.js** v20.0.0 or higher
* **npm** or **pnpm**
* A registered **Discord Bot Token** from the [Discord Developer Portal](https://discord.com/developers/applications)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/chokkoramo/Ordinary.git
   cd Ordinary
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   ```

4. Run the bot in development mode:
   ```bash
   npm run dev
   ```

5. Verify TypeScript strict type-checking:
   ```bash
   npx tsc --noEmit
   ```

---

## License
MIT