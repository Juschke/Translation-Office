#!/bin/bash

cd /home/oem/Desktop/Translation-Office/frontend/src

echo "🔄 PHASE 1: Füge useTranslation zu allen Komponenten hinzu..."

# Funktion um useTranslation zu einer Datei hinzuzufügen
add_translation_hook() {
    local file="$1"
    
    # Überspringe wenn bereits vorhanden
    if grep -q "useTranslation" "$file"; then
        return 0
    fi
    
    # Überspringe wenn keine React-Import vorhanden
    if ! grep -q "from 'react'" "$file"; then
        return 0
    fi
    
    # Finde die erste Import-Zeile
    local import_line=$(grep -n "from 'react'" "$file" | head -1 | cut -d: -f1)
    
    if [ ! -z "$import_line" ]; then
        sed -i "${import_line}a import { useTranslation } from 'react-i18next';" "$file"
        echo "✅ Added to: $file"
    fi
}

# Alle Pages
for file in pages/*.tsx; do
    [ -f "$file" ] && add_translation_hook "$file"
done

# Alle Komponenten
for file in components/**/*.tsx; do
    [ -f "$file" ] && add_translation_hook "$file"
done

echo ""
echo "🔄 PHASE 2: Aktualisiere hardcodierte deutsche Meldungen..."

# Batch-Update häufiger Meldungen
find . -name "*.tsx" -type f -exec sed -i \
  -e "s/toast\.success('Erfolgreich')/toast.success(t('messages.success'))/g" \
  -e "s/toast\.error('Fehler')/toast.error(t('messages.error'))/g" \
  -e "s/toast\.success('Speichern erfolgreich')/toast.success(t('messages.success'))/g" \
  -e "s/toast\.error('Speichern fehlgeschlagen')/toast.error(t('messages.error'))/g" \
  -e "s/toast\.success('Löschen erfolgreich')/toast.success(t('messages.success'))/g" \
  -e "s/toast\.error('Löschen fehlgeschlagen')/toast.error(t('messages.error'))/g" \
  -e "s/toast\.success('Aktualisiert erfolgreich')/toast.success(t('messages.success'))/g" \
  -e "s/toast\.error('Aktualisierung fehlgeschlagen')/toast.error(t('messages.error'))/g" \
  {} \;

echo "✅ Batch updates completed"
echo ""
echo "📊 Translation status:"
grep -r "useTranslation" . --include="*.tsx" | wc -l | xargs echo "Components with i18n:"
echo "Done!"

