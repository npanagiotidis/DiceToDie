/**
 * AD&D 2e Racial Data
 * Source: Player's Handbook
 *
 * Each race defines:
 *   abilityModifiers       - Adjustments applied to raw ability scores
 *   savingThrowBonuses     - Flat bonuses per save category
 *   useConSavingThrowBonus - Whether to apply the CON-based bonus (demi-humans)
 *   infravision            - Infravision range in feet (0 = none)
 *   weaponFamiliarity      - Weapons treated as one group smaller for proficiency
 */

const ADND2E_RACES = {

  human: {
    name: "Human",
    abilityModifiers: {},
    savingThrowBonuses: {},
    useConSavingThrowBonus: false,
    infravision: 0,
    weaponFamiliarity: []
  },

  elf: {
    name: "Elf",
    abilityModifiers: { dex: 1, con: -1 },
    /** 90% resistance to sleep and charm spells (not an integer bonus – handled separately) */
    sleepCharmResistance: true,
    savingThrowBonuses: {},
    useConSavingThrowBonus: false,
    infravision: 60,
    weaponFamiliarity: ["longsword", "short_sword", "longbow", "shortbow"]
  },

  halfElf: {
    name: "Half-Elf",
    abilityModifiers: {},
    savingThrowBonuses: {},
    useConSavingThrowBonus: false,
    infravision: 60,
    weaponFamiliarity: []
  },

  dwarf: {
    name: "Dwarf",
    abilityModifiers: { con: 1, cha: -1 },
    savingThrowBonuses: {},
    useConSavingThrowBonus: true,
    infravision: 60,
    weaponFamiliarity: ["battle_axe", "hand_axe", "war_hammer", "short_sword"]
  },

  gnome: {
    name: "Gnome",
    abilityModifiers: { int: 1, wis: -1 },
    savingThrowBonuses: {},
    useConSavingThrowBonus: true,
    infravision: 60,
    weaponFamiliarity: ["battle_axe", "hand_axe", "short_sword", "hoopak"]
  },

  halfling: {
    name: "Halfling",
    abilityModifiers: { dex: 1, str: -1 },
    savingThrowBonuses: {},
    useConSavingThrowBonus: true,
    infravision: 0,
    weaponFamiliarity: ["short_sword", "club", "sling"]
  },

  halfOrc: {
    name: "Half-Orc",
    abilityModifiers: { str: 1, con: 1, cha: -2 },
    savingThrowBonuses: {},
    useConSavingThrowBonus: false,
    infravision: 60,
    weaponFamiliarity: []
  }
};

/**
 * Constitution-based saving throw bonus table for demi-humans.
 * Applied to all saving throws (PHB p. 11).
 * @param {number} con - Constitution score
 * @returns {number}
 */
function getConSavingThrowBonus(con) {
  if (con <= 6)  return 0;
  if (con <= 10) return 1;
  if (con <= 13) return 2;
  if (con <= 17) return 3;
  if (con <= 24) return 4;
  return 5;
}

/**
 * Apply racial ability modifiers to a raw ability score object.
 * @param {string} race - Race key from ADND2E_RACES
 * @param {{str,dex,con,int,wis,cha}} abilities - Base ability scores
 * @returns {{str,dex,con,int,wis,cha}} Modified ability scores
 */
function applyRacialAbilityModifiers(race, abilities) {
  const raceData = ADND2E_RACES[race];
  if (!raceData) return { ...abilities };
  const result = { ...abilities };
  for (const [ability, modifier] of Object.entries(raceData.abilityModifiers)) {
    if (result[ability] !== undefined) result[ability] += modifier;
  }
  return result;
}

/**
 * Get the total saving throw bonus for a race/CON combination.
 * @param {string} race - Race key
 * @param {number} con  - Constitution score
 * @returns {{ppd:number, rsw:number, pp:number, bw:number, spell:number}}
 */
function getRacialSavingThrowBonuses(race, con) {
  const raceData = ADND2E_RACES[race];
  const base = { ppd: 0, rsw: 0, pp: 0, bw: 0, spell: 0 };
  if (!raceData) return base;

  const explicit = raceData.savingThrowBonuses || {};
  for (const [key, val] of Object.entries(explicit)) {
    if (base[key] !== undefined) base[key] += val;
  }

  if (raceData.useConSavingThrowBonus) {
    const bonus = getConSavingThrowBonus(con);
    for (const key of Object.keys(base)) base[key] += bonus;
  }

  return base;
}
