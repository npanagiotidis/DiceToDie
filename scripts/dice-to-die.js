/**
 * DiceToDie – Main Module Initialization
 *
 * AD&D 2e rules overlay for Foundry VTT / ARS system.
 * Registers settings, exposes a public API, and installs automation hooks.
 *
 * Automation (automatic dice rolls):
 *   ✅ THAC0 recalculation when class/level changes
 *   ✅ Saving throw recalculation when class/level/race changes
 *   ✅ Attack roll (d20) resolution
 *   ✅ Damage roll (weapon dice)
 *
 * Manual (player/GM triggered):
 *   🎲 Initiative (d10 + weapon speed / casting time)
 *   🎲 Reaction checks
 *   🎲 Spell interruption notification
 */

Hooks.once("init", () => {
  console.log("DiceToDie | Initialising AD&D 2e rules overlay – v2.0.0");

  /* ── Module settings ─────────────────────────────────────────────── */
  game.settings.register("dice-to-die", "autoUpdateThac0", {
    name:    "Auto-update THAC0",
    hint:    "Automatically recalculate THAC0 when an actor's class or level changes.",
    scope:   "world",
    config:  true,
    type:    Boolean,
    default: true
  });

  game.settings.register("dice-to-die", "autoUpdateSaves", {
    name:    "Auto-update Saving Throws",
    hint:    "Automatically recalculate saving throws when class, level, or race changes.",
    scope:   "world",
    config:  true,
    type:    Boolean,
    default: true
  });

  game.settings.register("dice-to-die", "showAttackDetails", {
    name:    "Show attack details in chat",
    hint:    "Post THAC0 vs AC breakdown to chat on every attack.",
    scope:   "world",
    config:  true,
    type:    Boolean,
    default: true
  });

  /* ── Public API ──────────────────────────────────────────────────── */
  window.DiceToDie = {
    version: "2.0.0",

    /* Data tables */
    tables: {
      thac0: ADND2E_THAC0_TABLES,
      saves: ADND2E_SAVE_TABLES,
      classes: ADND2E_CLASSES,
      races: ADND2E_RACES,
      wizardSpecializations: WIZARD_SPECIALIZATIONS,
      priestSpheres: PRIEST_SPHERES
    },

    /* Rule engines */
    thac0:           ADND2eThac0,
    savingThrows:    ADND2eSavingThrows,
    combat:          ADND2eCombat,
    initiative:      ADND2eInitiative,
    proficiencies:   ADND2eProficiencies,
    spells:          ADND2eSpells,
    raceApplication: ADND2eRaceApplication,

    /* Ability score roller (original feature) */
    abilityRoller: AbilityScoreRoller,

    /* Utility: configure a single-class character */
    async setupCharacter(actor, { className, level, race = "human" } = {}) {
      if (!className || !level) return;
      const cls = ADND2E_CLASSES[className.toLowerCase()];
      if (!cls) {
        ui.notifications.warn(`DiceToDie: Unknown class "${className}".`);
        return;
      }
      await actor.setFlag("dice-to-die", "className", className.toLowerCase());
      await actor.setFlag("dice-to-die", "level",     Number(level));
      await actor.setFlag("dice-to-die", "race",      race.toLowerCase());
      await ADND2eThac0.updateActorThac0(actor);
      await ADND2eSavingThrows.updateActorSaves(actor);
      ui.notifications.info(`DiceToDie: ${actor.name} configured as ${cls.name} level ${level}.`);
    },

    /* Utility: configure a multi-class character */
    async setupMultiClass(actor, classEntries, race = "human") {
      /* classEntries: [{className, level, xp}, ...] */
      if (!Array.isArray(classEntries) || classEntries.length === 0) return;
      const validated = classEntries.map(e => ({
        className: e.className.toLowerCase(),
        level:     Number(e.level),
        xp:        Number(e.xp ?? 0)
      }));
      await actor.setFlag("dice-to-die", "multiClassData", validated);
      await actor.setFlag("dice-to-die", "race", race.toLowerCase());
      await ADND2eThac0.updateActorThac0(actor);
      await ADND2eSavingThrows.updateActorSaves(actor);
    }
  };

  /* Make key classes globally accessible for macros */
  window.AbilityScoreRoller = AbilityScoreRoller;
  console.log("DiceToDie | Module initialised");
});

/* ── Automation Hooks ──────────────────────────────────────────────── */

/**
 * Module-level set used as a re-entrancy guard so that updating
 * system.details.race (triggered by applyRaceToActor) does not cause
 * applyRaceFromName to fire a second time for the same actor.
 * @type {Set<string>}
 */
const _ADND_RACE_LOCK = new Set();

Hooks.on("updateActor", async (actor, changes) => {
  /* ── Race field change: look up compendium and apply traits ──────── */
  if (foundry.utils.hasProperty(changes, "system.details.race") &&
      !_ADND_RACE_LOCK.has(actor.id)) {
    const raceName = foundry.utils.getProperty(actor, "system.details.race") ?? "";
    _ADND_RACE_LOCK.add(actor.id);
    try {
      await ADND2eRaceApplication.applyRaceFromName(actor, raceName);
    } finally {
      _ADND_RACE_LOCK.delete(actor.id);
    }
    return; /* applyRaceFromName already calls updateActorSaves internally */
  }

  /* ── Class/level/race-flag change: recalculate THAC0 + saves ─────── */
  const relevantChange =
    foundry.utils.hasProperty(changes, "system.details.class")  ||
    foundry.utils.hasProperty(changes, "system.details.level")  ||
    foundry.utils.hasProperty(changes, "system.attributes.level") ||
    foundry.utils.hasProperty(changes, "flags.dice-to-die.className") ||
    foundry.utils.hasProperty(changes, "flags.dice-to-die.level")     ||
    foundry.utils.hasProperty(changes, "flags.dice-to-die.race")      ||
    foundry.utils.hasProperty(changes, "flags.dice-to-die.multiClassData");

  if (!relevantChange) return;

  if (game.settings.get("dice-to-die", "autoUpdateThac0")) {
    await ADND2eThac0.updateActorThac0(actor);
  }
  if (game.settings.get("dice-to-die", "autoUpdateSaves")) {
    await ADND2eSavingThrows.updateActorSaves(actor);
  }
});

/* ── Race Item Hooks ───────────────────────────────────────────────── */

/**
 * Intercept race Items being dropped onto an actor BEFORE they are
 * created as embedded documents.  The ARS system does not define a
 * "race" item type and would show "can't find it in inventory" if the
 * item were created normally.
 *
 * Instead we:
 *   1. Return false to CANCEL the item-creation (no inventory entry).
 *   2. Fire applyRaceToActor asynchronously so racial traits are applied.
 *
 * Note: Foundry's preCreate hooks are called via Hooks.call() which is
 * synchronous, so async work must be started as a fire-and-forget.
 */
Hooks.on("preCreateItem", (item, _data, _options, _userId) => {
  if (item.type !== "race" || !item.parent || item.parent.documentName !== "Actor") return;

  const actor   = item.parent;
  const isOwner = actor.ownership?.[game.user?.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
  if (!(game.user?.isGM || isOwner)) return;

  /* Apply race traits in the background; do NOT await (pre-hook is sync) */
  ADND2eRaceApplication.applyRaceToActor(actor, item).catch(err =>
    console.error("DiceToDie | Error applying race from drop:", err)
  );

  return false; /* Cancel item creation – race never appears in inventory */
});

/**
 * Fallback: if a race item already exists as an embedded document (e.g.
 * pre-existing data or created via macro), remove racial traits when it
 * is deleted.
 */
Hooks.on("deleteItem", async (item, _options, _userId) => {
  if (item.type !== "race" || !item.parent || item.parent.documentName !== "Actor") return;

  const isOwner = item.parent.ownership?.[game.user?.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
  if (!(game.user?.isGM || isOwner)) return;

  await ADND2eRaceApplication.removeRaceFromActor(item.parent);
});

/* ── UI: Toolbar Button (original feature retained) ───────────────── */

Hooks.once("canvasReady", () => {
  AbilityScoreRoller.addButtonToToolbar();
});

Hooks.once("ready", () => {
  setTimeout(() => AbilityScoreRoller.addButtonToToolbar(), 1000);
  console.log("DiceToDie | Ready – AD&D 2e overlay active");
});
