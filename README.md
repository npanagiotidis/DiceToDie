# DiceToDie – AD&D 2e Rules Overlay

A Foundry VTT module that implements faithful **AD&D 2e** rules as an overlay for the **ARS** game system.

## Installation

### Method 1 – Foundry Module Manager (recommended)

1. Open Foundry VTT and go to **Configuration → Add-on Modules**
2. Click **Install Module**
3. Paste this manifest URL in the **Manifest URL** field at the bottom:
   ```
   https://raw.githubusercontent.com/npanagiotidis/DiceToDie/copilot/implement-thac0-system/module.json
   ```
4. Click **Install**

> **After this PR is merged to `main`**, update the manifest URL to:
> ```
> https://raw.githubusercontent.com/npanagiotidis/DiceToDie/main/module.json
> ```
> and update the three URL fields in `module.json` (manifest, download, readme) to point to `main` instead of the branch name.
> Pushing a `v*` tag (e.g. `git tag v2.0.0 && git push --tags`) will trigger the release workflow to create a proper zip release and update these fields automatically.

### Method 2 – Direct zip download

1. Download the zip directly:  
   [`DiceToDie-copilot-implement-thac0-system.zip`](https://github.com/npanagiotidis/DiceToDie/archive/refs/heads/copilot/implement-thac0-system.zip)
2. Unzip it and move the inner folder into your Foundry **modules** directory, renamed to `dice-to-die`, so the path looks like:
   ```
   <Foundry Data>/modules/dice-to-die/module.json
   ```
   (On Linux: `~/.local/share/FoundryVTT/Data/modules/dice-to-die/`)
3. Restart Foundry VTT and enable the module under **Configuration → Add-on Modules**

### Compatibility

| Foundry VTT | Status |
|---|---|
| v13 | ✅ Verified |
| v12 | ✅ Supported |

## Features

### 🗡️ THAC0 System
- Per-class progression tables (Warrior, Priest, Rogue, Wizard groups) from the PHB
- Multi-class support: best (lowest) THAC0 across all classes
- Manual THAC0 adjustment flag
- Auto-recalculates when class or level changes
- Attack resolution: **d20 ≥ THAC0 − Target AC** (descending AC, −10 to 10)

### 🛡️ Saving Throws (5 Categories)
- Paralyzation / Poison / Death
- Rod / Staff / Wand
- Petrification / Polymorph
- Breath Weapon
- Spell
- Multi-class: best value per category; racial CON bonuses applied automatically

### ⚔️ Combat Engine
- Full attack automation: d20 roll → hit resolution → damage dice roll
- Non-proficiency penalties by class group
- Fighter weapon specialization (+1 attack / +2 damage)
- Chat messages with THAC0 vs AC breakdown

### 🎲 Initiative (Manual Roll, Auto-Computed)
- Base d10 (lower = acts first)
- Weapon speed factor and spell casting time added to roll
- Spell interruption: flagged automatically when caster takes damage before casting

### 📜 Proficiency System
- Weapon and non-weapon proficiency slot tracking per class/level
- Non-weapon proficiency checks: `d20 ≤ ability score ± modifier`
- Fighter weapon specialization

### ✨ Magic System
- Spell objects: level, school, sphere, casting time, components, duration, range, saving throw
- Wizard specialization: prohibited schools, bonus spell slots
- Priest sphere access (major/minor)
- Memorize-and-forget model; no spontaneous casting

### 🎯 Ability Score Generator (Original Feature)
- 4d6 drop lowest, two sets for comparison
- Automatic application to the open character sheet

---

## How to Use

### Enable the Module
Go to **Settings → Manage Modules** and enable **DiceToDie – AD&D 2e Rules Overlay**.

### Configure a Character (Macro or Console)
```js
// Single class
await DiceToDie.setupCharacter(actor, { className: "fighter", level: 5, race: "human" });

// Multi-class
await DiceToDie.setupMultiClass(actor, [
  { className: "fighter", level: 5, xp: 16000 },
  { className: "mage",    level: 4, xp: 10000 }
], "halfElf");
```

### Roll an Attack
```js
const result = await DiceToDie.combat.attack(attacker, targetAC, {
  damage: "1d8+2",
  attackBonus: 1,
  name: "Long Sword +1"
});
await DiceToDie.combat.toChat(attacker, result);
```

### Roll a Saving Throw
```js
const save = await DiceToDie.savingThrows.rollSave(actor, "spell");
// categories: "ppd", "rsw", "pp", "bw", "spell"
```

### Roll Initiative
```js
const init = await DiceToDie.initiative.roll(actor, {
  speedFactor: 5,   // weapon speed factor
  castingTime: 0    // or >0 for a spell
});
await DiceToDie.initiative.toChat(actor, init);
```

### Proficiency Check
```js
const check = await DiceToDie.proficiencies.rollNonWeaponCheck(actor, "wis", -2);
```

### Memorize / Cast a Spell
```js
const spell = DiceToDie.spells.createSpell({
  name: "Magic Missile", level: 1, school: "invocation",
  castingTime: 1, components: "VS", duration: "Instantaneous",
  range: "60 yards + 10 yards/level", savingThrow: "None"
});
await DiceToDie.spells.memorizeSpell(actor, spell);
```

---

## Automation Boundaries

| Feature | Automated |
|---------|-----------|
| THAC0 update on level/class change | ✅ Auto |
| Saving throw update on level/class/race change | ✅ Auto |
| Attack d20 roll | ✅ Auto |
| Damage dice roll | ✅ Auto |
| Initiative roll | 🎲 Manual (macro/button) |
| Reaction checks | 🎲 Manual |
| Spell interruption check | 🔔 Auto-flagged on damage |

---

## Compatibility

- Foundry VTT 12–13
- ARS system (latest)

## Version History

See [CHANGELOG.md](CHANGELOG.md).

---

Created with 🎲 for faithful AD&D 2e roleplay

