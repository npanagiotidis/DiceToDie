/**
 * AD&D 2e Initiative System
 *
 * Base die: d10 (lower = acts first)
 * Weapon speed factor and spell casting time are added to the roll.
 * Initiative is rolled manually (semi-automated: dice are rolled, totals computed).
 * Spell interruption is flagged automatically when a caster takes damage
 * before their initiative count resolves.
 */

class ADND2eInitiative {

  /**
   * Roll initiative for an actor.
   *
   * @param {Actor}  actor
   * @param {object} [options={}]
   * @param {number} [options.speedFactor=0]  - Weapon speed factor (0 for unarmed)
   * @param {number} [options.castingTime=0]  - Spell casting time modifier
   * @returns {Promise<{roll: Roll, base: number, total: number, speedFactor: number, castingTime: number}>}
   */
  static async roll(actor, options = {}) {
    const { speedFactor = 0, castingTime = 0 } = options;
    const roll  = await new Roll("1d10").evaluate();
    const base  = roll.total;
    const total = base + speedFactor + castingTime;

    /* Store on actor for interruption checks this round */
    await actor.setFlag("dice-to-die", "currentInitiative", {
      base, speedFactor, castingTime, total, isCasting: castingTime > 0
    });

    return { roll, base, total, speedFactor, castingTime };
  }

  /**
   * Check whether a caster is interrupted.
   * A caster is interrupted if they take damage at an initiative count
   * less than or equal to their own initiative total.
   *
   * @param {Actor}  actor
   * @param {number} damageInitiative - Initiative count at which damage is dealt
   * @returns {boolean} true if the spell is interrupted
   */
  static checkSpellInterruption(actor, damageInitiative) {
    const init = actor.getFlag("dice-to-die", "currentInitiative");
    if (!init || !init.isCasting) return false;
    const interrupted = damageInitiative <= init.total;
    if (interrupted) {
      actor.setFlag("dice-to-die", "spellInterrupted", true);
      ui.notifications.warn(`${actor.name}'s spell is interrupted!`);
    }
    return interrupted;
  }

  /**
   * Clear initiative state at end of round.
   * @param {Actor} actor
   */
  static async clearRound(actor) {
    await actor.setFlag("dice-to-die", "currentInitiative", null);
    await actor.setFlag("dice-to-die", "spellInterrupted", false);
  }

  /**
   * Post the initiative result to Foundry chat.
   * @param {Actor}  actor
   * @param {{roll, base, total, speedFactor, castingTime}} result
   */
  static async toChat(actor, result) {
    const { base, total, speedFactor, castingTime, roll } = result;
    const modifiers = [];
    if (speedFactor > 0) modifiers.push(`Speed Factor +${speedFactor}`);
    if (castingTime  > 0) modifiers.push(`Casting Time +${castingTime}`);

    const modText = modifiers.length ? `<br><small>${modifiers.join(", ")}</small>` : "";

    const html = `
      <div class="adnd2e-initiative-result">
        <strong>${actor.name}</strong> — Initiative: <strong>${total}</strong>
        <br><small>d10: ${base}${modifiers.length ? ` + modifiers = ${total}` : ""}</small>
        ${modText}
      </div>`;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: html,
      type:    CONST.CHAT_MESSAGE_TYPES?.OTHER ?? 0
    });
  }
}
