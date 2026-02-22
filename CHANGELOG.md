# Changelog

All notable changes to DiceToDie are documented here.
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [2.1.0] – 2026-02-22

### Added – Races Compendium (30 playable AD&D 2e races)

Four Foundry VTT compendium packs with full structured `racialTraits` data:

| Pack | Source | Races |
|---|---|---|
| `ars-races-phb` | Player's Handbook (2nd Ed.) | Human, Dwarf, Elf, Gnome, Half-Elf, Half-Orc, Halfling |
| `ars-races-elves` | Complete Book of Elves | Aquatic, Dark (Drow), Gray, High, Sylvan, Valley, Wild, Winged |
| `ars-races-dwarves` | Complete Book of Dwarves | Mountain, Hill, Deep, Duergar, Gully, Sundered, Wild |
| `ars-races-gnomes-halflings` | Complete Book of Gnomes & Halflings | Rock/Forest/Deep/Tinker Gnome, Spriggan, Hairfoot/Stout/Tallfellow Halfling |

Each race Item includes a machine-readable `racialTraits` block covering:
- `abilityModifiers` – STR/DEX/CON/INT/WIS/CHA adjustments
- `savingThrowBonuses` – per-category flat bonuses
- `attackBonuses` / `defensiveBonuses`
- `detectAbilities` – stonecunning (dwarves/gnomes), secret door detection (elves)
- `innateAbilities` – spell-like abilities with `usesPerDay` and `minLevel` (Drow, Duergar, Svirfneblin, Spriggan)
- `penalties` – light sensitivity with per-field numeric penalties
- `infravision`, `sleepImmunity`, `magicResistance`

### Added – Build tooling
- `package.json` with `npm run build` to recompile all packs from `packs/src/` using `@foundryvtt/foundryvtt-cli`
- `.gitignore` for `node_modules/` and `package-lock.json`

---

## [2.0.0] – 2026-02-21

### Added – AD&D 2e Rules Overlay

#### Core Rule Engine
- **THAC0 System** (`scripts/thac0.js`)
  - Per-class progression tables for Warrior, Priest, Rogue, and Wizard groups
  - Multi-class support: best (lowest) THAC0 across all classes
  - Manual THAC0 adjustment via actor flags
  - Automatic recalculation on class/level change
  - Attack resolution: d20 ≥ THAC0 − Target AC (descending AC, −10 to 10)
  - Natural 20 always hits; natural 1 always misses

- **Saving Throw System** (`scripts/saving-throws.js`)
  - Five categories: Paralyzation/Poison/Death, Rod/Staff/Wand,
    Petrification/Polymorph, Breath Weapon, Spell
  - Class progression tables sourced from PHB (Tables 54–57)
  - Multi-class: best value per category across all classes
  - Racial bonuses applied automatically (including CON-based demi-human bonuses)
  - Automatic recalculation on class/level/race change

- **Combat Engine** (`scripts/combat.js`)
  - Full attack round: auto-roll d20, resolve hit, auto-roll damage dice
  - Non-proficiency penalty varies by class group
  - Fighter specialization bonus (+1 attack / +2 damage)
  - Chat message output with THAC0 vs AC breakdown

- **Initiative System** (`scripts/initiative.js`)
  - Base d10 roll (lower = acts first)
  - Weapon speed factor added to roll
  - Spell casting time added to roll
  - Spell interruption detection: caster interrupted if struck before initiative resolves
  - Per-round state stored in actor flags; cleared at end of round

- **Proficiency System** (`scripts/proficiencies.js`)
  - Weapon proficiency slot tracking (initial + per-level gain per class)
  - Fighter weapon specialization: 1 slot grants +1 attack / +2 damage
  - Non-weapon proficiency slot tracking
  - Ability-based NWP check: d20 ≤ ability score ± modifier

- **Magic / Spell System** (`scripts/spells.js`)
  - Canonical spell object model: level, school, sphere, castingTime,
    components, duration, range, savingThrow
  - Wizard specialization: prohibited schools, bonus spell slots
  - Priest sphere access: major (full) and minor (levels 1–3) spheres
  - Memorize-and-forget model; no spontaneous casting
  - Spell slot tracking via actor flags
  - Preparation reset clears only expended spells

#### Data Tables
- THAC0 progression for all four class groups (`scripts/data/thac0-tables.js`)
- Saving throw progression for all four class groups (`scripts/data/save-tables.js`)
- Complete class definitions for all PHB classes including all specialist wizards (`scripts/data/class-data.js`)
- Racial data: ability modifiers, saving throw bonuses, infravision, weapon familiarity (`scripts/data/racial-data.js`)

#### Module Infrastructure
- Public API exposed as `window.DiceToDie` and `game.modules.get('dice-to-die').api`
- Macro helpers: `DiceToDie.setupCharacter()`, `DiceToDie.setupMultiClass()`
- Module settings for toggling auto-update behaviour
- Versioned for Foundry VTT 12–13 compatibility
- AD&D 2e chat card styles (`styles/adnd2e.css`)

### Changed
- `module.json`: updated title, description, version, author, and script/style lists
- Existing ability score roller retained and integrated into the new init flow

---

## [1.0.0] – Initial Release

### Added
- 4d6 drop-lowest ability score generation
- Two-roll comparison dialog
- Automatic character sheet update via ARS actor fields
- Toolbar button integration
