// state.js
import { DEFAULT_SORT_COLUMN, DEFAULT_SORT_ASCENDING } from './config.js';

export let allSolves = [];
export let displayedSolves = [];
export let solvesChart = null;
export let stepPieChart = null;
export let currentSort = { column: DEFAULT_SORT_COLUMN, ascending: DEFAULT_SORT_ASCENDING };
export let sessionMap = {};
export let currentSession = null;

export let rollingBests = { /* ... */ };
// ↓↓↓ NEW State Variable for Filter ↓↓↓
export let activeRecordFilter = 'single'; // Default to 'single'
// ↓↓↓ NEW State Variable to store data needed for re-rendering history ↓↓↓
export let chronoSortedSolvesForHistory = [];
export let rollingBestsForHistory = {};


// Functions to update state
export function setAllSolves(solves) { allSolves = solves; }
export function setDisplayedSolves(solves) { displayedSolves = solves; }
export function setSolvesChart(chartInstance) { solvesChart = chartInstance; }
export function setStepPieChart(chartInstance) { stepPieChart = chartInstance; }
export function setCurrentSort(column, ascending) { currentSort = { column, ascending }; }
export function setSessionMap(map) { sessionMap = map; }
export function setCurrentSession(sessionName) { currentSession = sessionName; }
export function setRollingBests(bestsData) { rollingBests = bestsData; } // Use this? Maybe rename
// ↓↓↓ NEW Setters ↓↓↓
export function setActiveRecordFilter(filter) { activeRecordFilter = filter; }
export function setChronoSortedSolvesForHistory(solves) { chronoSortedSolvesForHistory = solves; }
export function setRollingBestsForHistory(bests) { rollingBestsForHistory = bests; }