// Statistics Calculations Engine
import { state } from './state.js';

// Calculate overall player standings/records, supports filtering by specific game
export function calculateStatistics(gameFilter = "all") {
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

// Calculate Head-to-Head records between two specific players
export function getH2HStats(playerA, playerB) {
  let matchWinsA = 0;
  let matchWinsB = 0;
  let roundWinsA = 0;
  let roundWinsB = 0;
  const charsUsedA = {};
  const charsUsedB = {};
  const mutualMatches = [];

  state.tournamentsDetails.forEach(tour => {
    tour.matches.forEach(m => {
      const isMatch = (m.p1 === playerA && m.p2 === playerB) || (m.p1 === playerB && m.p2 === playerA);
      if (!isMatch) return;

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

      if (charA && charA !== "-") charsUsedA[charA] = (charsUsedA[charA] || 0) + 1;
      if (charB && charB !== "-") charsUsedB[charB] = (charsUsedB[charB] || 0) + 1;

      mutualMatches.push({
        date: tour.date,
        tournamentName: tour.name,
        round: m.round,
        charA,
        charB,
        scoreA,
        scoreB,
        winner
      });
    });
  });

  return {
    matchWinsA,
    matchWinsB,
    roundWinsA,
    roundWinsB,
    charsUsedA,
    charsUsedB,
    mutualMatches
  };
}

// Extract and calculate overall medals list
export function getPalmaresMedals() {
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
  return medalsList;
}

// Utility: Format Date string to Spanish
export function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = String(date.getUTCDate()).padStart(2, '0');
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const monthName = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day} ${monthName} ${year}`;
}

// Calculate player detailed stats (boxing record, game filter, teams usage & history)
export function getPlayerDetailedStats(playerName, gameFilter = "all") {
  let wins = 0;
  let losses = 0;
  let played = 0;
  
  const podiums = { gold: 0, silver: 0, bronze: 0 };
  const teamFrequencies = {};
  const charFrequencies = {};
  const tournamentHistory = [];

  state.tournamentsDetails.forEach(tour => {
    // Check game filter
    const tourGame = tour.game || "Dragon Ball FighterZ";
    if (gameFilter !== "all" && tourGame !== gameFilter) {
      return;
    }

    // Check if player participated
    const hasParticipated = tour.participants.includes(playerName);
    if (!hasParticipated) {
      return;
    }

    // Determine rank in standings (only 1º, 2º, and 3º are recognized)
    let rank = "-";
    if (tour.standings) {
      const stand = tour.standings.find(s => s.player === playerName);
      if (stand) {
        const tourRank = stand.rank;
        if (tourRank === 1) {
          rank = 1;
          podiums.gold++;
        } else if (tourRank === 2) {
          rank = 2;
          podiums.silver++;
        } else if (tourRank === 3) {
          rank = 3;
          podiums.bronze++;
        }
      }
    }

    // Add to history
    tournamentHistory.push({
      id: tour.id,
      name: tour.name,
      date: tour.date,
      game: tourGame,
      mode: tour.mode,
      rank: rank
    });

    // Gather matches and count wins/losses and characters/teams
    tour.matches.forEach(m => {
      const isPlayerMatch = (m.p1 === playerName || m.p2 === playerName);
      if (!isPlayerMatch) return;

      played++;
      let myScore, opponentScore, myChars;
      if (m.p1 === playerName) {
        myScore = m.score1;
        opponentScore = m.score2;
        myChars = m.chars1;
      } else {
        myScore = m.score2;
        opponentScore = m.score1;
        myChars = m.chars2;
      }

      if (myScore > opponentScore) {
        wins++;
      } else if (opponentScore > myScore) {
        losses++;
      }

      // Process Team/Chars if they are defined
      if (myChars && myChars !== "-") {
        // Individual Characters count: split by comma, trim, count
        const charsList = myChars.split(",").map(c => c.trim()).filter(Boolean);
        charsList.forEach(char => {
          charFrequencies[char] = (charFrequencies[char] || 0) + 1;
        });

        // Team count: split, trim, sort alphabetically, join with " / "
        if (charsList.length > 0) {
          const sortedTeam = [...charsList].sort().join(" / ");
          teamFrequencies[sortedTeam] = (teamFrequencies[sortedTeam] || 0) + 1;
        }
      }
    });
  });

  // Calculate Winrate
  const winrate = played > 0 ? (wins / played) * 100 : 0;

  // Format team frequencies to sorted list
  const teamsList = Object.entries(teamFrequencies).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count);

  // Format char frequencies to sorted list
  const charsList = Object.entries(charFrequencies).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count);

  // Sort history newest first
  tournamentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    playerName,
    wins,
    losses,
    winrate,
    played,
    podiums,
    teamsList,
    charsList,
    tournamentHistory
  };
}
