/**
 * AD&D 2e THAC0 System
 *
 * Handles THAC0 calculation for single and multi-class characters,
 * manual adjustment support, and attack resolution using the
 * descending Armor Class model (AC 10 to -10).
 */

class ADND2eThac0 {

  /**
   * Calculate effective THAC0 for an actor.
   *
   * For multi-class characters the best (lowest) THAC0 among all classes is used.
   * A manual adjustment stored in actor flags is applied on top.
   *
   * @param {Actor} actor - Foundry VTT Actor document
   * @returns {number} Effective THAC0
   */
  static calculateForActor(actor) {
    const classEntries = ADND2eThac0._getClassEntries(actor);
    let baseThac0 = getBestThac0(classEntries);
    const adjustment = actor.getFlag("dice-to-die", "thac0Adjustment") ?? 0;
    return baseThac0 + adjustment;
  }

  /**
   * Resolve an attack roll against a target.
   *
   * Rule: attacker hits if  d20 roll ≥ THAC0 − target AC
   *
   * @param {number} d20Roll     - The d20 result (1–20)
   * @param {number} thac0       - Attacker's effective THAC0
   * @param {number} targetAC    - Target's Armor Class (-10 to 10)
   * @param {number} [attackBonus=0] - Situational/magical to-hit bonus
   * @returns {{hit: boolean, rollNeeded: number, natural20: boolean, naturalMiss: boolean}}
   */
  static resolveAttack(d20Roll, thac0, targetAC, attackBonus = 0) {
    const rollNeeded = thac0 - targetAC;
    const effectiveRoll = d20Roll + attackBonus;
    return {
      hit:         d20Roll !== 1 && (d20Roll === 20 || effectiveRoll >= rollNeeded),
      rollNeeded,
      natural20:   d20Roll === 20,
      naturalMiss: d20Roll === 1
    };
  }

  /**
   * Roll a d20 attack and resolve it automatically.
   *
   * @param {number} thac0       - Attacker THAC0
   * @param {number} targetAC    - Target Armor Class
   * @param {number} [attackBonus=0]
   * @returns {{roll: Roll, result: object}}
   */
  static async rollAttack(thac0, targetAC, attackBonus = 0) {
    const roll = await new Roll("1d20").evaluate();
    const result = ADND2eThac0.resolveAttack(roll.total, thac0, targetAC, attackBonus);
    return { roll, result };
  }

  /**
   * Update actor THAC0 flags when class or level changes.
   * Called automatically by the updateActor hook.
   *
   * @param {Actor} actor
   */
  static async updateActorThac0(actor) {
    const thac0 = ADND2eThac0.calculateForActor(actor);
    await actor.setFlag("dice-to-die", "thac0", thac0);
  }

  /**
   * Set a manual THAC0 adjustment for an actor.
   * @param {Actor} actor
   * @param {number} adjustment - Positive = worse, negative = better
   */
  static async setThac0Adjustment(actor, adjustment) {
    await actor.setFlag("dice-to-die", "thac0Adjustment", adjustment);
    await ADND2eThac0.updateActorThac0(actor);
  }

  /**
   * Build class entry list from actor flags/data.
   * Supports both single-class and multi-class actors.
   *
   * @param {Actor} actor
   * @returns {Array<{group: string, level: number}>}
   */
  static _getClassEntries(actor) {
    const multiClassData = actor.getFlag("dice-to-die", "multiClassData");
    if (multiClassData && Array.isArray(multiClassData) && multiClassData.length > 0) {
      return multiClassData
        .filter(e => e.className && e.level > 0)
        .map(e => ({
          group: ADND2E_CLASSES[e.className]?.thac0Group ?? "warrior",
          level: e.level
        }));
    }

    /* Fall back to single-class stored in ARS actor data */
    const className = actor.getFlag("dice-to-die", "className")
      ?? actor.system?.details?.class
      ?? actor.system?.class?.value
      ?? "";
    const level = actor.getFlag("dice-to-die", "level")
      ?? actor.system?.details?.level
      ?? actor.system?.attributes?.level?.value
      ?? 1;

    const group = ADND2E_CLASSES[className.toLowerCase()]?.thac0Group ?? "warrior";
    return [{ group, level: Number(level) }];
  }
}
