/**
 * AD&D 2e Class Definitions
 * Source: Player's Handbook
 *
 * Each class defines:
 *   hitDie              - Hit die type (e.g. "d10")
 *   thac0Group          - THAC0 progression group
 *   saveGroup           - Saving throw progression group
 *   weaponProficiency   - { initial, perLevels } slot counts
 *   nonWeaponProficiency- { initial, perLevels } slot counts
 *   allowedArmor        - Array of permitted armor types (or ["all"])
 *   allowedWeapons      - Array of permitted weapon types (or ["all"])
 *   spellcasting        - Optional: { type, specialization }
 *   xpTable             - XP required to reach each level (index 0 = level 1)
 */

const ADND2E_CLASSES = {

  /* ── Warrior Group ────────────────────────────────────────────────── */

  fighter: {
    name: "Fighter",
    hitDie: "d10",
    thac0Group: "warrior",
    saveGroup: "warrior",
    weaponProficiency:    { initial: 4, perLevels: 3 },
    nonWeaponProficiency: { initial: 3, perLevels: 3 },
    allowedArmor:   ["all"],
    allowedWeapons: ["all"],
    xpTable: [
      0, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000,
      750000, 1000000, 1250000, 1500000, 1750000, 2000000,
      2250000, 2500000, 2750000, 3000000
    ]
  },

  paladin: {
    name: "Paladin",
    hitDie: "d10",
    thac0Group: "warrior",
    saveGroup: "warrior",
    weaponProficiency:    { initial: 3, perLevels: 3 },
    nonWeaponProficiency: { initial: 3, perLevels: 3 },
    allowedArmor:   ["all"],
    allowedWeapons: ["all"],
    xpTable: [
      0, 2750, 5500, 12000, 24000, 45000, 95000, 175000, 350000, 700000,
      1050000, 1400000, 1750000, 2100000, 2450000, 2800000,
      3150000, 3500000, 3850000, 4200000
    ]
  },

  ranger: {
    name: "Ranger",
    hitDie: "d10",
    thac0Group: "warrior",
    saveGroup: "warrior",
    weaponProficiency:    { initial: 3, perLevels: 3 },
    nonWeaponProficiency: { initial: 3, perLevels: 3 },
    allowedArmor:   ["all"],
    allowedWeapons: ["all"],
    xpTable: [
      0, 2250, 4500, 10000, 20000, 40000, 90000, 150000, 225000, 325000,
      650000, 975000, 1300000, 1625000, 1950000, 2275000,
      2600000, 2925000, 3250000, 3575000
    ]
  },

  /* ── Priest Group ─────────────────────────────────────────────────── */

  cleric: {
    name: "Cleric",
    hitDie: "d8",
    thac0Group: "priest",
    saveGroup: "priest",
    weaponProficiency:    { initial: 2, perLevels: 4 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["all"],
    allowedWeapons: ["blunt"],
    spellcasting: { type: "divine", specialization: null },
    xpTable: [
      0, 1500, 3000, 6000, 13000, 27500, 55000, 110000, 225000, 450000,
      675000, 900000, 1125000, 1350000, 1575000, 1800000,
      2025000, 2250000, 2475000, 2700000
    ]
  },

  druid: {
    name: "Druid",
    hitDie: "d8",
    thac0Group: "priest",
    saveGroup: "priest",
    weaponProficiency:    { initial: 2, perLevels: 5 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["leather", "hide", "wooden_shield"],
    allowedWeapons: ["club", "sickle", "dart", "spear", "dagger", "scimitar", "sling", "quarterstaff"],
    spellcasting: { type: "divine", specialization: null },
    xpTable: [
      0, 2000, 4000, 7500, 12500, 20000, 35000, 60000, 90000, 125000,
      200000, 300000, 750000, 1500000, 3000000, 3500000,
      4000000, 4500000, 5000000, 5500000
    ]
  },

  /* ── Wizard Group ─────────────────────────────────────────────────── */

  mage: {
    name: "Mage",
    hitDie: "d4",
    thac0Group: "wizard",
    saveGroup: "wizard",
    weaponProficiency:    { initial: 1, perLevels: 6 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["none"],
    allowedWeapons: ["dagger", "dart", "knife", "quarterstaff", "hand_crossbow"],
    spellcasting: { type: "arcane", specialization: null },
    xpTable: [
      0, 2500, 5000, 10000, 20000, 40000, 60000, 90000, 135000, 250000,
      375000, 750000, 1125000, 1500000, 1875000, 2250000,
      2625000, 3000000, 3375000, 3750000
    ]
  },

  abjurer: {
    name: "Abjurer",
    hitDie: "d4",
    thac0Group: "wizard",
    saveGroup: "wizard",
    weaponProficiency:    { initial: 1, perLevels: 6 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["none"],
    allowedWeapons: ["dagger", "dart", "knife", "quarterstaff", "hand_crossbow"],
    spellcasting: { type: "arcane", specialization: "abjurer" },
    xpTable: [
      0, 2500, 5000, 10000, 20000, 40000, 60000, 90000, 135000, 250000,
      375000, 750000, 1125000, 1500000, 1875000, 2250000,
      2625000, 3000000, 3375000, 3750000
    ]
  },

  conjurer: {
    name: "Conjurer",
    hitDie: "d4",
    thac0Group: "wizard",
    saveGroup: "wizard",
    weaponProficiency:    { initial: 1, perLevels: 6 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["none"],
    allowedWeapons: ["dagger", "dart", "knife", "quarterstaff", "hand_crossbow"],
    spellcasting: { type: "arcane", specialization: "conjurer" },
    xpTable: [
      0, 2500, 5000, 10000, 20000, 40000, 60000, 90000, 135000, 250000,
      375000, 750000, 1125000, 1500000, 1875000, 2250000,
      2625000, 3000000, 3375000, 3750000
    ]
  },

  diviner: {
    name: "Diviner",
    hitDie: "d4",
    thac0Group: "wizard",
    saveGroup: "wizard",
    weaponProficiency:    { initial: 1, perLevels: 6 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["none"],
    allowedWeapons: ["dagger", "dart", "knife", "quarterstaff", "hand_crossbow"],
    spellcasting: { type: "arcane", specialization: "diviner" },
    xpTable: [
      0, 2500, 5000, 10000, 20000, 40000, 60000, 90000, 135000, 250000,
      375000, 750000, 1125000, 1500000, 1875000, 2250000,
      2625000, 3000000, 3375000, 3750000
    ]
  },

  enchanter: {
    name: "Enchanter",
    hitDie: "d4",
    thac0Group: "wizard",
    saveGroup: "wizard",
    weaponProficiency:    { initial: 1, perLevels: 6 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["none"],
    allowedWeapons: ["dagger", "dart", "knife", "quarterstaff", "hand_crossbow"],
    spellcasting: { type: "arcane", specialization: "enchanter" },
    xpTable: [
      0, 2500, 5000, 10000, 20000, 40000, 60000, 90000, 135000, 250000,
      375000, 750000, 1125000, 1500000, 1875000, 2250000,
      2625000, 3000000, 3375000, 3750000
    ]
  },

  illusionist: {
    name: "Illusionist",
    hitDie: "d4",
    thac0Group: "wizard",
    saveGroup: "wizard",
    weaponProficiency:    { initial: 1, perLevels: 6 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["none"],
    allowedWeapons: ["dagger", "dart", "knife", "quarterstaff", "hand_crossbow"],
    spellcasting: { type: "arcane", specialization: "illusionist" },
    xpTable: [
      0, 2250, 4500, 9000, 18000, 36000, 54000, 81000, 121500, 225000,
      337500, 675000, 1012500, 1350000, 1687500, 2025000,
      2362500, 2700000, 3037500, 3375000
    ]
  },

  invoker: {
    name: "Invoker",
    hitDie: "d4",
    thac0Group: "wizard",
    saveGroup: "wizard",
    weaponProficiency:    { initial: 1, perLevels: 6 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["none"],
    allowedWeapons: ["dagger", "dart", "knife", "quarterstaff", "hand_crossbow"],
    spellcasting: { type: "arcane", specialization: "invoker" },
    xpTable: [
      0, 2500, 5000, 10000, 20000, 40000, 60000, 90000, 135000, 250000,
      375000, 750000, 1125000, 1500000, 1875000, 2250000,
      2625000, 3000000, 3375000, 3750000
    ]
  },

  necromancer: {
    name: "Necromancer",
    hitDie: "d4",
    thac0Group: "wizard",
    saveGroup: "wizard",
    weaponProficiency:    { initial: 1, perLevels: 6 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["none"],
    allowedWeapons: ["dagger", "dart", "knife", "quarterstaff", "hand_crossbow"],
    spellcasting: { type: "arcane", specialization: "necromancer" },
    xpTable: [
      0, 2250, 4500, 9000, 18000, 36000, 54000, 81000, 121500, 225000,
      337500, 675000, 1012500, 1350000, 1687500, 2025000,
      2362500, 2700000, 3037500, 3375000
    ]
  },

  transmuter: {
    name: "Transmuter",
    hitDie: "d4",
    thac0Group: "wizard",
    saveGroup: "wizard",
    weaponProficiency:    { initial: 1, perLevels: 6 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["none"],
    allowedWeapons: ["dagger", "dart", "knife", "quarterstaff", "hand_crossbow"],
    spellcasting: { type: "arcane", specialization: "transmuter" },
    xpTable: [
      0, 2500, 5000, 10000, 20000, 40000, 60000, 90000, 135000, 250000,
      375000, 750000, 1125000, 1500000, 1875000, 2250000,
      2625000, 3000000, 3375000, 3750000
    ]
  },

  /* ── Rogue Group ──────────────────────────────────────────────────── */

  thief: {
    name: "Thief",
    hitDie: "d6",
    thac0Group: "rogue",
    saveGroup: "rogue",
    weaponProficiency:    { initial: 2, perLevels: 4 },
    nonWeaponProficiency: { initial: 3, perLevels: 4 },
    allowedArmor:   ["leather", "studded_leather"],
    allowedWeapons: ["all"],
    xpTable: [
      0, 1250, 2500, 5000, 10000, 20000, 40000, 70000, 110000, 160000,
      220000, 440000, 660000, 880000, 1100000, 1320000,
      1540000, 1760000, 1980000, 2200000
    ]
  },

  bard: {
    name: "Bard",
    hitDie: "d6",
    thac0Group: "rogue",
    saveGroup: "rogue",
    weaponProficiency:    { initial: 2, perLevels: 5 },
    nonWeaponProficiency: { initial: 4, perLevels: 3 },
    allowedArmor:   ["up_to_chain_no_shield"],
    allowedWeapons: ["all"],
    spellcasting: { type: "arcane", specialization: null },
    xpTable: [
      0, 1250, 2500, 5000, 10000, 20000, 40000, 70000, 110000, 160000,
      220000, 440000, 660000, 880000, 1100000, 1320000,
      1540000, 1760000, 1980000, 2200000
    ]
  }
};

/**
 * Calculate the number of weapon proficiency slots available at a given level.
 * @param {string} className
 * @param {number} level
 * @returns {number}
 */
function getWeaponProficiencySlots(className, level) {
  const cls = ADND2E_CLASSES[className];
  if (!cls) return 0;
  const { initial, perLevels } = cls.weaponProficiency;
  return initial + Math.floor((level - 1) / perLevels);
}

/**
 * Calculate the number of non-weapon proficiency slots available at a given level.
 * @param {string} className
 * @param {number} level
 * @returns {number}
 */
function getNonWeaponProficiencySlots(className, level) {
  const cls = ADND2E_CLASSES[className];
  if (!cls) return 0;
  const { initial, perLevels } = cls.nonWeaponProficiency;
  return initial + Math.floor((level - 1) / perLevels);
}

/**
 * Look up the level for a given XP total and class.
 * @param {string} className
 * @param {number} xp
 * @returns {number} Level (1-based)
 */
function getLevelForXP(className, xp) {
  const cls = ADND2E_CLASSES[className];
  if (!cls) return 1;
  let level = 1;
  for (let i = 0; i < cls.xpTable.length; i++) {
    if (xp >= cls.xpTable[i]) level = i + 1;
    else break;
  }
  return level;
}
