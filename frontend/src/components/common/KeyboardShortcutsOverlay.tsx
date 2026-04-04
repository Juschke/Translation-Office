import { useEffect } from 'react';
import { FaKeyboard, FaTimes } from 'react-icons/fa';
import { SHORTCUTS, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsOverlayProps {
    open: boolean;
    onClose: () => void;
}

const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-sm border border-slate-300 bg-slate-50 text-slate-700 text-xs font-mono font-semibold shadow-[0_2px_0_rgba(0,0,0,0.08)] leading-none">
        {children}
    </kbd>
);

// Group shortcuts by category
function groupByCategory(shortcuts: KeyboardShortcut[]): Record<string, KeyboardShortcut[]> {
    const groups: Record<string, KeyboardShortcut[]> = {};
    for (const s of shortcuts) {
        if (!groups[s.category]) groups[s.category] = [];
        groups[s.category].push(s);
    }
    return groups;
}

const KeyboardShortcutsOverlay = ({ open, onClose }: KeyboardShortcutsOverlayProps) => {
    // Close on Escape key
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    const grouped = groupByCategory(SHORTCUTS);
    const categories = Object.keys(grouped);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="shortcuts-title"
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 shadow-lg bg-white"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <FaKeyboard className="text-[var(--color-primary)] w-4 h-4" />
                        <h2
                            id="shortcuts-title"
                            className="text-base font-semibold text-slate-800"
                        >
                            Tastaturkuerzel
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        aria-label="Schliessen"
                    >
                        <FaTimes className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-5">
                    {categories.map((category) => (
                        <div key={category}>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                {category}
                            </p>
                            <ul className="space-y-1.5">
                                {grouped[category].map((shortcut) => (
                                    <li
                                        key={shortcut.key}
                                        className="flex items-center justify-between gap-4 py-1"
                                    >
                                        <span className="text-sm text-slate-600">
                                            {shortcut.description}
                                        </span>
                                        <Kbd>{shortcut.key}</Kbd>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Footer hint */}
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                        Kuerzel funktionieren ausserhalb von Eingabefeldern und Modals.
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Kbd>?</Kbd>
                        <span>zum Schliessen</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default KeyboardShortcutsOverlay;
