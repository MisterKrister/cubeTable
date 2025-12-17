// averages.js - OPTIMIZED VERSION

/**
 * Calculates the standard trimmed average (AoX) for the last 'count' times.
 * Removes single best and worst time if count > 3.
 * Treats null/Infinity as DNF (worst).
 */
function calculateAverage(times, count) {
    if (!Array.isArray(times) || times.length < count) {
        return null; // Not enough times
    }

    const lastN = times.slice(-count);

    let minIndex = -1, maxIndex = -1;
    let minValue = Infinity, maxValue = -Infinity;
    let dnfCount = 0;
    const validTimes = [];

    for (let i = 0; i < lastN.length; i++) {
        const time = lastN[i];
        if (time === null || typeof time !== 'number' || isNaN(time) || !isFinite(time)) {
             dnfCount++;
             if (maxValue !== Infinity) {
                 maxValue = Infinity;
                 maxIndex = i;
             }
        } else {
            validTimes.push(time);
            if (time < minValue) {
                minValue = time;
                minIndex = i;
            }
             if (maxValue === -Infinity || (maxValue !== Infinity && time > maxValue) ) {
                maxValue = time;
                maxIndex = i;
            }
        }
    }

    if (dnfCount > 1) {
        return null;
    }

    if (count <= 3) {
        if (dnfCount === 1) return null;
        if (validTimes.length < count) return null;
        let sum = 0;
        for (const t of lastN) {
             if (t === null || typeof t !== 'number' || !isFinite(t) || isNaN(t)) return null;
             sum += t;
        }
        return sum / count;
    }

    // --- Trimmed Average (AoX, count > 3) ---
    if (dnfCount === 1) {
        if (validTimes.length < count - 1) return null;

        let sum = 0;
        let includedCount = 0;
        let minRemoved = false;
        let actualMinValue = Infinity;
        let actualMinIndex = -1;
        for(let i=0; i<lastN.length; i++) {
            const t = lastN[i];
            if (t !== null && typeof t === 'number' && isFinite(t) && !isNaN(t)) {
                 if(t < actualMinValue) {
                    actualMinValue = t;
                    actualMinIndex = i;
                 }
            }
        }

        for (let i = 0; i < lastN.length; i++) {
             const time = lastN[i];
             if (time === null || typeof time !== 'number' || !isFinite(time) || isNaN(time)) {
                 continue; // Skip the DNF
             }
             if (!minRemoved && i === actualMinIndex) {
                 minRemoved = true;
             } else {
                 sum += time;
                 includedCount++;
             }
        }
        if (includedCount !== count - 2) {
             return null;
        }
        return sum / includedCount;

    } else {
        // No DNFs
        if (validTimes.length < count) return null;

        let sum = 0;
        let includedCount = 0;
        let minRemoved = false;
        let maxRemoved = false;

        for (let i = 0; i < lastN.length; i++) {
            const time = lastN[i];
             if (!minRemoved && i === minIndex) {
                minRemoved = true;
            } else if (!maxRemoved && i === maxIndex) {
                maxRemoved = true;
            } else {
                if (typeof time === 'number' && isFinite(time) && !isNaN(time)){
                    sum += time;
                    includedCount++;
                }
            }
        }
        if (includedCount !== count - 2) {
            validTimes.sort((a, b) => a - b);
            const middleTimes = validTimes.slice(1, -1);
            if (middleTimes.length !== count - 2) return null;
            return middleTimes.reduce((a, b) => a + b, 0) / middleTimes.length;
        }
        return sum / includedCount;
    }
}


/**
 * Calculates the Ao100 (Average of 100).
 * Removes the fastest 5% and slowest 5% (5 solves each).
 * Returns null (DNF) if more than 5 solves are DNF.
 */
function calculateAo100(times) {
    const count = 100;
    const percentToRemove = 5;

    if (!Array.isArray(times) || times.length < count) {
        return null;
    }

    const last100 = times.slice(-count);
    const numToRemove = Math.floor(count * (percentToRemove / 100));

    let dnfCount = 0;
    const validTimes = [];

    for (let i = 0; i < last100.length; i++) {
        const time = last100[i];
        if (time === null || typeof time !== 'number' || isNaN(time) || !isFinite(time)) {
             dnfCount++;
        } else {
            validTimes.push(time);
        }
    }

    if (dnfCount > numToRemove) {
        return null;
    }

    const neededValidTimes = count - (2 * numToRemove);
    if (validTimes.length < neededValidTimes) {
         return null;
    }

    validTimes.sort((a, b) => a - b);

    const numericSlowToRemove = Math.max(0, numToRemove - dnfCount);
    const numericFastToRemove = numToRemove;

    if (validTimes.length < (numericFastToRemove + numericSlowToRemove)) {
        return null;
    }

    const trimmedTimes = validTimes.slice(numericFastToRemove, validTimes.length - numericSlowToRemove);

    if (trimmedTimes.length === 0) {
        return null;
    }

    const sum = trimmedTimes.reduce((a, b) => a + b, 0);
    return sum / trimmedTimes.length;
}


/**
 * OPTIMIZED: Calculates rolling averages AND rolling bests using sliding window approach.
 * Assumes solves are chronologically sorted.
 * 
 * PERFORMANCE IMPROVEMENT: O(n) instead of O(n²) by using incremental calculation.
 */
export function calculateRollingAverages(solves) {
    const n = solves.length;
    
    // Early return for empty datasets
    if (n === 0) {
        return {
            averages: { ao5: [], ao12: [], ao100: [] },
            bests: { bestSingle: [], bestAo5: [], bestAo12: [], bestAo100: [] }
        };
    }

    // Pre-allocate arrays for better performance
    const timesForAo5Ao12 = new Array(n);
    const timesForAo100 = new Array(n);
    const singleTimes = new Array(n);
    
    // Single pass to extract times (more cache-friendly)
    for (let i = 0; i < n; i++) {
        const isDNF = solves[i].dnf;
        const time = solves[i].time;
        timesForAo5Ao12[i] = isDNF ? Infinity : time;
        timesForAo100[i] = isDNF ? null : time;
        singleTimes[i] = isDNF ? null : time;
    }

    const ao5 = new Array(n);
    const ao12 = new Array(n);
    const ao100 = new Array(n);

    const bestSingle = new Array(n);
    const bestAo5 = new Array(n);
    const bestAo12 = new Array(n);
    const bestAo100 = new Array(n);

    let currentBestSingle = Infinity;
    let currentBestAo5 = Infinity;
    let currentBestAo12 = Infinity;
    let currentBestAo100 = Infinity;

    // OPTIMIZATION: Use sliding window for average calculations
    // Instead of slicing from 0 to i+1 each time, we only look at the last N items
    for (let i = 0; i < n; i++) {
        // Calculate rolling averages only from the necessary window
        const startAo5 = Math.max(0, i - 4);
        const startAo12 = Math.max(0, i - 11);
        const startAo100 = Math.max(0, i - 99);

        // Only calculate if we have enough solves
        if (i >= 4) {
            ao5[i] = calculateAverage(timesForAo5Ao12.slice(startAo5, i + 1), 5);
        } else {
            ao5[i] = null;
        }

        if (i >= 11) {
            ao12[i] = calculateAverage(timesForAo5Ao12.slice(startAo12, i + 1), 12);
        } else {
            ao12[i] = null;
        }

        if (i >= 99) {
            ao100[i] = calculateAo100(timesForAo100.slice(startAo100, i + 1));
        } else {
            ao100[i] = null;
        }

        // Best Single (optimized with single pass)
        const currentSingle = singleTimes[i];
        if (currentSingle !== null && currentSingle < currentBestSingle) {
            currentBestSingle = currentSingle;
        }
        bestSingle[i] = (currentBestSingle === Infinity) ? null : currentBestSingle;

        // Best Ao5
        const currentAo5 = ao5[i];
        if (currentAo5 !== null && currentAo5 < currentBestAo5) {
            currentBestAo5 = currentAo5;
        }
        bestAo5[i] = (currentBestAo5 === Infinity) ? null : currentBestAo5;

        // Best Ao12
        const currentAo12 = ao12[i];
        if (currentAo12 !== null && currentAo12 < currentBestAo12) {
            currentBestAo12 = currentAo12;
        }
        bestAo12[i] = (currentBestAo12 === Infinity) ? null : currentBestAo12;

        // Best Ao100
        const currentAo100 = ao100[i];
        if (currentAo100 !== null && currentAo100 < currentBestAo100) {
            currentBestAo100 = currentAo100;
        }
        bestAo100[i] = (currentBestAo100 === Infinity) ? null : currentBestAo100;
    }

    return {
        averages: { ao5, ao12, ao100 },
        bests: { bestSingle, bestAo5, bestAo12, bestAo100 }
    };
}
