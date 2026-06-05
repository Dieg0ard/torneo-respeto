// Tournament Bracket Engine (Single and Double Elimination)
// Supports bracket sizes of 4, 8, and 16 players with automatic BYE resolution.

// Standard seeding mappings for brackets
const SEEDING_ORDERS = {
  4: [0, 3, 1, 2],
  8: [0, 7, 3, 4, 1, 6, 2, 5],
  16: [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10]
};

// Bracket structure definitions
const BRACKET_TEMPLATES = {
  // SINGLE ELIMINATION
  single: {
    4: {
      rounds: [
        { name: "Semifinales", matches: ["W1", "W2"] },
        { name: "Final", matches: ["W3"] }
      ],
      connections: {
        "W1": { next: "W3", slot: "p1" },
        "W2": { next: "W3", slot: "p2" }
      }
    },
    8: {
      rounds: [
        { name: "Cuartos de Final", matches: ["W1", "W2", "W3", "W4"] },
        { name: "Semifinales", matches: ["W5", "W6"] },
        { name: "Final", matches: ["W7"] }
      ],
      connections: {
        "W1": { next: "W5", slot: "p1" },
        "W2": { next: "W5", slot: "p2" },
        "W3": { next: "W6", slot: "p1" },
        "W4": { next: "W6", slot: "p2" },
        "W5": { next: "W7", slot: "p1" },
        "W6": { next: "W7", slot: "p2" }
      }
    },
    16: {
      rounds: [
        { name: "Octavos de Final", matches: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"] },
        { name: "Cuartos de Final", matches: ["W9", "W10", "W11", "W12"] },
        { name: "Semifinales", matches: ["W13", "W14"] },
        { name: "Final", matches: ["W15"] }
      ],
      connections: {
        "W1": { next: "W9", slot: "p1" }, "W2": { next: "W9", slot: "p2" },
        "W3": { next: "W10", slot: "p1" }, "W4": { next: "W10", slot: "p2" },
        "W5": { next: "W11", slot: "p1" }, "W6": { next: "W11", slot: "p2" },
        "W7": { next: "W12", slot: "p1" }, "W8": { next: "W12", slot: "p2" },
        "W9": { next: "W13", slot: "p1" }, "W10": { next: "W13", slot: "p2" },
        "W11": { next: "W14", slot: "p1" }, "W12": { next: "W14", slot: "p2" },
        "W13": { next: "W15", slot: "p1" }, "W14": { next: "W15", slot: "p2" }
      }
    }
  },

  // DOUBLE ELIMINATION
  double: {
    4: {
      rounds: [
        { name: "Ganadores - Semis", matches: ["W1", "W2"] },
        { name: "Ganadores - Final", matches: ["W3"] },
        { name: "Perdedores - Semis", matches: ["L1"] },
        { name: "Perdedores - Final", matches: ["L2"] },
        { name: "Gran Final", matches: ["GF1"] }
      ],
      connections: {
        "W1": { next: "W3", slot: "p1", loser: "L1", loserSlot: "p1" },
        "W2": { next: "W3", slot: "p2", loser: "L1", loserSlot: "p2" },
        "L1": { next: "L2", slot: "p2" },
        "W3": { next: "GF1", slot: "p1", loser: "L2", loserSlot: "p1" },
        "L2": { next: "GF1", slot: "p2" }
      }
    },
    8: {
      rounds: [
        { name: "Ganadores - Ronda 1", matches: ["W1", "W2", "W3", "W4"] },
        { name: "Ganadores - Semis", matches: ["W5", "W6"] },
        { name: "Ganadores - Final", matches: ["W7"] },
        { name: "Perdedores - Ronda 1", matches: ["L1", "L2"] },
        { name: "Perdedores - Ronda 2", matches: ["L3", "L4"] },
        { name: "Perdedores - Semis", matches: ["L5"] },
        { name: "Perdedores - Final", matches: ["L6"] },
        { name: "Gran Final", matches: ["GF1"] }
      ],
      connections: {
        "W1": { next: "W5", slot: "p1", loser: "L1", loserSlot: "p1" },
        "W2": { next: "W5", slot: "p2", loser: "L1", loserSlot: "p2" },
        "W3": { next: "W6", slot: "p1", loser: "L2", loserSlot: "p1" },
        "W4": { next: "W6", slot: "p2", loser: "L2", loserSlot: "p2" },
        "W5": { next: "W7", slot: "p1", loser: "L4", loserSlot: "p1" },
        "W6": { next: "W7", slot: "p2", loser: "L3", loserSlot: "p1" },
        "L1": { next: "L3", slot: "p2" },
        "L2": { next: "L4", slot: "p2" },
        "L3": { next: "L5", slot: "p1" },
        "L4": { next: "L5", slot: "p2" },
        "L5": { next: "L6", slot: "p2" },
        "W7": { next: "GF1", slot: "p1", loser: "L6", loserSlot: "p1" },
        "L6": { next: "GF1", slot: "p2" }
      }
    },
    16: {
      rounds: [
        { name: "Ganadores - Ronda 1", matches: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"] },
        { name: "Ganadores - Quarters", matches: ["W9", "W10", "W11", "W12"] },
        { name: "Ganadores - Semis", matches: ["W13", "W14"] },
        { name: "Ganadores - Final", matches: ["W15"] },
        { name: "Perdedores - Ronda 1", matches: ["L1", "L2", "L3", "L4"] },
        { name: "Perdedores - Ronda 2", matches: ["L5", "L6", "L7", "L8"] },
        { name: "Perdedores - Ronda 3", matches: ["L9", "L10"] },
        { name: "Perdedores - Ronda 4", matches: ["L11", "L12"] },
        { name: "Perdedores - Semis", matches: ["L13"] },
        { name: "Perdedores - Final", matches: ["L14"] },
        { name: "Gran Final", matches: ["GF1"] }
      ],
      connections: {
        "W1": { next: "W9", slot: "p1", loser: "L1", loserSlot: "p1" },
        "W2": { next: "W9", slot: "p2", loser: "L1", loserSlot: "p2" },
        "W3": { next: "W10", slot: "p1", loser: "L2", loserSlot: "p1" },
        "W4": { next: "W10", slot: "p2", loser: "L2", loserSlot: "p2" },
        "W5": { next: "W11", slot: "p1", loser: "L3", loserSlot: "p1" },
        "W6": { next: "W11", slot: "p2", loser: "L3", loserSlot: "p2" },
        "W7": { next: "W12", slot: "p1", loser: "L4", loserSlot: "p1" },
        "W8": { next: "W12", slot: "p2", loser: "L4", loserSlot: "p2" },
        "W9": { next: "W13", slot: "p1", loser: "L6", loserSlot: "p1" },
        "W10": { next: "W13", slot: "p2", loser: "L5", loserSlot: "p1" },
        "W11": { next: "W14", slot: "p1", loser: "L8", loserSlot: "p1" },
        "W12": { next: "W14", slot: "p2", loser: "L7", loserSlot: "p1" },
        "W13": { next: "W15", slot: "p1", loser: "L12", loserSlot: "p1" },
        "W14": { next: "W15", slot: "p2", loser: "L11", loserSlot: "p1" },
        "L1": { next: "L5", slot: "p2" },
        "L2": { next: "L6", slot: "p2" },
        "L3": { next: "L7", slot: "p2" },
        "L4": { next: "L8", slot: "p2" },
        "L5": { next: "L9", slot: "p1" },
        "L6": { next: "L9", slot: "p2" },
        "L7": { next: "L10", slot: "p1" },
        "L8": { next: "L10", slot: "p2" },
        "L9": { next: "L11", slot: "p2" },
        "L10": { next: "L12", slot: "p2" },
        "L11": { next: "L13", slot: "p1" },
        "L12": { next: "L13", slot: "p2" },
        "L13": { next: "L14", slot: "p2" },
        "W15": { next: "GF1", slot: "p1", loser: "L14", loserSlot: "p1" },
        "L14": { next: "GF1", slot: "p2" }
      }
    }
  }
};

// Generates the initial empty bracket structure populated with players
export function generateBracketStructure(players, type) {
  if (!players || players.length < 2) return null;

  // Determine size: 4, 8, 16
  let size = 4;
  if (players.length > 8) size = 16;
  else if (players.length > 4) size = 8;

  const template = BRACKET_TEMPLATES[type][size];
  if (!template) return null;

  const seeding = SEEDING_ORDERS[size];
  
  // Shuffle a copy of the players array to ensure randomized seeding
  const shuffledPlayers = [...players];
  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
  }

  // Create padded list of players
  const paddedPlayers = Array(size).fill(null);
  shuffledPlayers.forEach((p, idx) => {
    paddedPlayers[idx] = p;
  });

  // Fill remaining slots with BYE
  for (let i = players.length; i < size; i++) {
    paddedPlayers[i] = "BYE";
  }

  // Rearrange players in seeding order
  const seededPlayers = seeding.map(idx => paddedPlayers[idx]);

  // Initialize all matches
  const matches = {};
  
  // Helper to create empty match object
  const createEmptyMatch = (id, roundName) => {
    return {
      id,
      round: roundName,
      p1: "",
      p2: "",
      score1: null,
      score2: null,
      chars1: "",
      chars2: "",
      completed: false,
      isBye: false
    };
  };

  // Populate all matches in template rounds
  template.rounds.forEach(round => {
    round.matches.forEach(matchId => {
      matches[matchId] = createEmptyMatch(matchId, round.name);
    });
  });

  // Assign initial round players (W1, W2, etc.)
  const firstRoundMatchesCount = size / 2;
  for (let i = 0; i < firstRoundMatchesCount; i++) {
    const matchId = `W${i + 1}`;
    matches[matchId].p1 = seededPlayers[i * 2];
    matches[matchId].p2 = seededPlayers[i * 2 + 1];
  }

  const bracket = {
    type,
    size,
    rounds: template.rounds,
    connections: template.connections,
    matches
  };

  // Run initial recursive BYE resolution to clean up the bracket
  resolveBracketByes(bracket);

  return bracket;
}

// Recursively processes matches with BYEs, advancing the active player
function resolveBracketByes(bracket) {
  let changed = false;

  Object.values(bracket.matches).forEach(m => {
    if (m.completed) return;

    // Check if it has a BYE
    const hasBye1 = m.p1 === "BYE";
    const hasBye2 = m.p2 === "BYE";

    if (hasBye1 && hasBye2) {
      // Both are BYEs, advance BYE
      m.completed = true;
      m.isBye = true;
      m.score1 = 0;
      m.score2 = 0;
      propagateWinner(bracket, m.id, "BYE", "BYE");
      changed = true;
    } else if (hasBye1 && m.p2 && m.p2 !== "") {
      // P1 is BYE, P2 wins automatically
      m.completed = true;
      m.isBye = true;
      m.score1 = 0;
      m.score2 = 2; // Auto win score
      propagateWinner(bracket, m.id, m.p2, "BYE");
      changed = true;
    } else if (hasBye2 && m.p1 && m.p1 !== "") {
      // P2 is BYE, P1 wins automatically
      m.completed = true;
      m.isBye = true;
      m.score1 = 2;
      m.score2 = 0;
      propagateWinner(bracket, m.id, m.p1, "BYE");
      changed = true;
    }
  });

  // If we changed anything, run again to propagate newly unlocked BYEs
  if (changed) {
    resolveBracketByes(bracket);
  }
}

// Propagates winner to next slot and loser to losers slot
function propagateWinner(bracket, matchId, winnerName, loserName) {
  const conn = bracket.connections[matchId];
  if (!conn) return;

  // Propagate Winner to next Winners match
  if (conn.next && bracket.matches[conn.next]) {
    const nextMatch = bracket.matches[conn.next];
    if (conn.slot === "p1") nextMatch.p1 = winnerName;
    else nextMatch.p2 = winnerName;
  }

  // Propagate Loser to Losers bracket match (Double Elimination only)
  if (bracket.type === "double" && conn.loser && bracket.matches[conn.loser]) {
    const loserMatch = bracket.matches[conn.loser];
    if (conn.loserSlot === "p1") loserMatch.p1 = loserName;
    else loserMatch.p2 = loserName;
  }
}

// Advance a match by entering scores/characters
export function advanceBracketMatch(bracket, matchId, score1, score2, chars1, chars2) {
  const match = bracket.matches[matchId];
  if (!match) return null;

  match.score1 = score1;
  match.score2 = score2;
  match.chars1 = chars1;
  match.chars2 = chars2;
  match.completed = true;

  const p1 = match.p1;
  const p2 = match.p2;
  let winner = "";
  let loser = "";

  if (score1 > score2) {
    winner = p1;
    loser = p2;
  } else {
    winner = p2;
    loser = p1;
  }

  // Check if this was a Grand Finals match
  if (matchId === "GF1") {
    // If the losers bracket winner (P2) wins GF1, they reset the bracket!
    if (winner === p2) {
      // Generate GF2 (Bracket Reset) if it doesn't already exist
      if (!bracket.matches["GF2"]) {
        // Add GF2 round to the rounds list
        const gfRound = bracket.rounds.find(r => r.name === "Gran Final");
        if (gfRound && !gfRound.matches.includes("GF2")) {
          gfRound.matches.push("GF2");
        }
        
        bracket.matches["GF2"] = {
          id: "GF2",
          round: "Gran Final - Reset",
          p1: p1,
          p2: p2,
          score1: null,
          score2: null,
          chars1: "",
          chars2: "",
          completed: false,
          isBye: false
        };
      } else {
        // Reset existing GF2
        bracket.matches["GF2"].p1 = p1;
        bracket.matches["GF2"].p2 = p2;
        bracket.matches["GF2"].completed = false;
      }
    } else {
      // Winners player wins, tournament finishes. If GF2 existed, remove or skip it.
      if (bracket.matches["GF2"]) {
        delete bracket.matches["GF2"];
        const gfRound = bracket.rounds.find(r => r.name === "Gran Final");
        if (gfRound) {
          gfRound.matches = gfRound.matches.filter(m => m !== "GF2");
        }
      }
    }
  }

  // Propagate results
  propagateWinner(bracket, matchId, winner, loser);

  // Run BYE propagation in case this propagation unlocked a BYE match
  resolveBracketByes(bracket);

  // Return tournament match representation
  return {
    round: match.round,
    p1: match.p1,
    p2: match.p2,
    score1: match.score1,
    score2: match.score2,
    chars1: match.chars1 || "-",
    chars2: match.chars2 || "-"
  };
}
