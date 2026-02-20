import re

with open('src/components/forms/PartnerForm.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import PhoneInput from '../common/PhoneInput';",
    "import PhoneInput from '../common/PhoneInput';\nimport { IMaskInput } from 'react-imask';\nimport toast from 'react-hot-toast';\nimport MultiSelect from '../common/MultiSelect';"
)

# Domain options
domain_options = """
const DOMAIN_OPTIONS = [
  { value: 'agrarwirtschaft', label: 'Agrarwirtschaft' },
  { value: 'architektur', label: 'Architektur' },
  { value: 'automobil', label: 'Automobil' },
  { value: 'bankwesen', label: 'Bankwesen' },
  { value: 'bauwesen', label: 'Bauwesen' },
  { value: 'chemie', label: 'Chemie' },
  { value: 'elektrotechnik', label: 'Elektrotechnik' },
  { value: 'energie', label: 'Energie' },
  { value: 'finanzen', label: 'Finanzen' },
  { value: 'it', label: 'IT & Software' },
  { value: 'juristisch', label: 'Juristisch' },
  { value: 'kosmetik', label: 'Kosmetik' },
  { value: 'kunst', label: 'Kunst & Kultur' },
  { value: 'literatur', label: 'Literatur' },
  { value: 'marketing', label: 'Marketing & PR' },
  { value: 'maschinenbau', label: 'Maschinenbau' },
  { value: 'medizin', label: 'Medizin & Pharma' },
  { value: 'nahrungsmittel', label: 'Nahrungsmittel' },
  { value: 'oekologie', label: 'Ökologie & Umwelt' },
  { value: 'recht', label: 'Recht' },
  { value: 'technik', label: 'Technik' },
  { value: 'telekommunikation', label: 'Telekommunikation' },
  { value: 'tourismus', label: 'Tourismus' },
  { value: 'wirtschaft', label: 'Wirtschaft' }
];
"""

content = content.replace("export interface PartnerFormData {", domain_options + "\nexport interface PartnerFormData {")

# 2. Interface properties update
content = content.replace("domains: string | string[];", "domains: string[];\n  bankAccountHolder: string;\n  bankCode: string;")

# 3. formData initialization
content = content.replace("domains: '' as string | string[],", "domains: [] as string[],\n  bankAccountHolder: '',\n  bankCode: '',")

# 4. mappings in useEffect (mappedData)
mapped_data_replace = """ domains: initialData.domains ? (Array.isArray(initialData.domains) ? initialData.domains : initialData.domains.split(',').map((d: string) => d.trim())) : formData.domains,
 software: initialData.software || formData.software,
 priceMode: initialData.price_mode || initialData.priceMode || formData.priceMode,
 unitRates: initialData.unit_rates || initialData.unitRates || formData.unitRates,
 flatRates: initialData.flat_rates || initialData.flatRates || formData.flatRates,
 paymentTerms: String(initialData.payment_terms || initialData.paymentTerms || formData.paymentTerms),
 taxId: initialData.tax_id || initialData.taxId || formData.taxId,
 bankName: initialData.bank_name || initialData.bankName || formData.bankName,
 bankAccountHolder: initialData.bank_account_holder || initialData.bankAccountHolder || formData.bankAccountHolder,
 bankCode: initialData.bank_code || initialData.bankCode || formData.bankCode,"""

content = re.sub(
    r" domains: initialData.domains \|\| formData.domains,.*?\n.*?bankName: initialData.bank_name \|\| initialData.bankName \|\| formData.bankName,",
    mapped_data_replace,
    content,
    flags=re.DOTALL
)

# 5. validation
# No immediate change needed to existing validation, IMask handles the format mostly, but left there.

# 6. State variables inside PartnerForm
state_vars = """ const [errors, setErrors] = useState<Record<string, string>>({});
 const [touched, setTouched] = useState<Record<string, boolean>>({});
 const [isValidatingIban, setIsValidatingIban] = useState(false);"""
content = content.replace(" const [errors, setErrors] = useState<Record<string, string>>({});\n const [touched, setTouched] = useState<Record<string, boolean>>({});", state_vars)


# 7. Add handleIbanBlur and handleBicBlur
handlers = """
  const handleIbanBlur = async () => {
    const cleanIban = (formData.iban || '').replace(/\s/g, '');
    if (!cleanIban || cleanIban.length < 15) return;
    setIsValidatingIban(true);
    try {
      const response = await fetch(`https://openiban.com/validate/${cleanIban}?getBIC=true&validateBankCode=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          updateFormData({
            bic: data.bankData?.bic || formData.bic,
            bankName: data.bankData?.name || formData.bankName,
            bankCode: data.bankData?.bankCode || formData.bankCode,
          });
          setErrors(prev => ({ ...prev, iban: '' }));
          toast.success(`Bank erkannt: ${data.bankData?.name || 'IBAN valide'}`);
        } else {
          setErrors(prev => ({ ...prev, iban: 'Ungültige IBAN' }));
        }
      }
    } catch (error) {
      console.warn('IBAN Validation API unavailable');
    } finally {
      setIsValidatingIban(false);
    }
  };

  const handleBicBlur = () => {
    const bicVal = (formData.bic || '').toUpperCase().trim();
    if (!bicVal || bicVal.length < 4) return;
    const commonBanks: Record<string, string> = {
      'DEUTDE': 'Deutsche Bank AG',
      'COMADE': 'Commerzbank AG',
      'DRESDE': 'Dresdner Bank',
      'PBNKDE': 'Postbank (DB)',
      'INGDDE': 'ING-DiBa AG',
      'N26ADE': 'N26 Bank AG',
      'SOLODE': 'Solarisbank AG',
      'DKBADE': 'DKB Deutsche Kreditbank',
      'GENODE': 'Volksbanken Raiffeisenbanken',
      'HASADE': 'Hamburger Sparkasse',
      'BELADE': 'Berliner Sparkasse',
      'MAZADE': 'Mainzer Volksbank',
      'KRHADE': 'Sparkasse Hannover',
      'WELADE': 'Landesbank Baden-Württemberg',
      'BYLADE': 'BayernLB',
      'HEFADE': 'Helaba',
      'NOLA DE': 'NordLB'
    };
    const prefix6 = bicVal.substring(0, 6);
    const prefix4 = bicVal.substring(0, 4);
    if (!formData.bankName) {
      const foundBank = commonBanks[prefix6] || commonBanks[prefix4];
      if (foundBank) {
        updateFormData({ bankName: foundBank });
      }
    }
  };
"""

content = content.replace(" const getError = (field: string) => (touched[field] || externalValidationErrors.has(field)) ? errors[field] : '';", handlers + "\n const getError = (field: string) => (touched[field] || externalValidationErrors.has(field)) ? errors[field] : '';")

# 8. Type field update for Agency (als erstes nach partner-typ das feld anzeigen)
# We will insert it right after partner-typ p-tag.
type_block_find = """ <p className="mt-1.5 text-xs text-slate-400 font-medium ml-1">Definiert die Art der Zusammenarbeit und Vergütungsbasis</p>
 </div>"""
agency_block_insert = """ <p className="mt-1.5 text-xs text-slate-400 font-medium ml-1">Definiert die Art der Zusammenarbeit und Vergütungsbasis</p>
 </div>

 {formData.type === 'agency' && (
 <div className="col-span-12 animate-fadeIn">
 <Input
 label="Firma / Agenturname *"
 placeholder="z.B. Übersetzungsbüro Kassel"
 value={formData.company}
 error={!!getError('company')}
 onChange={e => updateFormData({ company: e.target.value })}
 onBlur={() => markTouched('company')}
 helperText={getError('company') || "Vollständiger Name der Agentur laut Handelsregister"}
 />
 </div>
 )}"""
content = content.replace(type_block_find, agency_block_insert)

# Now remove the old agency block which was at the end of section 1
old_agency_block = """ {formData.type === 'agency' && (
 <div className="col-span-12 animate-fadeIn">
 <Input
 label="Agenturname / Firma *"
 placeholder="z.B. Übersetzungsbüro Kassel"
 value={formData.company}
 error={!!getError('company')}
 onChange={e => updateFormData({ company: e.target.value })}
 onBlur={() => markTouched('company')}
 helperText={getError('company') || "Vollständiger Name der Agentur laut Handelsregister"}
 />
 </div>
 )}"""
content = content.replace(old_agency_block, "")

# 9. Domain component replacement
old_domain = """ <div className="col-span-2">
 <Input
 label="Fachgebiete / Spezialisierung"
 placeholder="z.B. Recht, Technik, Medizin..."
 value={Array.isArray(formData.domains) ? formData.domains.join(', ') : formData.domains}
 onChange={e => updateFormData({ domains: e.target.value })}
 helperText="Thematische Schwerpunkte und Expertise des Partners"
 />
 </div>"""
new_domain = """ <div className="col-span-2">
 <MultiSelect
 label="Fachgebiete / Spezialisierung"
 options={DOMAIN_OPTIONS}
 value={formData.domains}
 onChange={v => updateFormData({ domains: v })}
 placeholder="Fachgebiete auswählen..."
 />
 <p className="mt-1 text-xs text-slate-400 font-medium ml-1">Thematische Schwerpunkte und Expertise des Partners</p>
 </div>"""
content = content.replace(old_domain, new_domain)

# 10. Financial block replacement

old_finance_block = """ <div className="col-span-12 md:col-span-4">
 <Input label="Kreditinstitut" placeholder="Name der Bank" value={formData.bankName} onChange={e => updateFormData({ bankName: e.target.value })} helperText="Name der Bankgesellschaft" />
 </div>
 <div className="col-span-6 md:col-span-3">
 <Input label="BIC (SWIFT)" placeholder="DABA DE HH XXX" className="uppercase" value={formData.bic} error={!!getError('bic')} onChange={e => updateFormData({ bic: e.target.value })} onBlur={() => markTouched('bic')} helperText={getError('bic') || "Internationale Kennung"} />
 </div>
 <div className="col-span-6 md:col-span-5">
 <Input label="IBAN" placeholder="DE12 3456 ..." className="font-medium" value={formData.iban} error={!!getError('iban')} onChange={e => updateFormData({ iban: e.target.value })} onBlur={() => markTouched('iban')} helperText={getError('iban') || "Internationale Kontonummer"} />
 </div>"""

new_finance_block = """ <div className="col-span-12">
 <Input
 label="Kontoinhaber"
 value={formData.bankAccountHolder}
 onChange={e => updateFormData({ bankAccountHolder: e.target.value })}
 placeholder={formData.type === 'agency' ? formData.company || 'Agenturname' : `${formData.firstName || 'Vorname'} ${formData.lastName || 'Nachname'}`.trim()}
 helperText="Automatisch vorausgefüllt basierend auf dem Namen."
 />
 </div>
 <div className="col-span-12">
 <div className="flex flex-col">
 <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">IBAN</label>
 <div className="relative">
 <IMaskInput
 mask="aa00 0000 0000 0000 0000 00"
 definitions={{ 'a': /[a-zA-Z]/ }}
 placeholder="DE00 0000 0000 0000 0000 00"
 value={formData.iban || ''}
 onAccept={(value) => {
 updateFormData({ iban: value.toUpperCase() });
 markTouched('iban');
 }}
 onBlur={handleIbanBlur}
 className={clsx(
 'flex w-full rounded-sm bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all border outline-none min-h-[42px]',
 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900',
 getError('iban') && 'border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500/10'
 )}
 />
 {isValidatingIban && (
 <div className="absolute right-3 top-1/2 -translate-y-1/2">
 <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
 </div>
 )}
 </div>
 {getError('iban') && <span className="text-xs text-red-500 font-medium block mt-1">{getError('iban')}</span>}
 </div>
 </div>
 <div className="col-span-12 sm:col-span-4">
 <Input label="Bankname" placeholder="Name der Bank" value={formData.bankName} onChange={e => updateFormData({ bankName: e.target.value })} helperText="Name der Bankgesellschaft" />
 </div>
 <div className="col-span-12 sm:col-span-4">
 <Input label="BLZ" placeholder="000 000 00" value={formData.bankCode} onChange={e => updateFormData({ bankCode: e.target.value })} />
 </div>
 <div className="col-span-12 sm:col-span-4">
 <div className="flex flex-col">
 <label className="block text-sm font-medium text-slate-500 mb-1 ml-0.5">BIC</label>
 <IMaskInput
 mask="aaaaaa aa [aaa]"
 definitions={{ 'a': /[a-zA-Z0-9]/ }}
 placeholder="ABCDEFGH"
 value={formData.bic || ''}
 onAccept={(value) => {
 updateFormData({ bic: value.toUpperCase() });
 markTouched('bic');
 }}
 onBlur={handleBicBlur}
 className={clsx(
 'flex w-full rounded-sm bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all border outline-none min-h-[42px]',
 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-slate-950/10 focus:border-slate-900'
 )}
 />
 </div>
 </div>"""

content = content.replace(old_finance_block, new_finance_block)

with open('src/components/forms/PartnerForm.tsx', 'w') as f:
    f.write(content)
