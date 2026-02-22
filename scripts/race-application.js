/**
 * AD&D 2e Race Application Engine
 *
 * Reads racial attributes from compendium race Items and applies them to
 * Foundry VTT actor ability scores. Supports clean undo when switching or
 * removing a race.
 *
 * Flow when a race Item is dropped onto an actor sheet:
 *   1. createItem hook fires → ADND2eRaceApplication.applyRaceToActor()
 *   2. Previously applied racial modifiers are reversed (delta undo)
 *   3. New modifiers from item.system.abilityModifiers are applied
 *   4. Full race data (modifiers, infravision, racialTraits) is stored in
 *      actor flags for later undo, saving throw calculation, and display
 *   5. Saving throws are recalculated via ADND2eSavingThrows
 *
 * Flow when a race Item is deleted from an actor:
 *   deleteItem hook fires → ADND2eRaceApplication.removeRaceFromActor()
 *   Previously applied modifiers are reversed.
 */

class ADND2eRaceApplication {

  /* ── Public API ────────────────────────────────────────────────────── */

  /**
   * Apply a race Item's ability modifiers and traits to an actor.
   * Automatically reverses any previously applied race modifiers first.
   *
   * @param {Actor} actor
   * @param {Item|object} raceItem - Foundry Item document or plain system data
   */
  static async applyRaceToActor(actor, raceItem) {
    const itemSystem   = raceItem.system ?? raceItem;
    const newModifiers = itemSystem.abilityModifiers ?? {};
    const raceName     = raceItem.name ?? itemSystem.name ?? "Unknown";

    /* 1. Undo any previously applied race modifiers */
    await ADND2eRaceApplication._undoPreviousRace(actor);

    /* 2. Build the ability score update */
    const updateData = {};
    const ABILITIES  = ["str", "dex", "con", "int", "wis", "cha"];
    for (const ab of ABILITIES) {
      const mod = Number(newModifiers[ab] ?? 0);
      if (mod !== 0) {
        const current = actor.system?.abilities?.[ab]?.value ?? 10;
        updateData[`system.abilities.${ab}.value`] = current + mod;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await actor.update(updateData);
    }

    /* 3. Store race data on actor flags for undo + save calculation */
    await actor.setFlag("dice-to-die", "appliedRaceData", {
      name:             raceName,
      abilityModifiers: newModifiers,
      infravision:      itemSystem.infravision    ?? 0,
      racialTraits:     itemSystem.racialTraits   ?? {}
    });

    /* 4. Keep the legacy "race" flag in sync (used by saving-throws.js fallback) */
    await actor.setFlag("dice-to-die", "race", raceName.toLowerCase().replace(/[\s()'-]+/g, ""));

    /* 5. Recalculate saving throws using the new race data */
    await ADND2eSavingThrows.updateActorSaves(actor);

    ui.notifications.info(`DiceToDie: Applied ${raceName} racial traits to ${actor.name}.`);
  }

  /**
   * Remove all racial modifiers from an actor (called when a race Item is deleted).
   * @param {Actor} actor
   */
  static async removeRaceFromActor(actor) {
    await ADND2eRaceApplication._undoPreviousRace(actor);
    await actor.unsetFlag("dice-to-die", "appliedRaceData");
    await actor.unsetFlag("dice-to-die", "race");
    await ADND2eSavingThrows.updateActorSaves(actor);
    ui.notifications.info(`DiceToDie: Racial traits removed from ${actor.name}.`);
  }

  /**
   * Compute saving throw bonuses from stored race trait data (compendium-sourced).
   *
   * Handles:
   *   - Constitution-based bonus: "+1 per 3.5 CON" entries in racialTraits.savingThrowBonuses
   *   - Explicit numeric bonuses mapped to the 5 save categories
   *
   * @param {object} raceData - Stored appliedRaceData flag value
   * @param {number} con      - Constitution score
   * @returns {{ppd:number, rsw:number, pp:number, bw:number, spell:number}}
   */
  static computeSaveBonuses(raceData, con) {
    const base = { ppd: 0, rsw: 0, pp: 0, bw: 0, spell: 0 };
    if (!raceData) return base;

    const traits     = raceData.racialTraits ?? {};
    const stBonuses  = traits.savingThrowBonuses ?? [];

    /* CON-based bonus (dwarves, gnomes, halflings) */
    const hasConBonus = stBonuses.some(
      b => typeof b.bonus === "string" && b.bonus.toUpperCase().includes("CON")
    );
    if (hasConBonus) {
      const conBonus = getConSavingThrowBonus(Number(con));
      for (const key of Object.keys(base)) base[key] += conBonus;
    }

    /* Explicit numeric bonuses – map "vs" text → save category */
    for (const entry of stBonuses) {
      if (typeof entry.bonus === "number") {
        const key = ADND2eRaceApplication._saveCategoryFromVs(entry.vs);
        if (key) base[key] += entry.bonus;
      }
    }

    return base;
  }

  /**
   * Return the stored appliedRaceData for an actor, or null.
   * @param {Actor} actor
   * @returns {object|null}
   */
  static getAppliedRaceData(actor) {
    return actor.getFlag("dice-to-die", "appliedRaceData") ?? null;
  }

  /* ── Private helpers ───────────────────────────────────────────────── */

  /**
   * Reverse the ability modifiers stored in appliedRaceData.
   * @param {Actor} actor
   */
  static async _undoPreviousRace(actor) {
    const prev = actor.getFlag("dice-to-die", "appliedRaceData");
    if (!prev || !prev.abilityModifiers) return;

    const updateData = {};
    for (const [ab, mod] of Object.entries(prev.abilityModifiers)) {
      const m = Number(mod ?? 0);
      if (m !== 0) {
        const current = actor.system?.abilities?.[ab]?.value ?? 10;
        updateData[`system.abilities.${ab}.value`] = current - m;
      }
    }
    if (Object.keys(updateData).length > 0) {
      await actor.update(updateData);
    }
  }

  /**
   * Map a "vs" string from racialTraits.savingThrowBonuses to a save category key.
   * @param {string} vs
   * @returns {string|null}
   */
  static _saveCategoryFromVs(vs) {
    if (!vs) return null;
    const v = vs.toLowerCase();
    if (v.includes("poison") || v.includes("death") || v.includes("paralyz")) return "ppd";
    if (v.includes("rod")    || v.includes("staff")  || v.includes("wand"))   return "rsw";
    if (v.includes("petrif") || v.includes("polymorph"))                       return "pp";
    if (v.includes("breath"))                                                   return "bw";
    if (v.includes("spell")  || v.includes("magic")  || v.includes("charm"))  return "spell";
    return null;
  }
}
