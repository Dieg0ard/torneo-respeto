// Administrator Page Control Module (JSON Generator Form)
import { state } from './state.js';
import { generateBracketStructure, advanceBracketMatch } from './bracket.js';

export function setupAdminControls() {
  // Admin sub-tabs event listener
  const adminTabBtns = document.querySelectorAll(".admin-tab-btn");
  adminTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-admin-target");
      
      adminTabBtns.forEach(t => t.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".admin-tab-section").forEach(sec => {
        sec.hidden = sec.id !== targetId;
      });
    });
  });

  // Admin Tools: Add Participant
  const btnAddPlayer = document.getElementById("btn-admin-add-player");
  const playerInput = document.getElementById("admin-player-input");
  
  if (btnAddPlayer && playerInput) {
    const addPlayer = () => {
      const name = playerInput.value.trim();
      if (name && !state.adminParticipants.includes(name)) {
        state.adminParticipants.push(name);
        playerInput.value = "";
        renderAdminParticipants();
        updateAdminDropdowns();
        renderAdminStandings();
      }
    };
    btnAddPlayer.addEventListener("click", addPlayer);
    playerInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") addPlayer();
    });
  }

  // Admin Tools: Add Match (Manual)
  const btnAddMatch = document.getElementById("btn-admin-add-match");
  if (btnAddMatch) {
    btnAddMatch.addEventListener("click", () => {
      const round = document.getElementById("admin-match-round").value.trim() || "Ronda General";
      const p1 = document.getElementById("admin-match-p1").value;
      const p2 = document.getElementById("admin-match-p2").value;
      const score1 = parseInt(document.getElementById("admin-match-score1").value) || 0;
      const score2 = parseInt(document.getElementById("admin-match-score2").value) || 0;
      const chars1 = document.getElementById("admin-match-char1").value.trim();
      const chars2 = document.getElementById("admin-match-char2").value.trim();
      const team1 = document.getElementById("admin-match-team1").value.trim();
      const team2 = document.getElementById("admin-match-team2").value.trim();

      if (!p1 || !p2) {
        alert("Debes seleccionar ambos jugadores para registrar el combate.");
        return;
      }
      if (p1 === p2) {
        alert("Un jugador no puede pelear contra sí mismo.");
        return;
      }

      const match = {
        round,
        p1,
        p2,
        score1,
        score2,
        chars1,
        chars2
      };

      if (team1) match.team1 = team1;
      if (team2) match.team2 = team2;

      state.adminMatches.push(match);
      
      // Clean inputs
      document.getElementById("admin-match-score1").value = "0";
      document.getElementById("admin-match-score2").value = "0";
      document.getElementById("admin-match-char1").value = "";
      document.getElementById("admin-match-char2").value = "";
      
      // Hide presets
      document.getElementById("admin-match-char1-preset").style.display = "none";
      document.getElementById("admin-match-char2-preset").style.display = "none";
      
      renderAdminMatches();
    });
  }

  // Admin Tools: Generate JSON
  const btnGenerate = document.getElementById("btn-admin-generate");
  if (btnGenerate) {
    btnGenerate.addEventListener("click", generateTournamentJSON);
  }

  // Admin Tools: Copy code
  const btnCopy = document.getElementById("btn-admin-copy");
  if (btnCopy) {
    btnCopy.addEventListener("click", () => {
      const box = document.getElementById("admin-json-output");
      box.select();
      document.execCommand("copy");
      
      const origText = btnCopy.textContent;
      btnCopy.textContent = "¡Copiado!";
      setTimeout(() => btnCopy.textContent = origText, 2000);
    });
  }

  // Admin Tools: Download JSON
  const btnDownload = document.getElementById("btn-admin-download");
  if (btnDownload) {
    btnDownload.addEventListener("click", () => {
      const id = document.getElementById("admin-tour-id").value.trim() || "torneo";
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(document.getElementById("admin-json-output").value);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // QoL: Character preset list triggers
  const p1Select = document.getElementById("admin-match-p1");
  const p2Select = document.getElementById("admin-match-p2");
  const char1Preset = document.getElementById("admin-match-char1-preset");
  const char2Preset = document.getElementById("admin-match-char2-preset");

  if (p1Select && char1Preset) {
    p1Select.addEventListener("change", () => {
      updateCharacterPresetsForPlayer("admin-match-p1", "admin-match-char1-preset", "admin-match-char1");
    });
    char1Preset.addEventListener("change", () => {
      document.getElementById("admin-match-char1").value = char1Preset.value;
    });
  }

  if (p2Select && char2Preset) {
    p2Select.addEventListener("change", () => {
      updateCharacterPresetsForPlayer("admin-match-p2", "admin-match-char2-preset", "admin-match-char2");
    });
    char2Preset.addEventListener("change", () => {
      document.getElementById("admin-match-char2").value = char2Preset.value;
    });
  }

  // JSON Import triggers
  const btnImportFileTrigger = document.getElementById("btn-admin-import-file-trigger");
  const fileInput = document.getElementById("admin-import-file");
  const btnImportPasteTrigger = document.getElementById("btn-admin-import-paste-trigger");
  const pasteContainer = document.getElementById("admin-import-paste-container");
  const btnPasteConfirm = document.getElementById("btn-admin-import-paste-confirm");

  if (btnImportFileTrigger && fileInput) {
    btnImportFileTrigger.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          loadTournamentIntoForm(parsed);
        } catch (err) {
          alert("Error al parsear el archivo JSON: " + err.message);
        }
      };
      reader.readAsText(file);
      fileInput.value = ""; // Reset file input
    });
  }

  if (btnImportPasteTrigger && pasteContainer) {
    btnImportPasteTrigger.addEventListener("click", () => {
      const isHidden = pasteContainer.style.display === "none";
      pasteContainer.style.display = isHidden ? "block" : "none";
    });
  }

  if (btnPasteConfirm) {
    btnPasteConfirm.addEventListener("click", () => {
      const text = document.getElementById("admin-import-paste-area").value.trim();
      if (!text) {
        alert("El texto JSON está vacío.");
        return;
      }
      try {
        const parsed = JSON.parse(text);
        loadTournamentIntoForm(parsed);
      } catch (err) {
        alert("Error de sintaxis JSON: " + err.message);
      }
    });
  }

  // Bracket triggers
  const bracketTypeSelect = document.getElementById("admin-bracket-type");
  const btnGenerateBracket = document.getElementById("btn-admin-generate-bracket");
  
  if (bracketTypeSelect && btnGenerateBracket) {
    bracketTypeSelect.addEventListener("change", () => {
      const type = bracketTypeSelect.value;
      if (type === "none") {
        btnGenerateBracket.style.display = "none";
        document.getElementById("admin-bracket-container").style.display = "none";
        state.adminBracket = null;
      } else {
        btnGenerateBracket.style.display = "block";
      }
    });

    btnGenerateBracket.addEventListener("click", () => {
      const type = bracketTypeSelect.value;
      if (state.adminParticipants.length < 2) {
        alert("Necesitas al menos 2 participantes agregados en la lista para generar un bracket.");
        return;
      }

      const confirmReset = state.adminMatches.length === 0 || confirm("Generar un bracket borrará la lista actual de combates registrados en este formulario. ¿Deseas continuar?");
      if (!confirmReset) return;

      // Clear existing matches
      state.adminMatches = [];
      renderAdminMatches();

      // Initialize bracket
      state.adminBracket = generateBracketStructure(state.adminParticipants, type);
      if (state.adminBracket) {
        document.getElementById("admin-bracket-container").style.display = "block";
        renderBracket();
      }
    });
  }
}

// QoL helper: Populate preset select for previously used character combinations
function updateCharacterPresetsForPlayer(playerSelectId, presetSelectId, textInputId) {
  const player = document.getElementById(playerSelectId).value;
  const presetSelect = document.getElementById(presetSelectId);
  const textInput = document.getElementById(textInputId);

  if (!presetSelect || !textInput) return;

  if (!player) {
    presetSelect.style.display = "none";
    return;
  }

  // Collect unique characters used in registered matches
  const uniqueChars = new Set();
  state.adminMatches.forEach(m => {
    if (m.p1 === player && m.chars1 && m.chars1 !== "-") uniqueChars.add(m.chars1);
    if (m.p2 === player && m.chars2 && m.chars2 !== "-") uniqueChars.add(m.chars2);
  });

  if (uniqueChars.size === 0) {
    presetSelect.style.display = "none";
    return;
  }

  presetSelect.innerHTML = `<option value="" disabled selected>Personajes previos...</option>`;
  uniqueChars.forEach(chars => {
    const opt = document.createElement("option");
    opt.value = chars;
    opt.textContent = chars;
    presetSelect.appendChild(opt);
  });

  presetSelect.style.display = "block";
}

// Load a parsed JSON object into the creator form
function loadTournamentIntoForm(tour) {
  try {
    if (!tour.id || !tour.name || !tour.date || !tour.mode || !tour.game || !tour.participants) {
      throw new Error("El JSON de entrada no tiene la estructura de torneo válida (campos ausentes).");
    }

    document.getElementById("admin-tour-id").value = tour.id;
    document.getElementById("admin-tour-name").value = tour.name;
    document.getElementById("admin-tour-date").value = tour.date;
    document.getElementById("admin-tour-mode").value = tour.mode;
    document.getElementById("admin-tour-game").value = tour.game;

    state.adminParticipants = [...tour.participants];
    state.adminMatches = [...(tour.matches || [])];

    renderAdminParticipants();
    updateAdminDropdowns();
    renderAdminMatches();
    renderAdminStandings();

    // Restore standings podium selections (GF, SF, LF)
    if (tour.standings) {
      setTimeout(() => {
        tour.standings.forEach(s => {
          const select = document.querySelector(`#admin-standings-list .admin-standing-select[data-rank="${s.rank}"]`);
          if (select) {
            select.value = s.player;
          }
        });
      }, 80);
    }

    alert(`¡Torneo "${tour.name}" cargado con éxito! Puedes modificar la información y re-generar el JSON.`);

    // Reset paste interface
    document.getElementById("admin-import-paste-container").style.display = "none";
    document.getElementById("admin-import-paste-area").value = "";

    // Reset bracket status since we are loading custom matches list
    document.getElementById("admin-bracket-type").value = "none";
    document.getElementById("btn-admin-generate-bracket").style.display = "none";
    document.getElementById("admin-bracket-container").style.display = "none";
    state.adminBracket = null;

  } catch (err) {
    alert("Error al cargar la información: " + err.message);
  }
}

// ADMIN TOOLS: Update participant tags UI
function renderAdminParticipants() {
  const container = document.getElementById("admin-participants-list");
  if (!container) return;

  container.innerHTML = "";
  state.adminParticipants.forEach((p, idx) => {
    const span = document.createElement("span");
    span.className = "tag-player-admin";
    span.innerHTML = `
      ${p} <span class="btn-remove-tag" data-idx="${idx}">✕</span>
    `;
    
    span.querySelector(".btn-remove-tag").addEventListener("click", () => {
      state.adminParticipants.splice(idx, 1);
      renderAdminParticipants();
      updateAdminDropdowns();
      renderAdminStandings();
    });

    container.appendChild(span);
  });
}

// ADMIN TOOLS: Update match builder player options
function updateAdminDropdowns() {
  const p1Select = document.getElementById("admin-match-p1");
  const p2Select = document.getElementById("admin-match-p2");
  
  if (!p1Select || !p2Select) return;

  p1Select.innerHTML = `<option value="" disabled selected>Escoge Jugador 1</option>`;
  p2Select.innerHTML = `<option value="" disabled selected>Escoge Jugador 2</option>`;

  state.adminParticipants.forEach(p => {
    const opt1 = document.createElement("option");
    opt1.value = p;
    opt1.textContent = p;
    p1Select.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = p;
    opt2.textContent = p;
    p2Select.appendChild(opt2);
  });
}

// ADMIN TOOLS: Render currently registered matches
function renderAdminMatches() {
  const list = document.getElementById("admin-matches-list");
  if (!list) return;

  list.innerHTML = "";
  state.adminMatches.forEach((m, idx) => {
    const li = document.createElement("li");
    li.className = "admin-match-item";
    
    const charsMarkup = (m.chars1 || m.chars2) ? ` (${m.chars1 || '-'} vs ${m.chars2 || '-'})` : "";
    const teamMarkup = (m.team1 || m.team2) ? ` [${m.team1 || '-'} vs ${m.team2 || '-'}]` : "";

    li.innerHTML = `
      <span>[${m.round}] <strong>${m.p1}</strong> ${m.score1} - ${m.score2} <strong>${m.p2}</strong>${charsMarkup}${teamMarkup}</span>
      <button type="button" class="btn-remove-tag" style="padding: 2px 6px;">✕</button>
    `;

    li.querySelector("button").addEventListener("click", () => {
      state.adminMatches.splice(idx, 1);
      renderAdminMatches();
    });

    list.appendChild(li);
  });
}

// ADMIN TOOLS: Generate standings dynamic controls based on player list (Podium only)
export function renderAdminStandings() {
  const container = document.getElementById("admin-standings-list");
  if (!container) return;

  container.innerHTML = "";
  
  // We only need top 3 positions officially
  const count = Math.min(3, state.adminParticipants.length);
  
  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.className = "standing-item-input";
    
    let selectOptions = `<option value="" disabled selected>Selecciona jugador para el podio</option>`;
    state.adminParticipants.forEach(p => {
      selectOptions += `<option value="${p}">${p}</option>`;
    });

    const labels = ["1º (Campeón)", "2º (Subcampeón)", "3º Lugar (Opcional)"];

    div.innerHTML = `
      <span class="standing-rank-lbl" style="width: 150px; text-align: left;">${labels[i-1]}:</span>
      <select class="admin-standing-select" data-rank="${i}">
        ${selectOptions}
      </select>
    `;
    
    container.appendChild(div);
  }
}

// QoL helper: Retrieve preset character selections for a player name
function getPlayerCharacterPresets(player) {
  const uniqueChars = new Set();
  state.adminMatches.forEach(m => {
    if (m.p1 === player && m.chars1 && m.chars1 !== "-") uniqueChars.add(m.chars1);
    if (m.p2 === player && m.chars2 && m.chars2 !== "-") uniqueChars.add(m.chars2);
  });
  return Array.from(uniqueChars);
}

// Render the visual rounds of the bracket
function renderBracket() {
  const roundsContainer = document.getElementById("admin-bracket-rounds");
  if (!roundsContainer || !state.adminBracket) return;

  roundsContainer.innerHTML = "";
  const bracket = state.adminBracket;

  bracket.rounds.forEach(round => {
    const col = document.createElement("div");
    col.className = "bracket-round-col";
    
    const title = document.createElement("div");
    title.className = "bracket-round-title";
    title.textContent = round.name;
    col.appendChild(title);

    round.matches.forEach(matchId => {
      const match = bracket.matches[matchId];
      if (!match) return;

      const card = document.createElement("div");
      card.className = "bracket-match-card";
      
      if (match.completed) {
        card.className += " completed-match";
      } else if (match.p1 && match.p2 && match.p1 !== "BYE" && match.p2 !== "BYE") {
        card.className += " active-match";
      }

      if (match.isBye) {
        card.className += " bye-match";
      }

      // Header
      const header = document.createElement("div");
      header.className = "bracket-match-header";
      
      let statusText = "Esperando...";
      if (match.isBye) {
        statusText = "BYE (Avance)";
      } else if (match.completed) {
        statusText = "Jugado";
      } else if (match.p1 && match.p2) {
        statusText = "Listo";
      }

      header.innerHTML = `
        <span class="bracket-match-id">[${match.id}]</span>
        <span>${statusText}</span>
      `;
      card.appendChild(header);

      // Player 1
      const p1Row = document.createElement("div");
      p1Row.className = "bracket-player-row";
      const p1NameClass = !match.p1 ? "placeholder-player" : (match.completed && match.score1 > match.score2 ? "winner-highlight" : "");
      const p1Name = match.p1 || "Por definir...";
      p1Row.innerHTML = `
        <span class="bracket-player-name ${p1NameClass}">${p1Name}</span>
        <input type="number" class="bracket-score-input" id="score-p1-${match.id}" value="${match.score1 !== null ? match.score1 : 0}" min="0" ${(!match.p1 || !match.p2 || match.completed || match.isBye) ? 'disabled' : ''}>
      `;
      card.appendChild(p1Row);

      // Player 2
      const p2Row = document.createElement("div");
      p2Row.className = "bracket-player-row";
      const p2NameClass = !match.p2 ? "placeholder-player" : (match.completed && match.score2 > match.score1 ? "winner-highlight" : "");
      const p2Name = match.p2 || "Por definir...";
      p2Row.innerHTML = `
        <span class="bracket-player-name ${p2NameClass}">${p2Name}</span>
        <input type="number" class="bracket-score-input" id="score-p2-${match.id}" value="${match.score2 !== null ? match.score2 : 0}" min="0" ${(!match.p1 || !match.p2 || match.completed || match.isBye) ? 'disabled' : ''}>
      `;
      card.appendChild(p2Row);

      // Character entries
      if (match.p1 && match.p2 && !match.isBye) {
        const charInputs = document.createElement("div");
        charInputs.style.display = "flex";
        charInputs.style.flexDirection = "column";
        charInputs.style.gap = "4px";
        charInputs.style.marginTop = "4px";

        // Generate P1 presets markup
        const p1Presets = getPlayerCharacterPresets(match.p1);
        let p1PresetSelectHTML = "";
        if (p1Presets.length > 0 && !match.completed) {
          p1PresetSelectHTML = `
            <select class="admin-standing-select" id="preset-p1-${match.id}" style="margin-top: 2px; font-size: 0.8rem; padding: 2px 4px; width: 100%;">
              <option value="" disabled selected>Personajes previos...</option>
              ${p1Presets.map(chars => `<option value="${chars}">${chars}</option>`).join("")}
            </select>
          `;
        }

        // Generate P2 presets markup
        const p2Presets = getPlayerCharacterPresets(match.p2);
        let p2PresetSelectHTML = "";
        if (p2Presets.length > 0 && !match.completed) {
          p2PresetSelectHTML = `
            <select class="admin-standing-select" id="preset-p2-${match.id}" style="margin-top: 2px; font-size: 0.8rem; padding: 2px 4px; width: 100%;">
              <option value="" disabled selected>Personajes previos...</option>
              ${p2Presets.map(chars => `<option value="${chars}">${chars}</option>`).join("")}
            </select>
          `;
        }

        charInputs.innerHTML = `
          <div style="display: flex; flex-direction: column;">
            <input type="text" class="bracket-chars-input" id="chars-p1-${match.id}" placeholder="Personajes de ${match.p1}" value="${match.chars1 || ''}" ${match.completed ? 'disabled' : ''}>
            ${p1PresetSelectHTML}
          </div>
          <div style="display: flex; flex-direction: column; margin-top: 4px;">
            <input type="text" class="bracket-chars-input" id="chars-p2-${match.id}" placeholder="Personajes de ${match.p2}" value="${match.chars2 || ''}" ${match.completed ? 'disabled' : ''}>
            ${p2PresetSelectHTML}
          </div>
        `;
        card.appendChild(charInputs);

        // Bind preset selection listeners
        if (p1Presets.length > 0 && !match.completed) {
          const selectEl = charInputs.querySelector(`#preset-p1-${match.id}`);
          if (selectEl) {
            selectEl.addEventListener("change", () => {
              const inputEl = charInputs.querySelector(`#chars-p1-${match.id}`);
              if (inputEl) inputEl.value = selectEl.value;
            });
          }
        }

        if (p2Presets.length > 0 && !match.completed) {
          const selectEl = charInputs.querySelector(`#preset-p2-${match.id}`);
          if (selectEl) {
            selectEl.addEventListener("change", () => {
              const inputEl = charInputs.querySelector(`#chars-p2-${match.id}`);
              if (inputEl) inputEl.value = selectEl.value;
            });
          }
        }
      }

      // Actions
      if (match.p1 && match.p2 && !match.isBye) {
        const actions = document.createElement("div");
        actions.className = "bracket-actions";

        if (!match.completed) {
          actions.innerHTML = `<button type="button" class="btn-action" style="font-size: 0.8rem; padding: 2px 8px; min-height: auto; height: 26px;" id="btn-save-match-${match.id}">Confirmar</button>`;
          card.appendChild(actions);

          actions.querySelector("button").addEventListener("click", () => {
            const s1 = parseInt(document.getElementById(`score-p1-${match.id}`).value) || 0;
            const s2 = parseInt(document.getElementById(`score-p2-${match.id}`).value) || 0;
            const c1 = document.getElementById(`chars-p1-${match.id}`).value.trim();
            const c2 = document.getElementById(`chars-p2-${match.id}`).value.trim();

            if (s1 === s2) {
              alert("Los combates en un bracket no pueden terminar en empate.");
              return;
            }

            const tourMatch = advanceBracketMatch(bracket, match.id, s1, s2, c1, c2);
            if (tourMatch) {
              const existingIdx = state.adminMatches.findIndex(m => m.round === tourMatch.round && m.p1 === tourMatch.p1 && m.p2 === tourMatch.p2);
              if (existingIdx >= 0) {
                state.adminMatches[existingIdx] = tourMatch;
              } else {
                state.adminMatches.push(tourMatch);
              }

              renderAdminMatches();
              renderBracket();
              checkBracketCompletionAndFillPodium();
            }
          });
        } else {
          actions.innerHTML = `<button type="button" class="btn-secondary" style="font-size: 0.8rem; padding: 2px 8px; min-height: auto; height: 26px;" id="btn-edit-match-${match.id}">Editar</button>`;
          card.appendChild(actions);

          actions.querySelector("button").addEventListener("click", () => {
            match.completed = false;
            // Remove from registered list
            state.adminMatches = state.adminMatches.filter(m => !(m.round === match.round && m.p1 === match.p1 && m.p2 === match.p2));
            renderAdminMatches();
            renderBracket();
            checkBracketCompletionAndFillPodium();
          });
        }
      }

      col.appendChild(card);
    });

    roundsContainer.appendChild(col);
  });
}

// Automatically check if the bracket is finished and populate the podium selections
function checkBracketCompletionAndFillPodium() {
  const bracket = state.adminBracket;
  if (!bracket) return;

  let finalMatchId = "";
  if (bracket.type === "single") {
    if (bracket.size === 4) finalMatchId = "W3";
    else if (bracket.size === 8) finalMatchId = "W7";
    else if (bracket.size === 16) finalMatchId = "W15";
  } else if (bracket.type === "double") {
    finalMatchId = bracket.matches["GF2"] ? "GF2" : "GF1";
  }

  const finalMatch = bracket.matches[finalMatchId];
  if (!finalMatch || !finalMatch.completed) return;

  let champion = "";
  let runnerUp = "";

  if (finalMatch.score1 > finalMatch.score2) {
    champion = finalMatch.p1;
    runnerUp = finalMatch.p2;
  } else {
    champion = finalMatch.p2;
    runnerUp = finalMatch.p1;
  }

  const select1 = document.querySelector(`#admin-standings-list .admin-standing-select[data-rank="1"]`);
  const select2 = document.querySelector(`#admin-standings-list .admin-standing-select[data-rank="2"]`);

  if (select1) select1.value = champion;
  if (select2) select2.value = runnerUp;

  if (bracket.type === "double") {
    let losersFinalId = "";
    if (bracket.size === 4) losersFinalId = "L2";
    else if (bracket.size === 8) losersFinalId = "L6";
    else if (bracket.size === 16) losersFinalId = "L14";

    const losersFinal = bracket.matches[losersFinalId];
    if (losersFinal && losersFinal.completed) {
      let thirdPlace = "";
      if (losersFinal.score1 > losersFinal.score2) {
        thirdPlace = losersFinal.p2;
      } else {
        thirdPlace = losersFinal.p1;
      }

      const select3 = document.querySelector(`#admin-standings-list .admin-standing-select[data-rank="3"]`);
      if (select3) select3.value = thirdPlace;
    }
  }
}

// ADMIN TOOLS: Validate and Generate JSON string output
function generateTournamentJSON() {
  const id = document.getElementById("admin-tour-id").value.trim();
  const name = document.getElementById("admin-tour-name").value.trim();
  const date = document.getElementById("admin-tour-date").value;
  const mode = document.getElementById("admin-tour-mode").value;
  const game = document.getElementById("admin-tour-game").value.trim();

  if (!id || !name || !date || !mode || !game) {
    alert("Por favor, rellena los campos básicos del torneo (ID, Nombre, Fecha, Modalidad y Juego).");
    return;
  }

  if (state.adminParticipants.length === 0) {
    alert("Debes añadir al menos un participante.");
    return;
  }

  // Parse standings
  const standingsSelects = document.querySelectorAll("#admin-standings-list .admin-standing-select");
  const standings = [];
  const selectedStandings = new Set();
  let standingsError = false;

  standingsSelects.forEach(select => {
    const rank = parseInt(select.getAttribute("data-rank"));
    const player = select.value;
    
    if (!player) {
      // 3rd place is optional
      if (rank === 3) {
        return;
      }
      alert(`Por favor, selecciona al jugador para el ${rank}º puesto.`);
      standingsError = true;
      return;
    }

    if (selectedStandings.has(player)) {
      alert(`Jugador repetido en posiciones de podio: ${player}`);
      standingsError = true;
      return;
    }

    selectedStandings.add(player);
    standings.push({ rank, player });
  });

  if (standingsError) return;

  // Construct Final Object
  const tournamentObj = {
    id,
    name,
    date,
    mode,
    game,
    participants: [...state.adminParticipants],
    matches: [...state.adminMatches],
    standings
  };

  // Stringify with pretty printing indentation
  const jsonOutput = JSON.stringify(tournamentObj, null, 2);
  
  // Update Outputs
  document.getElementById("admin-json-output").value = jsonOutput;
  document.getElementById("admin-inst-filename").textContent = `${id}.json`;
  
  // Generate metadata entry output
  const metaObj = {
    id,
    filename: `${id}.json`,
    name,
    date,
    mode,
    game
  };
  
  // Format the snippet to add to index registry
  const registrySnippet = JSON.stringify(metaObj, null, 2);
  document.getElementById("admin-registry-output").textContent = registrySnippet;

  // Enable buttons
  document.getElementById("btn-admin-download").disabled = false;
  document.getElementById("btn-admin-copy").disabled = false;
}
