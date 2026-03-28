const fs = require('fs');

// Fix ConfirmationModal and ConfirmModal
const files = [
  '/home/oem/Desktop/Translation-Office/frontend/src/components/modals/ConfirmationModal.tsx',
  '/home/oem/Desktop/Translation-Office/frontend/src/components/modals/ConfirmModal.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace default button texts
    content = content.replace(/confirmText = 'Bestätigen'/g, "confirmText = t('actions.confirm')");
    content = content.replace(/cancelText = 'Abbrechen'/g, "cancelText = t('actions.cancel')");
    
    fs.writeFileSync(file, content);
    console.log(`✓ Fixed ${file.split('/').pop()}`);
  }
});

// Fix EmailComposeModal - same variable substitution as Inbox
const emailModalFile = '/home/oem/Desktop/Translation-Office/frontend/src/components/modals/EmailComposeModal.tsx';
if (fs.existsSync(emailModalFile)) {
  let content = fs.readFileSync(emailModalFile, 'utf8');
  
  const replacements = [
    ["label: 'Kundenname'", "label: t('inbox.var_customer_name')"],
    ["label: 'Ansprechpartner'", "label: t('inbox.var_contact_person')"],
    ["label: 'Kunden-E-Mail'", "label: t('inbox.var_customer_email')"],
    ["label: 'Telefon'", "label: t('inbox.var_customer_phone')"],
    ["label: 'Adresse'", "label: t('inbox.var_customer_address')"],
    ["label: 'Stadt'", "label: t('inbox.var_customer_city')"],
    ["label: 'PLZ'", "label: t('inbox.var_customer_zip')"],
    ["label: 'Projektnummer'", "label: t('inbox.var_project_number')"],
    ["label: 'Projektname'", "label: t('inbox.var_project_name')"],
    ["label: 'Status'", "label: t('inbox.var_project_status')"],
    ["label: 'Ausgangssprache'", "label: t('inbox.var_source_language')"],
    ["label: 'Zielsprache'", "label: t('inbox.var_target_language')"],
    ["label: 'Sprachpaar'", "label: t('inbox.var_project_languages')"],
    ["label: 'Deadline'", "label: t('inbox.var_deadline')"],
    ["label: 'Dokumentenart'", "label: t('inbox.var_document_type')"],
    ["label: 'Priorität'", "label: t('inbox.var_priority')"],
    ["label: 'Betrag (Netto)'", "label: t('inbox.var_price_net')"],
    ["label: 'Betrag (Brutto)'", "label: t('inbox.var_price_gross')"],
    ["label: 'Zahlungsziel'", "label: t('inbox.var_payment_terms')"],
    ["label: 'Rechnungsnummer'", "label: t('inbox.var_invoice_number')"],
    ["label: 'Rechnungsdatum'", "label: t('inbox.var_invoice_date')"],
    ["label: 'Fälligkeitsdatum'", "label: t('inbox.var_due_date')"],
    ["group: 'Kunde'", "group: t('inbox.group_customer')"],
    ["group: 'Projekt'", "group: t('inbox.group_project')"],
    ["group: 'Finanzen'", "group: t('inbox.group_finance')"]
  ];
  
  replacements.forEach(([old, newVal]) => {
    content = content.replace(new RegExp(old.replace(/'/g, "'"), 'g'), newVal);
  });
  
  fs.writeFileSync(emailModalFile, content);
  console.log('✓ Fixed EmailComposeModal.tsx');
}

// Fix CustomerSelectionModal
const custSelModalFile = '/home/oem/Desktop/Translation-Office/frontend/src/components/modals/CustomerSelectionModal.tsx';
if (fs.existsSync(custSelModalFile)) {
  let content = fs.readFileSync(custSelModalFile, 'utf8');
  
  content = content.replace(/c\.type === 'company' \? 'Firma' : c\.type === 'authority' \? 'Behörde' : 'Privat'/g, "c.type === 'company' ? t('customers.type_company_label') : c.type === 'authority' ? t('customers.type_authority_label') : t('customers.type_private_label')");
  
  fs.writeFileSync(custSelModalFile, content);
  console.log('✓ Fixed CustomerSelectionModal.tsx');
}

console.log('\n✓ All modal translations updated!');
