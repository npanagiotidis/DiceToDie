/**
 * DiceToDie - Ability Score Roller for ARS/OSRIC
 */

class AbilityScoreRoller {
  static roll4d6DropLowest() {
    const rolls = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
    
    const sorted = rolls.sort((a, b) => a - b);
    const sum = sorted.slice(1).reduce((a, b) => a + b, 0);
    
    return {
      rolled: rolls,
      dropped: sorted[0],
      sum: sum,
      keptDice: sorted.slice(1)
    };
  }

  static generateTwoRolls() {
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const roll1 = {};
    const roll2 = {};
    
    abilities.forEach(ability => {
      roll1[ability] = this.roll4d6DropLowest();
      roll2[ability] = this.roll4d6DropLowest();
    });
    
    return { roll1, roll2 };
  }

  static async showSelectionDialog(actor, rolls) {
    const { roll1, roll2 } = rolls;
    
    const html = `
      <div class="ability-selection-container">
        <p style="margin-bottom: 1.5em; text-align: center;"><strong>Select the ability scores you prefer:</strong></p>
        
        <div style="display: flex; gap: 2em; justify-content: space-around;">
          <div class="roll-option">
            <h4 style="text-align: center; margin-top: 0; color: #4CAF50;">Roll Set 1</h4>
            <table class="ability-scores-table">
              <tbody>
                <tr><td class="ability-name"><strong>STR:</strong></td><td class="ability-score">${roll1.str.sum}</td><td class="ability-dice"><small>${roll1.str.keptDice.join(', ')} (${roll1.str.dropped}↓)</small></td></tr>
                <tr><td class="ability-name"><strong>DEX:</strong></td><td class="ability-score">${roll1.dex.sum}</td><td class="ability-dice"><small>${roll1.dex.keptDice.join(', ')} (${roll1.dex.dropped}↓)</small></td></tr>
                <tr><td class="ability-name"><strong>CON:</strong></td><td class="ability-score">${roll1.con.sum}</td><td class="ability-dice"><small>${roll1.con.keptDice.join(', ')} (${roll1.con.dropped}↓)</small></td></tr>
                <tr><td class="ability-name"><strong>INT:</strong></td><td class="ability-score">${roll1.int.sum}</td><td class="ability-dice"><small>${roll1.int.keptDice.join(', ')} (${roll1.int.dropped}↓)</small></td></tr>
                <tr><td class="ability-name"><strong>WIS:</strong></td><td class="ability-score">${roll1.wis.sum}</td><td class="ability-dice"><small>${roll1.wis.keptDice.join(', ')} (${roll1.wis.dropped}↓)</small></td></tr>
                <tr><td class="ability-name"><strong>CHA:</strong></td><td class="ability-score">${roll1.cha.sum}</td><td class="ability-dice"><small>${roll1.cha.keptDice.join(', ')} (${roll1.cha.dropped}↓)</small></td></tr>
              </tbody>
            </table>
            <button class="select-roll" data-roll="roll1">Select Roll 1</button>
          </div>

          <div class="roll-option">
            <h4 style="text-align: center; margin-top: 0; color: #2196F3;">Roll Set 2</h4>
            <table class="ability-scores-table">
              <tbody>
                <tr><td class="ability-name"><strong>STR:</strong></td><td class="ability-score">${roll2.str.sum}</td><td class="ability-dice"><small>${roll2.str.keptDice.join(', ')} (${roll2.str.dropped}↓)</small></td></tr>
                <tr><td class="ability-name"><strong>DEX:</strong></td><td class="ability-score">${roll2.dex.sum}</td><td class="ability-dice"><small>${roll2.dex.keptDice.join(', ')} (${roll2.dex.dropped}↓)</small></td></tr>
                <tr><td class="ability-name"><strong>CON:</strong></td><td class="ability-score">${roll2.con.sum}</td><td class="ability-dice"><small>${roll2.con.keptDice.join(', ')} (${roll2.con.dropped}↓)</small></td></tr>
                <tr><td class="ability-name"><strong>INT:</strong></td><td class="ability-score">${roll2.int.sum}</td><td class="ability-dice"><small>${roll2.int.keptDice.join(', ')} (${roll2.int.dropped}↓)</small></td></tr>
                <tr><td class="ability-name"><strong>WIS:</strong></td><td class="ability-score">${roll2.wis.sum}</td><td class="ability-dice"><small>${roll2.wis.keptDice.join(', ')} (${roll2.wis.dropped}↓)</small></td></tr>
                <tr><td class="ability-name"><strong>CHA:</strong></td><td class="ability-score">${roll2.cha.sum}</td><td class="ability-dice"><small>${roll2.cha.keptDice.join(', ')} (${roll2.cha.dropped}↓)</small></td></tr>
              </tbody>
            </table>
            <button class="select-roll" data-roll="roll2">Select Roll 2</button>
          </div>
        </div>
      </div>
    `;

    return new Promise((resolve) => {
      const dialog = new Dialog({
        title: "Generate Ability Scores",
        content: html,
        buttons: {},
        default: null,
        close: () => resolve(null)
      }, { width: 900, height: "auto" });

      dialog.render(true);

      setTimeout(() => {
        document.querySelectorAll('.select-roll').forEach(button => {
          button.addEventListener('click', async (e) => {
            e.preventDefault();
            const selectedRoll = e.target.dataset.roll;
            const scores = selectedRoll === 'roll1' ? roll1 : roll2;
            await AbilityScoreRoller.applyAbilityScores(actor, scores);
            dialog.close();
            resolve(scores);
          });
        });
      }, 100);
    });
  }

  static async applyAbilityScores(actor, scores) {
    const updateData = {};
    
    const abilityMap = {
      'str': 'system.abilities.str.value',
      'dex': 'system.abilities.dex.value',
      'con': 'system.abilities.con.value',
      'int': 'system.abilities.int.value',
      'wis': 'system.abilities.wis.value',
      'cha': 'system.abilities.cha.value'
    };

    Object.entries(abilityMap).forEach(([key, path]) => {
      updateData[path] = scores[key].sum;
    });

    await actor.update(updateData);
    ui.notifications.info(`Ability scores have been applied to ${actor.name}!`);
  }

  static getOpenCharacterSheet() {
    console.log('DiceToDie: Looking for open character sheets');
    
    // Check all open windows
    for (const [id, window] of Object.entries(ui.windows)) {
      console.log(`Window ${id}:`, window.constructor.name);
      
      if (window instanceof ActorSheet) {
        console.log(`Found ActorSheet:`, window.actor?.name, 'Type:', window.actor?.type);
        
        // Check if it's a character
        if (window.actor?.type === 'character') {
          console.log(`Found character sheet for:`, window.actor.name);
          return window.actor;
        }
      }
    }
    
    // If no character sheet found, try to get the first actor if any
    console.log('No character sheet found, checking actors');
    if (game.actors && game.actors.size > 0) {
      for (const actor of game.actors) {
        if (actor.type === 'character') {
          console.log('Using actor:', actor.name);
          return actor;
        }
      }
    }
    
    return null;
  }

  static addButtonToToolbar() {
    console.log('DiceToDie: addButtonToToolbar called');
    
    // Check if already added
    if (document.querySelector('.dice-to-die-button')) {
      console.log('DiceToDie: Button already exists');
      return;
    }
    
    // Find the scene controls menu
    const sceneControlsMenu = document.querySelector('#scene-controls-layers');
    if (!sceneControlsMenu) {
      console.log('DiceToDie: Could not find scene controls menu');
      return;
    }
    
    console.log('DiceToDie: Found scene controls menu, creating button');
    
    // Create the button with pointer-events enabled
    const li = document.createElement('li');
    li.style.pointerEvents = 'auto';
    
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'control-ui-control layer icon fa-solid fa-dice dice-to-die-button';
    button.title = 'Generate Ability Scores';
    button.setAttribute('data-action', 'dice-to-die');
    button.style.pointerEvents = 'auto';
    button.style.cursor = 'pointer';
    
    li.appendChild(button);
    sceneControlsMenu.appendChild(li);
    
    console.log('DiceToDie: Button added to DOM');
    
    // Add click handler directly to button
    button.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('DiceToDie: Button clicked via onclick!');
      
      const actor = AbilityScoreRoller.getOpenCharacterSheet();
      
      if (!actor) {
        ui.notifications.warn('No character sheet found. Please open a character sheet first.');
        return;
      }
      
      console.log('DiceToDie: Generating for:', actor.name);
      
      const rolls = AbilityScoreRoller.generateTwoRolls();
      await AbilityScoreRoller.showSelectionDialog(actor, rolls);
    };
    
    console.log('DiceToDie: Button onclick handler added');
  }
}

Hooks.once('canvasReady', () => {
  console.log('DiceToDie: canvasReady hook fired');
  AbilityScoreRoller.addButtonToToolbar();
});

Hooks.once('ready', () => {
  console.log('DiceToDie: ready hook fired');
  setTimeout(() => {
    AbilityScoreRoller.addButtonToToolbar();
  }, 1000);
});

Hooks.once('init', () => {
  console.log('DiceToDie: Module initialized');
  window.AbilityScoreRoller = AbilityScoreRoller;
});
