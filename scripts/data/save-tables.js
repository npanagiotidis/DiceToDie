/**
 * AD&D 2e Saving Throw Progression Tables
 * Source: Player's Handbook, Tables 54–57
 *
 * Five categories:
 *   ppd   = Paralyzation, Poison, or Death Magic
 *   rsw   = Rod, Staff, or Wand
 *   pp    = Petrification or Polymorph
 *   bw    = Breath Weapon
 *   spell = Spell
 *
 * Each entry covers a min–max level range.
 * Roll this number or higher on a d20 to succeed.
 */

const ADND2E_SAVE_TABLES = {
  /** Fighter, Paladin, Ranger */
  warrior: [
    { min: 1,  max: 2,  ppd: 14, rsw: 16, pp: 15, bw: 17, spell: 17 },
    { min: 3,  max: 4,  ppd: 13, rsw: 15, pp: 14, bw: 16, spell: 16 },
    { min: 5,  max: 6,  ppd: 11, rsw: 13, pp: 12, bw: 13, spell: 14 },
    { min: 7,  max: 8,  ppd: 10, rsw: 12, pp: 11, bw: 12, spell: 13 },
    { min: 9,  max: 10, ppd:  8, rsw: 10, pp:  9, bw:  9, spell: 11 },
    { min: 11, max: 12, ppd:  7, rsw:  9, pp:  8, bw:  8, spell: 10 },
    { min: 13, max: 14, ppd:  5, rsw:  7, pp:  6, bw:  5, spell:  8 },
    { min: 15, max: 16, ppd:  4, rsw:  6, pp:  5, bw:  4, spell:  7 },
    { min: 17, max: 18, ppd:  3, rsw:  5, pp:  4, bw:  4, spell:  6 },
    { min: 19, max: 99, ppd:  2, rsw:  4, pp:  3, bw:  3, spell:  5 }
  ],
  /** Cleric, Druid */
  priest: [
    { min: 1,  max: 3,  ppd: 10, rsw: 14, pp: 13, bw: 16, spell: 15 },
    { min: 4,  max: 6,  ppd:  9, rsw: 13, pp: 12, bw: 15, spell: 14 },
    { min: 7,  max: 9,  ppd:  7, rsw: 11, pp: 10, bw: 13, spell: 12 },
    { min: 10, max: 12, ppd:  6, rsw: 10, pp:  9, bw: 12, spell: 11 },
    { min: 13, max: 15, ppd:  5, rsw:  9, pp:  8, bw: 11, spell: 10 },
    { min: 16, max: 18, ppd:  4, rsw:  8, pp:  7, bw: 10, spell:  9 },
    { min: 19, max: 99, ppd:  2, rsw:  6, pp:  5, bw:  8, spell:  7 }
  ],
  /** Thief, Bard */
  rogue: [
    { min: 1,  max: 4,  ppd: 13, rsw: 14, pp: 12, bw: 16, spell: 15 },
    { min: 5,  max: 8,  ppd: 12, rsw: 12, pp: 11, bw: 15, spell: 13 },
    { min: 9,  max: 12, ppd: 11, rsw: 10, pp: 10, bw: 14, spell: 11 },
    { min: 13, max: 16, ppd: 10, rsw:  8, pp:  9, bw: 13, spell:  9 },
    { min: 17, max: 20, ppd:  9, rsw:  6, pp:  8, bw: 12, spell:  7 },
    { min: 21, max: 99, ppd:  8, rsw:  4, pp:  7, bw: 11, spell:  5 }
  ],
  /** Mage, Specialist Wizards */
  wizard: [
    { min: 1,  max: 5,  ppd: 14, rsw: 11, pp: 13, bw: 15, spell: 12 },
    { min: 6,  max: 10, ppd: 13, rsw:  9, pp: 11, bw: 13, spell: 10 },
    { min: 11, max: 15, ppd: 11, rsw:  7, pp:  9, bw: 11, spell:  8 },
    { min: 16, max: 20, ppd: 10, rsw:  5, pp:  7, bw:  9, spell:  6 },
    { min: 21, max: 99, ppd:  8, rsw:  3, pp:  5, bw:  7, spell:  4 }
  ]
};

/**
 * Get saving throw target numbers for a given class group and level.
 * @param {string} group - One of "warrior", "priest", "rogue", "wizard"
 * @param {number} level - Character level
 * @returns {{ppd:number, rsw:number, pp:number, bw:number, spell:number}|null}
 */
function getSavesForGroup(group, level) {
  const table = ADND2E_SAVE_TABLES[group];
  if (!table) return null;
  const row = table.find(r => level >= r.min && level <= r.max);
  if (!row) return null;
  return { ppd: row.ppd, rsw: row.rsw, pp: row.pp, bw: row.bw, spell: row.spell };
}

/**
 * Get the best (lowest) saving throws across multiple class entries.
 * @param {Array<{group: string, level: number}>} classEntries
 * @returns {{ppd:number, rsw:number, pp:number, bw:number, spell:number}}
 */
function getBestSaves(classEntries) {
  const defaults = { ppd: 20, rsw: 20, pp: 20, bw: 20, spell: 20 };
  if (!classEntries || classEntries.length === 0) return defaults;
  return classEntries.reduce((best, entry) => {
    const saves = getSavesForGroup(entry.group, entry.level);
    if (!saves) return best;
    return {
      ppd:   Math.min(best.ppd,   saves.ppd),
      rsw:   Math.min(best.rsw,   saves.rsw),
      pp:    Math.min(best.pp,    saves.pp),
      bw:    Math.min(best.bw,    saves.bw),
      spell: Math.min(best.spell, saves.spell)
    };
  }, defaults);
}
