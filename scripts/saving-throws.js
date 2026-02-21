/**
 * AD&D 2e Saving Throw System
 *
 * Five save categories:
 *   ppd   – Paralyzation, Poison, or Death Magic
 *   rsw   – Rod, Staff, or Wand
 *   pp    – Petrification or Polymorph
 *   bw    – Breath Weapon
 *   spell – Spell
 *
 * Values are derived from class tables (best of all classes for multi-class),
 * then modified by racial bonuses and magic items.
 */

/** Human-readable labels for each saving throw category. */
const SAVE_LABELS = {
  ppd:   "Paralyzation / Poison / Death",
  rsw:   "Rod / Staff / Wand",
  pp:    "Petrification / Polymorph",
  bw:    "Breath Weapon",
  spell: "Spell"
};

class ADND2eSavingThrows {

  /**
   * Compute all five saving throw target numbers for an actor.
   * Combines class progression (best of multi-class) with racial bonuses.
   *
   * @param {Actor} actor - Foundry VTT Actor document
   * @returns {{ppd:number, rsw:number, pp:number, bw:number, spell:number}}
   */
  static calculateForActor(actor) {
    const classEntries = ADND2eSavingThrows._getClassEntries(actor);
    const baseSaves    = getBestSaves(classEntries);

    const race = actor.getFlag("dice-to-die", "race")
      ?? actor.system?.details?.race
      ?? "human";
    const con  = actor.system?.abilities?.con?.value
      ?? actor.getFlag("dice-to-die", "con")
      ?? 10;

    const racialBonuses = getRacialSavingThrowBonuses(race.toLowerCase(), Number(con));

    /* Magic-item bonuses stored in flags */
    const itemBonuses = actor.getFlag("dice-to-die", "savingThrowItemBonuses") ?? {};

    const result = {};
    for (const key of Object.keys(baseSaves)) {
      result[key] = baseSaves[key]
        - (racialBonuses[key] ?? 0)
        - (itemBonuses[key]   ?? 0);
    }
    return result;
  }

  /**
   * Roll a saving throw for an actor.
   *
   * @param {Actor} actor
   * @param {"ppd"|"rsw"|"pp"|"bw"|"spell"} category
   * @param {number} [bonus=0] - Situational bonus (positive = easier)
   * @returns {{roll: Roll, success: boolean, target: number, label: string}}
   */
  static async rollSave(actor, category, bonus = 0) {
    const saves  = ADND2eSavingThrows.calculateForActor(actor);
    const target = saves[category] ?? 20;
    const roll   = await new Roll("1d20").evaluate();
    const success = (roll.total + bonus) >= target;
    return {
      roll,
      success,
      target,
      label: SAVE_LABELS[category] ?? category
    };
  }

  /**
   * Update actor saving throw flags when class/level/race changes.
   * @param {Actor} actor
   */
  static async updateActorSaves(actor) {
    const saves = ADND2eSavingThrows.calculateForActor(actor);
    await actor.setFlag("dice-to-die", "savingThrows", saves);
  }

  /**
   * Build class entry list from actor, mirroring ADND2eThac0._getClassEntries
   * but using saveGroup instead of thac0Group.
   * @param {Actor} actor
   * @returns {Array<{group: string, level: number}>}
   */
  static _getClassEntries(actor) {
    const multiClassData = actor.getFlag("dice-to-die", "multiClassData");
    if (multiClassData && Array.isArray(multiClassData) && multiClassData.length > 0) {
      return multiClassData
        .filter(e => e.className && e.level > 0)
        .map(e => ({
          group: ADND2E_CLASSES[e.className]?.saveGroup ?? "warrior",
          level: e.level
        }));
    }

    const className = actor.getFlag("dice-to-die", "className")
      ?? actor.system?.details?.class
      ?? actor.system?.class?.value
      ?? "";
    const level = actor.getFlag("dice-to-die", "level")
      ?? actor.system?.details?.level
      ?? actor.system?.attributes?.level?.value
      ?? 1;

    const group = ADND2E_CLASSES[className.toLowerCase()]?.saveGroup ?? "warrior";
    return [{ group, level: Number(level) }];
  }
}
