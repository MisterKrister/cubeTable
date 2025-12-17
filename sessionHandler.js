// sessionHandler.js
import * as DomElements from './domElements.js';
import * as State from './state.js';
import * as Config from './config.js';
import { displayData, sortData, updateSortArrows, displayRecordHistory } from './uiUpdater.js';
import { calculateRollingAverages } from './averages.js';
import { updateMainChart } from './chartManager.js';

export function extractSessions(solves) {
    console.log("[SessionHandler] Extracting sessions...");
    const sessionMap = {};
    let sessionFound = false;

    if (!solves || solves.length === 0) {
         console.log("[SessionHandler] No solves to extract sessions from.");
         State.setSessionMap({}); // Reset map
         return;
    }

    if ('session' in solves[0]) {
        sessionFound = true;
        solves.forEach(solve => {
            const sessionName = solve.session || 'Default';
            if (!sessionMap[sessionName]) {
                sessionMap[sessionName] = [];
            }
            sessionMap[sessionName].push(solve);
        });
    }

    if (!sessionFound) {
        console.log("[SessionHandler] No session column found, treating all solves as one session: 'All'.");
        sessionMap['All'] = solves;
    } else {
        console.log(`[SessionHandler] Found ${Object.keys(sessionMap).length} sessions:`, Object.keys(sessionMap));
    }

    State.setSessionMap(sessionMap);
}


// Renamed from populateSessionSelect
export function populateCustomSessionDropdown() {
    if (!DomElements.customSessionDropdown || !DomElements.sessionSelectorContainer || !DomElements.changeSessionButton) {
         console.warn("[SessionHandler] Custom session dropdown elements not found.");
         return;
    }

    const dropdown = DomElements.customSessionDropdown;
    const container = DomElements.sessionSelectorContainer;
    const button = DomElements.changeSessionButton;

    dropdown.innerHTML = ''; // Clear existing items

    const sessionNames = Object.keys(State.sessionMap).sort(); // Sort names alphabetically

    if (sessionNames.length <= 1) {
        // Hide the entire container if only one session (or none)
        container.style.display = 'none';
        button.disabled = true;
        button.textContent = sessionNames.length === 1 ? sessionNames[0] : 'No Sessions'; // Show name if one session
        console.log("[SessionHandler] Hiding session selector (<= 1 session).")
    } else {
        console.log("[SessionHandler] Populating custom session dropdown with:", sessionNames);
        sessionNames.forEach(name => {
            const item = document.createElement('div');
            item.className = 'session-item';
            item.textContent = name;
            item.dataset.session = name; // Store name in data attribute
            dropdown.appendChild(item);
        });
        container.style.display = ''; // Show container (button + hidden dropdown)
        button.disabled = false;
        // Set button text to current session or default if none selected yet
        button.textContent = State.currentSession || sessionNames[0] || 'Select Session';
    }
}

export function setSession(sessionName) {
    console.log(`[SessionHandler] Setting current session to: ${sessionName}`);
    let sessionSolves = [];
    if (!sessionName || !State.sessionMap[sessionName]) {
        // Handle invalid/empty session
        State.setCurrentSession(sessionName);
        State.setDisplayedSolves([]);
        State.setActiveRecordFilter('single'); // Reset filter
        State.setChronoSortedSolvesForHistory([]); // Clear history data
        State.setRollingBestsForHistory({}); // Clear history data
        if (DomElements.changeSessionButton) DomElements.changeSessionButton.textContent = sessionName || 'Select Session';
    } else {
        // Handle valid session
        State.setCurrentSession(sessionName);
        sessionSolves = [...State.sessionMap[sessionName]]; // Use copy
        State.setDisplayedSolves(sessionSolves);
        State.setActiveRecordFilter('single'); // Reset filter to default on session change
        if (DomElements.changeSessionButton) DomElements.changeSessionButton.textContent = sessionName;
    }

    // Sort the *displayed* data list
    sortData(State.currentSort.column); // Calls displayData

    // Calculate averages/bests on CHRONOLOGICAL data for chart/history
    const chronoSortedSessionSolves = [...sessionSolves].sort((a, b) => a.date - b.date);
    const calculationResults = calculateRollingAverages(chronoSortedSessionSolves);

    // ↓↓↓ Store data needed for history re-rendering ↓↓↓
    State.setChronoSortedSolvesForHistory(chronoSortedSessionSolves);
    State.setRollingBestsForHistory(calculationResults.bests || {});

    // Update the main chart
    updateMainChart(chronoSortedSessionSolves, calculationResults);

    // Update the record history display (will use the 'single' filter initially)
    displayRecordHistory(State.chronoSortedSolvesForHistory, State.rollingBestsForHistory);

    // Ensure sort arrows are correct
    updateSortArrows();

    console.log(`[SessionHandler] Session set. Displaying ${State.displayedSolves.length} solves.`);
} // End setSession