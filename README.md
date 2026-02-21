# DiceToDie - Ability Score Generator & ARS Races Compendium

A Foundry VTT module for ARS/OSRIC systems that generates ability scores using the classic 4d6 drop lowest method and provides a comprehensive compendium of races from AD&D 2nd Edition sourcebooks.

## Features

✨ **Ability Score Generator**
- Click the 🎲 dice button in the left toolbar to generate ability scores
- Two roll sets displayed side-by-side for comparison
- Shows individual dice rolls and dropped die for each ability

🎯 **Smart Selection**
- Compare two different 4d6 drop lowest rolls
- Choose which set works best for your character concept
- Scores are automatically applied to all six abilities (STR, DEX, CON, INT, WIS, CHA)

📊 **Clear Display**
- Color-coded roll sets (green for Roll Set 1, blue for Roll Set 2)
- Individual dice breakdown showing kept and dropped dice
- Automatic confirmation when scores are applied

📖 **ARS Races Compendium**

Four compendium packs covering races from the major AD&D 2nd Edition sourcebooks:

### ARS Races – Player's Handbook (2nd Edition)
| Race | STR | DEX | CON | INT | WIS | CHA |
|------|-----|-----|-----|-----|-----|-----|
| Human | — | — | — | — | — | — |
| Dwarf | — | — | +1 | — | — | −1 |
| Elf | — | +1 | −1 | — | — | — |
| Gnome | — | — | — | +1 | −1 | — |
| Half-Elf | — | — | — | — | — | — |
| Half-Orc | +1 | — | +1 | — | — | −2 |
| Halfling | −1 | +1 | — | — | — | — |

### ARS Races – The Complete Book of Elves
| Race | STR | DEX | CON | INT | WIS | CHA |
|------|-----|-----|-----|-----|-----|-----|
| Aquatic Elf | — | +1 | −1 | — | — | — |
| Dark Elf (Drow) | — | +1 | −1 | +1 | — | +1 |
| Gray Elf | −1 | +1 | −1 | +2 | — | — |
| High Elf | — | +1 | −1 | — | — | — |
| Sylvan Elf (Wood Elf) | +1 | +1 | — | −1 | — | −1 |
| Valley Elf | — | +1 | −1 | — | — | — |
| Wild Elf (Grugach) | +1 | +1 | — | −2 | — | — |
| Winged Elf (Avariel) | −1 | +2 | −1 | — | — | — |

### ARS Races – The Complete Book of Dwarves
| Race | STR | DEX | CON | INT | WIS | CHA |
|------|-----|-----|-----|-----|-----|-----|
| Mountain Dwarf | — | — | +1 | — | — | −1 |
| Hill Dwarf | — | — | +1 | — | — | −1 |
| Deep Dwarf | — | — | +1 | — | — | −2 |
| Duergar (Gray Dwarf) | — | — | +1 | — | — | −2 |
| Gully Dwarf | — | — | — | −2 | — | −2 |
| Sundered Dwarf | — | — | +1 | — | — | −1 |
| Wild Dwarf | +1 | — | +1 | −1 | — | −1 |

### ARS Races – The Complete Book of Gnomes & Halflings
| Race | STR | DEX | CON | INT | WIS | CHA |
|------|-----|-----|-----|-----|-----|-----|
| Rock Gnome | — | — | — | +1 | −1 | — |
| Forest Gnome | — | +1 | −1 | +1 | — | — |
| Deep Gnome (Svirfneblin) | −2 | +2 | — | — | +2 | −2 |
| Tinker Gnome | — | — | — | +2 | −2 | — |
| Spriggan | — | +1 | — | — | — | −2 |
| Hairfoot Halfling | −1 | +1 | — | — | — | — |
| Stout Halfling | −1 | +1 | +1 | — | — | — |
| Tallfellow Halfling | −1 | +1 | — | +1 | — | — |

## How to Use

### Ability Score Generator
1. **Enable the Module**: Go to Settings → Manage Modules and enable "DiceToDie"
2. **Open a Character Sheet**: Open any ARS/OSRIC character sheet
3. **Click the Dice Button**: Look for the 🎲 dice icon in the left toolbar
4. **Choose Your Rolls**: Compare the two generated roll sets and click "Select Roll 1" or "Select Roll 2"
5. **Done**: Your ability scores are automatically updated!

### Races Compendium
1. **Enable the Module**: Go to Settings → Manage Modules and enable "DiceToDie"
2. **Open a Compendium**: Go to the Compendiums tab and look for the **ARS Races** packs
3. **Browse Races**: Each pack corresponds to one sourcebook — open a pack to view all available races
4. **Import a Race**: Drag a race entry to your Items directory or directly onto a character sheet

## Technical Details

- **Ability Score Method**: 4d6 drop lowest (rolls 4d6, drops the lowest die, sums the remaining 3)
- **Compendium Format**: LevelDB (Foundry VTT v12+ compatible)
- **Compatibility**: Foundry VTT 11+ (verified on 13)
- **System**: ARS/OSRIC
- **License**: MIT

## Building from Source

The compendium source files are JSON documents located in `packs/src/`. To rebuild the compiled packs after editing the source files:

```bash
npm install
npm run build
```

This requires [Node.js](https://nodejs.org/) and uses `@foundryvtt/foundryvtt-cli` to compile the JSON sources into LevelDB packs.

## Version History

### v1.1.0
- Added ARS Races Compendium with 30 races across four sourcebooks
  - AD&D 2nd Edition Player's Handbook (7 races)
  - The Complete Book of Elves (8 elf subraces)
  - The Complete Book of Dwarves (7 dwarf subraces)
  - The Complete Book of Gnomes & Halflings (5 gnome subraces + 3 halfling subraces)
- Added `package.json` with build script for compendium compilation

### v1.0.0
- Initial release
- 4d6 drop lowest ability score generation
- Two roll comparison interface
- Automatic character sheet updates

---

Created with 🎲 for tabletop RPG enthusiasts
