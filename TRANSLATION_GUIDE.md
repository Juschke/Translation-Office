# Translation Guide - Übersetzungsleitfaden

## Übersicht / Overview

Dieses Projekt verwendet **i18next** für Mehrsprachigkeit mit Englisch (English) und Deutsch (Deutsch).

### Dateien / Files:
- `frontend/src/locales/en/common.json` - English translations
- `frontend/src/locales/de/common.json` - German translations
- `frontend/src/i18n.ts` - i18n configuration

---

## Translation Categories / Übersetzungskategorien

### 1. **Common UI** - Häufig verwendete UI-Elemente
- Actions: save, cancel, delete, edit, create, close
- Status: draft, active, pending, completed, cancelled, overdue, paid
- Fields: name, email, phone, address, city, zip, country
- Pagination, empty states

**Usage:**
```tsx
const { t } = useTranslation();
<button>{t('actions.save')}</button>
<span>{t('status.completed')}</span>
```

### 2. **Settings** - Einstellungen
- Tabs: profile, company, subscription, invoice, master_data, notifications, audit
- Master data: languages, doc_types, services, email_templates, units, currencies
- **NEW**: number_circles, document_layout

**Usage:**
```tsx
<div>{t('settings.tabs.number_circles')}</div>
```

### 3. **Projects** - Projekte
- Status labels with workflow steps:
  - Step 1: Offer (Angebot)
  - Step 2: Production (Produktion)
  - Step 3: Delivery (Lieferung)
  - Step 4: Completion (Abschluss)
- Priority levels: standard, normal, high, express
- Project-specific terms: translation, normline, certified, apostille

**Usage in NewProject.tsx:**
```tsx
const { t } = useTranslation();
const statusOptions = getStatusOptions(t);
// Returns localized status options with steps
```

### 4. **Partners** - Partner
- Types: translator, interpreter, agency
- Rates: per_unit, per_hour, flat
- Bank details: iban, bic, bank_name
- Status: available, busy, vacation, blacklisted

### 5. **Customers** - Kunden
- Types: company, private, authority
- Fields: company_name, contact_person, billing_address
- Tax info: tax_id, registration_number

### 6. **Invoices** - Rechnungen
- Invoice management terms
- Payment status: received, pending
- Export: DATEV, credit notes, reminders

### 7. **Forms** - Formulare
- Validation messages
- Placeholders
- Error messages
- Required field indicators

### 8. **Auth** - Authentifizierung
- Login/Logout
- Registration
- Password management
- Remember me options

### 9. **General UI** - Allgemeine UI
- Common operations: add_new, create_new, import, export, download, upload
- Settings: language, theme, dark_mode, light_mode

---

## How to Add New Translations / Neue Übersetzungen hinzufügen

### Step 1: Identify the Category
Determine which category your translation belongs to (Projects, Partners, etc.)

### Step 2: Add to Both Language Files
Add your translation key to **both** files:

**en/common.json:**
```json
{
  "project": {
    "new_key": "English Text"
  }
}
```

**de/common.json:**
```json
{
  "project": {
    "new_key": "Deutscher Text"
  }
}
```

### Step 3: Use in Component
```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return <div>{t('project.new_key')}</div>;
};
```

---

## Updated Components / Aktualisierte Komponenten

### ✅ Navigation.tsx
- Fixed hardcoded "Nummerkreise" → `t('settings.tabs.number_circles')`
- Fixed hardcoded "Dokumentlayout" → `t('settings.tabs.document_layout')`

### ✅ NewProject.tsx
- Implemented dynamic status options with translations
- Project workflow steps now fully localized
- Uses `getStatusOptions(t)` helper function

---

## Common Patterns / Häufige Muster

### 1. Using Interpolation (with variables)
```tsx
{t('pagination.showing', { from: 1, to: 10, total: 100 })}
// Output: "Showing 1–10 of 100"
```

### 2. Using Count (plural forms)
```tsx
{t('tables.selected', { count: selectedItems.length })}
// Output: "5 selected"
```

### 3. Using Fallbacks
```tsx
{t('some.key', { defaultValue: 'Fallback Text' })}
```

---

## Language Switching / Sprachenwechsel

The app stores language preference in `localStorage` with key `locale`:

```tsx
import i18n from 'react-i18next';

// Change language
i18n.changeLanguage('en'); // English
i18n.changeLanguage('de'); // German

// Get current language
const currentLanguage = i18n.language;
```

---

## Best Practices / Best Practices

1. **Always use `useTranslation()`** in components needing translations
2. **Never hardcode text** that should be translatable
3. **Group related translations** under the same category
4. **Use consistent naming** for translation keys (snake_case)
5. **Update both language files** simultaneously
6. **Test both languages** when adding new features
7. **Use placeholder/interpolation** for dynamic content

---

## Translation Statistics / Übersetzungsstatistik

**Current Coverage:**
- Common UI: ✅ Complete
- Settings: ✅ Complete (including number_circles, document_layout)
- Projects: ✅ Complete (all status labels & priorities)
- Partners: ✅ Complete
- Customers: ✅ Complete
- Invoices: ✅ Complete
- Forms: ✅ Complete
- Auth: ✅ Complete

**Total Keys:** 300+ translation keys covering all major features

---

## Checklist for New Pages/Components / Checkliste für neue Seiten/Komponenten

- [ ] Import `useTranslation` hook
- [ ] Initialize `const { t } = useTranslation()`
- [ ] Replace all hardcoded text with `t('key')`
- [ ] Add new keys to both `en/common.json` and `de/common.json`
- [ ] Test both languages in browser
- [ ] Verify language switching works correctly

---

**Letzte Aktualisierung / Last Updated:** 2026-03-28
