export function getLocaleDateString(isoString: string, option: Intl.DateTimeFormatOptions = {}) {
    const baseOption: Intl.DateTimeFormatOptions = {
        ...option,
        year:   "numeric",
        month:  "2-digit",
        day:    "2-digit",
        hour:   "2-digit",
        minute: "2-digit",
        hour12: false,
    };

    return new Date(isoString).toLocaleTimeString(undefined, baseOption);
}