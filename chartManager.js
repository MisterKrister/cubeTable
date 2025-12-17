// chartManager.js - OPTIMIZED & FIXED VERSION
// import Chart from 'chart.js/auto'; // Use auto bundle
import { formatTime } from './formatters.js';
import * as Config from './config.js';
import * as State from './state.js';
import * as DomElements from './domElements.js';

// --- Main Line Chart ---

const mainLineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 }, // Disable animation for performance
    interaction: {
        mode: 'index',
        intersect: false,
    },
    scales: {
        x: {
            display: true,
            title: { display: true, text: 'Solve Number', color: '#ccc' },
            grid: { color: 'rgba(204, 204, 204, 0.2)' },
            ticks: { 
                color: '#ccc',
                // OPTIMIZATION: Reduce tick density for large datasets
                maxTicksLimit: 20,
                autoSkip: true,
                autoSkipPadding: 50
            }
        },
        y: {
            display: true,
            title: { display: true, text: 'Time (s)', color: '#ccc' },
            grid: { color: 'rgba(204, 204, 204, 0.2)' },
            ticks: {
                color: '#ccc',
                // Format Y-axis ticks to seconds
                callback: function(value) {
                    if (typeof value === 'number') {
                        return (value / 1000).toFixed(2);
                    }
                    return value;
                }
            }
        }
    },
    plugins: {
        tooltip: { enabled: false }, // Disabled in original code
        legend: {
            display: true,
            position: 'bottom',
            align: 'start',
            labels: {
                boxWidth: 12,
                boxHeight: 12,
                color: '#ccc',
                padding: 10,
                generateLabels: function(c) {
                    const datasets = c.data.datasets;
                    return datasets.map((dataset, i) => ({
                        text: dataset.label,
                        fillStyle: dataset.borderColor,
                        strokeStyle: 'rgba(0,0,0,0)',
                        lineWidth: 0,
                        hidden: !c.isDatasetVisible(i),
                        datasetIndex: i,
                    }));
                }
            }
        }
    }
};

export function initializeMainChart() {
    console.log("Initializing main line chart...");
    if (State.solvesChart) {
        console.log("Destroying previous main line chart instance.");
        State.solvesChart.destroy();
        State.setSolvesChart(null);
    }
    if (!DomElements.chartCanvas) {
        console.error("Main line chart canvas element not found!");
        return;
    }
    try {
        const ctx = DomElements.chartCanvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    // Rolling Averages (Solid Lines)
                    { label: 'Ao100', data: [], borderColor: Config.CHART_MAIN_LINE_COLORS.ao100, borderWidth: 1.5, tension: 0.3, pointRadius: 0, fill: false, order: 1 },
                    { label: 'Ao12', data: [], borderColor: Config.CHART_MAIN_LINE_COLORS.ao12, borderWidth: 1.5, tension: 0.3, pointRadius: 0, fill: false, order: 1 },
                    { label: 'Ao5', data: [], borderColor: Config.CHART_MAIN_LINE_COLORS.ao5, borderWidth: 1.5, tension: 0.3, pointRadius: 0, fill: false, order: 1 },
                    { label: 'Single', data: [], borderColor: Config.CHART_MAIN_LINE_COLORS.single, borderWidth: 1, tension: 0, pointRadius: 1, fill: false, order: 1 },

                    // Rolling Bests (Dashed Lines)
                    { label: 'Best Ao100', data: [], borderColor: Config.CHART_MAIN_LINE_COLORS.bestAo100, borderWidth: 1.5, tension: 0, pointRadius: 0, fill: false, borderDash: [5, 5], order: 0 },
                    { label: 'Best Ao12', data: [], borderColor: Config.CHART_MAIN_LINE_COLORS.bestAo12, borderWidth: 1.5, tension: 0, pointRadius: 0, fill: false, borderDash: [5, 5], order: 0 },
                    { label: 'Best Ao5', data: [], borderColor: Config.CHART_MAIN_LINE_COLORS.bestAo5, borderWidth: 1.5, tension: 0, pointRadius: 0, fill: false, borderDash: [5, 5], order: 0 },
                    { label: 'Best Single', data: [], borderColor: Config.CHART_MAIN_LINE_COLORS.bestSingle, borderWidth: 1.5, tension: 0, pointRadius: 0, fill: false, borderDash: [5, 5], order: 0 },
                ]
            },
            options: mainLineChartOptions
        });
        State.setSolvesChart(chart);
        console.log("Main line chart initialized.");
    } catch (error) {
        console.error("Error initializing main line chart:", error);
    }
}

// OPTIMIZATION: Batch chart updates with requestAnimationFrame
let pendingChartUpdate = null;

export function updateMainChart(solves, calculationResults) {
    // Cancel any pending updates
    if (pendingChartUpdate !== null) {
        cancelAnimationFrame(pendingChartUpdate);
        pendingChartUpdate = null;
    }

    // Schedule update on next animation frame for smoother performance
    pendingChartUpdate = requestAnimationFrame(() => {
        performChartUpdate(solves, calculationResults);
        pendingChartUpdate = null;
    });
}

function performChartUpdate(solves, calculationResults) {
    if (!State.solvesChart) {
        console.warn("Chart not initialized, skipping update.");
        return;
    }

    // Destructure results
    const { averages, bests } = calculationResults || { averages: {}, bests: {} };

    if (!solves || solves.length === 0) {
        State.solvesChart.data.labels = [];
        State.solvesChart.data.datasets.forEach(dataset => { dataset.data = []; });
    } else {
        const labels = solves.map((_, index) => index + 1);
        const singleTimes = solves.map(s => s.dnf ? null : s.time);

        // Convert nulls to NaN for Chart.js rendering gaps
        const ao100Data = (averages.ao100 || []).map(v => v === null ? NaN : v);
        const ao12Data = (averages.ao12 || []).map(v => v === null ? NaN : v);
        const ao5Data = (averages.ao5 || []).map(v => v === null ? NaN : v);
        const singleData = singleTimes.map(v => v === null ? NaN : v);

        const bestAo100Data = (bests.bestAo100 || []).map(v => v === null ? NaN : v);
        const bestAo12Data = (bests.bestAo12 || []).map(v => v === null ? NaN : v);
        const bestAo5Data = (bests.bestAo5 || []).map(v => v === null ? NaN : v);
        const bestSingleData = (bests.bestSingle || []).map(v => v === null ? NaN : v);

        // Assign data based on the ORDER DEFINED IN initializeMainChart
        State.solvesChart.data.labels = labels;
        // Averages
        State.solvesChart.data.datasets[0].data = ao100Data;
        State.solvesChart.data.datasets[1].data = ao12Data;
        State.solvesChart.data.datasets[2].data = ao5Data;
        State.solvesChart.data.datasets[3].data = singleData;
        // Bests
        State.solvesChart.data.datasets[4].data = bestAo100Data;
        State.solvesChart.data.datasets[5].data = bestAo12Data;
        State.solvesChart.data.datasets[6].data = bestAo5Data;
        State.solvesChart.data.datasets[7].data = bestSingleData;
    }

    // Update the chart
    console.log("Calling main chart.update() with optimized data...");
    try {
        State.solvesChart.update('none'); // Use 'none' mode for instant update without animation
        console.log("Main chart update() completed.");
    } catch (e) {
        console.error("ERROR calling main chart.update():", e);
    }
}


// --- Step Pie Chart (Modal) ---

const stepPieChartOptionsBase = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 }, // Quick animation for modal
    plugins: {
        legend: {
            position: 'top',
            labels: {
                color: '#ccc',
                boxWidth: 15,
                padding: 15,
                // Custom label generator to include percentage
                generateLabels: function(chart) {
                    const data = chart.data;
                    if (!data.labels || !data.datasets || !data.datasets[0].data) {
                         return [];
                    }
                    const datasetData = data.datasets[0].data;
                    const total = datasetData.reduce((sum, value) => sum + (value || 0), 0);
                    if (total === 0) {
                         return data.labels.map((label, index) => ({
                            text: `${label}: 0.0%`,
                            fillStyle: data.datasets[0].backgroundColor[index],
                            strokeStyle: '#000',
                            lineWidth: 0,
                            hidden: !chart.getDataVisibility(index),
                            index: index
                        }));
                    }
                    return data.labels.map((label, index) => {
                        const value = datasetData[index] || 0;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return {
                            text: `${label}: ${percentage}%`,
                            fillStyle: data.datasets[0].backgroundColor[index],
                            strokeStyle: '#000',
                            lineWidth: 0,
                            hidden: !chart.getDataVisibility(index),
                            index: index
                        };
                    });
                }
            }
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.chart.data.datasets[0].data.reduce((sum, v) => sum + (v || 0), 0);
                    const percentage = total > 0 ? (value / total) * 100 : 0;
                    const formattedTime = formatTime(value, true);
                    return `${label}: ${formattedTime} (${percentage.toFixed(1)}%)`;
                }
            }
        }
    },
    layout: {
        padding: { top: 10, bottom: 10 }
    }
};

export function renderStepPieChart(stepData) {
     console.log("[ChartManager] Rendering step pie chart with data:", stepData);
    if (State.stepPieChart) {
        console.log("Destroying previous step pie chart instance.");
        State.stepPieChart.destroy();
        State.setStepPieChart(null);
    }

    if (!DomElements.pieChartCanvas) {
        console.error("Pie chart canvas element not found in modal!");
        return;
    }
    
    const ctx = DomElements.pieChartCanvas.getContext('2d');
    ctx.clearRect(0, 0, DomElements.pieChartCanvas.width, DomElements.pieChartCanvas.height);

    if (!stepData || !stepData.data || stepData.data.length === 0 || stepData.data.every(d => d === 0)) {
        console.log("No valid step execution data to create pie chart.");
         ctx.fillStyle = '#aaa';
         ctx.textAlign = 'center';
         ctx.font = '14px sans-serif';
         ctx.fillText("No step execution data available", DomElements.pieChartCanvas.width / 2, DomElements.pieChartCanvas.height / 2);
        return;
    }

     console.log("Creating new pie chart...");
    try {
        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: stepData.labels,
                datasets: [{
                    label: 'Step Execution Time',
                    data: stepData.data,
                    backgroundColor: stepData.colors,
                    borderColor: '#555',
                    borderWidth: 1
                }]
            },
            options: stepPieChartOptionsBase
        });
        State.setStepPieChart(chart);
        console.log("Pie chart created successfully.");
    } catch (chartError) {
        console.error("ERROR Creating pie chart:", chartError);
        State.setStepPieChart(null);
    }
}

export function destroyStepPieChart() {
     if (State.stepPieChart) {
        console.log("[ChartManager] Destroying step pie chart.");
        try {
            State.stepPieChart.destroy();
        } catch (destroyError) {
            console.error("[ChartManager] Error destroying pie chart:", destroyError);
        }
        State.setStepPieChart(null);
    }
}
