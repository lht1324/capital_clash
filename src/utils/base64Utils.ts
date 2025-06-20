export function encodeBase64(str: string): string {
    // 브라우저 (client) ↔ 서버 (edge / node) 양쪽 지원
    if (typeof window !== 'undefined' && 'btoa' in window) {
        return window.btoa(
            encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p) =>
                String.fromCharCode(parseInt(p, 16)),
            ),
        );
    }
    return Buffer.from(str, 'utf8').toString('base64');
}

export function decodeBase64(b64: string): string {
    if (typeof window !== 'undefined' && 'atob' in window) {
        const ascii = window.atob(b64);
        return decodeURIComponent(
            ascii
                .split('')
                .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join(''),
        );
    }
    return Buffer.from(b64, 'base64').toString('utf8');
}

/* URL-safe 변형 ----------------------------------------------------------- */
export function encodeBase64Url(str: string): string {
    return encodeBase64(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export function decodeBase64Url(b64url: string): string {
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return decodeBase64(b64);
}