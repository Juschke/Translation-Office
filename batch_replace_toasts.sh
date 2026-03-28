#!/bin/bash

cd /home/oem/Desktop/Translation-Office/frontend/src

echo "🔄 Batch-Update: Ersetze alle Toast-Meldungen..."

# Ersetze häufigste Patterns
find . -name "*.tsx" -type f -exec sed -i \
  -e "s/toast\.success('Termin erfolgreich erstellt')/toast.success(t('toast.appointment_created'))/g" \
  -e "s/toast\.error('Fehler beim Erstellen des Termins')/toast.error(t('toast.appointment_error'))/g" \
  -e "s/toast\.success('Deadline erfolgreich gesetzt')/toast.success(t('toast.deadline_set'))/g" \
  -e "s/toast\.error('Fehler beim Setzen der Deadline')/toast.error(t('toast.deadline_error'))/g" \
  -e "s/toast\.success('Dokumenttyp erstellt')/toast.success(t('toast.document_type_created'))/g" \
  -e "s/toast\.error('Fehler beim Erstellen des Dokumenttyps')/toast.error(t('toast.document_type_error'))/g" \
  -e "s/toast\.success('Vorlage erstellt erfolgreich')/toast.success(t('toast.email_template_created'))/g" \
  -e "s/toast\.error('Fehler beim Erstellen der Vorlage')/toast.error(t('toast.email_template_error'))/g" \
  -e "s/toast\.success('Zahlung erfasst')/toast.success(t('toast.payment_recorded'))/g" \
  -e "s/toast\.error('Fehler beim Erfassen der Zahlung')/toast.error(t('toast.payment_error'))/g" \
  -e "s/toast\.success('Einstellungen gespeichert')/toast.success(t('toast.settings_saved'))/g" \
  -e "s/toast\.error('Fehler beim Speichern der Einstellungen')/toast.error(t('toast.settings_error'))/g" \
  -e "s/toast\.success('Daten exportiert erfolgreich')/toast.success(t('toast.data_exported'))/g" \
  -e "s/toast\.error('Fehler beim Exportieren der Daten')/toast.error(t('toast.export_error'))/g" \
  -e "s/toast\.success('Daten importiert erfolgreich')/toast.success(t('toast.import_success'))/g" \
  -e "s/toast\.error('Fehler beim Importieren der Daten')/toast.error(t('toast.import_error'))/g" \
  {} \;

echo "✅ Toast replacements complete!"

# Zähle wie viele Komponenten jetzt t() verwenden
echo ""
echo "📊 Translation Hook Usage:"
echo "Components with t(): $(grep -r "t('toast\." . --include="*.tsx" | cut -d: -f1 | sort -u | wc -l)"
echo "Components with useTranslation: $(grep -r "useTranslation" . --include="*.tsx" | wc -l)"

