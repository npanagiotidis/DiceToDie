/**
 * AD&D 2e Proficiency System
 *
 * Weapon Proficiencies:
 *   - Slot tracking per class/level
 *   - Fighter specialization: 1 extra slot grants +1 attack / +2 damage
 *
 * Non-Weapon Proficiencies:
 *   - Ability-based check: roll d20 ≤ (ability score + modifier)
 *   - Slot tracking per class/level
 */

class ADND2eProficiencies {

  /* ──────────────────────── Weapon Proficiencies ─────────────────── */

  /**
   * Get total weapon proficiency slots available.
   * For multi-class use the sum of each class's slots at its level.
   * @param {Actor} actor
   * @returns {number}
   */
  static getWeaponProficiencySlots(actor) {
    return ADND2eProficiencies._sumSlots(actor, "weaponProficiency");
  }

  /**
   * Check whether the actor is proficient with a given weapon.
   * @param {Actor}  actor
   * @param {string} weaponKey - Lowercase weapon identifier
   * @returns {boolean}
   */
  static isWeaponProficient(actor, weaponKey) {
    const profs = actor.getFlag("dice-to-die", "weaponProficiencies") ?? [];
    return profs.some(p => p.weapon === weaponKey);
  }

  /**
   * Check whether the actor has specialization in a weapon (Fighter only).
   * Specialization grants +1 attack roll and +2 damage.
   * @param {Actor}  actor
   * @param {string} weaponKey
   * @returns {boolean}
   */
  static isWeaponSpecialist(actor, weaponKey) {
    const profs = actor.getFlag("dice-to-die", "weaponProficiencies") ?? [];
    return profs.some(p => p.weapon === weaponKey && p.specialized === true);
  }

  /**
   * Get the attack and damage modifiers for a weapon, considering proficiency
   * and fighter specialization.
   * @param {Actor}  actor
   * @param {string} weaponKey
   * @returns {{attackBonus: number, damageBonus: number, nonproficiencyPenalty: number}}
   */
  static getWeaponModifiers(actor, weaponKey) {
    const proficient   = ADND2eProficiencies.isWeaponProficient(actor, weaponKey);
    const specialized  = ADND2eProficiencies.isWeaponSpecialist(actor, weaponKey);

    /* Non-proficiency penalty varies by class (simplified: -3 for warriors, -5 for rogues/priests, -5 for wizards) */
    const className  = (actor.getFlag("dice-to-die", "className") ?? "fighter").toLowerCase();
    const classGroup = ADND2E_CLASSES[className]?.thac0Group ?? "warrior";
    const penalty    = proficient ? 0
                     : classGroup === "warrior" ? -3
                     : classGroup === "rogue"   ? -3
                     : classGroup === "priest"  ? -3
                     : -5;  /* wizard */

    return {
      attackBonus:            specialized ? 1  : 0,
      damageBonus:            specialized ? 2  : 0,
      nonproficiencyPenalty:  penalty
    };
  }

  /* ──────────────────────── Non-Weapon Proficiencies ─────────────── */

  /**
   * Get total non-weapon proficiency slots available.
   * @param {Actor} actor
   * @returns {number}
   */
  static getNonWeaponProficiencySlots(actor) {
    return ADND2eProficiencies._sumSlots(actor, "nonWeaponProficiency");
  }

  /**
   * Perform a non-weapon proficiency ability check.
   *
   * Rule: roll d20 ≤ (relevant ability score ± ability modifier)
   *
   * @param {Actor}  actor
   * @param {string} abilityKey  - "str", "dex", "con", "int", "wis", "cha"
   * @param {number} [modifier=0] - Situational modifier (positive = easier)
   * @returns {Promise<{roll: Roll, target: number, success: boolean}>}
   */
  static async rollNonWeaponCheck(actor, abilityKey, modifier = 0) {
    const score  = actor.system?.abilities?.[abilityKey]?.value
      ?? actor.getFlag("dice-to-die", abilityKey)
      ?? 10;
    const target = Number(score) + modifier;
    const roll   = await new Roll("1d20").evaluate();
    const success = roll.total <= target;
    return { roll, target, success };
  }

  /* ──────────────────────── Private helpers ───────────────────────── */

  /**
   * Sum proficiency slots across all classes an actor belongs to.
   * @param {Actor}  actor
   * @param {"weaponProficiency"|"nonWeaponProficiency"} slotType
   * @returns {number}
   */
  static _sumSlots(actor, slotType) {
    const multiClassData = actor.getFlag("dice-to-die", "multiClassData");
    if (multiClassData && Array.isArray(multiClassData) && multiClassData.length > 0) {
      return multiClassData.reduce((sum, entry) => {
        const fn = slotType === "weaponProficiency"
          ? getWeaponProficiencySlots
          : getNonWeaponProficiencySlots;
        return sum + fn(entry.className, entry.level);
      }, 0);
    }

    const className = (actor.getFlag("dice-to-die", "className")
      ?? actor.system?.details?.class
      ?? "fighter").toLowerCase();
    const level = Number(
      actor.getFlag("dice-to-die", "level")
        ?? actor.system?.details?.level
        ?? actor.system?.attributes?.level?.value
        ?? 1
    );

    const fn = slotType === "weaponProficiency"
      ? getWeaponProficiencySlots
      : getNonWeaponProficiencySlots;
    return fn(className, level);
  }
}
