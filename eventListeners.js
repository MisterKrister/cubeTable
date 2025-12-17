// eventListeners.js
import * as DomElements from './domElements.js';
import * as State from './state.js';
import { processSolves } from './csvParser.js';
import { calculateRollingAverages } from './averages.js';
import { initializeMainChart, updateMainChart } from './chartManager.js';
import { displayData, sortData, showLoading, hideLoading, showNotification, updateSortArrows, displayRecordHistory } from './uiUpdater.js';
import { showSolveDetails, closeModal } from './modalHandler.js';
import { extractSessions, populateCustomSessionDropdown, setSession } from './sessionHandler.js';
import { showAverageDetails } from './modalHandler.js';

const Papa = window.Papa;

// Helper to toggle dropdown visibility
function toggleSessionDropdown(show) {
    if (DomElements.customSessionDropdown) {
        DomElements.customSessionDropdown.classList.toggle('dropdown-visible', show);
    }
}

export function setupEventListeners() {
    console.log("Setting up event listeners...");

    // 1. File Input Change
    if (DomElements.fileInput) {
        DomElements.fileInput.addEventListener('change', (event) => {
            console.log("File input 'change' event fired.");
            const file = event.target.files[0];
            if (!file) {
                console.log("No file selected.");
                showNotification("No file selected.", "warning");
                return;
            }
            if (!Papa) {
                console.error("PapaParse library is not loaded!");
                showNotification("Error: CSV Parsing library (PapaParse) missing.", "error");
                return;
            }

            console.log("Selected file:", file.name);
            showLoading(`Parsing ${file.name}...`); // Show loading indicator

            try {
                Papa.parse(file, {
                    header: false, // We handle headers manually
                    skipEmptyLines: true,
                    complete: (results) => {
                        console.log("PapaParse complete.");
                        hideLoading();
                        try {
                            console.log("Raw PapaParse data (first 5 rows):", results.data.slice(0, 5));
                            if (!results.data || results.data.length < 2 || !results.data[0]) {
                                console.warn("PapaParse result data seems invalid or empty.");
                                showNotification("Could not parse meaningful data from the CSV. Is it empty or corrupted?", "error");
                                State.setAllSolves([]);
                                State.setSessionMap({});
                                populateCustomSessionDropdown(); // Update UI (will hide button)
                                setSession(null);
                                return;
                            }

                            const parsedSolves = processSolves(results.data);
                            State.setAllSolves(parsedSolves);
                            extractSessions(parsedSolves);
                            populateCustomSessionDropdown(); // Populate the new dropdown structure

                            const sessionNames = Object.keys(State.sessionMap).sort(); // Sort sessions for predictable initial load
                            const initialSession = sessionNames.length > 0 ? sessionNames[0] : null;

                            if (initialSession) {
                                // Set the session (this will update data, chart, and button text)
                                setSession(initialSession);
                                showNotification(`Loaded ${parsedSolves.length} solves across ${sessionNames.length} session(s).`, "success");
                            } else {
                                setSession(null); // Handles empty/no-session case
                                showNotification("CSV parsed, but no valid solve data found.", "warning");
                            }

                        } catch (processingError) {
                            hideLoading();
                            console.error("Error during data processing or UI update after parse:", processingError);
                            showNotification(`Error processing CSV data: ${processingError.message}`, "error");
                            State.setAllSolves([]);
                            State.setSessionMap({});
                            populateCustomSessionDropdown(); // Update UI
                            setSession(null);
                        }

                    },
                    error: (error, file) => {
                        hideLoading();
                        console.error("PapaParse error:", error);
                        showNotification(`Error parsing CSV file: ${error.message}`, "error");
                        State.setAllSolves([]); // Clear state
                        State.setSessionMap({});
                        setSession(null); // Update UI
                    }
                });
            } catch (papaError) {
                hideLoading();
                console.error("Error calling Papa.parse:", papaError);
                showNotification(`An error occurred trying to start parsing: ${papaError.message}`, "error");
                State.setAllSolves([]); // Clear state
                State.setSessionMap({});
                setSession(null); // Update UI
            } finally {
                // Reset file input value so the same file can be loaded again
                event.target.value = null;
            }
        });
        console.log("File input listener attached.");
    } else {
        console.warn("File input element not found.");
    }

    // 2. Sortable Header Clicks
    if (DomElements.headerSpans) {
        DomElements.headerSpans.forEach(span => {
            span.addEventListener('click', () => {
                const column = span.dataset.column;
                // ---> DEBUG LOG <---
                console.log(`Header clicked: ${column}`);
                if (column) {
                    sortData(column); // Call the sorting function
                } else {
                    console.warn("Clicked header span is missing data-column attribute.");
                }
            });
        });
        console.log("Sortable header listeners attached.");
    } else {
        console.warn("Header spans not found.");
    }

    // 3. Data Row Clicks
    if (DomElements.dataBody) {
        DomElements.dataBody.addEventListener('click', (event) => {
            const row = event.target.closest('.data-row'); // Find the closest parent row
            if (row && row.dataset.solveId) {
                const solveId = row.dataset.solveId;
                // ---> DEBUG LOG <---
                console.log(`Data row clicked, solveId: ${solveId}`);
                showSolveDetails(solveId); // Call the function to show the modal
            }
        });
        console.log("Data body listener attached (for row clicks).");
    } else {
        console.warn("Data body element not found.");
    }

    // 4. Modal Close Button
    if (DomElements.closeModalButton) {
        DomElements.closeModalButton.addEventListener('click', () => {
            // ---> DEBUG LOG <---
            console.log("Modal close button clicked.");
            closeModal(); // Call the function to close the modal
        });
        console.log("Modal close button listener attached.");
    } else {
        console.warn("Modal close button not found.");
    }

    // 5. Modal Background Click
    if (DomElements.modal) {
        DomElements.modal.addEventListener('click', (event) => {
            if (event.target === DomElements.modal) { // Only close if clicking the background itself
                // ---> DEBUG LOG <---
                console.log("Modal background clicked.");
                closeModal(); // Call the function to close the modal
            }
        });
        console.log("Modal background listener attached.");
    } else {
        console.warn("Modal element not found.");
    }

    // 6. Session Button Click
    if (DomElements.changeSessionButton) {
        DomElements.changeSessionButton.addEventListener('click', (event) => {
            // ---> DEBUG LOG <---
            console.log("Change session button clicked.");
            const isVisible = DomElements.customSessionDropdown.classList.contains('dropdown-visible');
            toggleSessionDropdown(!isVisible);
            event.stopPropagation(); // Prevent this click from immediately triggering the 'click outside' listener
        });
        console.log("Change session button listener attached (toggle).");
    } else {
        console.warn("Change session button not found.");
    }

    // 7. Custom Dropdown Item Click (Event Delegation)
    if (DomElements.customSessionDropdown) {
        DomElements.customSessionDropdown.addEventListener('click', (event) => {
            const target = event.target;
            // Check if the clicked element is a session item
            if (target.classList.contains('session-item') && target.dataset.session) {
                const sessionName = target.dataset.session;
                // ---> DEBUG LOG <---
                console.log(`Session item clicked: ${sessionName}`);
                setSession(sessionName); // Set the session
                toggleSessionDropdown(false); // Hide the dropdown
            }
        });
        console.log("Custom session dropdown item listener attached (delegated).");
    } else {
        console.warn("Custom session dropdown not found.");
    }

    // 8. Click Outside Listener (to close dropdown)
    document.addEventListener('click', (event) => {
        if (!DomElements.sessionSelectorContainer || !DomElements.changeSessionButton || !DomElements.customSessionDropdown) return; // Added checks

        // Check if the click was outside the button AND outside the dropdown itself
        // Ensure elements exist before accessing contains
        const isClickInsideButton = DomElements.changeSessionButton.contains(event.target);
        const isClickInsideDropdown = DomElements.customSessionDropdown.contains(event.target);

        if (!isClickInsideButton && !isClickInsideDropdown) {
            // If the dropdown is currently visible, hide it
            if (DomElements.customSessionDropdown.classList.contains('dropdown-visible')) {
                // ---> DEBUG LOG <---
                console.log("Clicked outside session dropdown, closing it.");
                toggleSessionDropdown(false);
            }
        }
    });
    console.log("Click outside listener attached.");

    // 9. Record History Filter Button Listener
    if (DomElements.recordFilterButtonsContainer) {
        DomElements.recordFilterButtonsContainer.addEventListener('click', (event) => {
            const button = event.target.closest('.record-filter-button'); // Find the clicked button
            if (button && button.dataset.filter) {
                const newFilter = button.dataset.filter;
                // ---> DEBUG LOG <---
                console.log(`Record filter button clicked: ${newFilter}`);
                if (newFilter !== State.activeRecordFilter) {
                    State.setActiveRecordFilter(newFilter);
                    // Re-render the record history using the currently stored data
                    displayRecordHistory(State.chronoSortedSolvesForHistory, State.rollingBestsForHistory);
                } else {
                    console.log("Clicked filter is already active.");
                }
            }
        });
        console.log("Record history filter button listener attached.");
    } else {
        console.warn("Record filter buttons container not found.");
    }

    console.log("All event listeners setup complete.");

    // Details button inside record history list
    if (DomElements.recordHistoryList) {
        DomElements.recordHistoryList.addEventListener('click', (event) => {
            const btn = event.target.closest('.record-detail-button');
            if (!btn) return;

            const type = btn.dataset.type;

            if (type === 'single') {
                // For singles, open the solve detail directly
                const solveId = btn.dataset.solveId;
                showSolveDetails(solveId);
            } else {
                // For averages, show the average breakdown
                const index = Number(btn.dataset.index);
                showAverageDetails(type, index);
            }

            event.stopPropagation();
        });
    }

    // 10. Statistics Calculate Button
    const calculateStatsButton = document.getElementById('calculateStatsButton');
    if (calculateStatsButton) {
        import('./statsManager.js').then(({ calculateAndDisplayStats }) => {
            calculateStatsButton.addEventListener('click', () => {
                console.log('[Stats] Calculate button clicked');
                calculateAndDisplayStats();
            });
            console.log('[Stats] Button listener attached.');
        }).catch(error => {
            console.error('[Stats] Error loading statsManager:', error);
        });
    } else {
        console.warn('[Stats] Calculate stats button not found.');
    }
} // End setupEventListeners