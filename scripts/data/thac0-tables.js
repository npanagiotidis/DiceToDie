/**
 * AD&D 2e THAC0 Progression Tables
 * Source: Player's Handbook, Table 53
 *
 * Index = level - 1 (0-indexed, so index 0 = level 1)
 * Values represent the THAC0 score at each level.
 */

const ADND2E_THAC0_TABLES = {
  /** Fighter, Paladin, Ranger */
  warrior: [20, 20, 18, 18, 16, 16, 14, 14, 12, 12, 10, 10, 8, 8, 6, 6, 4, 4, 2, 2],
  /** Cleric, Druid, Shaman */
  priest:  [20, 20, 20, 18, 18, 18, 16, 16, 16, 14, 14, 14, 12, 12, 12, 10, 10, 10, 8, 8],
  /** Thief, Bard */
  rogue:   [20, 20, 19, 19, 17, 17, 15, 15, 13, 13, 11, 11, 9,  9,  7,  7,  5,  5,  3,  3],
  /** Mage, Specialist Wizards */
  wizard:  [20, 20, 20, 20, 20, 16, 16, 16, 16, 16, 12, 12, 12, 12, 12, 8,  8,  8,  8,  8]
};

/**
 * Get THAC0 for a given class group and level.
 * @param {string} group - One of "warrior", "priest", "rogue", "wizard"
 * @param {number} level - Character level (1–20+)
 * @returns {number} THAC0 value
 */
function getThac0ForGroup(group, level) {
  const table = ADND2E_THAC0_TABLES[group];
  if (!table) return 20;
  const idx = Math.max(0, Math.min(level - 1, table.length - 1));
  return table[idx];
}

/**
 * Get best THAC0 across multiple class entries (for multi-class characters).
 * @param {Array<{group: string, level: number}>} classEntries
 * @returns {number} Best (lowest) THAC0 value
 */
function getBestThac0(classEntries) {
  if (!classEntries || classEntries.length === 0) return 20;
  return Math.min(...classEntries.map(e => getThac0ForGroup(e.group, e.level)));
}
