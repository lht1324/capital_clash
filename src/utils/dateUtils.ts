export function getLocaleDateString(isoString: string) {
    return new Date(isoString).toLocaleDateString();
}