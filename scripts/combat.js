/**
 * AD&D 2e Combat Engine
 *
 * Handles:
 *   - Attack resolution using THAC0 vs descending AC (-10 to 10)
 *   - Automatic damage roll (dice only, no flat bonus added automatically)
 *   - Weapon speed factor integration
 *   - Multi-attack support
 *
 * Automation level: attack d20 and damage dice are auto-rolled;
 * initiative, reaction checks, and spell interruption are manual.
 */

class ADND2eCombat {

  /**
   * Execute a full attack: roll d20, resolve hit, and if hit roll damage.
   *
   * @param {Actor}  attacker
   * @param {number} targetAC          - Target's Armor Class
   * @param {object} [weaponData={}]
   * @param {string} [weaponData.damage="1d6"]     - Weapon damage dice formula
   * @param {number} [weaponData.attackBonus=0]    - Magical/situational to-hit bonus
   * @param {number} [weaponData.damageBonus=0]    - Magical/STR damage bonus
   * @param {string} [weaponData.name="Weapon"]    - Display name
   * @returns {Promise<{attackRoll, hit, damageRoll, total, message}>}
   */
  static async attack(attacker, targetAC, weaponData = {}) {
    const {
      damage      = "1d6",
      attackBonus = 0,
      damageBonus = 0,
      name        = "Weapon"
    } = weaponData;

    const thac0 = ADND2eThac0.calculateForActor(attacker);
    const { roll: attackRoll, result } = await ADND2eThac0.rollAttack(thac0, targetAC, attackBonus);

    let damageRoll = null;
    let total      = 0;

    if (result.hit) {
      damageRoll = await new Roll(damage).evaluate();
      total      = Math.max(1, damageRoll.total + damageBonus);
    }

    const message = ADND2eCombat._buildChatMessage(
      attacker.name, name, attackRoll.total, result, thac0, targetAC, damageRoll, total
    );

    return { attackRoll, result, damageRoll, total, message };
  }

  /**
   * Roll weapon damage without a preceding attack roll (e.g. guaranteed-hit effects).
   *
   * @param {string} damageFormula  - Dice formula, e.g. "2d6+1"
   * @param {number} [bonus=0]      - Flat bonus (STR, magic, etc.)
   * @returns {Promise<{roll: Roll, total: number}>}
   */
  static async rollDamage(damageFormula, bonus = 0) {
    const roll  = await new Roll(damageFormula).evaluate();
    const total = Math.max(1, roll.total + bonus);
    return { roll, total };
  }

  /**
   * Post the attack result to Foundry VTT chat.
   *
   * @param {Actor}  attacker
   * @param {object} result - Return value of ADND2eCombat.attack()
   */
  static async toChat(attacker, result) {
    const { message } = result;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: attacker }),
      content: message,
      type:    CONST.CHAT_MESSAGE_TYPES?.OTHER ?? 0
    });
  }

  /* ── Private helpers ─────────────────────────────────────────────── */

  static _buildChatMessage(attackerName, weaponName, d20, result, thac0, targetAC, damageRoll, total) {
    const hitText  = result.natural20  ? "⚡ CRITICAL HIT!"
                   : result.naturalMiss ? "💨 Natural Miss"
                   : result.hit         ? "✅ Hit"
                                        : "❌ Miss";

    const rollNeeded = thac0 - targetAC;

    let html = `
      <div class="adnd2e-attack-result">
        <h3>${attackerName} attacks with ${weaponName}</h3>
        <table class="adnd2e-roll-table">
          <tr><td>Attack Roll</td><td><strong>${d20}</strong></td></tr>
          <tr><td>Needs (THAC0 ${thac0} − AC ${targetAC})</td><td>${rollNeeded}</td></tr>
          <tr><td>Result</td><td><strong>${hitText}</strong></td></tr>`;

    if (result.hit && damageRoll) {
      html += `<tr><td>Damage</td><td><strong>${total}</strong> (${damageRoll.formula} = ${damageRoll.result})</td></tr>`;
    }

    html += `</table></div>`;
    return html;
  }
}
