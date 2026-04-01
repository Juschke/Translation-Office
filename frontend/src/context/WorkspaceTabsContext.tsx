import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface WorkspaceTab {
    id: string;
    label: string;
    path: string;
    type?: string;
    closable?: boolean;
    active?: boolean;
    isDirty?: boolean;
}

interface WorkspaceTabsContextType {
    tabs: WorkspaceTab[];
    activeTabId: string | null;
    openTab: (tab: Omit<WorkspaceTab, 'active'>) => void;
    closeTab: (id: string, force?: boolean) => void;
    closeAllTabs: (force?: boolean) => void;
    closeOtherTabs: (id: string, force?: boolean) => void;
    setActiveTab: (id: string) => void;
    updateTab: (id: string, updates: Partial<Omit<WorkspaceTab, 'id'>>) => void;
}

const WorkspaceTabsContext = createContext<WorkspaceTabsContextType | undefined>(undefined);

export const WorkspaceTabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tabs, setTabs] = useState<WorkspaceTab[]>(() => {
        const saved = localStorage.getItem('workspace_tabs');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [];
    });

    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Persist tabs to localStorage
    useEffect(() => {
        localStorage.setItem('workspace_tabs', JSON.stringify(tabs));
    }, [tabs]);

    const openTab = useCallback((tab: Omit<WorkspaceTab, 'active'>) => {
        setTabs(prev => {
            const existingIndex = prev.findIndex(t => t.path === tab.path || t.id === tab.id);
            if (existingIndex !== -1) {
                const newTabs = [...prev];
                newTabs[existingIndex] = { ...newTabs[existingIndex], ...tab };
                return newTabs;
            }
            return [...prev, { ...tab, closable: tab.closable ?? true }];
        });
        setActiveTabId(tab.id);
        navigate(tab.path);
    }, [navigate]);

    const closeTab = useCallback((id: string, force: boolean = false) => {
        const tabToClose = tabs.find(t => t.id === id);
        if (tabToClose?.isDirty && !force) {
            if (!window.confirm(`Die Seite "${tabToClose.label}" hat ungespeicherte Änderungen. Möchten Sie sie wirklich schließen?`)) {
                return;
            }
        }

        setTabs(prev => {
            const index = prev.findIndex(t => t.id === id);
            if (index === -1) return prev;

            const newTabs = prev.filter(t => t.id !== id);

            // If we closed the active tab, switch to another
            if (activeTabId === id) {
                if (newTabs.length > 0) {
                    const nextTab = newTabs[Math.max(0, index - 1)];
                    setActiveTabId(nextTab.id);
                    navigate(nextTab.path);
                } else {
                    setActiveTabId(null);
                    navigate('/'); // Go back home if no tabs left
                }
            }

            return newTabs;
        });
    }, [activeTabId, navigate, tabs]);

    const closeAllTabs = useCallback((force: boolean = false) => {
        const dirtyTabs = tabs.filter(t => t.isDirty);
        if (dirtyTabs.length > 0 && !force) {
            if (!window.confirm("Es gibt Tabs mit ungespeicherten Änderungen. Möchten Sie wirklich alle Tabs schließen?")) {
                return;
            }
        }
        setTabs([]);
        setActiveTabId(null);
        navigate('/');
    }, [tabs, navigate]);

    const setActiveTab = useCallback((id: string) => {
        const tab = tabs.find(t => t.id === id);
        if (tab) {
            setActiveTabId(id);
            navigate(tab.path);
        }
    }, [tabs, navigate]);

    const updateTab = useCallback((id: string, updates: Partial<Omit<WorkspaceTab, 'id'>>) => {
        setTabs(prev => {
            const tab = prev.find(t => t.id === id);
            if (!tab) return prev;

            // Optimization: check if anything actually changed
            const keys = Object.keys(updates) as (keyof typeof updates)[];
            const hasChanged = keys.some(key => tab[key] !== updates[key]);

            if (!hasChanged) return prev;

            return prev.map(t => t.id === id ? { ...t, ...updates } : t);
        });
    }, []);

    // Update active tab based on current URL and auto-create tabs for specific routes
    useEffect(() => {
        const path = location.pathname;

        // Define routes that should automatically become tabs
        const patterns = [
            { regex: /^\/projects\/new$/, label: 'Neues Projekt', type: 'project_new' },
            { regex: /^\/projects\/([^/]+)\/edit$/, label: 'Projekt bearbeiten', type: 'project_edit' },
            { regex: /^\/projects\/([^/]+)$/, label: 'Projekt-Details', type: 'project_detail' },
            { regex: /^\/customers\/new$/, label: 'Neuer Kunde', type: 'customer_new' },
            { regex: /^\/customers\/([^/]+)$/, label: 'Kunden-Details', type: 'customer_detail' },
            { regex: /^\/partners\/new$/, label: 'Neuer Partner', type: 'partner_new' },
            { regex: /^\/partners\/([^/]+)$/, label: 'Partner-Details', type: 'partner_detail' },
            { regex: /^\/invoices\/new$/, label: 'Neue Rechnung', type: 'invoice_new' },
            { regex: /^\/invoices\/([^/]+)$/, label: 'Rechnung', type: 'invoice_detail' },
            { regex: /^\/settings/, label: 'Einstellungen', type: 'settings' },
            { regex: /^\/inbox$/, label: 'Posteingang', type: 'inbox' },
            { regex: /^\/calendar$/, label: 'Kalender', type: 'calendar' },
            { regex: /^\/dashboard$/, label: 'Dashboard', type: 'dashboard' },
        ];

        const match = patterns.find(p => p.regex.test(path));

        if (match) {
            const matches = path.match(match.regex);
            const entityId = matches && matches[1] ? matches[1] : null;
            const tabId = entityId ? `${match.type}_${entityId}` : (match.type || path);

            setTabs(prev => {
                const existingTab = prev.find(t => t.id === tabId || t.path === path);
                if (!existingTab) {
                    return [...prev, {
                        id: tabId,
                        label: match.label,
                        path: path,
                        type: match.type,
                        closable: true
                    }];
                }
                // Update path if it changed (e.g. going from /projects/new to /projects/123 after save)
                if (existingTab.path !== path) {
                    return prev.map(t => t.id === existingTab.id ? { ...t, path } : t);
                }
                return prev;
            });
            setActiveTabId(tabId);
        } else if (path === '/') {
            setActiveTabId(null);
        }
    }, [location.pathname]);

    const closeOtherTabs = useCallback((id: string, force: boolean = false) => {
        const otherDirtyTabs = tabs.filter(t => t.id !== id && t.isDirty);
        if (otherDirtyTabs.length > 0 && !force) {
            if (!window.confirm("Einige andere Tabs haben ungespeicherte Änderungen. Möchten Sie wirklich alle anderen Tabs schließen?")) {
                return;
            }
        }
        setTabs(prev => prev.filter(t => t.id === id));
        setActiveTabId(id);
        const tab = tabs.find(t => t.id === id);
        if (tab) navigate(tab.path);
    }, [tabs, navigate]);

    return (
        <WorkspaceTabsContext.Provider value={{ tabs, activeTabId, openTab, closeTab, closeAllTabs, closeOtherTabs, setActiveTab, updateTab }}>
            {children}
        </WorkspaceTabsContext.Provider>
    );
};

export const useWorkspaceTabs = () => {
    const context = useContext(WorkspaceTabsContext);
    if (context === undefined) {
        throw new Error('useWorkspaceTabs must be used within a WorkspaceTabsProvider');
    }
    return context;
};
