/**
 * AD&D 2e Race Application Engine
 *
 * Reads racial attributes from compendium race Items and applies them to
 * a Foundry VTT actor:
 *   • Ability score adjustments       (system.abilities.*.value)
 *   • Infravision                     (system.attributes.senses.infravision)
 *   • Magic resistance                (system.attributes.magicResistance)
 *   • Sleep immunity                  (system.traits.sleepImmunity)
 *   • Charm save bonus                (system.traits.charmSaveBonus)
 *   • All racialTraits (detect, innate, attack, AC, penalties)
 *                                     → stored in flags AND as Active Effects
 *   • Saving throw bonuses            → recalculated automatically
 *
 * Flow – apply (race Item dropped onto actor):
 *   1. createItem hook → applyRaceToActor()
 *   2. Previously applied race is fully reversed (ability scores, AEs, flags)
 *   3. New ability modifiers written to actor system data
 *   4. infravision / magicResistance / sleepImmunity / charmSaveBonus written
 *   5. Active Effects created for every trait group (detect, innate, attack,
 *      AC, penalties, class restrictions)
 *   6. AE IDs stored in flags for clean removal
 *   7. Saving throws recalculated
 *   8. Chat card posted with full racial trait summary
 *
 * Flow – remove (race Item deleted from actor):
 *   deleteItem hook → removeRaceFromActor()
 *   All applied deltas and Active Effects are reversed.
 */

class ADND2eRaceApplication {

  /* ── Public API ────────────────────────────────────────────────────── */

  /**
   * Apply a race Item's full attributes to an actor.
   * Reverses any previously applied race first.
   *
   * @param {Actor}       actor
   * @param {Item|object} raceItem - Foundry Item document or plain object
   */
  static async applyRaceToActor(actor, raceItem) {
    const sys     = raceItem.system ?? raceItem;
    const mods    = sys.abilityModifiers ?? {};
    const traits  = sys.racialTraits     ?? {};
    const name    = raceItem.name ?? sys.name ?? "Unknown";
    const origin  = raceItem.uuid ?? "";

    /* Guard: skip if this exact race is already applied (prevents double-application
       when both preCreateItem and system.details.race update fire together). */
    const existing = ADND2eRaceApplication.getAppliedRaceData(actor);
    if (existing?.name === name) return;

    /* 1. Undo any previously applied race (scores + AEs) */
    await ADND2eRaceApplication._undoPreviousRace(actor);

    /* 2. Ability score adjustments */
    const scoreUpdate = {};
    for (const ab of ["str", "dex", "con", "int", "wis", "cha"]) {
      const m = Number(mods[ab] ?? 0);
      if (m !== 0)
        scoreUpdate[`system.abilities.${ab}.value`] =
          (actor.system?.abilities?.[ab]?.value ?? 10) + m;
    }

    /* 3. Flat system-data attributes (infravision, MR, sleep/charm immunity) */
    const infravision     = Number(sys.infravision          ?? 0);
    const magicResistance = Number(traits.magicResistance   ?? 0);
    const sleepImmunity   = Number(traits.sleepImmunity     ?? 0);
    const charmSaveBonus  = Number(traits.charmSaveBonus    ?? 0);

    if (infravision     > 0) scoreUpdate["system.attributes.senses.infravision"] = infravision;
    if (magicResistance > 0) scoreUpdate["system.attributes.magicResistance"]    = magicResistance;
    if (sleepImmunity   > 0) scoreUpdate["system.traits.sleepImmunity"]           = sleepImmunity;
    if (charmSaveBonus  > 0) scoreUpdate["system.traits.charmSaveBonus"]          = charmSaveBonus;

    if (Object.keys(scoreUpdate).length > 0) await actor.update(scoreUpdate);

    /* 4. Build and create Active Effects for all racial trait groups */
    const aeDocs = ADND2eRaceApplication._buildRacialActiveEffects(
      name, sys.infravision ?? 0, traits, origin
    );
    let aeIds = [];
    if (aeDocs.length > 0 && actor.createEmbeddedDocuments) {
      const created = await actor.createEmbeddedDocuments("ActiveEffect", aeDocs);
      aeIds = created.map(ae => ae.id);
    }

    /* 5. Store full race snapshot in flags (undo + save calc + macro access) */
    await actor.setFlag("dice-to-die", "appliedRaceData", {
      name, abilityModifiers: mods,
      infravision, magicResistance, sleepImmunity, charmSaveBonus,
      racialTraits: traits,
      activeEffectIds: aeIds
    });
    await actor.setFlag("dice-to-die", "race",
      name.toLowerCase().replace(/[\s()'-]+/g, ""));

    /* 6. Recalculate saving throws */
    await ADND2eSavingThrows.updateActorSaves(actor);

    /* 7. Post chat summary */
    await ADND2eRaceApplication._postRaceCard(actor, name, sys.infravision ?? 0, traits);

    ui.notifications.info(
      `DiceToDie: Applied ${name} racial traits to ${actor.name}.`
    );
  }

  /**
   * Remove all racial modifiers and Active Effects from an actor.
   * @param {Actor} actor
   */
  static async removeRaceFromActor(actor) {
    await ADND2eRaceApplication._undoPreviousRace(actor);
    await actor.unsetFlag("dice-to-die", "appliedRaceData");
    await actor.unsetFlag("dice-to-die", "race");
    await ADND2eSavingThrows.updateActorSaves(actor);
    ui.notifications.info(
      `DiceToDie: Racial traits removed from ${actor.name}.`
    );
  }

  /**
   * Look up a race by name across all DiceToDie compendium packs and apply
   * it to the actor.  Called automatically when the actor's
   * system.details.race field changes (e.g. typed in the ARS character
   * sheet's Race input).
   *
   * If no compendium entry is found the actor's saving throws are still
   * recalculated using the built-in table (for common PHB races).
   * Passing an empty / falsy raceName removes any applied race data.
   *
   * @param {Actor} actor
   * @param {string} raceName  - e.g. "Elf", "High Elf", "Drow", ""
   * @returns {Promise<boolean>} true if a compendium match was applied
   */
  static async applyRaceFromName(actor, raceName) {
    /* Empty name → remove race */
    if (!raceName || !raceName.trim()) {
      await ADND2eRaceApplication.removeRaceFromActor(actor);
      return false;
    }

    /** Normalise for fuzzy matching: lowercase, strip spaces/punctuation. */
    const normalise = s => s.toLowerCase().replace(/[\s()'\-]+/g, "");
    const target    = normalise(raceName);

    /* Guard: already applied, nothing to do */
    const existing = ADND2eRaceApplication.getAppliedRaceData(actor);
    if (existing && normalise(existing.name) === target) {
      await ADND2eSavingThrows.updateActorSaves(actor);
      return true;
    }

    const PACK_IDS = [
      "dice-to-die.ars-races-phb",
      "dice-to-die.ars-races-elves",
      "dice-to-die.ars-races-dwarves",
      "dice-to-die.ars-races-gnomes-halflings"
    ];

    for (const packId of PACK_IDS) {
      const pack = game.packs?.get(packId);
      if (!pack) continue;

      const index = await pack.getIndex();
      /* Fuzzy match: exact → starts-with → contains */
      const entry = index.find(e => normalise(e.name) === target) ??
                    index.find(e => normalise(e.name).startsWith(target)) ??
                    index.find(e => target.startsWith(normalise(e.name))) ??
                    index.find(e => normalise(e.name).includes(target));

      if (entry) {
        const document = await pack.getDocument(entry._id);
        if (document) {
          await ADND2eRaceApplication.applyRaceToActor(actor, document);
          return true;
        }
      }
    }

    /* Fallback: no compendium match; still refresh saves from built-in table */
    ui.notifications?.warn(
      `DiceToDie: No compendium entry found for race "${raceName}". ` +
      `Saving throws recalculated from built-in table.`
    );
    await ADND2eSavingThrows.updateActorSaves(actor);
    return false;
  }

  /**
   * Compute saving throw bonuses from stored race trait data.
   * Handles CON-based bonus formula and explicit numeric bonuses.
   *
   * @param {object} raceData - appliedRaceData flag value
   * @param {number} con
   * @returns {{ppd:number, rsw:number, pp:number, bw:number, spell:number}}
   */
  static computeSaveBonuses(raceData, con) {
    const base      = { ppd: 0, rsw: 0, pp: 0, bw: 0, spell: 0 };
    if (!raceData) return base;
    const stBonuses = (raceData.racialTraits ?? {}).savingThrowBonuses ?? [];

    const hasConBonus = stBonuses.some(
      b => typeof b.bonus === "string" && b.bonus.toUpperCase().includes("CON")
    );
    if (hasConBonus) {
      const cb = getConSavingThrowBonus(Number(con));
      for (const k of Object.keys(base)) base[k] += cb;
    }

    for (const entry of stBonuses) {
      if (typeof entry.bonus === "number") {
        const k = ADND2eRaceApplication._saveCategoryFromVs(entry.vs);
        if (k) base[k] += entry.bonus;
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

  /* ── Active Effect builder ─────────────────────────────────────────── */

  /**
   * Build an array of ActiveEffect creation objects for all racial traits.
   *
   * Each trait group becomes one labelled Active Effect so every property
   * appears on the actor's Effects tab and can be toggled independently.
   *
   * @param {string} raceName
   * @param {number} infravision
   * @param {object} traits     - racialTraits block from the race Item
   * @param {string} origin     - race Item UUID (may be empty string)
   * @returns {object[]}
   */
  static _buildRacialActiveEffects(raceName, infravision, traits, origin) {
    const aes  = [];
    const tag  = `[${raceName}]`;
    const base = { origin, transfer: false, disabled: false };

    /* Helper: push an AE with a changes array */
    const push = (label, icon, changes, extra = {}) =>
      aes.push({
        ...base, ...extra,
        name:    `${tag} ${label}`,
        icon,
        changes
      });

    /* ── Infravision ──────────────────────────────────────────────── */
    if (infravision > 0) {
      push("Infravision", "icons/magic/perception/eye-ringed-glow-yellow.webp", [
        { key: "system.attributes.senses.infravision", mode: 5, value: String(infravision), priority: 20 }
      ]);
    }

    /* ── Magic Resistance ────────────────────────────────────────── */
    if (Number(traits.magicResistance) > 0) {
      push("Magic Resistance", "icons/magic/defensive/shield-barrier-flaming-diamond-blue.webp", [
        { key: "system.attributes.magicResistance", mode: 5, value: String(traits.magicResistance), priority: 20 }
      ]);
    }

    /* ── Sleep / Charm Immunity ──────────────────────────────────── */
    if (Number(traits.sleepImmunity) > 0 || Number(traits.charmSaveBonus) > 0) {
      const ch = [];
      if (Number(traits.sleepImmunity)  > 0)
        ch.push({ key: "system.traits.sleepImmunity",  mode: 5, value: String(traits.sleepImmunity),  priority: 20 });
      if (Number(traits.charmSaveBonus) > 0)
        ch.push({ key: "system.traits.charmSaveBonus", mode: 2, value: String(traits.charmSaveBonus), priority: 20 });
      push(
        `Sleep/Charm Resistance (${traits.sleepImmunity ?? 0}% / +${traits.charmSaveBonus ?? 0})`,
        "icons/magic/control/hypnosis-mesmerism-eye.webp", ch
      );
    }

    /* ── Helper: normalise a "vs" value to a display string ─────── */
    const vsToString = vs => Array.isArray(vs) ? vs.join(", ") : String(vs ?? "");

    /* ── Attack Bonuses ──────────────────────────────────────────── */
    for (const ab of (traits.attackBonuses ?? [])) {
      const note = ab.note ? ` (${ab.note})` : "";
      push(
        `Attack Bonus +${ab.bonus} vs ${vsToString(ab.vs)}${note}`,
        "icons/skills/melee/hand-grip-sword-red.webp",
        [{ key: "flags.dice-to-die.attackBonuses", mode: 0,
           value: JSON.stringify({ vs: ab.vs, bonus: ab.bonus }), priority: 20 }]
      );
    }

    /* ── Defensive (AC) Bonuses ──────────────────────────────────── */
    for (const db of (traits.defensiveBonuses ?? [])) {
      const note = db.note ? ` (${db.note})` : "";
      push(
        `AC ${db.acBonus} vs ${vsToString(db.vs)}${note}`,
        "icons/magic/defensive/shield-barrier-deflect-teal.webp",
        [{ key: "flags.dice-to-die.defensiveBonuses", mode: 0,
           value: JSON.stringify({ vs: db.vs, acBonus: db.acBonus }), priority: 20 }]
      );
    }

    /* ── Detect Abilities (stonecunning, secret doors, etc.) ─────── */
    for (const det of (traits.detectAbilities ?? [])) {
      push(
        `Detect: ${det.ability} (1-${det.successOn} on d${det.dieSize})`,
        "icons/magic/perception/eye-ringed-glow-purple.webp",
        [{ key: "flags.dice-to-die.detectAbilities", mode: 0,
           value: JSON.stringify(det), priority: 20 }]
      );
    }

    /* ── Innate Abilities (Drow, Duergar, Svirfneblin, Spriggan) ─── */
    for (const inn of (traits.innateAbilities ?? [])) {
      const freq  = inn.usesPerDay != null ? `${inn.usesPerDay}×/day` : "at will";
      const level = inn.minLevel   != null ? ` (from lvl ${inn.minLevel})` : "";
      const note  = inn.note       ? ` — ${inn.note}` : "";
      push(
        `Innate: ${inn.name} — ${freq}${level}${note}`,
        "icons/magic/light/orb-lightning-blue.webp",
        [{ key: "flags.dice-to-die.innateAbilities", mode: 0,
           value: JSON.stringify(inn), priority: 20 }]
      );
    }

    /* ── Special Abilities ───────────────────────────────────────── */
    for (const sp of (traits.specialAbilities ?? [])) {
      push(
        `Special: ${sp.name}`,
        "icons/magic/symbols/rune-sigil-red-pink.webp",
        [{ key: "flags.dice-to-die.specialAbilities", mode: 0,
           value: JSON.stringify(sp), priority: 20 }]
      );
    }

    /* ── Penalties (light sensitivity, etc.) ────────────────────── */
    for (const pen of (traits.penalties ?? [])) {
      const fx = pen.effects ?? {};
      const ch = [];
      if (typeof fx.attackPenalty  === "number")
        ch.push({ key: "system.attributes.attack",  mode: 2, value: String(fx.attackPenalty), priority: 20 });
      if (typeof fx.savePenalty    === "number")
        ch.push({ key: "system.attributes.save",    mode: 2, value: String(fx.savePenalty),   priority: 20 });
      push(
        `Penalty: ${pen.condition}`,
        "icons/magic/light/explosion-star-glow-orange.webp",
        ch,
        { disabled: true }   /* start disabled – GM activates when condition applies */
      );
    }

    /* ── Class Restrictions (informational) ─────────────────────── */
    if (traits.classRestrictions) {
      push(
        `Class Restrictions: ${traits.classRestrictions}`,
        "icons/skills/social/diplomacy-handshake.webp",
        []   /* no mechanical change – informational only */
      );
    }

    return aes;
  }

  /* ── Chat card ─────────────────────────────────────────────────────── */

  /**
   * Post a formatted chat message summarising all racial traits.
   * @param {Actor}  actor
   * @param {string} raceName
   * @param {number} infravision
   * @param {object} traits
   */
  static async _postRaceCard(actor, raceName, infravision, traits) {
    const rows = [];

    const fmt = (label, val) => `<li><strong>${label}:</strong> ${val}</li>`;

    if (infravision > 0)                    rows.push(fmt("Infravision",        `${infravision} ft`));
    if (Number(traits.magicResistance) > 0) rows.push(fmt("Magic Resistance",   `${traits.magicResistance}%`));
    if (Number(traits.sleepImmunity)   > 0) rows.push(fmt("Sleep Immunity",     `${traits.sleepImmunity}%`));
    if (Number(traits.charmSaveBonus)  > 0) rows.push(fmt("Charm Save Bonus",   `+${traits.charmSaveBonus}`));

    for (const ab of (traits.attackBonuses   ?? []))
      rows.push(fmt("Attack Bonus",   `+${ab.bonus} vs ${Array.isArray(ab.vs) ? ab.vs.join(", ") : ab.vs}`));
    for (const db of (traits.defensiveBonuses ?? []))
      rows.push(fmt("AC Bonus",       `${db.acBonus} vs ${Array.isArray(db.vs) ? db.vs.join(", ") : db.vs}`));
    for (const det of (traits.detectAbilities ?? []))
      rows.push(fmt("Detect",         `${det.ability}: 1-${det.successOn} on d${det.dieSize}`));
    for (const inn of (traits.innateAbilities  ?? []))
      rows.push(fmt("Innate",         `${inn.name} ${inn.usesPerDay != null ? `${inn.usesPerDay}×/day` : "at will"}`));
    for (const sp  of (traits.specialAbilities ?? []))
      rows.push(fmt("Special",        sp.name));
    for (const pen of (traits.penalties        ?? []))
      rows.push(fmt("Penalty",        pen.condition + " (disabled by default)"));
    if (traits.classRestrictions)
      rows.push(fmt("Class Restrictions", traits.classRestrictions));

    const content = `
      <div class="dice-to-die-race-card">
        <h3>🧬 ${raceName} — Racial Traits Applied to ${actor.name}</h3>
        <ul style="margin:4px 0;padding-left:16px">${rows.join("")}</ul>
      </div>`;

    await ChatMessage.create({ content, speaker: ChatMessage.getSpeaker({ actor }) });
  }

  /* ── Private helpers ───────────────────────────────────────────────── */

  /**
   * Reverse all previously applied racial data:
   * ability score deltas, system attributes, and Active Effects.
   * @param {Actor} actor
   */
  static async _undoPreviousRace(actor) {
    const prev = actor.getFlag("dice-to-die", "appliedRaceData");
    if (!prev) return;

    /* Reverse ability score deltas */
    const updateData = {};
    for (const [ab, mod] of Object.entries(prev.abilityModifiers ?? {})) {
      const m = Number(mod ?? 0);
      if (m !== 0)
        updateData[`system.abilities.${ab}.value`] =
          (actor.system?.abilities?.[ab]?.value ?? 10) - m;
    }

    /* Reverse flat system attributes */
    if (Number(prev.infravision)     > 0) updateData["system.attributes.senses.infravision"] = 0;
    if (Number(prev.magicResistance) > 0) updateData["system.attributes.magicResistance"]    = 0;
    if (Number(prev.sleepImmunity)   > 0) updateData["system.traits.sleepImmunity"]           = 0;
    if (Number(prev.charmSaveBonus)  > 0) updateData["system.traits.charmSaveBonus"]          = 0;

    if (Object.keys(updateData).length > 0) await actor.update(updateData);

    /* Delete racial Active Effects */
    const aeIds = prev.activeEffectIds ?? [];
    if (aeIds.length > 0 && actor.deleteEmbeddedDocuments) {
      const existing = aeIds.filter(id => actor.effects?.get(id));
      if (existing.length > 0)
        await actor.deleteEmbeddedDocuments("ActiveEffect", existing);
    }
  }

  /**
   * Map a "vs" string from savingThrowBonuses to an AD&D 5-category save key.
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
