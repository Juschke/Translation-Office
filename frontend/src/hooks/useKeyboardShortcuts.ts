import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Returns true when the event originates from a focusable input element
 * or when any modal/dialog overlay is open in the DOM.
 */
function isEditableTarget(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    if (!target) return false;

    const tag = target.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return true;
    if (target.isContentEditable) return true;

    // Block shortcuts when any Radix / Ant Design modal overlay is present
    const hasModalOverlay =
        document.querySelector('[role="dialog"]') !== null ||
        document.querySelector('.ant-modal-wrap') !== null;
    if (hasModalOverlay) return true;

    return false;
}

export interface KeyboardShortcut {
    key: string;
    description: string;
    category: string;
}

export const SHORTCUTS: KeyboardShortcut[] = [
    { key: 'N', description: 'Neues Projekt erstellen', category: 'Navigation' },
    { key: 'C', description: 'Zur Kundenliste navigieren', category: 'Navigation' },
    { key: '/', description: 'Globale Suche fokussieren', category: 'Suche' },
    { key: '?', description: 'Tastaturkuerzel-Hilfe anzeigen', category: 'Hilfe' },
];

interface UseKeyboardShortcutsOptions {
    onShowHelp: () => void;
}

export function useKeyboardShortcuts({ onShowHelp }: UseKeyboardShortcutsOptions): void {
    const navigate = useNavigate();

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Never fire when the user is typing or a modal is open
            if (isEditableTarget(event)) return;

            // Ignore modifier-key combos (Ctrl+N, Alt+C, etc.)
            if (event.ctrlKey || event.metaKey || event.altKey) return;

            switch (event.key) {
                case 'n':
                case 'N':
                    event.preventDefault();
                    navigate('/projects/new');
                    break;

                case 'c':
                case 'C':
                    event.preventDefault();
                    navigate('/customers');
                    break;

                case '/':
                    event.preventDefault();
                    // Focus the global search input if it exists in the DOM
                    {
                        const searchInput = document.querySelector<HTMLInputElement>(
                            '[data-global-search]'
                        );
                        if (searchInput) {
                            searchInput.focus();
                            searchInput.select();
                        }
                    }
                    break;

                case '?':
                    event.preventDefault();
                    onShowHelp();
                    break;

                default:
                    break;
            }
        },
        [navigate, onShowHelp]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
}
