// csvParser.js - OPTIMIZED VERSION
import * as Config from './config.js';

// --- Helper Functions for processSolves ---

function getHeaderIndices(headers) {
    const indices = {
        time: headers.indexOf(Config.HEADER_TIME),
        timerTime: headers.indexOf(Config.HEADER_TIMER_TIME),
        date: headers.indexOf(Config.HEADER_DATE),
        faceTurns: headers.indexOf(Config.HEADER_FACE_TURNS),
        tps: headers.indexOf(Config.HEADER_TPS),
        scramble: headers.indexOf(Config.HEADER_SCRAMBLE),
        dnf: headers.indexOf(Config.HEADER_DNF),
        id: headers.indexOf(Config.HEADER_ID),
        totalRecogTime: headers.indexOf(Config.HEADER_TOTAL_RECOG_TIME),
        totalExecTime: headers.indexOf(Config.HEADER_TOTAL_EXEC_TIME),
        session: headers.indexOf(Config.HEADER_SESSION_NAME) !== -1
                  ? headers.indexOf(Config.HEADER_SESSION_NAME)
                  : headers.indexOf(Config.HEADER_SESSION_ALT),
        steps: {}
    };
    // Find time index (prefer 'time' over 'timer_time')
    indices.actualTime = indices.time !== -1 ? indices.time : indices.timerTime;

    for (let i = 0; i < Config.MAX_STEPS_TO_PARSE; i++) {
        indices.steps[`step_${i}_name`] = headers.indexOf(`${Config.HEADER_STEP_NAME_PREFIX}${i}_name`);
        indices.steps[`step_${i}_time`] = headers.indexOf(`${Config.HEADER_STEP_TIME_PREFIX}${i}_time`);
        indices.steps[`step_${i}_recognition_time`] = headers.indexOf(`${Config.HEADER_STEP_RECOG_TIME_PREFIX}${i}_recognition_time`);
        indices.steps[`step_${i}_execution_time`] = headers.indexOf(`${Config.HEADER_STEP_EXEC_TIME_PREFIX}${i}_execution_time`);
    }
    return indices;
}

function parseStepData(row, stepIndices) {
    const steps = [];
    let calculatedTotalRecog = 0;

    for (let i = 0; i < Config.MAX_STEPS_TO_PARSE; i++) {
        const nameIndex = stepIndices[`step_${i}_name`];
        const timeIndex = stepIndices[`step_${i}_time`];
        const recogTimeIndex = stepIndices[`step_${i}_recognition_time`];
        const execTimeIndex = stepIndices[`step_${i}_execution_time`];

        const stepName = (nameIndex !== -1 && row[nameIndex]) ? row[nameIndex] : null;
        const stepTimeStr = (timeIndex !== -1 && row[timeIndex]) ? row[timeIndex] : null;
        const stepRecogTimeStr = (recogTimeIndex !== -1) ? row[recogTimeIndex] : null;
        const stepExecTimeStr = (execTimeIndex !== -1) ? row[execTimeIndex] : null;

        // Only process if at least name and time are present
        if (stepName && stepTimeStr) {
            const stepTime = parseInt(stepTimeStr, 10);
            const stepRecogTime = parseInt(stepRecogTimeStr, 10);
            const stepExecTime = parseInt(stepExecTimeStr, 10);

            if (!isNaN(stepTime)) {
                const stepData = {
                    name: stepName,
                    time: stepTime,
                    recognitionTime: isNaN(stepRecogTime) ? null : stepRecogTime,
                    executionTime: isNaN(stepExecTime) ? null : stepExecTime,
                };

                // Calculate execution if missing and possible
                if (stepData.executionTime === null && stepData.time !== null && stepData.recognitionTime !== null) {
                    stepData.executionTime = Math.max(0, stepData.time - stepData.recognitionTime);
                }
                // Add to calculated total pause time
                if (stepData.recognitionTime !== null) {
                    calculatedTotalRecog += stepData.recognitionTime;
                }
                steps.push(stepData);
            }
        } else if (nameIndex === -1 && timeIndex === -1 && recogTimeIndex === -1 && execTimeIndex === -1 && i > 0) {
             break;
        }
    }
    return { steps, calculatedTotalRecog };
}

function parseSolveRow(row, indices, index) {
     if (!Array.isArray(row) || row.length === 0 || row.every(cell => cell === null || cell === '')) return null;

    const timeMsStr = row[indices.actualTime];
    const dateStr = row[indices.date];

    const timeMs = parseInt(timeMsStr, 10);
    const date = new Date(dateStr);

    // --- Critical validation ---
    if (isNaN(timeMs)) {
        return null;
    }
     if (isNaN(date.getTime())) {
        return null;
     }
     // --- End Critical validation ---

    const faceTurnsStr = indices.faceTurns !== -1 ? row[indices.faceTurns] : null;
    const dnfStr = indices.dnf !== -1 ? row[indices.dnf] : 'false';
    const tpsStr = indices.tps !== -1 ? row[indices.tps] : null;
    const totalRecogTimeStr = indices.totalRecogTime !== -1 ? row[indices.totalRecogTime] : null;
    const totalExecTimeStr = indices.totalExecTime !== -1 ? row[indices.totalExecTime] : null;
    const scramble = indices.scramble !== -1 ? (row[indices.scramble] || 'N/A') : 'N/A';
    const id = indices.id !== -1 ? (row[indices.id] || `gen_${index}`) : `gen_${index}`;
    const sessionName = indices.session !== -1 ? (row[indices.session] || 'Default') : 'Default';

    const faceTurns = parseInt(faceTurnsStr, 10);
    const isDNF = String(dnfStr).toLowerCase() === 'true';
    const totalRecognitionTime = parseInt(totalRecogTimeStr, 10);
    const totalExecutionTime = parseInt(totalExecTimeStr, 10);

    // Calculate TPS if missing or invalid, but possible
    let tps = null;
    const rawTps = parseFloat(tpsStr);
    if (!isNaN(rawTps) && rawTps > 0) {
        tps = rawTps;
    } else if (!isDNF && timeMs > 0 && !isNaN(faceTurns) && faceTurns > 0) {
        tps = (faceTurns / (timeMs / 1000));
        if (!isFinite(tps)) tps = null;
    }

     // --- Process Step Data ---
    const { steps, calculatedTotalRecog } = parseStepData(row, indices.steps);

    // --- Final Solve Object Construction ---
    const solveData = {
        id: id,
        date: date,
        time: timeMs,
        face_turns: isNaN(faceTurns) ? null : faceTurns,
        tps: tps,
        scramble: scramble,
        dnf: isDNF,
        totalRecognitionTime: isNaN(totalRecognitionTime) ? calculatedTotalRecog : totalRecognitionTime,
        totalExecutionTime: isNaN(totalExecutionTime) ? null : totalExecutionTime,
        steps: steps,
        session: sessionName,
    };

    // Calculate total execution time if missing and possible
    if (solveData.totalExecutionTime === null && !solveData.dnf && solveData.time !== null && solveData.totalRecognitionTime !== null) {
        solveData.totalExecutionTime = Math.max(0, solveData.time - solveData.totalRecognitionTime);
    }

    return solveData;
}


// --- Main Exported Function ---
export function processSolves(rawData) {
    console.log("[CSVParser] Starting processSolves...");
    const startTime = performance.now();
    
    if (!rawData || rawData.length < 2) {
        console.warn("[CSVParser] No data or only header row found.");
        return [];
    }

    const headers = rawData[0].map(h => h ? String(h).trim().toLowerCase() : '');
    const dataRows = rawData.slice(1);
    console.log(`[CSVParser] Processing ${dataRows.length} data rows with headers:`, headers);

    const indices = getHeaderIndices(headers);

    // Check for essential columns
    if (indices.actualTime === -1 || indices.date === -1) {
        console.error("[CSVParser] CRITICAL: Missing 'time'/'timer_time' or 'date' column. Cannot process.");
        alert("Error: Could not find required 'Time' or 'Date' columns in the CSV.");
        return [];
    }

    // OPTIMIZATION: Pre-allocate array with approximate size
    const processedData = new Array(dataRows.length);
    let validCount = 0;
    
    // OPTIMIZATION: Process in batches for better memory management and progress tracking
    const BATCH_SIZE = 500;
    const totalBatches = Math.ceil(dataRows.length / BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, dataRows.length);
        
        // Log progress for large datasets
        if (totalBatches > 2 && batchIndex % 5 === 0) {
            const progress = ((batchEnd / dataRows.length) * 100).toFixed(1);
            console.log(`[CSVParser] Processing: ${progress}% complete (${batchEnd}/${dataRows.length} rows)`);
        }
        
        // Process batch
        for (let i = batchStart; i < batchEnd; i++) {
            const solve = parseSolveRow(dataRows[i], indices, i);
            if (solve) {
                processedData[validCount++] = solve;
            }
        }
    }

    // Trim array to actual size
    const result = processedData.slice(0, validCount);
    
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    console.log(`[CSVParser] Finished processing ${result.length} valid solves in ${duration}ms (${(result.length / duration * 1000).toFixed(0)} solves/sec)`);
    
    return result;
}
