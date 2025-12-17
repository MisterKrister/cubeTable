// statsManager.js
import { formatTime } from './formatters.js';
import { displayedSolves } from './state.js';

// Parse date range input
export function parseDateRange(dateRangeStr) {
    // Format: "2025/01/01-2025/02/02"
    const parts = dateRangeStr.trim().split('-');
    if (parts.length !== 2) {
        throw new Error('Invalid date range format. Use: YYYY/MM/DD-YYYY/MM/DD');
    }

    const start = new Date(parts[0].trim());
    const end = new Date(parts[1].trim());

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid dates in range');
    }

    // Set end time to end of day
    end.setHours(23, 59, 59, 999);

    return { start, end };
}

// Parse day count input
export function parseDayCount(dayCount) {
    const days = parseInt(dayCount, 10);
    if (isNaN(days) || days < 1) {
        throw new Error('Invalid day count. Must be a positive number');
    }

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    return { start, end };
}

// Filter solves by date range
export function filterSolvesByDateRange(solves, startDate, endDate) {
    return solves.filter(solve => {
        const solveDate = solve.date;
        return solveDate >= startDate && solveDate <= endDate;
    });
}

// Calculate OLL skip rate - returns object with count and rate
export function calculateOLLSkipRate(solves) {
    let totalWithOLL = 0;
    let ollSkips = 0;

    solves.forEach(solve => {
        if (!solve.steps || solve.steps.length === 0) return;

        // Check if OLL step exists
        const ollStep = solve.steps.find(step =>
            step.name && step.name.toLowerCase() === 'oll'
        );

        if (ollStep) {
            totalWithOLL++;
            // Check if OLL was skipped (no moves or very short time)
            if (ollStep.time === 0 || (ollStep.executionTime !== null && ollStep.executionTime === 0)) {
                ollSkips++;
            }
        }
    });

    const rate = totalWithOLL === 0 ? 0 : (ollSkips / totalWithOLL) * 100;
    return { count: ollSkips, rate };
}

// Calculate PLL skip rate - returns object with count and rate
export function calculatePLLSkipRate(solves) {
    let totalWithPLL = 0;
    let pllSkips = 0;

    solves.forEach(solve => {
        if (!solve.steps || solve.steps.length === 0) return;

        // Check if PLL step exists
        const pllStep = solve.steps.find(step =>
            step.name && step.name.toLowerCase() === 'pll'
        );

        if (pllStep) {
            totalWithPLL++;
            // Check if PLL was skipped
            if (pllStep.time === 0 || (pllStep.executionTime !== null && pllStep.executionTime === 0)) {
                pllSkips++;
            }
        }
    });

    const rate = totalWithPLL === 0 ? 0 : (pllSkips / totalWithPLL) * 100;
    return { count: pllSkips, rate };
}

// Calculate average time per step
export function calculateAverageStepTimes(solves) {
    const stepTotals = {};
    const stepCounts = {};

    solves.forEach(solve => {
        if (!solve.steps || solve.steps.length === 0 || solve.dnf) return;

        solve.steps.forEach(step => {
            const stepName = step.name;
            if (!stepTotals[stepName]) {
                stepTotals[stepName] = 0;
                stepCounts[stepName] = 0;
            }
            if (step.time && step.time > 0) {
                stepTotals[stepName] += step.time;
                stepCounts[stepName]++;
            }
        });
    });

    const averages = {};
    for (const stepName in stepTotals) {
        averages[stepName] = stepTotals[stepName] / stepCounts[stepName];
    }

    return averages;
}

// Calculate all statistics for the given solves
export function calculateStatistics(solves) {
    // Filter out DNF solves for most calculations
    const validSolves = solves.filter(s => !s.dnf);

    // Total solve count
    const totalSolves = validSolves.length;

    // Average solve time
    let avgTime = 0;
    if (totalSolves > 0) {
        const totalTime = validSolves.reduce((sum, solve) => sum + solve.time, 0);
        avgTime = totalTime / totalSolves;
    }

    // Total solving time
    const totalSolvingTime = validSolves.reduce((sum, solve) => sum + solve.time, 0);

    // OLL and PLL skip rates (now returns objects with count and rate)
    const ollSkipData = calculateOLLSkipRate(validSolves);
    const pllSkipData = calculatePLLSkipRate(validSolves);

    // Average step times
    const avgStepTimes = calculateAverageStepTimes(validSolves);

    return {
        totalSolves,
        avgTime,
        totalSolvingTime,
        ollSkipCount: ollSkipData.count,
        ollSkipRate: ollSkipData.rate,
        pllSkipCount: pllSkipData.count,
        pllSkipRate: pllSkipData.rate,
        avgStepTimes
    };
}

// Display statistics in the UI
export function displayStatistics(stats) {
    // Display basic stats
    document.getElementById('stat-solve-count').textContent = stats.totalSolves;
    document.getElementById('stat-average').textContent =
        stats.totalSolves > 0 ? formatTime(stats.avgTime) : '-';

    // Format total time (convert to hours:minutes:seconds if large)
    let totalTimeStr = '-';
    if (stats.totalSolvingTime > 0) {
        const totalSeconds = Math.floor(stats.totalSolvingTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            totalTimeStr = `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            totalTimeStr = `${minutes}m ${seconds}s`;
        } else {
            totalTimeStr = `${seconds}s`;
        }
    }
    document.getElementById('stat-total-time').textContent = totalTimeStr;

    // Display OLL skip - count with percentage below
    const ollSkipEl = document.getElementById('stat-oll-skip');
    if (stats.ollSkipCount > 0 || stats.ollSkipRate > 0) {
        ollSkipEl.innerHTML = `${stats.ollSkipCount}<br><span class="stat-percentage">(${stats.ollSkipRate.toFixed(1)}%)</span>`;
    } else {
        ollSkipEl.textContent = '-';
    }

    // Display PLL skip - count with percentage below
    const pllSkipEl = document.getElementById('stat-pll-skip');
    if (stats.pllSkipCount > 0 || stats.pllSkipRate > 0) {
        pllSkipEl.innerHTML = `${stats.pllSkipCount}<br><span class="stat-percentage">(${stats.pllSkipRate.toFixed(1)}%)</span>`;
    } else {
        pllSkipEl.textContent = '-';
    }

    // Display step times
    const stepStatsContainer = document.getElementById('stepStatsContainer');
    stepStatsContainer.innerHTML = ''; // Clear previous content

    if (Object.keys(stats.avgStepTimes).length === 0) {
        stepStatsContainer.innerHTML = '<div class="step-stat-placeholder">No step data available</div>';
    } else {
        // Sort steps by a logical order (Cross, F2L, OLL, PLL, etc.)
        const stepOrder = ['cross', 'f2l slot 1', 'f2l slot 2', 'f2l slot 3', 'f2l slot 4', 'oll', 'pll'];
        const sortedSteps = Object.keys(stats.avgStepTimes).sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            const aIndex = stepOrder.findIndex(s => aLower.includes(s));
            const bIndex = stepOrder.findIndex(s => bLower.includes(s));

            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.localeCompare(b);
        });

        sortedSteps.forEach(stepName => {
            const avgTime = stats.avgStepTimes[stepName];
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step-stat-item';
            stepDiv.innerHTML = `
                <span class="step-stat-name">${stepName}</span>
                <span class="step-stat-time">${formatTime(avgTime)}</span>
            `;
            stepStatsContainer.appendChild(stepDiv);
        });
    }
}

// Main function to calculate and display stats based on user input
export function calculateAndDisplayStats() {
    const dateRangeInput = document.getElementById('dateRangeInput').value.trim();
    const dayCountInput = document.getElementById('dayCountInput').value.trim();

    let startDate, endDate;

    try {
        if (dateRangeInput) {
            ({ start: startDate, end: endDate } = parseDateRange(dateRangeInput));
        } else if (dayCountInput) {
            ({ start: startDate, end: endDate } = parseDayCount(dayCountInput));
        } else {
            alert('Please enter either a date range or number of days');
            return;
        }

        // Filter solves
        const filteredSolves = filterSolvesByDateRange(displayedSolves, startDate, endDate);

        if (filteredSolves.length === 0) {
            alert('No solves found in the specified date range');
            return;
        }

        // Calculate statistics
        const stats = calculateStatistics(filteredSolves);

        // Display statistics
        displayStatistics(stats);

    } catch (error) {
        alert('Error: ' + error.message);
        console.error('[StatsManager]', error);
    }
}
