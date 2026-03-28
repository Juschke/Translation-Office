#!/bin/bash

FILES=(
  "/home/oem/Desktop/Translation-Office/frontend/src/components/inbox/MailDetailPanel.tsx"
  "/home/oem/Desktop/Translation-Office/frontend/src/components/inbox/MailListPanel.tsx"
  "/home/oem/Desktop/Translation-Office/frontend/src/components/inbox/MailResourceTable.tsx"
  "/home/oem/Desktop/Translation-Office/frontend/src/components/inbox/MailTabButton.tsx"
  "/home/oem/Desktop/Translation-Office/frontend/src/components/projects/ProjectFilesTab.tsx"
  "/home/oem/Desktop/Translation-Office/frontend/src/components/projects/ProjectOverviewTab.tsx"
  "/home/oem/Desktop/Translation-Office/frontend/src/components/modals/ProjectFinancialSidebar.tsx"
  "/home/oem/Desktop/Translation-Office/frontend/src/components/modals/ProjectPaymentsTable.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ] && ! grep -q "useTranslation" "$file"; then
    echo "Adding useTranslation to $(basename $file)..."
    sed -i "0,/^import/s/^import/import { useTranslation } from 'react-i18next';\nimport/" "$file"
  fi
done

echo "✓ All components updated with i18n imports!"
