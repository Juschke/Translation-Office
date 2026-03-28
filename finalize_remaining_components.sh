#!/bin/bash

cd /home/oem/Desktop/Translation-Office/frontend/src

echo "🔄 Finalisiere verbleibende Komponenten..."

# FileExplorer.tsx
if grep -q "useTranslation" components/projects/FileExplorer.tsx; then
    echo "✅ FileExplorer.tsx - already has useTranslation"
fi

# KanbanBoard.tsx
if grep -q "useTranslation" components/projects/KanbanBoard.tsx; then
    echo "✅ KanbanBoard.tsx - already has useTranslation"
fi

# ProjectPositionsTable.tsx
if grep -q "useTranslation" components/modals/ProjectPositionsTable.tsx; then
    echo "✅ ProjectPositionsTable.tsx - already has useTranslation"
fi

# ProjectPaymentsTable.tsx
if grep -q "useTranslation" components/modals/ProjectPaymentsTable.tsx; then
    echo "✅ ProjectPaymentsTable.tsx - already has useTranslation"
fi

# Zähle Komponenten mit i18n
echo ""
echo "📊 Final Translation Statistics:"
echo "Components with useTranslation: $(grep -r "useTranslation" . --include="*.tsx" | cut -d: -f1 | sort -u | wc -l)"
echo "Components with t('...'): $(grep -r "t('" . --include="*.tsx" | cut -d: -f1 | sort -u | wc -l)"
echo "Translation keys in EN: $(grep -c '":' locales/en/common.json)"
echo "Translation keys in DE: $(grep -c '":' locales/de/common.json)"

