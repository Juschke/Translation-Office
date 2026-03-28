#!/bin/bash

cd /home/oem/Desktop/Translation-Office/frontend/src

# Update all remaining German toast messages across all files
echo "🔄 Batch updating translation references..."

# Common error patterns
find . -name "*.tsx" -type f -exec sed -i \
  -e "s/toast\.success('Mitarbeiter wurde hinzugefügt\.')/toast.success(t('team.member_added'))/g" \
  -e "s/toast\.error('Fehler beim Hinzufügen des Mitarbeiters\.')/toast.error(t('team.member_add_error'))/g" \
  -e "s/toast\.success('Mitarbeiter wurde aktualisiert\.')/toast.success(t('team.member_updated'))/g" \
  -e "s/toast\.error('Fehler beim Aktualisieren des Mitarbeiters\.')/toast.error(t('team.member_update_error'))/g" \
  -e "s/toast\.success('Mitarbeiter wurde gelöscht\.')/toast.success(t('team.member_deleted'))/g" \
  -e "s/toast\.error('Fehler beim Löschen des Mitarbeiters\.')/toast.error(t('team.member_delete_error'))/g" \
  {} \;

echo "✅ Batch updates completed"
