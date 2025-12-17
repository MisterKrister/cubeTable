// main.js
import { initializeMainChart } from './chartManager.js';
import { displayData, updateSortArrows } from './uiUpdater.js';
import { setupEventListeners } from './eventListeners.js';
// Use the new function name
import { populateCustomSessionDropdown } from './sessionHandler.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded - Initializing application.");

    initializeMainChart();
    setupEventListeners();
    populateCustomSessionDropdown(); // <-- Call the renamed function
    updateSortArrows();
    displayData(); // Show initial placeholder

    console.log("Application initialization complete.");
});