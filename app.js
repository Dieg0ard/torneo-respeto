// Application State
const state = {
  tournamentsMetadata: [], // loaded from data/tournaments.json
  tournamentsDetails: [],  // loaded from data/tournaments/torneo_X.json
  playersStats: {},        // computed player stats
  activeTab: "sec-overview",
  selectedTournamentId: null,
  adminParticipants: [],
  adminMatches: []
};

// Initialize Application

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupNavigation();
  setupEventListeners();
  loadData();
});

// Theme Management
function initTheme() {
  const btn = document.getElementById("btn-theme-toggle");
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  
  if (!btn) return;
  
  const updateThemeIcon = (theme) => {
    const sun = btn.querySelector(".theme-icon-sun");
    const moon = btn.querySelector(".theme-icon-moon");
    if (!sun || !moon) return;
    
    if (theme === "dark") {
      sun.style.display = "block";
      moon.style.display = "none";
    } else {
      sun.style.display = "none";
      moon.style.display = "block";
    }
  };
  
  // Set initial icon
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'system';
  const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkNow = currentTheme === 'dark' || (currentTheme === 'system' && systemIsDark);
  updateThemeIcon(isDarkNow ? "dark" : "light");

  // Toggle button event
  btn.addEventListener("click", () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    let nextTheme = "dark";
    
    if (current === "dark") {
      nextTheme = "light";
    } else if (current === "light") {
      // If we go back to system, determine system preference
      nextTheme = "system";
    }
    
    html.setAttribute('data-theme', nextTheme);
    
    if (nextTheme === "system") {
      localStorage.removeItem("color-scheme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      metaColorScheme.content = "light dark";
      updateThemeIcon(systemDark ? "dark" : "light");
    } else {
      localStorage.setItem("color-scheme", nextTheme);
      metaColorScheme.content = nextTheme;
      updateThemeIcon(nextTheme);
    }
  });

  // Listen to system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (document.documentElement.getAttribute('data-theme') === "system") {
      updateThemeIcon(e.matches ? "dark" : "light");
    }
  });
}

// Sidebar & Tab Navigation
function setupNavigation() {
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

// Global Event Listeners (H2H, Leaderboard Search, Admin controls)
function setupEventListeners() {
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
    searchInput.addEventListener("input", (e) => {
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

// Fetch files from local directory structure
async function loadData() {
  try {
    const response = await fetch("data/tournaments.json");
    if (!response.ok) throw new Error("No se pudo cargar data/tournaments.json");
    
    state.tournamentsMetadata = await response.json();
    
    // Sort metadata chronologically by date descending
    state.tournamentsMetadata.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Fetch details of all tournaments in parallel
    const detailsPromises = state.tournamentsMetadata.map(async (meta) => {
      const res = await fetch(`data/tournaments/${meta.filename}`);
      if (!res.ok) throw new Error(`No se pudo cargar el detalle del torneo: ${meta.filename}`);
      return await res.json();
    });

    state.tournamentsDetails = await Promise.all(detailsPromises);
    
    // Calculate global stats
    state.playersStats = calculateStatistics("all");
    
    // Populate Game Dropdown Filters
    populateGameFilters();
    
    // Populate H2H selection lists
    populateH2HSelectors();
    
    // Render views
    renderOverview();
    renderTournamentsView();
    
    // Setup date placeholder in administrator
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("admin-tour-date").value = today;

  } catch (error) {
    console.error("Error al cargar los datos del torneo:", error);
    document.querySelector(".status-indicator").innerHTML = `⚠️ Error al cargar datos`;
    document.querySelector(".status-indicator").style.backgroundColor = "oklch(40% 0.15 20)";
  }
}

// Compute Statistics (Leaderboard & League Stats)
function calculateStatistics(gameFilter = "all") {
  const stats = {};

  // Process each player that participated
  state.tournamentsDetails.forEach(tour => {
    // Filter by game if specified
    if (gameFilter !== "all" && (tour.game || "Dragon Ball FighterZ") !== gameFilter) {
      return;
    }

    // Register players who joined
    tour.participants.forEach(p => {
      if (!stats[p]) {
        stats[p] = {
          name: p,
          points: 0,
          played: 0,
          wins: 0,
          losses: 0,
          podiums: { gold: 0, silver: 0, bronze: 0 }
        };
      }
      // 1 point for participating
      stats[p].points += 1;
    });

    // Award podium points
    if (tour.standings) {
      tour.standings.forEach(stand => {
        const p = stand.player;
        if (stats[p]) {
          if (stand.rank === 1) {
            stats[p].points += 10;
            stats[p].podiums.gold += 1;
          } else if (stand.rank === 2) {
            stats[p].points += 6;
            stats[p].podiums.silver += 1;
          } else if (stand.rank === 3) {
            stats[p].points += 4;
            stats[p].podiums.bronze += 1;
          }
        }
      });
    }

    // Process individual matches for Win/Loss metrics
    tour.matches.forEach(m => {
      const p1 = m.p1;
      const p2 = m.p2;

      if (!stats[p1] || !stats[p2]) return;

      stats[p1].played += 1;
      stats[p2].played += 1;

      if (m.score1 > m.score2) {
        stats[p1].wins += 1;
        stats[p2].losses += 1;
      } else if (m.score2 > m.score1) {
        stats[p2].wins += 1;
        stats[p1].losses += 1;
      }
    });
  });

  // Calculate percentages
  Object.keys(stats).forEach(p => {
    const s = stats[p];
    s.winrate = s.played > 0 ? (s.wins / s.played) * 100 : 0;
  });

  return stats;
}

// Populate Dropdowns in H2H
function populateH2HSelectors() {
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
function populateGameFilters() {
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
function renderOverview() {
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
    // Sort details chronologically
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
function renderLeaderboard() {
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

  // Initial Sort: By Points (Desc), then by Winrate (Desc), then by Played (Desc)
  list.sort((a, b) => b.points - a.points || b.winrate - a.winrate || b.played - a.played);

  tbody.innerHTML = "";
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">No se encontraron jugadores para esta selección</td></tr>`;
    return;
  }

  list.forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>#${idx + 1}</strong></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="highlight">${p.points}</span></td>
      <td>${p.played}</td>
      <td>${p.wins}</td>
      <td>${p.losses}</td>
      <td>${p.winrate.toFixed(1)}%</td>
      <td>🥇 ${p.podiums.gold} | 🥈 ${p.podiums.silver} | 🥉 ${p.podiums.bronze}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Leaderboard Sort Trigger
function sortLeaderboardTable(field, asc) {
  const tbody = document.querySelector("#table-full-leaderboard tbody");
  if (!tbody) return;

  const gameFilter = document.getElementById("select-leaderboard-game")?.value || "all";
  const stats = calculateStatistics(gameFilter);
  const list = Object.values(stats);

  const compare = (a, b) => {
    let valA, valB;
    
    switch (field) {
      case "rank":
        // Sort rank translates to default order by points descending
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
        // Calculate weighted podium score for sorting
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
  list.forEach((p, idx) => {
    // Retrieve correct absolute rank based on sorted overall stats
    const listForRanking = Object.values(stats);
    listForRanking.sort((x, y) => y.points - x.points || y.winrate - x.winrate);
    const originalRank = listForRanking.findIndex(x => x.name === p.name) + 1;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>#${originalRank}</strong></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="highlight">${p.points}</span></td>
      <td>${p.played}</td>
      <td>${p.wins}</td>
      <td>${p.losses}</td>
      <td>${p.winrate.toFixed(1)}%</td>
      <td>🥇 ${p.podiums.gold} | 🥈 ${p.podiums.silver} | 🥉 ${p.podiums.bronze}</td>
    `;
    tbody.appendChild(tr);
  });
}

// RENDER: HEAD TO HEAD
function calculateAndRenderH2H(playerA, playerB) {
  const placeholder = document.getElementById("h2h-results-placeholder");
  const results = document.getElementById("h2h-results");
  
  if (!placeholder || !results) return;

  placeholder.hidden = true;
  results.hidden = false;

  // Stats Counters
  let matchWinsA = 0;
  let matchWinsB = 0;
  let roundWinsA = 0;
  let roundWinsB = 0;
  
  const charsUsedA = {};
  const charsUsedB = {};
  
  const mutualMatches = [];

  // Filter matches where they played against each other
  state.tournamentsDetails.forEach(tour => {
    tour.matches.forEach(m => {
      const isMatch = (m.p1 === playerA && m.p2 === playerB) || (m.p1 === playerB && m.p2 === playerA);
      if (!isMatch) return;

      const dateStr = tour.date;
      const tourName = tour.name;

      let winner, scoreA, scoreB, charA, charB;

      if (m.p1 === playerA) {
        scoreA = m.score1;
        scoreB = m.score2;
        charA = m.chars1 || "-";
        charB = m.chars2 || "-";
      } else {
        scoreA = m.score2;
        scoreB = m.score1;
        charA = m.chars2 || "-";
        charB = m.chars1 || "-";
      }

      if (scoreA > scoreB) {
        winner = playerA;
        matchWinsA++;
      } else if (scoreB > scoreA) {
        winner = playerB;
        matchWinsB++;
      }

      roundWinsA += scoreA;
      roundWinsB += scoreB;

      // Track character usage
      if (charA && charA !== "-") charsUsedA[charA] = (charsUsedA[charA] || 0) + 1;
      if (charB && charB !== "-") charsUsedB[charB] = (charsUsedB[charB] || 0) + 1;

      mutualMatches.push({
        date: dateStr,
        tournamentName: tourName,
        round: m.round,
        charA,
        charB,
        scoreA,
        scoreB,
        winner
      });
    });
  });

  // Render Stats Grid
  document.getElementById("h2h-name-p1").textContent = playerA;
  document.getElementById("h2h-name-p2").textContent = playerB;

  const totalMutualMatches = mutualMatches.length;
  let pctA = 50;
  let pctB = 50;

  if (totalMutualMatches > 0) {
    pctA = (matchWinsA / totalMutualMatches) * 100;
    pctB = (matchWinsB / totalMutualMatches) * 100;
  }

  document.getElementById("h2h-pct-p1").textContent = `${pctA.toFixed(0)}%`;
  document.getElementById("h2h-pct-p2").textContent = `${pctB.toFixed(0)}%`;

  // Update visual distribution bar
  document.getElementById("h2h-bar-fill-p1").style.width = `${pctA}%`;
  document.getElementById("h2h-bar-fill-p2").style.width = `${pctB}%`;

  document.getElementById("h2h-wins-p1").textContent = matchWinsA;
  document.getElementById("h2h-wins-p2").textContent = matchWinsB;

  document.getElementById("h2h-rounds-p1").textContent = roundWinsA;
  document.getElementById("h2h-rounds-p2").textContent = roundWinsB;

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

  const favA = getFavoriteChar(charsUsedA);
  const favB = getFavoriteChar(charsUsedB);
  
  // Character visual decorator
  const getCharDecorator = (charName) => {
    return charName;
  };

  document.getElementById("h2h-main-char-p1").textContent = favA !== "-" ? getCharDecorator(favA) : "-";
  document.getElementById("h2h-main-char-p2").textContent = favB !== "-" ? getCharDecorator(favB) : "-";

  // Render match history list
  const listMatches = document.getElementById("list-h2h-matches");
  listMatches.innerHTML = "";

  if (mutualMatches.length === 0) {
    listMatches.innerHTML = `<li class="text-center padding-md description-small">No hay registros de combates directos entre estos jugadores.</li>`;
  } else {
    // Sort matches newest first
    mutualMatches.sort((x, y) => new Date(y.date) - new Date(x.date));

    mutualMatches.forEach(m => {
      const li = document.createElement("li");
      li.className = "h2h-match-item";
      
      const charDecoratedA = getCharDecorator(m.charA);
      const charDecoratedB = getCharDecorator(m.charB);

      li.innerHTML = `
        <div class="h2h-match-top">
          <span>${formatDate(m.date)} - ${m.tournamentName}</span>
          <span>${m.round}</span>
        </div>
        <div class="h2h-match-body">
          <div class="h2h-match-p ${m.winner === playerA ? 'highlight' : ''}">
            <strong>${playerA}</strong>
            <span class="description-small">${charDecoratedA}</span>
          </div>
          <div class="h2h-match-score">
            <span class="${m.winner === playerA ? 'score-winner' : ''}">${m.scoreA}</span>
            <span> - </span>
            <span class="${m.winner === playerB ? 'score-winner' : ''}">${m.scoreB}</span>
          </div>
          <div class="h2h-match-p align-right ${m.winner === playerB ? 'highlight' : ''}">
            <strong>${playerB}</strong>
            <span class="description-small">${charDecoratedB}</span>
          </div>
        </div>
      `;
      listMatches.appendChild(li);
    });
  }
}

// RENDER: TOURNAMENTS DETAIL & LIST
function renderTournamentsView() {
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

function showTournamentDetails(tournamentId) {
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
  
  // Character visual decorator
  const getCharDecorator = (charName) => {
    return charName;
  };

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

      const charDecorated1 = getCharDecorator(m.chars1 || "-");
      const charDecorated2 = getCharDecorator(m.chars2 || "-");

      const t1Markup = m.team1 ? `<span class="match-p-team">${m.team1}</span>` : "";
      const t2Markup = m.team2 ? `<span class="match-p-team">${m.team2}</span>` : "";

      matchWrapper.innerHTML = `
        ${showRoundTag ? `<div class="match-round-tag">${m.round}</div>` : ''}
        <div class="match-p-box ${p1Winner ? 'highlight' : ''}">
          <span class="match-p-name">${m.p1}</span>
          <span class="match-p-char">${charDecorated1}</span>
          ${t1Markup}
        </div>
        <div class="match-score-box">
          <span class="${p1Winner ? 'score-winner' : ''}">${m.score1}</span>
          <span> - </span>
          <span class="${p2Winner ? 'score-winner' : ''}">${m.score2}</span>
        </div>
        <div class="match-p-box align-right ${p2Winner ? 'highlight' : ''}">
          <span class="match-p-name">${m.p2}</span>
          <span class="match-p-char">${charDecorated2}</span>
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
function renderPalmares() {
  const summaryContainer = document.getElementById("palmares-summary");
  const timelineContainer = document.getElementById("palmares-timeline");
  
  if (!summaryContainer || !timelineContainer) return;

  // Calculate medals
  const playerMedals = {};
  
  state.tournamentsDetails.forEach(tour => {
    if (tour.standings) {
      tour.standings.forEach(s => {
        const p = s.player;
        if (!playerMedals[p]) {
          playerMedals[p] = { name: p, gold: 0, silver: 0, bronze: 0 };
        }
        if (s.rank === 1) playerMedals[p].gold++;
        else if (s.rank === 2) playerMedals[p].silver++;
        else if (s.rank === 3) playerMedals[p].bronze++;
      });
    }
  });

  const medalsList = Object.values(playerMedals);
  // Sort by Gold (Desc), then Silver (Desc), then Bronze (Desc)
  medalsList.sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);

  // Render Summary Cards (Champions Leaderboard)
  summaryContainer.innerHTML = "";
  if (medalsList.length === 0) {
    summaryContainer.innerHTML = `<p class="text-center padding-md">No hay podios registrados.</p>`;
  } else {
    // Show only players with at least one medal
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

// ADMIN TOOLS: Generate standings dynamic controls based on player list
function renderAdminStandings() {
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
      // Not filled
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

// Utility: Format Date string to Spanish
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  // Keep it safe for browser zones
  const day = String(date.getUTCDate()).padStart(2, '0');
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const monthName = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day} ${monthName} ${year}`;
}
