export function getShortEnglishLocaleString(amount: number) {
    return amount.toLocaleString('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    })
}