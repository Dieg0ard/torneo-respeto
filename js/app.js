// JavaScript Application Entry Point (ES Modules)
import { state, loadData } from './state.js';
import { initTheme } from './theme.js';
import { calculateStatistics } from './stats.js';
import { setupAdminControls } from './admin.js';
import {
  setupNavigation,
  setupUIEventListeners,
  populateH2HSelectors,
  populateGameFilters,
  renderOverview,
  renderTournamentsView
} from './ui.js';

// Application bootstrapping on document load
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupNavigation();
  setupUIEventListeners();
  setupAdminControls();
  
  initializeApplicationData();
});

// Load tournaments from local storage/JSON files and render initial tabs
async function initializeApplicationData() {
  const statusIndicator = document.querySelector(".status-indicator");
  try {
    // Fetch index and details files asynchronously
    await loadData();
    
    // Calculate global players statistics
    state.playersStats = calculateStatistics("all");
    
    // Populate select fields and filters
    populateGameFilters();
    populateH2HSelectors();
    
    // Render dashboard overview and tournament menu lists
    renderOverview();
    renderTournamentsView();
    
    // Setup date placeholder in administrator form to current date
    const adminDate = document.getElementById("admin-tour-date");
    if (adminDate) {
      adminDate.value = new Date().toISOString().split('T')[0];
    }
  } catch (error) {
    console.error("Error al cargar los datos del torneo:", error);
    if (statusIndicator) {
      statusIndicator.textContent = "Error al cargar datos";
      statusIndicator.style.backgroundColor = "oklch(40% 0.15 20)";
    }
  }
}
