// Administrator Page Control Module (JSON Generator Form)
import { state } from './state.js';

export function setupAdminControls() {
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

  // Admin Tools: Add Match
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

    const labels = ["1º (Campeón)", "2º (Subcampeón)", "3º Lugar"];

    div.innerHTML = `
      <span class="standing-rank-lbl" style="width: 125px; text-align: left;">${labels[i-1]}:</span>
      <select class="admin-standing-select" data-rank="${i}">
        ${selectOptions}
      </select>
    `;
    
    container.appendChild(div);
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
  const standingsSelects = document.querySelectorAll(".admin-standing-select");
  const standings = [];
  const selectedStandings = new Set();
  let standingsError = false;

  standingsSelects.forEach(select => {
    const rank = parseInt(select.getAttribute("data-rank"));
    const player = select.value;
    
    if (!player) {
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
