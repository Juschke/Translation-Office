#!/bin/bash

# Components to update with i18n
COMPONENTS=(
    "frontend/src/pages/Team.tsx"
    "frontend/src/pages/Interpreting.tsx"
    "frontend/src/pages/Reports.tsx"
    "frontend/src/pages/Calendar.tsx"
    "frontend/src/components/modals/NewProjectModal.tsx"
    "frontend/src/components/modals/NewCustomerModal.tsx"
    "frontend/src/components/modals/NewPartnerModal.tsx"
    "frontend/src/components/settings/CompanySettingsTab.tsx"
    "frontend/src/components/settings/InvoiceSettingsTab.tsx"
    "frontend/src/components/settings/MasterDataTab.tsx"
    "frontend/src/components/settings/ProfileTab.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        # Check if it already has useTranslation
        if ! grep -q "useTranslation" "$component"; then
            echo "Adding i18n to: $component"
            
            # Add import at top
            sed -i "/import.*from 'react'/a import { useTranslation } from 'react-i18next';" "$component"
            
            # Remove duplicate imports if any
            sed -i '1!N;$!D;s/\(import.*react-i18next.*\)\n\1/\1/' "$component"
        fi
    fi
done

echo "✅ i18n imports added to components"
