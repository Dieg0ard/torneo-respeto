// Application State Management

export const state = {
  tournamentsMetadata: [], // loaded from data/tournaments.json
  tournamentsDetails: [],  // loaded from data/tournaments/torneo_X.json
  playersStats: {},        // computed player stats (all games combined)
  activeTab: "sec-overview",
  selectedTournamentId: null,
  adminParticipants: [],
  adminMatches: []
};

// Asynchronously fetch indices and detail files
export async function loadData() {
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
}
