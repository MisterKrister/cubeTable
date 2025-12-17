// config.js

// CSV Header Names (Adapt if your headers differ)
export const HEADER_TIME = 'time';
export const HEADER_TIMER_TIME = 'timer_time'; // Alternative for time
export const HEADER_DATE = 'date';
export const HEADER_FACE_TURNS = 'face_turns';
export const HEADER_TPS = 'turns_per_second';
export const HEADER_SCRAMBLE = 'scramble';
export const HEADER_DNF = 'dnf';
export const HEADER_ID = 'id';
export const HEADER_TOTAL_RECOG_TIME = 'total_recognition_time';
export const HEADER_TOTAL_EXEC_TIME = 'total_execution_time';
export const HEADER_STEP_NAME_PREFIX = 'step_'; // e.g., step_0_name
export const HEADER_STEP_TIME_PREFIX = 'step_'; // e.g., step_0_time
export const HEADER_STEP_RECOG_TIME_PREFIX = 'step_'; // e.g., step_0_recognition_time
export const HEADER_STEP_EXEC_TIME_PREFIX = 'step_'; // e.g., step_0_execution_time
export const HEADER_SESSION_NAME = 'session_name'; // Or 'session'
export const HEADER_SESSION_ALT = 'session';

// Chart Settings
export const CHART_MAIN_LINE_COLORS = {
    // Regular Averages
    single: 'rgb(59, 130, 246)',  // Blue
    ao5: 'rgb(239, 68, 68)',     // Red
    ao12: 'rgb(245, 158, 11)',    // Amber
    ao100: 'rgb(34, 197, 94)',    // Green

    // Rolling Bests (Example: Slightly lighter/different colors)
    bestSingle: 'rgb(147, 197, 253)', // Light Blue
    bestAo5: 'rgb(252, 165, 165)',    // Light Red
    bestAo12: 'rgb(253, 224, 71)',     // Light Amber/Yellow
    bestAo100: 'rgb(134, 239, 172)',   // Light Green
};
export const CHART_STEP_PIE_COLORS = [
    'rgb(34, 197, 94)',   // F2L (Green)
    'rgb(239, 68, 68)',   // OLL (Red)
    'rgb(59, 130, 246)',  // PLL (Blue)
    'rgb(245, 158, 11)',  // Cross (Amber)
    'rgb(107, 114, 128)'  // Other (Gray)
];
export const CHART_STEP_PIE_LABELS = ['Cross', 'F2L', 'OLL', 'PLL', 'Other'];

// Other
export const MAX_STEPS_TO_PARSE = 9; // Max step_{i}_* columns to check
export const DEFAULT_SORT_COLUMN = 'date';
export const DEFAULT_SORT_ASCENDING = false;
export const VIRTUALIZATION_THRESHOLD = 1000;
export const ESTIMATED_ROW_HEIGHT_PX = 42;