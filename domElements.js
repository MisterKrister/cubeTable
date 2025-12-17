// domElements.js

export const fileInput = document.getElementById('csvFileInput');
export const dataBody = document.getElementById('dataBody');
export const solveCountDisplay = document.getElementById('solveCountDisplay');
export const modal = document.getElementById('solveDetailModal');
export const modalContent = document.getElementById('solveDetailContent');
export const closeModalButton = document.getElementById('closeModalButton');
export const chartCanvas = document.getElementById('solvesChart');
export const pieChartCanvas = document.getElementById('stepPieChartCanvas');
export const headerSpans = document.querySelectorAll('.data-header .sortable');
export const changeSessionButton = document.getElementById('changeSessionButton');
export const sessionSelectorContainer = document.getElementById('sessionSelectorContainer'); 
export const customSessionDropdown = document.getElementById('customSessionDropdown'); 
export const recordHistoryList = document.getElementById('recordHistoryList'); 
export const recordFilterButtonsContainer = document.getElementById('recordFilterButtons');
export const averageDetailModal        = document.getElementById('averageDetailModal');
export const averageDetailContent      = document.getElementById('averageDetailContent');
export const closeAverageModalButton   = document.getElementById('closeAverageModalButton');

// Basic check
if (!fileInput || !dataBody || !modal || !chartCanvas || !pieChartCanvas || !sessionSelectorContainer || !customSessionDropdown || !changeSessionButton || !recordHistoryList || !recordFilterButtonsContainer) {
    console.warn("One or more essential DOM elements might be missing.");
}