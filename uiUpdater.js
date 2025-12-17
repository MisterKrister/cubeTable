// uiUpdater.js

import * as DomElements from './domElements.js';

import * as State from './state.js';

import { formatTime, formatRelativeDateOrAbsolute, formatDate } from './formatters.js';

import * as Config from './config.js';



/**

 * OPTIMIZED Display Data Function using DocumentFragment.

 */

export function displayData() {

    console.log(`[DisplayData] Rendering ${State.displayedSolves.length} solves.`);

    if (!DomElements.dataBody || !DomElements.solveCountDisplay) {

        console.error("[DisplayData] Missing dataBody or solveCountDisplay element.");

        return;

    }



    // --- Performance Optimization ---

    DomElements.dataBody.textContent = ''; // Clear existing content

    const fragment = document.createDocumentFragment();



    if (State.displayedSolves.length === 0) {

        const placeholder = document.createElement('div');

        placeholder.className = 'placeholder-row';

        // Ensure placeholder text fits the context (data list)

        placeholder.textContent = State.currentSession === null ? 'Load a CSV file to see solves...' : 'No solves to display for this session.';

        fragment.appendChild(placeholder);

        DomElements.solveCountDisplay.textContent = `Solves: 0`;

    } else {

        DomElements.solveCountDisplay.textContent = `Solves: ${State.displayedSolves.length}`;



        State.displayedSolves.forEach((solve) => {

            const row = document.createElement('div');

            row.className = 'data-row';

            row.dataset.solveId = solve.id;



            const timeStr = solve.dnf ? 'DNF' : formatTime(solve.time);

            const turnsStr = solve.face_turns ?? 'N/A';

            const tpsStr = solve.dnf ? 'N/A' : (solve.tps?.toFixed(2) ?? 'N/A');

            // Use relative date for the main list

            const dateStr = formatRelativeDateOrAbsolute(solve.date);



            row.innerHTML = `<span>${timeStr}</span><span>${turnsStr}</span><span>${tpsStr}</span><span>${dateStr}</span>`;

            fragment.appendChild(row);

        });

    }



    DomElements.dataBody.appendChild(fragment);

    // --- End Performance Optimization ---



    console.log("[DisplayData] Finished rendering.");

}



export function updateSortArrows() {

    if (!DomElements.headerSpans) return;



    DomElements.headerSpans.forEach(span => {

        const column = span.dataset.column;

        if (!column) return;



        let arrowSpan = span.querySelector('.sort-arrow');

        if (!arrowSpan) {

            const newArrow = document.createElement('span');

            newArrow.className = 'sort-arrow';

            span.appendChild(newArrow);

            arrowSpan = newArrow;

        }



        if (column === State.currentSort.column) {

            arrowSpan.textContent = State.currentSort.ascending ? '↑' : '↓';

            arrowSpan.style.opacity = '1';

        } else {

            arrowSpan.textContent = '↓';

            arrowSpan.style.opacity = '0.3';

        }

    });

}



export function sortData(column) {

    console.log(`Sorting data by column: ${column}`);

    if (!column || !State.displayedSolves) {

         console.warn("Sort attempted with no column or data.");

         // Ensure UI reflects empty state if needed

         displayData();

         updateSortArrows(); // Update arrows even if empty

         return;

    }



     // Determine new sort direction only if clicking the *same* column again

     let ascending = State.currentSort.ascending;

     if (State.currentSort.column === column) {

         ascending = !State.currentSort.ascending; // Toggle if same column

     } else {

         // Default direction for the *new* column

         ascending = (column === 'date' ? Config.DEFAULT_SORT_ASCENDING : true);

     }



    // Sort the array

    State.displayedSolves.sort((a, b) => {

        let valA = a[column];

        let valB = b[column];



        if (column === 'time') {

            const aIsDNF = a.dnf || valA === null || valA === Infinity || typeof valA !== 'number' || isNaN(valA);

            const bIsDNF = b.dnf || valB === null || valB === Infinity || typeof valB !== 'number' || isNaN(valB);

            if (aIsDNF && bIsDNF) return 0;

            if (aIsDNF) return 1;

            if (bIsDNF) return -1;

             valA = a.time; // Use actual time now we know they are numbers

             valB = b.time;

        }



         const factor = ascending ? 1 : -1;

         // Consistent null/undefined handling: treat as lowest value when ascending

         if (valA === null || typeof valA === 'undefined') return -1 * factor;

         if (valB === null || typeof valB === 'undefined') return 1 * factor;



        // Handle Date objects specifically

        if (valA instanceof Date && valB instanceof Date) {

             valA = valA.getTime();

             valB = valB.getTime();

        }



        // General comparison (numbers or strings)

        if (valA < valB) return -1 * factor;

        if (valA > valB) return 1 * factor;

        return 0;

    });



    // Update state

    State.setCurrentSort(column, ascending);



    // Update UI

    displayData(); // Re-render the sorted list

    updateSortArrows(); // Update arrows AFTER sorting and state update

}



// Loading Indicators

export function showLoading(message = "Loading...") {

    // Basic console log implementation

    console.log(`Showing loading: ${message}`);

    // Placeholder for actual UI implementation:

    // const overlay = document.getElementById('loadingOverlay');

    // if (overlay) {

    //     overlay.querySelector('.loading-message').textContent = message;

    //     overlay.style.display = 'flex';

    // }

}



export function hideLoading() {

    console.log("Hiding loading indicator.");

    // Placeholder for actual UI implementation:

    // const overlay = document.getElementById('loadingOverlay');

    // if (overlay) {

    //     overlay.style.display = 'none';

    // }

}



// Notifications

export function showNotification(message, type = 'info') {

     console.log(`[Notification-${type}] ${message}`);

     let notificationArea = document.getElementById('notificationArea');

     if (!notificationArea) {

         notificationArea = document.createElement('div');

         notificationArea.id = 'notificationArea';

         // Basic positioning, should be refined in CSS

         notificationArea.style.position = 'fixed';

         notificationArea.style.top = '1rem';

         notificationArea.style.right = '1rem';

         notificationArea.style.zIndex = '2000';

         notificationArea.style.width = '300px';

         notificationArea.style.display = 'flex';

         notificationArea.style.flexDirection = 'column';

         notificationArea.style.gap = '0.5rem';

         document.body.appendChild(notificationArea);

     }

     const notification = document.createElement('div');

     notification.className = `notification notification-${type}`; // Use CSS classes for styling

     notification.textContent = message;

     notificationArea.appendChild(notification);

     setTimeout(() => {

         notification.remove();

     }, 5000);

 }



 function updateRecordFilterButtons() {

    if (!DomElements.recordFilterButtonsContainer) return;

    const buttons = DomElements.recordFilterButtonsContainer.querySelectorAll('.record-filter-button');

    buttons.forEach(button => {

        if (button.dataset.filter === State.activeRecordFilter) {

            button.classList.add('active');

        } else {

            button.classList.remove('active');

        }

    });

}



/**

 * Displays the history of personal bests achieved in the current session.

 */

export function displayRecordHistory(chronoSortedSolves, rollingBestsData) {

    // 1. Update button active states first

    updateRecordFilterButtons();



    if (!DomElements.recordHistoryList) {

        console.warn("Record history list element not found.");

        return;

    }



    const list = DomElements.recordHistoryList;

    list.innerHTML = ''; // Clear previous entries

    const fragment = document.createDocumentFragment();

    let recordsFound = 0; // Track if records *matching the filter* are found



    const bests = rollingBestsData || {};

    const { bestSingle = [], bestAo5 = [], bestAo12 = [], bestAo100 = [] } = bests;



    // Track last bests *within the loop* to correctly identify new PBs

    let lastSingle = Infinity, lastAo5 = Infinity, lastAo12 = Infinity, lastAo100 = Infinity;



    chronoSortedSolves.forEach((solve, i) => {

        let recordHtmlParts = []; // Parts for the current solve *matching the filter*

        let aRecordWasSet = false; // Track if *any* record was set on this solve



        // Check Single PB

        const currentSingle = (i < bestSingle.length) ? bestSingle[i] : null;

        if (currentSingle !== null && currentSingle < lastSingle) {

            if (State.activeRecordFilter === 'single') {

                recordHtmlParts.push(`

                    <span class="record-type">Best Single:</span>

                    <span class="record-value">${formatTime(currentSingle)}</span>

                    <button class="record-detail-button"

                            data-type="single"

                            data-solve-id="${solve.id}">

                        Details

                    </button>`);

            }

            lastSingle = currentSingle;

            aRecordWasSet = true;

        }

        

        // Check Ao5 PB

        const currentAo5 = (i < bestAo5.length) ? bestAo5[i] : null;

        if (currentAo5 !== null && currentAo5 < lastAo5) {

            if (State.activeRecordFilter === 'ao5') {

                recordHtmlParts.push(`

                    <span class="record-type">Best Ao5:</span>

                    <span class="record-value">${formatTime(currentAo5)}</span>

                    <button class="record-detail-button"

                            data-type="ao5"

                            data-index="${i}">

                        Details

                    </button>`);

            }

            lastAo5 = currentAo5;

            aRecordWasSet = true;

        }

        

        // Check Ao12 PB

        const currentAo12 = (i < bestAo12.length) ? bestAo12[i] : null;

        if (currentAo12 !== null && currentAo12 < lastAo12) {

            if (State.activeRecordFilter === 'ao12') {

                recordHtmlParts.push(`

                    <span class="record-type">Best Ao12:</span>

                    <span class="record-value">${formatTime(currentAo12)}</span>

                    <button class="record-detail-button"

                            data-type="ao12"

                            data-index="${i}">

                        Details

                    </button>`);

            }

            lastAo12 = currentAo12;

            aRecordWasSet = true;

        }

        

        // Check Ao100 PB

        const currentAo100 = (i < bestAo100.length) ? bestAo100[i] : null;

        if (currentAo100 !== null && currentAo100 < lastAo100) {

            if (State.activeRecordFilter === 'ao100') {

                recordHtmlParts.push(`

                    <span class="record-type">Best Ao100:</span>

                    <span class="record-value">${formatTime(currentAo100)}</span>

                    <button class="record-detail-button"

                            data-type="ao100"

                            data-index="${i}">

                        Details

                    </button>`);

            }

            lastAo100 = currentAo100;

            aRecordWasSet = true;

        }



        // If any record *matching the filter* was found for this solve, create list item

        if (recordHtmlParts.length > 0) {

            recordsFound++;

            const li = document.createElement('li');

            const solveNum = i + 1;

            const dateStr = formatDate(solve.date);

            li.innerHTML = `

                ${recordHtmlParts.join('<br>')}

                <span class="record-details">(<span class="record-solve-num">Solve #${solveNum}</span>, <span class="record-date">${dateStr}</span>)</span>

            `;

            fragment.insertBefore(li, fragment.firstChild); // Prepend newest first

        }

    });



    if (recordsFound === 0) {

        const placeholder = document.createElement('li');

        placeholder.className = 'placeholder-row';

        placeholder.textContent = `No '${State.activeRecordFilter}' records for this session.`; // Filter-specific placeholder

        fragment.appendChild(placeholder);

    }



    list.appendChild(fragment);

}