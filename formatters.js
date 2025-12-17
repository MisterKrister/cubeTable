// formatters.js

// Helper: Format Time
export function formatTime(ms, returnZeroOnError = false) {
    if (ms === null || typeof ms === 'undefined' || typeof ms !== 'number') {
        return returnZeroOnError ? '0.00 s' : 'undefined s';
    }
    if (isNaN(ms)) {
        return returnZeroOnError ? '0.00 s' : 'undefined s';
    }
    if (ms === Infinity) return 'DNF';
    const seconds = ms / 1000;
    return seconds.toFixed(2) + ' s';
}

// Helper: Format Date (Absolute ISO-like)
export function formatDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'undefined';
    try {
        // Return YYYY-MM-DD HH:MM
        return date.toISOString().slice(0, 16).replace('T', ' ');
    } catch (e) {
        console.error("Error formatting date:", date, e);
        return 'undefined';
    }
}

// Helper: Format Date (Relative or Absolute)
export function formatRelativeDateOrAbsolute(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'undefined';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const oneMinute = 60 * 1000;
    const oneHour = 60 * oneMinute;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;

    // If in the future or more than a week ago, show absolute date
    if (diffMs < 0 || diffMs >= oneWeek) {
        return formatDate(date);
    }

    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffMs / oneMinute);
    const diffHours = Math.round(diffMs / oneHour);
    const diffDays = Math.round(diffMs / oneDay);

    if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    return `${Math.max(diffSeconds, 1)} second${diffSeconds !== 1 ? 's' : ''} ago`;
}