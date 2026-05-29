// User Interface Navigation and Rendering Module
import { state } from './state.js';
import { calculateStatistics, getH2HStats, getPalmaresMedals, formatDate } from './stats.js';

// Sidebar & Tab Navigation
export function setupNavigation() {
  const navButtons = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".tab-section");
  const pageTitle = document.getElementById("page-title");
  
  // Mobile Sidebar Controls
  const sidebar = document.getElementById("sidebar");
  const btnOpen = document.getElementById("btn-open-sidebar");
  const btnClose = document.getElementById("btn-close-sidebar");

  if (btnOpen && sidebar) {
    btnOpen.addEventListener("click", () => sidebar.classList.add("open"));
  }
  if (btnClose && sidebar) {
    btnClose.addEventListener("click", () => sidebar.classList.remove("open"));
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      
      // Close mobile sidebar if open
      if (sidebar) sidebar.classList.remove("open");
      
      // Switch Active Class on buttons
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Switch Active Class on sections with transitions
      sections.forEach(sec => {
        if (sec.id === targetId) {
          sec.hidden = false;
          // Trigger reflow to run animation
          sec.offsetHeight;
          sec.classList.add("active");
        } else {
          sec.classList.remove("active");
          sec.hidden = true;
        }
      });

      // Update header title based on tab
      const buttonText = btn.textContent.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
      pageTitle.textContent = buttonText;
      state.activeTab = targetId;

      // Special triggers on section switch
      if (targetId === "sec-leaderboard") {
        renderLeaderboard();
      } else if (targetId === "sec-palmares") {
        renderPalmares();
      }
    });
  });

  // Dashboard shortcut to leaderboard
  const linkToLeaderboard = document.getElementById("link-to-leaderboard");
  if (linkToLeaderboard) {
    linkToLeaderboard.addEventListener("click", () => {
      document.getElementById("tab-leaderboard").click();
    });
  }
}

// Global UI Event Listeners
export function setupUIEventListeners() {
  // Head-to-Head dropdown change
  const selectP1 = document.getElementById("select-h2h-p1");
  const selectP2 = document.getElementById("select-h2h-p2");
  
  if (selectP1 && selectP2) {
    const handleH2HChange = () => {
      const p1 = selectP1.value;
      const p2 = selectP2.value;
      if (p1 && p2) {
        calculateAndRenderH2H(p1, p2);
      }
    };
    selectP1.addEventListener("change", handleH2HChange);
    selectP2.addEventListener("change", handleH2HChange);
  }

  // Leaderboard search filter
  const searchInput = document.getElementById("input-search-leaderboard");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderLeaderboard();
    });
  }

  // Leaderboard game filter
  const gameSelect = document.getElementById("select-leaderboard-game");
  if (gameSelect) {
    gameSelect.addEventListener("change", () => {
      // Reset sort indicators to default (rank sorted-asc)
      const headers = document.querySelectorAll("#table-full-leaderboard th.sortable");
      headers.forEach(h => h.classList.remove("sorted-asc", "sorted-desc"));
      const defaultHeader = document.querySelector("#table-full-leaderboard th[data-sort='rank']");
      if (defaultHeader) defaultHeader.classList.add("sorted-asc");
      
      renderLeaderboard();
    });
  }

  // Leaderboard column sorting
  const headers = document.querySelectorAll("#table-full-leaderboard th.sortable");
  headers.forEach(header => {
    header.addEventListener("click", () => {
      const sortField = header.getAttribute("data-sort");
      const isAsc = header.classList.contains("sorted-desc") || !header.classList.contains("sorted-asc");
      
      // Reset all headers
      headers.forEach(h => {
        h.classList.remove("sorted-asc", "sorted-desc");
      });
      
      header.classList.add(isAsc ? "sorted-asc" : "sorted-desc");
      sortLeaderboardTable(sortField, isAsc);
    });
  });
}

// Populate Dropdowns in H2H
export function populateH2HSelectors() {
  const selectP1 = document.getElementById("select-h2h-p1");
  const selectP2 = document.getElementById("select-h2h-p2");
  
  if (!selectP1 || !selectP2) return;

  // Clear previous options except placeholders
  selectP1.innerHTML = `<option value="" disabled selected>Selecciona jugador A</option>`;
  selectP2.innerHTML = `<option value="" disabled selected>Selecciona jugador B</option>`;

  const sortedPlayers = Object.keys(state.playersStats).sort();

  sortedPlayers.forEach(p => {
    const opt1 = document.createElement("option");
    opt1.value = p;
    opt1.textContent = p;
    selectP1.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = p;
    opt2.textContent = p;
    selectP2.appendChild(opt2);
  });
}

// Populate Leaderboard Game Filter options
export function populateGameFilters() {
  const selectGame = document.getElementById("select-leaderboard-game");
  if (!selectGame) return;

  selectGame.innerHTML = `<option value="all">Todos los juegos</option>`;

  // Find unique games
  const uniqueGames = [...new Set(state.tournamentsDetails.map(t => t.game || "Dragon Ball FighterZ"))].sort();

  uniqueGames.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    selectGame.appendChild(opt);
  });
}

// RENDER: OVERVIEW
export function renderOverview() {
  const totalTournaments = state.tournamentsMetadata.length;
  const totalPlayers = Object.keys(state.playersStats).length;

  document.getElementById("stat-total-tournaments").textContent = totalTournaments;
  document.getElementById("stat-total-players").textContent = totalPlayers;

  // Count total matches played across all tournaments
  let totalMatchesCount = 0;
  state.tournamentsDetails.forEach(t => totalMatchesCount += t.matches.length);
  document.getElementById("stat-total-matches").textContent = totalMatchesCount;

  // Determine current league leader (highest points)
  const playersList = Object.values(state.playersStats);
  playersList.sort((a, b) => b.points - a.points || b.winrate - a.winrate);
  
  const leaderName = playersList.length > 0 ? playersList[0].name : "-";
  document.getElementById("stat-leader-name").textContent = leaderName;

  // Render Top 5 Leaderboard
  const top5 = playersList.slice(0, 5);
  const tbody = document.querySelector("#table-top-leaderboard tbody");
  if (tbody) {
    tbody.innerHTML = "";
    if (top5.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center">No hay registros de clasificación</td></tr>`;
    } else {
      top5.forEach((p, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>#${idx + 1}</strong></td>
          <td>${p.name}</td>
          <td><span class="highlight">${p.points}</span></td>
          <td>${p.played}</td>
          <td>${p.winrate.toFixed(1)}%</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  // Render details of the most recent tournament
  if (state.tournamentsDetails.length > 0) {
    const sortedDetails = [...state.tournamentsDetails].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sortedDetails[0];

    document.getElementById("recent-tournament-mode").textContent = recent.mode;
    document.getElementById("recent-tournament-date").textContent = formatDate(recent.date);
    document.getElementById("recent-tournament-game").textContent = recent.game || "Dragon Ball FighterZ";
    
    // Find winners in standings
    let champion = "-";
    let runnerUp = "-";
    let third = "-";

    if (recent.standings) {
      const s1 = recent.standings.find(s => s.rank === 1);
      const s2 = recent.standings.find(s => s.rank === 2);
      const s3 = recent.standings.find(s => s.rank === 3);

      if (s1) champion = s1.player;
      if (s2) runnerUp = s2.player;
      if (s3) third = s3.player;
    }

    document.getElementById("recent-tournament-winner").textContent = champion;
    document.getElementById("recent-podium-1").textContent = champion;
    document.getElementById("recent-podium-2").textContent = runnerUp;
    document.getElementById("recent-podium-3").textContent = third;
  }
}

// RENDER: LEADERBOARD
export function renderLeaderboard() {
  const tbody = document.querySelector("#table-full-leaderboard tbody");
  if (!tbody) return;

  const filterText = document.getElementById("input-search-leaderboard")?.value.trim() || "";
  const gameFilter = document.getElementById("select-leaderboard-game")?.value || "all";

  // Re-calculate statistics with selected game filter
  const stats = calculateStatistics(gameFilter);
  let list = Object.values(stats);

  // Apply Search Filter
  if (filterText) {
    const textLower = filterText.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(textLower));
  }

  // Sort: By Points (Desc), then by Winrate (Desc), then by Played (Desc)
  list.sort((a, b) => b.points - a.points || b.winrate - a.winrate || b.played - a.played);

  tbody.innerHTML = "";
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">No se encontraron jugadores para esta selección</td></tr>`;
    return;
  }

  list.forEach((p, idx) => {
    const tr = document.createElement("tr");
    // Removed emojis here - replaced with text description
    tr.innerHTML = `
      <td><strong>#${idx + 1}</strong></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="highlight">${p.points}</span></td>
      <td>${p.played}</td>
      <td>${p.wins}</td>
      <td>${p.losses}</td>
      <td>${p.winrate.toFixed(1)}%</td>
      <td>1º: ${p.podiums.gold} | 2º: ${p.podiums.silver} | 3º: ${p.podiums.bronze}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Leaderboard Sort Trigger
export function sortLeaderboardTable(field, asc) {
  const tbody = document.querySelector("#table-full-leaderboard tbody");
  if (!tbody) return;

  const gameFilter = document.getElementById("select-leaderboard-game")?.value || "all";
  const stats = calculateStatistics(gameFilter);
  const list = Object.values(stats);

  const compare = (a, b) => {
    let valA, valB;
    
    switch (field) {
      case "rank":
        valA = a.points;
        valB = b.points;
        break;
      case "player":
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case "points":
        valA = a.points;
        valB = b.points;
        break;
      case "played":
        valA = a.played;
        valB = b.played;
        break;
      case "wins":
        valA = a.wins;
        valB = b.wins;
        break;
      case "losses":
        valA = a.losses;
        valB = b.losses;
        break;
      case "winrate":
        valA = a.winrate;
        valB = b.winrate;
        break;
      case "podiums":
        valA = (a.podiums.gold * 3) + (a.podiums.silver * 2) + a.podiums.bronze;
        valB = (b.podiums.gold * 3) + (b.podiums.silver * 2) + b.podiums.bronze;
        break;
      default:
        valA = a.points;
        valB = b.points;
    }

    if (valA < valB) return asc ? -1 : 1;
    if (valA > valB) return asc ? 1 : -1;
    return 0;
  };

  list.sort(compare);

  tbody.innerHTML = "";
  list.forEach((p) => {
    // Retrieve correct absolute rank based on sorted overall stats
    const listForRanking = Object.values(stats);
    listForRanking.sort((x, y) => y.points - x.points || y.winrate - x.winrate);
    const originalRank = listForRanking.findIndex(x => x.name === p.name) + 1;

    const tr = document.createElement("tr");
    // Removed emojis here
    tr.innerHTML = `
      <td><strong>#${originalRank}</strong></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="highlight">${p.points}</span></td>
      <td>${p.played}</td>
      <td>${p.wins}</td>
      <td>${p.losses}</td>
      <td>${p.winrate.toFixed(1)}%</td>
      <td>1º: ${p.podiums.gold} | 2º: ${p.podiums.silver} | 3º: ${p.podiums.bronze}</td>
    `;
    tbody.appendChild(tr);
  });
}

// RENDER: HEAD TO HEAD
export function calculateAndRenderH2H(playerA, playerB) {
  const placeholder = document.getElementById("h2h-results-placeholder");
  const results = document.getElementById("h2h-results");
  
  if (!placeholder || !results) return;

  placeholder.hidden = true;
  results.hidden = false;

  const h2h = getH2HStats(playerA, playerB);

  // Render Stats Grid
  document.getElementById("h2h-name-p1").textContent = playerA;
  document.getElementById("h2h-name-p2").textContent = playerB;

  const totalMutualMatches = h2h.mutualMatches.length;
  let pctA = 50;
  let pctB = 50;

  if (totalMutualMatches > 0) {
    pctA = (h2h.matchWinsA / totalMutualMatches) * 100;
    pctB = (h2h.matchWinsB / totalMutualMatches) * 100;
  }

  document.getElementById("h2h-pct-p1").textContent = `${pctA.toFixed(0)}%`;
  document.getElementById("h2h-pct-p2").textContent = `${pctB.toFixed(0)}%`;

  // Update visual distribution bar
  document.getElementById("h2h-bar-fill-p1").style.width = `${pctA}%`;
  document.getElementById("h2h-bar-fill-p2").style.width = `${pctB}%`;

  document.getElementById("h2h-wins-p1").textContent = h2h.matchWinsA;
  document.getElementById("h2h-wins-p2").textContent = h2h.matchWinsB;

  document.getElementById("h2h-rounds-p1").textContent = h2h.roundWinsA;
  document.getElementById("h2h-rounds-p2").textContent = h2h.roundWinsB;

  // Favorite character calculation
  const getFavoriteChar = (charsObj) => {
    let fav = "-";
    let max = 0;
    Object.keys(charsObj).forEach(c => {
      if (charsObj[c] > max) {
        max = charsObj[c];
        fav = c;
      }
    });
    return fav;
  };

  const favA = getFavoriteChar(h2h.charsUsedA);
  const favB = getFavoriteChar(h2h.charsUsedB);

  document.getElementById("h2h-main-char-p1").textContent = favA;
  document.getElementById("h2h-main-char-p2").textContent = favB;

  // Render match history list
  const listMatches = document.getElementById("list-h2h-matches");
  listMatches.innerHTML = "";

  if (h2h.mutualMatches.length === 0) {
    listMatches.innerHTML = `<li class="text-center padding-md description-small">No hay registros de combates directos entre estos jugadores.</li>`;
  } else {
    // Sort matches newest first
    const sortedMatches = [...h2h.mutualMatches].sort((x, y) => new Date(y.date) - new Date(x.date));

    sortedMatches.forEach(m => {
      const li = document.createElement("li");
      li.className = "h2h-match-item";
      
      li.innerHTML = `
        <div class="h2h-match-top">
          <span>${formatDate(m.date)} - ${m.tournamentName}</span>
          <span>${m.round}</span>
        </div>
        <div class="h2h-match-body">
          <div class="h2h-match-p ${m.winner === playerA ? 'highlight' : ''}">
            <strong>${playerA}</strong>
            <span class="description-small">${m.charA}</span>
          </div>
          <div class="h2h-match-score">
            <span class="${m.winner === playerA ? 'score-winner' : ''}">${m.scoreA}</span>
            <span> - </span>
            <span class="${m.winner === playerB ? 'score-winner' : ''}">${m.scoreB}</span>
          </div>
          <div class="h2h-match-p align-right ${m.winner === playerB ? 'highlight' : ''}">
            <strong>${playerB}</strong>
            <span class="description-small">${m.charB}</span>
          </div>
        </div>
      `;
      listMatches.appendChild(li);
    });
  }
}

// RENDER: TOURNAMENTS DETAIL & LIST
export function renderTournamentsView() {
  const navContainer = document.getElementById("list-tournaments-nav");
  if (!navContainer) return;

  navContainer.innerHTML = "";
  if (state.tournamentsMetadata.length === 0) {
    navContainer.innerHTML = `<p class="text-center padding-md">No hay torneos registrados.</p>`;
    return;
  }

  state.tournamentsMetadata.forEach(meta => {
    const btn = document.createElement("button");
    btn.className = "tournament-nav-btn";
    btn.setAttribute("data-id", meta.id);
    
    // Find champion
    const detail = state.tournamentsDetails.find(d => d.id === meta.id);
    let champName = "-";
    if (detail && detail.standings) {
      const stand1 = detail.standings.find(s => s.rank === 1);
      if (stand1) champName = stand1.player;
    }

    btn.innerHTML = `
      <span class="tour-nav-name">${meta.name}</span>
      <div class="tour-nav-meta">
        <span>${formatDate(meta.date)}</span>
        <span>1º: ${champName}</span>
      </div>
    `;

    btn.addEventListener("click", () => {
      // Toggle active classes
      document.querySelectorAll(".tournament-nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      showTournamentDetails(meta.id);
    });

    navContainer.appendChild(btn);
  });

  // Setup sub-tabs event inside details view
  const detailTabs = document.querySelectorAll(".det-tab-btn");
  detailTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("data-det-target");
      
      detailTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".det-tab-section").forEach(sec => {
        sec.hidden = sec.id !== targetId;
      });
    });
  });
}

export function showTournamentDetails(tournamentId) {
  const placeholder = document.getElementById("tournament-detail-placeholder");
  const content = document.getElementById("tournament-detail-content");
  
  if (!placeholder || !content) return;

  state.selectedTournamentId = tournamentId;
  placeholder.hidden = true;
  content.hidden = false;

  const detail = state.tournamentsDetails.find(d => d.id === tournamentId);
  if (!detail) return;

  // Header Details
  document.getElementById("det-tour-name").textContent = detail.name;
  document.getElementById("det-tour-date").textContent = formatDate(detail.date);
  document.getElementById("det-tour-mode").textContent = detail.mode;
  document.getElementById("det-tour-game").textContent = detail.game || "Dragon Ball FighterZ";

  // Render Participants list
  const listParts = document.getElementById("det-list-participants");
  listParts.innerHTML = "";
  detail.participants.forEach(p => {
    const li = document.createElement("li");
    li.className = "participant-tag-item";
    li.textContent = p;
    listParts.appendChild(li);
  });

  // Render Standings table
  const tbody = document.querySelector("#det-table-standings tbody");
  tbody.innerHTML = "";
  
  const top3Players = new Set();
  
  if (detail.standings && detail.standings.length > 0) {
    const sortedStandings = detail.standings.filter(s => s.rank <= 3).sort((x, y) => x.rank - y.rank);
    sortedStandings.forEach(s => {
      top3Players.add(s.player);
      const tr = document.createElement("tr");
      
      let podiumClass = "";
      if (s.rank === 1) podiumClass = "rank-gold";
      else if (s.rank === 2) podiumClass = "rank-silver";
      else if (s.rank === 3) podiumClass = "rank-bronze";

      tr.innerHTML = `
        <td><strong class="${podiumClass}">${s.rank}º</strong></td>
        <td><strong>${s.player}</strong></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Display other participants as simply placement after 3rd
  if (detail.participants) {
    detail.participants.forEach(p => {
      if (!top3Players.has(p)) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><span style="color: var(--text-muted);">-</span></td>
          <td><span style="color: var(--text-muted);">${p}</span></td>
        `;
        tbody.appendChild(tr);
      }
    });
  }

  // Render Matches list
  const matchesContainer = document.getElementById("det-list-matches");
  matchesContainer.innerHTML = "";
  
  if (detail.matches && detail.matches.length > 0) {
    let currentRound = "";

    detail.matches.forEach(m => {
      const matchWrapper = document.createElement("div");
      matchWrapper.className = "match-card-item";

      const showRoundTag = m.round !== currentRound;
      if (showRoundTag) {
        currentRound = m.round;
      }

      const p1Winner = m.score1 > m.score2;
      const p2Winner = m.score2 > m.score1;

      const t1Markup = m.team1 ? `<span class="match-p-team">${m.team1}</span>` : "";
      const t2Markup = m.team2 ? `<span class="match-p-team">${m.team2}</span>` : "";

      matchWrapper.innerHTML = `
        ${showRoundTag ? `<div class="match-round-tag">${m.round}</div>` : ''}
        <div class="match-p-box ${p1Winner ? 'highlight' : ''}">
          <span class="match-p-name">${m.p1}</span>
          <span class="match-p-char">${m.chars1 || "-"}</span>
          ${t1Markup}
        </div>
        <div class="match-score-box">
          <span class="${p1Winner ? 'score-winner' : ''}">${m.score1}</span>
          <span> - </span>
          <span class="${p2Winner ? 'score-winner' : ''}">${m.score2}</span>
        </div>
        <div class="match-p-box align-right ${p2Winner ? 'highlight' : ''}">
          <span class="match-p-name">${m.p2}</span>
          <span class="match-p-char">${m.chars2 || "-"}</span>
          ${t2Markup}
        </div>
      `;
      matchesContainer.appendChild(matchWrapper);
    });
  } else {
    matchesContainer.innerHTML = `<p class="text-center padding-md description-small">No hay combates registrados.</p>`;
  }
}

// RENDER: PALMARES (Hall of Fame)
export function renderPalmares() {
  const summaryContainer = document.getElementById("palmares-summary");
  const timelineContainer = document.getElementById("palmares-timeline");
  
  if (!summaryContainer || !timelineContainer) return;

  const medalsList = getPalmaresMedals();

  // Render Summary Cards (Champions Leaderboard)
  summaryContainer.innerHTML = "";
  if (medalsList.length === 0) {
    summaryContainer.innerHTML = `<p class="text-center padding-md">No hay podios registrados.</p>`;
  } else {
    const medalWinners = medalsList.filter(m => m.gold > 0 || m.silver > 0 || m.bronze > 0);
    
    medalWinners.forEach((m, idx) => {
      const card = document.createElement("div");
      card.className = "palmares-podium-card glass";
      
      let titleLabel = "Podio";
      if (idx === 0 && m.gold > 0) titleLabel = "Líder de Oro";

      card.innerHTML = `
        <span class="palmares-crown" style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--accent-color); letter-spacing: 0.05em;">${titleLabel}</span>
        <span class="palmares-player" style="margin-block: var(--spacing-xs);">${m.name}</span>
        <div class="palmares-stats" style="font-size: 0.85rem; line-height: 1.6;">
          <div>1º Lugar: <strong>${m.gold}</strong></div>
          <div>2º Lugar: <strong>${m.silver}</strong></div>
          <div>3º Lugar: <strong>${m.bronze}</strong></div>
        </div>
      `;
      summaryContainer.appendChild(card);
    });
  }

  // Render Timeline of champions per edition (sorted chronologically descending)
  timelineContainer.innerHTML = "";
  const sortedDetails = [...state.tournamentsDetails].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sortedDetails.length === 0) {
    timelineContainer.innerHTML = `<p class="text-center padding-md">No hay torneos en el historial.</p>`;
  } else {
    sortedDetails.forEach(tour => {
      const item = document.createElement("div");
      item.className = "timeline-item";
      
      let champ = "Desconocido";
      let runnerUp = "Desconocido";
      let third = "Desconocido";

      if (tour.standings) {
        const s1 = tour.standings.find(s => s.rank === 1);
        const s2 = tour.standings.find(s => s.rank === 2);
        const s3 = tour.standings.find(s => s.rank === 3);

        if (s1) champ = s1.player;
        if (s2) runnerUp = s2.player;
        if (s3) third = s3.player;
      }

      item.innerHTML = `
        <div class="timeline-header">
          <span>${formatDate(tour.date)}</span>
          <span class="tag-mode">${tour.mode}</span>
        </div>
        <div class="timeline-body">
          <div>
            <strong>${tour.name}</strong>
            <div class="timeline-winner">Campeón: ${champ}</div>
          </div>
          <div class="timeline-runners text-center">
            <div>2º: ${runnerUp}</div>
            <div>3º: ${third}</div>
          </div>
        </div>
      `;
      timelineContainer.appendChild(item);
    });
  }
}
