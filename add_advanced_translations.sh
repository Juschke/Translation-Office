#!/bin/bash

cd /home/oem/Desktop/Translation-Office/frontend/src/locales

# English additions
cat > temp_en.json << 'JSON'
,
  "reports": {
    "title": "Reports",
    "analytics": "Analytics",
    "export": "Export Report",
    "period": "Reporting Period",
    "revenue": "Revenue",
    "costs": "Costs",
    "profit": "Profit",
    "margin": "Margin",
    "no_data": "No data for selected period"
  },
  "documents": {
    "title": "Documents",
    "upload": "Upload Document",
    "download": "Download",
    "preview": "Preview",
    "delete": "Delete Document",
    "document_type": "Document Type",
    "uploaded_by": "Uploaded by",
    "file_size": "File Size",
    "no_documents": "No documents available"
  },
  "interpreting_advanced": {
    "assignment": "Assignment",
    "interpreter": "Interpreter",
    "location": "Location",
    "confirmed": "Confirmed",
    "pending": "Pending",
    "cancelled": "Cancelled"
  },
  "files": {
    "upload": "Upload File",
    "download": "Download File",
    "delete": "Delete File",
    "preview": "Preview File",
    "shared": "Shared",
    "private": "Private",
    "no_files": "No files uploaded"
  },
  "search": {
    "placeholder": "Search...",
    "searching": "Searching...",
    "no_results": "No results found",
    "advanced": "Advanced Search"
  },
  "notifications": {
    "title": "Notifications",
    "new": "New Notification",
    "mark_as_read": "Mark as Read",
    "unread": "Unread",
    "no_notifications": "No notifications"
  }
JSON

# German additions
cat > temp_de.json << 'JSON'
,
  "reports": {
    "title": "Berichte",
    "analytics": "Analytik",
    "export": "Bericht exportieren",
    "period": "Berichtszeitraum",
    "revenue": "Umsatz",
    "costs": "Kosten",
    "profit": "Gewinn",
    "margin": "Marge",
    "no_data": "Keine Daten für ausgewählten Zeitraum"
  },
  "documents": {
    "title": "Dokumente",
    "upload": "Dokument hochladen",
    "download": "Herunterladen",
    "preview": "Vorschau",
    "delete": "Dokument löschen",
    "document_type": "Dokumenttyp",
    "uploaded_by": "Hochgeladen von",
    "file_size": "Dateigröße",
    "no_documents": "Keine Dokumente vorhanden"
  },
  "interpreting_advanced": {
    "assignment": "Einsatz",
    "interpreter": "Dolmetscher",
    "location": "Ort",
    "confirmed": "Bestätigt",
    "pending": "Ausstehend",
    "cancelled": "Storniert"
  },
  "files": {
    "upload": "Datei hochladen",
    "download": "Datei herunterladen",
    "delete": "Datei löschen",
    "preview": "Vorschau",
    "shared": "Geteilt",
    "private": "Privat",
    "no_files": "Keine Dateien hochgeladen"
  },
  "search": {
    "placeholder": "Suchen...",
    "searching": "Wird gesucht...",
    "no_results": "Keine Ergebnisse gefunden",
    "advanced": "Erweiterte Suche"
  },
  "notifications": {
    "title": "Benachrichtigungen",
    "new": "Neue Benachrichtigung",
    "mark_as_read": "Als gelesen markieren",
    "unread": "Ungelesen",
    "no_notifications": "Keine Benachrichtigungen"
  }
JSON

# Entferne die schließende Klammer vor dem Hinzufügen
sed -i '$d' en/common.json
sed -i '$d' de/common.json

# Füge neue Inhalte hinzu
cat temp_en.json >> en/common.json
echo "}" >> en/common.json

cat temp_de.json >> de/common.json
echo "}" >> de/common.json

# Cleanup
rm temp_en.json temp_de.json

echo "✅ Advanced translations added!"

