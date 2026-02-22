/**
 * AD&D 2e Magic / Spell System
 *
 * Covers:
 *   - Spell data model (level, school, sphere, casting time, etc.)
 *   - Wizard specialization (prohibited schools, bonus slots, save penalties)
 *   - Priest spheres (major / minor access)
 *   - Memorization slot tracking and preparation resets
 *   - Spontaneous casting: NOT allowed (memorize-and-forget)
 */

/* ── Wizard Schools ────────────────────────────────────────────────── */

const WIZARD_SCHOOLS = [
  "abjuration", "conjuration", "divination", "enchantment",
  "illusion", "invocation", "necromancy", "alteration"
];

/**
 * Specialist wizard definitions.
 * prohibitedSchools: cannot learn or cast these schools.
 * bonusSpells: gain one extra spell slot per spell level.
 * savePenalty: opponents suffer -1 on saves vs this specialist's school.
 */
const WIZARD_SPECIALIZATIONS = {
  abjurer:    { school: "abjuration",   prohibitedSchools: ["alteration", "illusion"] },
  conjurer:   { school: "conjuration",  prohibitedSchools: ["divination", "invocation"] },
  diviner:    { school: "divination",   prohibitedSchools: ["conjuration"] },
  enchanter:  { school: "enchantment",  prohibitedSchools: ["invocation", "necromancy"] },
  illusionist:{ school: "illusion",     prohibitedSchools: ["abjuration", "invocation"] },
  invoker:    { school: "invocation",   prohibitedSchools: ["conjuration", "enchantment"] },
  necromancer:{ school: "necromancy",   prohibitedSchools: ["enchantment", "illusion"] },
  transmuter: { school: "alteration",   prohibitedSchools: ["abjuration", "necromancy"] }
};

/* ── Priest Spheres ─────────────────────────────────────────────────── */

const PRIEST_SPHERES = {
  all:        { name: "All" },
  animal:     { name: "Animal" },
  astral:     { name: "Astral" },
  charm:      { name: "Charm" },
  combat:     { name: "Combat" },
  creation:   { name: "Creation" },
  divination: { name: "Divination" },
  elemental:  { name: "Elemental" },
  guardian:   { name: "Guardian" },
  healing:    { name: "Healing" },
  law:        { name: "Law" },
  necromantic:{ name: "Necromantic" },
  plant:      { name: "Plant" },
  protection: { name: "Protection" },
  summoning:  { name: "Summoning" },
  sun:        { name: "Sun" },
  thought:    { name: "Thought" },
  time:       { name: "Time" },
  travelers:  { name: "Travelers" },
  war:        { name: "War" },
  wards:      { name: "Wards" },
  weather:    { name: "Weather" }
};

/* ── Core Spell Class ───────────────────────────────────────────────── */

class ADND2eSpells {

  /**
   * Build a canonical spell object from raw data.
   *
   * @param {object} data
   * @param {number} data.level        - 1–9
   * @param {string} data.school       - Wizard school (arcane spells)
   * @param {string} [data.sphere]     - Priest sphere (divine spells)
   * @param {number} data.castingTime  - In segments (10 per round)
   * @param {string} data.components   - "V", "VS", "VSM", etc.
   * @param {string} data.duration     - Duration text ("1 round/level", etc.)
   * @param {string} data.range        - Range text
   * @param {string} [data.savingThrow]- "None", "Negates", "Half", etc.
   * @param {string} data.name
   * @param {string} [data.type="arcane"] - "arcane" or "divine"
   * @returns {object} Normalised spell object
   */
  static createSpell(data) {
    return {
      name:        data.name         ?? "Unknown Spell",
      type:        data.type         ?? "arcane",
      level:       data.level        ?? 1,
      school:      data.school       ?? "alteration",
      sphere:      data.sphere       ?? null,
      castingTime: data.castingTime  ?? 1,
      components:  data.components   ?? "VS",
      duration:    data.duration     ?? "Instantaneous",
      range:       data.range        ?? "0",
      savingThrow: data.savingThrow  ?? "None",
      memorized:   false,
      expended:    false
    };
  }

  /* ── Memorization ─────────────────────────────────────────────────── */

  /**
   * Get the memorized spell list for an actor.
   * @param {Actor} actor
   * @returns {object[]} Array of memorized spell objects
   */
  static getMemorizedSpells(actor) {
    return actor.getFlag("dice-to-die", "memorizedSpells") ?? [];
  }

  /**
   * Memorize a spell (add to actor's memorized list, consuming a slot).
   * @param {Actor}  actor
   * @param {object} spell - Spell object (from createSpell or an Item)
   * @returns {Promise<boolean>} false if no slot available
   */
  static async memorizeSpell(actor, spell) {
    const available = ADND2eSpells.getAvailableSlots(actor, spell.level, spell.type);
    if (available <= 0) {
      ui.notifications.warn(`No available ${spell.type} spell slots at level ${spell.level}.`);
      return false;
    }

    const memorized = ADND2eSpells.getMemorizedSpells(actor);
    memorized.push({ ...spell, memorized: true, expended: false, uid: foundry.utils.randomID() });
    await actor.setFlag("dice-to-die", "memorizedSpells", memorized);
    return true;
  }

  /**
   * Expend a memorized spell (mark as cast, slot consumed until re-preparation).
   * @param {Actor}  actor
   * @param {string} uid - Unique ID of the memorized spell entry
   */
  static async expendSpell(actor, uid) {
    const memorized = ADND2eSpells.getMemorizedSpells(actor);
    const idx = memorized.findIndex(s => s.uid === uid);
    if (idx === -1) return;
    memorized[idx].expended = true;
    await actor.setFlag("dice-to-die", "memorizedSpells", memorized);
  }

  /**
   * Reset memorization (long rest / preparation period).
   * Removes all expended spells; retained non-expended spells stay memorized.
   * @param {Actor} actor
   */
  static async resetMemorization(actor) {
    const memorized = ADND2eSpells.getMemorizedSpells(actor);
    const remaining = memorized.filter(s => !s.expended);
    await actor.setFlag("dice-to-die", "memorizedSpells", remaining);
  }

  /**
   * Count how many additional spells of the given level can still be memorized.
   * @param {Actor}  actor
   * @param {number} level    - Spell level 1–9
   * @param {string} type     - "arcane" or "divine"
   * @returns {number}
   */
  static getAvailableSlots(actor, level, type) {
    const maxSlots      = ADND2eSpells._getMaxSlots(actor, level, type);
    const memorized     = ADND2eSpells.getMemorizedSpells(actor);
    const memorizedSlots = memorized.filter(s => s.level === level && s.type === type && !s.expended).length;
    return Math.max(0, maxSlots - memorizedSlots);
  }

  /* ── Validation helpers ───────────────────────────────────────────── */

  /**
   * Check if a wizard can learn/memorize a spell based on specialization.
   * @param {string} specialization - Specialist type key (or null for mage)
   * @param {string} school         - Spell school
   * @returns {boolean}
   */
  static canWizardLearnSpell(specialization, school) {
    if (!specialization) return true;
    const spec = WIZARD_SPECIALIZATIONS[specialization];
    if (!spec) return true;
    return !spec.prohibitedSchools.includes(school);
  }

  /**
   * Check if a priest has access to a sphere (major = full access, minor = up to level 3).
   * @param {{major: string[], minor: string[]}} sphereAccess
   * @param {string} sphere
   * @param {number} spellLevel
   * @returns {boolean}
   */
  static canPriestAccessSphere(sphereAccess, sphere, spellLevel) {
    if (!sphereAccess) return false;
    if ((sphereAccess.major ?? []).includes(sphere) || (sphereAccess.major ?? []).includes("all")) return true;
    if ((sphereAccess.minor ?? []).includes(sphere) || (sphereAccess.minor ?? []).includes("all")) return spellLevel <= 3;
    return false;
  }

  /* ── Private ──────────────────────────────────────────────────────── */

  /**
   * Retrieve maximum memorizable slots for a level/type from actor flags.
   * These are set by the ARS system sheet or by the DM.
   * @param {Actor}  actor
   * @param {number} level
   * @param {string} type
   * @returns {number}
   */
  static _getMaxSlots(actor, level, type) {
    const slotData = actor.getFlag("dice-to-die", "spellSlots") ?? {};
    return slotData?.[type]?.[level] ?? 0;
  }
}
