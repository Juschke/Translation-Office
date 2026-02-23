/**
 * Hilfsfunktionen für Datei-Downloads via Blob-URLs.
 * Stellt sicher, dass Blob-URLs nach der Verwendung immer revoked werden
 * um Memory-Leaks zu vermeiden.
 */

/** Löst einen Datei-Download via verstecktem Link aus und revoked die Blob-URL danach. */
export function triggerBlobDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Sofort revoken - Browser hat URL bereits referenziert
    URL.revokeObjectURL(url);
}

/** Öffnet eine Blob-URL in einem neuen Tab und revoked sie nach kurzem Delay. */
export function openBlobInNewTab(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Delay damit der neue Tab die URL laden kann, bevor wir revoken
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
