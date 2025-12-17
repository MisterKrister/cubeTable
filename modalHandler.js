import * as DomElements from './domElements.js';
import * as State from './state.js';
import * as Config from './config.js';
import { formatTime, formatDate } from './formatters.js';
import { renderStepPieChart, destroyStepPieChart } from './chartManager.js';

// Track modal navigation state
let modalHistory = [];
let averageSolvesData = [];
let currentSort = { column: null, ascending: true };

function aggregateStepExecutionTimes(steps) {
    const aggregated = { cross: 0, f2l: 0, oll: 0, pll: 0, other: 0 };
    let totalAggregatedExecTime = 0;

    if (!steps || steps.length === 0) {
        return { aggregated, totalAggregatedExecTime };
    }

    steps.forEach(step => {
        const execTime = (typeof step.executionTime === 'number' && !isNaN(step.executionTime)) ? step.executionTime : 0;
        if (execTime <= 0) return;

        const stepNameLower = step.name?.toLowerCase() ?? '';
        if (stepNameLower.includes('cross')) aggregated.cross += execTime;
        else if (stepNameLower.includes('f2l')) aggregated.f2l += execTime;
        else if (stepNameLower.includes('oll')) aggregated.oll += execTime;
        else if (stepNameLower.includes('pll')) aggregated.pll += execTime;
        else aggregated.other += execTime;

        totalAggregatedExecTime += execTime;
    });

    return { aggregated, totalAggregatedExecTime };
}

function generateSolveDetailHTML(solve) {
    const { aggregated, totalAggregatedExecTime } = aggregateStepExecutionTimes(solve.steps);
    const hasSteps = solve.steps && solve.steps.length > 0;
    const hasChart = totalAggregatedExecTime > 0;
    
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:0.5rem;border-bottom:1px solid var(--border-color);"><h2 style="margin:0;font-size:1.3rem;color:var(--text-highlight-color);">Solve Details</h2>${modalHistory.length > 0 ? `<button id="modalBackButton" style="padding:0.4rem 1rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border:1px solid #667eea;color:white;border-radius:1.5rem;cursor:pointer;font-size:0.85rem;font-weight:500;transition:all 0.2s ease;" onmouseover="this.style.background='linear-gradient(135deg,#5a6fd8 0%,#6a4190 100%)'" onmouseout="this.style.background='linear-gradient(135deg,#667eea 0%,#764ba2 100%)'">← Back</button>` : ''}</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1rem;"><div style="background:var(--modal-pre-bg-color);border:1px solid var(--border-color);border-radius:4px;padding:0.8rem;text-align:center;"><div style="font-size:1.25rem;font-weight:600;color:var(--text-highlight-color);">${solve.dnf ? 'DNF' : formatTime(solve.time)}</div><div style="font-size:0.7rem;text-transform:uppercase;color:var(--text-muted-color);">Time</div></div><div style="background:var(--modal-pre-bg-color);border:1px solid var(--border-color);border-radius:4px;padding:0.8rem;text-align:center;"><div style="font-size:1.25rem;font-weight:600;color:var(--text-highlight-color);">${solve.face_turns ?? 'N/A'}</div><div style="font-size:0.7rem;text-transform:uppercase;color:var(--text-muted-color);">Turns</div></div><div style="background:var(--modal-pre-bg-color);border:1px solid var(--border-color);border-radius:4px;padding:0.8rem;text-align:center;"><div style="font-size:1.25rem;font-weight:600;color:var(--text-highlight-color);">${solve.dnf ? 'N/A' : (solve.tps?.toFixed(2) ?? 'N/A')}</div><div style="font-size:0.7rem;text-transform:uppercase;color:var(--text-muted-color);">TPS</div></div><div style="background:var(--modal-pre-bg-color);border:1px solid var(--border-color);border-radius:4px;padding:0.8rem;text-align:center;"><div style="font-size:1.25rem;font-weight:600;color:var(--text-highlight-color);">${formatTime(solve.totalRecognitionTime)}</div><div style="font-size:0.7rem;text-transform:uppercase;color:var(--text-muted-color);">Pause Time</div></div></div><div style="margin-bottom:1rem;"><h3 style="margin:0 0 0.5rem 0;font-size:1rem;color:var(--text-highlight-color);">Details</h3><p style="margin:0.2rem 0;line-height:1.3;"><strong>Date:</strong> ${formatDate(solve.date)}</p><p style="margin:0.2rem 0;line-height:1.3;"><strong>Scramble:</strong> ${solve.scramble}</p></div>${hasSteps ? `<div style="display:flex;gap:2rem;align-items:flex-start;"><div style="flex:2;"><h3 style="margin:0 0 0.5rem 0;font-size:1rem;color:var(--text-highlight-color);">Steps</h3><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:var(--modal-pre-bg-color);"><th style="padding:0.4rem 0.6rem;border-bottom:1px solid var(--border-color);font-size:0.8rem;text-transform:uppercase;color:var(--text-muted-color);text-align:left;">Step</th><th style="padding:0.4rem 0.6rem;border-bottom:1px solid var(--border-color);font-size:0.8rem;text-transform:uppercase;color:var(--text-muted-color);text-align:left;">Total</th><th style="padding:0.4rem 0.6rem;border-bottom:1px solid var(--border-color);font-size:0.8rem;text-transform:uppercase;color:var(--text-muted-color);text-align:left;">Pause</th><th style="padding:0.4rem 0.6rem;border-bottom:1px solid var(--border-color);font-size:0.8rem;text-transform:uppercase;color:var(--text-muted-color);text-align:left;">Exec</th></tr></thead><tbody>${solve.steps.map(step => `<tr style="transition:background-color 0.1s ease;" onmouseover="this.style.backgroundColor='var(--hover-bg-color)'" onmouseout="this.style.backgroundColor=''"><td style="padding:0.4rem 0.6rem;border-bottom:1px solid var(--border-color);font-size:0.9rem;">${step.name ?? 'Unnamed'}</td><td style="padding:0.4rem 0.6rem;border-bottom:1px solid var(--border-color);font-size:0.9rem;">${formatTime(step.time)}</td><td style="padding:0.4rem 0.6rem;border-bottom:1px solid var(--border-color);font-size:0.9rem;">${formatTime(step.recognitionTime)}</td><td style="padding:0.4rem 0.6rem;border-bottom:1px solid var(--border-color);font-size:0.9rem;">${formatTime(step.executionTime)}</td></tr>`).join('')}</tbody></table></div>${hasChart ? `<div style="flex:1;max-width:400px;min-width:300px;"><h3 style="margin:0 0 0.5rem 0;font-size:1rem;color:var(--text-highlight-color);text-align:center;">Step Breakdown</h3><div style="width:100%;display:flex;flex-direction:column;align-items:center;"><canvas id="stepPieChartCanvas" style="max-width:100%;max-height:300px;"></canvas></div></div>` : ''}</div>` : ''}`;
}

export function showSolveDetails(solveId, fromAverage = false) {
    console.log("[ModalHandler] Showing details for solve ID:", solveId);
    const solve = State.allSolves.find(s => s.id === solveId);

    if (!solve) {
        console.warn("[ModalHandler] Solve not found:", solveId);
        return;
    }
    if (!DomElements.modal || !DomElements.modalContent) {
        console.error("[ModalHandler] Modal elements not found!");
        return;
    }

    // Save previous state if coming from average modal
    if (fromAverage && DomElements.averageDetailModal && DomElements.averageDetailModal.style.display !== 'none') {
        modalHistory.push({
            type: 'average',
            content: DomElements.averageDetailContent.innerHTML
        });
        DomElements.averageDetailModal.style.display = 'none';
    }

    // Set modal styles
    DomElements.modal.style.display = 'flex';
    DomElements.modal.style.justifyContent = 'center';
    DomElements.modal.style.alignItems = 'flex-start';
    DomElements.modal.style.padding = '2vh 2vw';
    
    DomElements.modalContent.style.width = '95vw';
    DomElements.modalContent.style.maxWidth = '1600px';
    DomElements.modalContent.style.minWidth = '1200px';
    DomElements.modalContent.style.maxHeight = '92vh';
    DomElements.modalContent.style.overflow = 'auto';
    DomElements.modalContent.style.padding = '1.2rem';
    DomElements.modalContent.style.background = 'var(--modal-bg-color)';
    DomElements.modalContent.style.border = '1px solid var(--border-modal-color)';
    DomElements.modalContent.style.borderRadius = '6px';

    // Generate and set HTML
    DomElements.modalContent.innerHTML = generateSolveDetailHTML(solve);

    // Set up back button listener
    const backButton = document.getElementById('modalBackButton');
    if (backButton) {
        backButton.addEventListener('click', goBackInModal);
    }

    // Render pie chart if needed
    const { aggregated } = aggregateStepExecutionTimes(solve.steps);
    const stepExecutionData = [aggregated.cross, aggregated.f2l, aggregated.oll, aggregated.pll, aggregated.other];
    const filteredLabels = [], filteredData = [], filteredColors = [];

    stepExecutionData.forEach((time, index) => {
        if (time > 0) {
            filteredLabels.push(Config.CHART_STEP_PIE_LABELS[index]);
            filteredData.push(time);
            filteredColors.push(Config.CHART_STEP_PIE_COLORS[index]);
        }
    });

    if (filteredData.length > 0) {
        const pieChartData = {
            labels: filteredLabels,
            data: filteredData,
            colors: filteredColors
        };
        renderStepPieChart(pieChartData);
    }

    console.log("[ModalHandler] Modal displayed.");
}

function goBackInModal() {
    if (modalHistory.length === 0) return;
    
    const previousState = modalHistory.pop();
    
    if (previousState.type === 'average') {
        closeModal();
        DomElements.averageDetailContent.innerHTML = previousState.content;
        DomElements.averageDetailModal.style.display = 'flex';
        setupAverageModalListeners();
    }
}

export function closeModal() {
    if (!DomElements.modal) return;
    DomElements.modal.style.display = 'none';
    if (DomElements.modalContent) DomElements.modalContent.innerHTML = '';
    
    modalHistory = [];
    destroyStepPieChart();
    console.log("Modal closed.");
}

// Sorting function for average table
function sortAverageTable(column) {
    if (!averageSolvesData.length) return;
    
    const ascending = (currentSort.column === column) ? !currentSort.ascending : true;
    
    averageSolvesData.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        
        if (column === 'time') {
            const aIsDNF = a.dnf || valA === null || valA === Infinity;
            const bIsDNF = b.dnf || valB === null || valB === Infinity;
            if (aIsDNF && bIsDNF) return 0;
            if (aIsDNF) return 1;
            if (bIsDNF) return -1;
        }
        
        const factor = ascending ? 1 : -1;
        if (valA === null || typeof valA === 'undefined') return -1 * factor;
        if (valB === null || typeof valB === 'undefined') return 1 * factor;
        
        if (valA < valB) return -1 * factor;
        if (valA > valB) return 1 * factor;
        return 0;
    });
    
    currentSort = { column, ascending };
    renderAverageTable();
}

function renderAverageTable() {
    const tbody = DomElements.averageDetailContent.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    averageSolvesData.forEach((solve) => {
        const timeClass = solve.dnf ? 'solve-dnf' : 'solve-time';
        const time = solve.dnf ? 'DNF' : formatTime(solve.time);
        const turns = solve.face_turns ?? 'N/A';
        const tps = solve.dnf ? 'N/A' : (solve.tps?.toFixed(2) ?? 'N/A');
        
        const row = document.createElement('tr');
        row.className = 'average-solve-item';
        row.dataset.solveId = solve.id;
        row.innerHTML = `
            <td class="solve-number">${solve.originalIndex}</td>
            <td class="${timeClass}">${time}</td>
            <td>${turns}</td>
            <td>${tps}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Update header sorting indicators
    const headers = DomElements.averageDetailContent.querySelectorAll('th.sortable');
    headers.forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        if (th.dataset.column === currentSort.column) {
            th.classList.add(currentSort.ascending ? 'sorted-asc' : 'sorted-desc');
        }
    });
    
    setupRowClickListeners();
}

function setupRowClickListeners() {
    const rows = DomElements.averageDetailContent.querySelectorAll('.average-solve-item');
    rows.forEach(row => {
        row.addEventListener('click', () => {
            const id = row.dataset.solveId;
            showSolveDetails(id, true);
        });
    });
}

function sizeFromType(type) {
    return type === 'ao5' ? 5 : (type === 'ao12' ? 12 : 100);
}

export function showAverageDetails(avgType, recordIndex) {
    if (!DomElements.averageDetailModal || !DomElements.averageDetailContent) return;

    const N = sizeFromType(avgType);
    const solves = State.chronoSortedSolvesForHistory;
    const startIndex = recordIndex - N + 1;
    if (startIndex < 0) return;

    const avgSolves = solves.slice(startIndex, recordIndex + 1);
    const avgTime = State.rollingBestsForHistory[`best${avgType.charAt(0).toUpperCase() + avgType.slice(1)}`]?.[recordIndex];

    // Store solves data for sorting
    averageSolvesData = avgSolves.map((solve, i) => ({
        ...solve,
        originalIndex: startIndex + i + 1
    }));
    currentSort = { column: null, ascending: true };

    let html = `
        <div class="modal-header">
            <h2>${avgType.toUpperCase()} Record</h2>
        </div>
        
        <div class="modal-stats-grid">
            <div class="modal-stat-card">
                <span class="modal-stat-value">${formatTime(avgTime)}</span>
                <span class="modal-stat-label">Average Time</span>
            </div>
            <div class="modal-stat-card">
                <span class="modal-stat-value">${N}</span>
                <span class="modal-stat-label"># Solves</span>
            </div>
            <div class="modal-stat-card">
                <span class="modal-stat-value">#${startIndex + 1} - #${recordIndex + 1}</span>
                <span class="modal-stat-label">Solve Range</span>
            </div>
            <div class="modal-stat-card">
                <span class="modal-stat-value">${formatDate(avgSolves[avgSolves.length - 1].date)}</span>
                <span class="modal-stat-label">Date</span>
            </div>
        </div>
        
        <h3>Individual Solves</h3>
        <table class="modal-table">
            <thead>
                <tr>
                    <th class="sortable" data-column="originalIndex">#</th>
                    <th class="sortable" data-column="time">Time</th>
                    <th class="sortable" data-column="face_turns">Turns</th>
                    <th class="sortable" data-column="tps">TPS</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    DomElements.averageDetailContent.innerHTML = html;
    renderAverageTable();
    setupAverageModalListeners();
    DomElements.averageDetailModal.style.display = 'flex';
}

function setupAverageModalListeners() {
    const headers = DomElements.averageDetailContent.querySelectorAll('th.sortable');
    headers.forEach(th => {
        th.addEventListener('click', () => {
            sortAverageTable(th.dataset.column);
        });
    });
    
    setupRowClickListeners();
}

// Event listeners for average modal
if (DomElements.closeAverageModalButton) {
    DomElements.closeAverageModalButton.addEventListener('click', () => {
        DomElements.averageDetailModal.style.display = 'none';
        DomElements.averageDetailContent.innerHTML = '';
        averageSolvesData = [];
        currentSort = { column: null, ascending: true };
    });
}

if (DomElements.averageDetailModal) {
    DomElements.averageDetailModal.addEventListener('click', (e) => {
        if (e.target === DomElements.averageDetailModal) {
            DomElements.averageDetailModal.style.display = 'none';
            DomElements.averageDetailContent.innerHTML = '';
            averageSolvesData = [];
            currentSort = { column: null, ascending: true };
        }
    });
}