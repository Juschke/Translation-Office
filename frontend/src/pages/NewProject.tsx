import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    FaPlus, FaMinus, FaFlag, FaClock, FaBolt,
    FaSearch, FaCheck, FaTimes, FaArrowLeft, FaSave,
    FaInfoCircle, FaQuestionCircle
} from 'react-icons/fa';
import SearchableSelect from '../components/common/SearchableSelect';
import CustomerSelect from '../components/common/CustomerSelect';
import DocumentTypeSelect from '../components/common/DocumentTypeSelect';
import PartnerSelect from '../components/common/PartnerSelect';
import LanguageSelect from '../components/common/LanguageSelect';
import Input from '../components/common/Input';
import NewCustomerModal from '../components/modals/NewCustomerModal';
import CustomerSelectionModal from '../components/modals/CustomerSelectionModal';
import NewPartnerModal from '../components/modals/NewPartnerModal';
import PartnerSelectionModal from '../components/modals/PartnerSelectionModal';
import NewDocTypeModal from '../components/modals/NewDocTypeModal';
import NewMasterDataModal from '../components/modals/NewMasterDataModal';
import PaymentModal from '../components/modals/PaymentModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { customerService, partnerService, settingsService, projectService } from '../api/services';
import type { ProjectPosition } from '../components/modals/projectTypes';
import ProjectPositionsTable from '../components/modals/ProjectPositionsTable';
import ProjectPaymentsTable from '../components/modals/ProjectPaymentsTable';
import { Button } from '../components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../components/ui/tooltip';

/* ─── Design Tokens ─── */
const LABEL_CLASS = 'text-[13px] font-medium text-slate-500 flex items-center gap-1.5 min-w-[160px] shrink-0';
const INPUT_WRAP = 'flex-1 min-w-0';
const ROW_CLASS = 'flex items-start gap-4 py-3 border-b border-slate-50';
const SECTION_HEADER = 'flex items-center gap-3 pb-3 mb-1 border-b border-slate-200';
const SECTION_NUM = 'w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm';
const SECTION_TITLE = 'text-sm font-semibold text-slate-800 tracking-tight';

const getStatusOptions = (t: any) => [
    { value: 'offer', label: t('project.status_offer'), group: t('project.step_1') },
    { value: 'in_progress', label: t('project.status_in_progress'), group: t('project.step_2') },
    { value: 'ready_for_pickup', label: t('project.status_ready_for_pickup'), group: t('project.step_3') },
    { value: 'delivered', label: t('project.status_delivered'), group: t('project.step_3') },
    { value: 'invoiced', label: t('project.status_invoiced'), group: t('project.step_4') },
    { value: 'completed', label: t('project.status_completed'), group: t('project.step_4') }
];

/* ─── Tooltip Helper ─── */
const FieldTip = ({ text }: { text: string }) => (
    <TooltipProvider delayDuration={200}>
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="text-slate-300 hover:text-slate-500 transition cursor-help">
                    <FaQuestionCircle className="text-[11px]" />
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs z-[200]">
                {text}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

/* ─── Form Row ─── */
const FormRow = ({ label, required, tooltip, children, error, id }: {
    label: string; required?: boolean; tooltip?: string;
    children: React.ReactNode; error?: boolean; id?: string;
}) => (
    <div className={clsx(ROW_CLASS, error && 'bg-red-50/40')} id={id}>
        <div className={LABEL_CLASS}>
            <span>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</span>
            {tooltip && <FieldTip text={tooltip} />}
        </div>
        <div className={INPUT_WRAP}>{children}</div>
    </div>
);

const NewProject = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;
    const queryClient = useQueryClient();

    // ── Get status options with translations ──
    const statusOptions = getStatusOptions(t);

    // ── States ──
    const [name, setName] = useState('');
    const [customer, setCustomer] = useState('');
    const [deadline, setDeadline] = useState('');
    const [source, setSource] = useState('de-DE');
    const [target, setTarget] = useState<string[]>(['en-US']);
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
    const [status, setStatus] = useState('offer');
    const [withTax, setWithTax] = useState(true);
    const [isCertified, setIsCertified] = useState(true);
    const [certifiedQty, setCertifiedQty] = useState(1);
    const [hasApostille, setHasApostille] = useState(false);
    const [apostilleQty, setApostilleQty] = useState(1);
    const [isExpress, setIsExpress] = useState(false);
    const [expressQty, setExpressQty] = useState(1);
    const [classification, setClassification] = useState('nein');
    const [classificationQty, setClassificationQty] = useState(1);
    const [copies, setCopies] = useState(0);
    const [copyPrice, setCopyPrice] = useState('5.00');
    const [positions, setPositions] = useState<ProjectPosition[]>([{
        id: Date.now().toString(), description: 'Übersetzung',
        unit: 'Normzeile', amount: '1.00', quantity: '1.00', partnerRate: '0.00', partnerMode: 'unit',
        partnerTotal: '0.00', customerRate: '0.00', customerTotal: '0.00',
        customerMode: 'rate', marginType: 'markup', marginPercent: '0.00'
    }]);
    const [docType, setDocType] = useState<string[]>([]);
    const [translator, setTranslator] = useState('');
    const [totalPrice, setTotalPrice] = useState('');
    const [partnerPrice, setPartnerPrice] = useState('');
    const [payments, setPayments] = useState<any[]>([]);
    const [notes, setNotes] = useState('');
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    const [partnerSearch, setPartnerSearch] = useState('');

    // UI modals
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [isPartnerSearchOpen, setIsPartnerSearchOpen] = useState(false);
    const [showDocTypeModal, setShowDocTypeModal] = useState(false);
    const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
    const [langTrigger, setLangTrigger] = useState<'source' | 'target' | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<any>(null);
    const [confirmConfig, setConfirmConfig] = useState<any>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // ── API Data ──
    const { data: customersData = [] } = useQuery({ queryKey: ['customers'], queryFn: customerService.getAll });
    const { data: partnersData = [] } = useQuery({ queryKey: ['partners'], queryFn: partnerService.getAll });
    const { data: languages = [] } = useQuery({ queryKey: ['settings', 'languages'], queryFn: settingsService.getLanguages });
    const { data: docTypes = [] } = useQuery({ queryKey: ['settings', 'docTypes'], queryFn: settingsService.getDocTypes });
    const { data: projectsData = [] } = useQuery({ queryKey: ['projects'], queryFn: projectService.getAll, enabled: !isEditing });
    const { data: companyData } = useQuery({ queryKey: ['companySettings'], queryFn: settingsService.getCompany });

    const { data: initialData, isLoading: isDetailLoading } = useQuery({
        queryKey: ['project', id],
        queryFn: () => projectService.getById(id!),
        enabled: isEditing,
    });

    const getFullLanguageName = (code: string) => {
        if (!code) return '';
        const lang = languages.find((l: any) =>
            l.iso_code.toLowerCase() === code.toLowerCase() ||
            l.iso_code.toLowerCase().startsWith(code.toLowerCase() + '-') ||
            code.toLowerCase().startsWith(l.iso_code.toLowerCase() + '-')
        );
        return lang ? (lang.name_internal || lang.name) : code.toUpperCase();
    };

    // ── Derived ──
    const custOptions = useMemo(() => (Array.isArray(customersData) ? customersData : []).map((c: any) => ({
        value: c.id.toString(),
        label: `${c.company_name || `${c.first_name} ${c.last_name}`} (${c.display_id || c.id}) - ${c.address_city || ''}`
    })), [customersData]);

    const partnerOptions = useMemo(() => (Array.isArray(partnersData) ? partnersData : []).map((p: any) => ({
        value: p.id.toString(),
        label: `${p.company_name || `${p.first_name} ${p.last_name}`} (${p.display_id || p.id}) - ${p.address_city || ''}`
    })), [partnersData]);

    const { matchingPartners, otherPartners } = useMemo(() => {
        if (!Array.isArray(partnersData)) return { matchingPartners: [], otherPartners: [] };
        const src = source?.toLowerCase().split('-')[0];
        const targetLangs = Array.isArray(target) ? target : [target];
        const trgs = targetLangs.map(t => t?.toLowerCase().split('-')[0]).filter(Boolean);
        const filtered = partnersData.filter((p: any) => {
            const s = partnerSearch.toLowerCase();
            return (p.first_name || '').toLowerCase().includes(s) || (p.last_name || '').toLowerCase().includes(s) || (p.company_name || '').toLowerCase().includes(s);
        });
        const matches: any[] = [], others: any[] = [];
        filtered.forEach((p: any) => {
            const rawLangs = p.languages || [];
            const langs = Array.isArray(rawLangs) ? rawLangs : (typeof rawLangs === 'string' ? rawLangs.split(',').map((l: string) => l.trim().toLowerCase()) : []);
            const matchSrc = src && langs.some((l: string) => l.toLowerCase().includes(src));
            const matchAnyTrg = trgs.length > 0 && trgs.some(trg => langs.some((l: string) => l.toLowerCase().includes(trg)));
            if (matchSrc || matchAnyTrg) matches.push({ ...p, isPerfectMatch: matchSrc && matchAnyTrg, languages: Array.isArray(rawLangs) ? rawLangs : langs });
            else others.push({ ...p, languages: Array.isArray(rawLangs) ? rawLangs : langs });
        });
        return { matchingPartners: matches, otherPartners: others };
    }, [partnersData, source, target, partnerSearch]);

    const displayNr = useMemo(() => {
        if (initialData?.project_number) return initialData.project_number;
        const prefix = companyData?.project_id_prefix || 'P';
        const datePart = new Date().toLocaleDateString('de-DE', { year: '2-digit', month: '2-digit' }).replace('.', '');
        const nextNum = companyData?.project_start_number || '0001';
        return `${prefix}-${datePart}-${nextNum}`;
    }, [initialData?.project_number, companyData]);

    // ── Position calculations ──
    useEffect(() => {
        const updated = positions.map(pos => {
            const qty = parseFloat(pos.quantity) || 0;
            const pRate = parseFloat(pos.partnerRate) || 0;
            const pTotal = pos.partnerMode === 'unit' ? qty * pRate : pRate;
            let cTotal = 0, cRate = 0;
            if (pos.customerMode === 'unit') {
                const margin = (parseFloat(pos.marginPercent) || 0) / 100;
                cTotal = pTotal * (pos.marginType === 'markup' ? (1 + margin) : (1 - margin));
                if (qty > 0) cRate = cTotal / qty;
            } else if (pos.customerMode === 'rate') {
                cRate = parseFloat(pos.customerRate) || 0;
                cTotal = qty * cRate;
            } else {
                cTotal = parseFloat(pos.customerRate) || 0;
            }
            return { ...pos, partnerTotal: pTotal.toFixed(2), customerTotal: cTotal.toFixed(2), customerRate: pos.customerMode === 'unit' ? cRate.toFixed(2) : pos.customerRate };
        });
        if (JSON.stringify(updated) !== JSON.stringify(positions)) setPositions(updated);
        setPartnerPrice(updated.reduce((s, p) => s + parseFloat(p.partnerTotal || '0'), 0).toFixed(2));
        setTotalPrice(updated.reduce((s, p) => s + parseFloat(p.customerTotal || '0'), 0).toFixed(2));
    }, [positions]);

    // Auto-generate name
    useEffect(() => {
        if (!isEditing && source && target && Array.isArray(projectsData)) {
            const targetArray = Array.isArray(target) ? target : [target];
            const cs = source.split('-')[0].toLowerCase();
            const ct = targetArray[0]?.split('-')[0].toLowerCase() || 'xx';
            const now = new Date();
            const dp = String(now.getFullYear()).slice(-2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
            const base = `${cs}_${ct}_${dp}`.toUpperCase();
            const list = Array.isArray(projectsData) ? projectsData : [];
            const cnt = list.filter((p: any) => (p.project_name || '').toUpperCase().startsWith(base)).length;
            setName(`${base}_${String(cnt + 1).padStart(2, '0')}`);
        }
    }, [source, target, projectsData, isEditing]);

    // Load initial data for editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || initialData.project_name || '');
            setCustomer(initialData.customer_id?.toString() || '');
            setDeadline(initialData.due || initialData.deadline || '');
            setSource(initialData.source || initialData.source_language?.iso_code?.split('-')[0] || 'de');
            let targetLangs: string[] = ['en'];
            if (initialData.target_languages?.length) {
                targetLangs = initialData.target_languages.map((l: any) => l.iso_code || l);
            } else if (initialData.target) {
                targetLangs = Array.isArray(initialData.target) ? initialData.target : [initialData.target];
            } else if (initialData.target_language?.iso_code) {
                targetLangs = [initialData.target_language.iso_code];
            }
            setTarget(targetLangs);
            setPriority(initialData.priority || 'medium');
            setStatus(initialData.status || 'draft');
            setIsCertified(initialData.isCertified || !!initialData.is_certified);
            setCertifiedQty(initialData.certified_count || 1);
            setHasApostille(initialData.hasApostille || !!initialData.has_apostille);
            setApostilleQty(initialData.apostille_count || 1);
            setIsExpress(initialData.isExpress || !!initialData.is_express);
            setExpressQty(initialData.express_count || 1);
            setClassification(initialData.classification === 'ja' || initialData.classification === true ? 'ja' : 'nein');
            setClassificationQty(initialData.classification_count || 1);
            setCopies(initialData.copies || initialData.copies_count || 0);
            setCopyPrice(String(initialData.copyPrice || initialData.copy_price || '5'));
            const dt: string[] = [];
            if (initialData.document_type_id) dt.push(initialData.document_type_id.toString());
            if (initialData.additional_doc_types?.length) dt.push(...initialData.additional_doc_types.map((x: any) => x.toString()));
            setDocType([...new Set(dt)]);
            setTranslator(initialData.partner?.id?.toString() || '');
            if (initialData.positions?.length) {
                setPositions(initialData.positions.map((p: any) => ({ ...p, id: p.id.toString(), unit: p.unit || 'Normzeile', partnerRate: p.partner_rate || p.partnerRate || '0', customerRate: p.customer_rate || p.customerRate || '0', partnerMode: p.partner_mode || 'unit', customerMode: p.customer_mode || 'unit' })));
            }
            if (initialData.payments?.length) setPayments(initialData.payments.map((p: any) => ({ ...p, id: p.id?.toString() || Date.now().toString() })));
            else if (initialData.down_payment && parseFloat(initialData.down_payment) > 0) setPayments([{ id: Date.now().toString(), amount: initialData.down_payment.toString(), payment_date: initialData.down_payment_date || new Date().toISOString(), payment_method: 'Überweisung', note: 'Anzahlung' }]);
            else setPayments([]);
            setNotes(initialData.notes || '');
        }
    }, [initialData]);

    // ── Mutations ──
    const createMutation = useMutation({
        mutationFn: projectService.create,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Projekt erfolgreich erstellt'); navigate('/projects'); },
        onError: () => toast.error('Fehler beim Erstellen')
    });
    const updateMutation = useMutation({
        mutationFn: (data: any) => projectService.update(data.id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Projekt aktualisiert'); navigate(`/projects/${id}`); },
        onError: () => toast.error('Fehler beim Aktualisieren')
    });
    const createCustomerMutation = useMutation({
        mutationFn: customerService.create,
        onSuccess: (c) => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setCustomer(c.id.toString()); setShowCustomerModal(false); toast.success('Kunde angelegt'); }
    });
    const createPartnerMutation = useMutation({
        mutationFn: partnerService.create,
        onSuccess: (p) => { queryClient.invalidateQueries({ queryKey: ['partners'] }); setTranslator(p.id.toString()); setShowPartnerModal(false); toast.success('Partner angelegt'); }
    });
    const createDocTypeMutation = useMutation({
        mutationFn: settingsService.createDocType,
        onSuccess: (dt) => { queryClient.invalidateQueries({ queryKey: ['settings', 'docTypes'] }); setDocType([dt.id.toString()]); setShowDocTypeModal(false); }
    });
    const createLanguageMutation = useMutation({
        mutationFn: settingsService.createLanguage,
        onSuccess: (l) => { queryClient.invalidateQueries({ queryKey: ['settings', 'languages'] }); const c = l.iso_code?.split('-')[0] || l.iso_code; if (langTrigger === 'source') setSource(c); else if (langTrigger === 'target') setTarget(c); setIsLanguageModalOpen(false); setLangTrigger(null); }
    });

    // ── Financials ──
    const extraCosts = (isCertified ? 5 * certifiedQty : 0) + (hasApostille ? 25 * apostilleQty : 0) + (isExpress ? 15 * expressQty : 0) + (classification === 'ja' ? 15 * classificationQty : 0) + (copies * Number(copyPrice) || 0);
    const baseNet = parseFloat(totalPrice) || 0;
    const calcNet = baseNet + extraCosts;
    const calcTax = withTax ? calcNet * 0.19 : 0;
    const calcGross = calcNet + calcTax;
    const totalPaid = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const remainingBalance = calcGross - totalPaid;
    const profit = calcNet - (parseFloat(partnerPrice) || 0);
    const profitMargin = calcNet > 0 ? (profit / calcNet) * 100 : 0;
    const fmtEur = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    // ── Submit ──
    const handleSubmit = () => {
        const errors: string[] = [];
        const errSet = new Set<string>();
        if (!customer) { errors.push('Kunde ist ein Pflichtfeld'); errSet.add('customer'); }
        if (!source) { errors.push('Eingangssprache ist erforderlich'); errSet.add('source'); }
        const targetArray = Array.isArray(target) ? target : [target];
        if (!targetArray.length || !targetArray[0]) { errors.push('Zielsprache ist erforderlich'); errSet.add('target'); }
        if (!docType.length) { errors.push('Dokumentenart ist ein Pflichtfeld'); errSet.add('docType'); }
        if (!translator) { errors.push('Übersetzer ist ein Pflichtfeld'); errSet.add('translator'); }
        setValidationErrors(errSet);
        if (errors.length > 0) {
            toast.error(
                <div className="flex flex-col gap-1">
                    <span className="font-medium">Bitte korrigieren Sie folgende Fehler:</span>
                    <ul className="list-disc list-inside text-xs">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>, { duration: 5000 }
            );
            setTimeout(() => { const el = document.getElementById(`field-${Array.from(errSet)[0]}`); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
            return;
        }
        const targetDisplayString = targetArray.join(', ').toUpperCase();
        let finalName = name || `${source.toUpperCase()}_${targetDisplayString}_${Date.now()}`;
        finalName = finalName.replace(/\s+/g, '_').substring(0, 100);
        const sourceLangId = languages.find((l: any) => l.iso_code.startsWith(source))?.id || 1;
        const targetLangIds = targetArray.map(t => languages.find((l: any) => l.iso_code.startsWith(t))?.id || 2);
        const payload: any = {
            project_name: finalName, customer_id: parseInt(customer), partner_id: translator ? parseInt(translator) : null,
            source_lang_id: sourceLangId, target_lang_id: targetLangIds[0], target_lang_ids: targetLangIds, deadline, priority, status,
            is_certified: isCertified, certified_count: certifiedQty,
            has_apostille: hasApostille, apostille_count: apostilleQty,
            is_express: isExpress, express_count: expressQty,
            classification: classification === 'ja', classification_count: classificationQty,
            copies_count: copies, copy_price: parseFloat(copyPrice) || 0, price_total: calcNet,
            partner_cost_net: parseFloat(partnerPrice) || 0, document_type_id: docType.length > 0 ? parseInt(docType[0]) : null,
            additional_doc_types: docType.length > 1 ? docType.slice(1) : null, notes,
            positions: positions.map(p => ({ description: p.description, unit: p.unit, amount: parseFloat(p.amount) || 0, quantity: parseFloat(p.quantity) || 0, partner_rate: parseFloat(p.partnerRate) || 0, partner_mode: p.partnerMode, partner_total: parseFloat(p.partnerTotal) || 0, customer_rate: parseFloat(p.customerRate) || 0, customer_mode: p.customerMode, customer_total: parseFloat(p.customerTotal) || 0, margin_type: p.marginType, margin_percent: parseFloat(p.marginPercent) || 0 })),
            payments: payments.map(p => ({ amount: parseFloat(p.amount) || 0, payment_date: p.payment_date, payment_method: p.payment_method, note: p.note }))
        };
        if (isEditing) updateMutation.mutate({ ...payload, id });
        else createMutation.mutate(payload);
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const renderActionButtons = () => (
        <>
            <Button variant="secondary" onClick={() => navigate('/projects')} className="h-9 px-4 text-xs font-semibold">
                <FaTimes className="mr-1.5" /> Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="h-9 px-6 text-xs font-bold">
                <FaSave className="mr-1.5" /> {isSaving ? t('projects.project_creating') : isEditing ? t('projects.update_project') : t('projects.create_project')}
            </Button>
        </>
    );

    // ── Loading ──
    if (isEditing && isDetailLoading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Lade Projektdaten...</p>
            </div>
        </div>
    );

    return (
        <div className="fade-in pb-12">
            {/* ── Sticky Header ── */}
            <div className="bg-white border-b border-slate-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 shadow-sm">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/projects')} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition">
                            <FaArrowLeft />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
                                {isEditing ? 'Projekt bearbeiten' : 'Neues Projekt erfassen'}
                            </h1>
                            <span className="text-xs text-slate-400 font-medium">Nr: {displayNr}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Priority */}
                        <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200 h-9">
                            {(['low', 'medium', 'high'] as const).map(p => (
                                <button key={p} onClick={() => setPriority(p)} className={clsx('px-3 h-full text-xs font-medium rounded-sm transition-all flex items-center gap-1.5', priority === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                                    {p === 'low' && <FaClock className="text-xs" />}
                                    {p === 'medium' && <FaFlag className="text-xs" />}
                                    {p === 'high' && <FaBolt className="text-xs" />}
                                    <span className="hidden sm:inline">{p === 'low' ? t('projects.priority_standard') : p === 'medium' ? t('projects.priority_urgent') : t('projects.priority_express')}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            {renderActionButtons()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
                {/* ── Main Content ── */}
                <div className="flex-1 min-w-0 space-y-8">

                    {/* Section 1: Basis-Daten */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>01</div>
                            <h3 className={SECTION_TITLE}>Basis-Daten</h3>
                        </div>
                        <div className="px-6 pb-5">
                            <FormRow label="Projektname" tooltip="Wird automatisch generiert aus Sprachpaar und Datum. Leerzeichen werden durch Unterstriche ersetzt.">
                                <Input placeholder="z.B. DE_EN_260326_01" value={name} onChange={e => setName(e.target.value)} />
                            </FormRow>
                            <FormRow label="Dokumentenart" required tooltip="Art des zu übersetzenden Dokuments. Mehrfachauswahl möglich." error={validationErrors.has('docType')} id="field-docType">
                                <DocumentTypeSelect
                                    options={docTypes.sort((a: any, b: any) => (a.category || '').localeCompare(b.category || '')).map((dt: any) => ({ value: dt.id.toString(), label: dt.name, group: dt.category }))}
                                    value={docType}
                                    onChange={setDocType}
                                    error={validationErrors.has('docType')}
                                    isMulti={true}
                                />
                            </FormRow>
                            <FormRow label="Status" tooltip="Aktueller Bearbeitungsstatus des Projekts." error={validationErrors.has('status')} id="field-status">
                                <SearchableSelect options={statusOptions} value={status} onChange={setStatus} error={validationErrors.has('status')} preserveOrder={true} />
                            </FormRow>
                            <FormRow label="Liefertermin" tooltip="Geplanter Abgabetermin inkl. Uhrzeit.">
                                <DatePicker showTime format="DD.MM.YYYY HH:mm" value={deadline ? dayjs(deadline) : null}
                                    onChange={(d) => setDeadline(d ? d.toISOString() : '')} className="w-full h-9" placeholder="Datum & Zeit wählen" />
                            </FormRow>
                        </div>
                    </section>

                    {/* Section 2: Kunde */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>02</div>
                            <h3 className={SECTION_TITLE}>Kunde</h3>
                        </div>
                        <div className="px-6 pb-5">
                            <FormRow label="Kunde" required tooltip="Der Auftraggeber dieses Projekts." error={validationErrors.has('customer')} id="field-customer">
                                <CustomerSelect
                                    options={custOptions}
                                    value={customer}
                                    onChange={setCustomer}
                                    error={validationErrors.has('customer')}
                                    placeholder="Kunde auswählen..."
                                />
                            </FormRow>
                        </div>
                    </section>

                    {/* Section 3: Sprachen */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>03</div>
                            <h3 className={SECTION_TITLE}>Sprachen</h3>
                        </div>
                        <div className="px-6 pb-5">
                            <FormRow label="Eingangssprache" required tooltip="Sprache des Originaldokuments." error={validationErrors.has('source')} id="field-source">
                                <LanguageSelect id="source" value={source} onChange={setSource} error={validationErrors.has('source')} onAddNew={() => { setLangTrigger('source'); setIsLanguageModalOpen(true); }} />
                            </FormRow>
                            <FormRow label="Zielsprache" required tooltip="Sprache, in die übersetzt werden soll." error={validationErrors.has('target')} id="field-target">
                                <LanguageSelect id="target" value={target} onChange={setTarget} isMulti={true} error={validationErrors.has('target')} onAddNew={() => { setLangTrigger('target'); setIsLanguageModalOpen(true); }} />
                            </FormRow>
                        </div>
                    </section>

                    {/* Section 4: Partner */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>04</div>
                            <h3 className={SECTION_TITLE}>Partner & Übersetzer</h3>
                        </div>
                        <div className="px-6 pb-5">
                            <FormRow label="Übersetzer" required tooltip="Wählen Sie den Partner, der die Übersetzung durchführt." error={validationErrors.has('translator')} id="field-translator">
                                <PartnerSelect
                                    options={partnerOptions}
                                    value={translator}
                                    onChange={setTranslator}
                                    error={validationErrors.has('translator')}
                                    placeholder="Übersetzer auswählen..."
                                />
                            </FormRow>

                            {/* Partner suggestion table */}
                            <div className="mt-4">
                                <div className="flex justify-end mb-2">
                                    <div className="relative w-40">
                                        <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
                                        <input type="text" placeholder="Suchen..." value={partnerSearch} onChange={e => setPartnerSearch(e.target.value)}
                                            className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-slate-400 transition" />
                                    </div>
                                </div>
                                <div className="border border-slate-200 rounded-sm bg-white overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-white border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Partner</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Sprachen</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right w-16">Wählen</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {[...matchingPartners, ...otherPartners].map((p: any) => (
                                                <tr key={p.id} className={clsx('group transition-colors cursor-pointer hover:bg-slate-50', translator === p.id.toString() && 'bg-brand-primary/5')}
                                                    onClick={() => setTranslator(p.id.toString() === translator ? '' : p.id.toString())}>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-sm bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">{(p.first_name?.[0] || '')}{(p.last_name?.[0] || '')}</div>
                                                            <span className="text-xs font-medium text-slate-700">{p.company_name || `${p.first_name} ${p.last_name}`}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-wrap gap-1">{(p.languages || []).slice(0, 3).map((l: string) => <span key={l} className="px-1.5 py-0.5 rounded-sm text-[10px] font-medium border bg-white text-slate-400 border-slate-100">{getFullLanguageName(l)}</span>)}</div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className={clsx('inline-flex items-center justify-center w-5 h-5 rounded-full border transition', translator === p.id.toString() ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white border-slate-200 text-transparent')}>
                                                            <FaCheck className="text-[10px]" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {matchingPartners.length === 0 && otherPartners.length === 0 && (
                                                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-300 italic text-xs">Keine Partner gefunden</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Leistungen & Optionen */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>05</div>
                            <h3 className={SECTION_TITLE}>Leistungen & Optionen</h3>
                        </div>
                        <div className="px-6 pb-5">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-4 border-b border-slate-100">
                                {[
                                    { label: 'Beglaubigung (5€)', enabled: isCertified, toggle: () => setIsCertified(!isCertified), qty: certifiedQty, setQty: setCertifiedQty, tip: 'Beglaubigte Übersetzung mit Stempel und Unterschrift.' },
                                    { label: 'Express (15€)', enabled: isExpress, toggle: () => setIsExpress(!isExpress), qty: expressQty, setQty: setExpressQty, tip: 'Eilzuschlag für schnelle Bearbeitung.' },
                                    { label: 'Apostille (25€)', enabled: hasApostille, toggle: () => setHasApostille(!hasApostille), qty: apostilleQty, setQty: setApostilleQty, tip: 'Apostille-Beglaubigung für internationalen Gebrauch.' },
                                    { label: 'Klassifizierung (15€)', enabled: classification === 'ja', toggle: () => setClassification(classification === 'ja' ? 'nein' : 'ja'), qty: classificationQty, setQty: setClassificationQty, tip: 'Führerschein-Klassifizierung.' },
                                ].map(opt => (
                                    <div key={opt.label} className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400 flex items-center gap-1">{opt.label} <FieldTip text={opt.tip} /></label>
                                        <div className="flex flex-col gap-2">
                                            <div className="h-9 flex items-center gap-2 cursor-pointer" onClick={opt.toggle}>
                                                <div className={clsx('w-8 h-4 rounded-full relative transition-colors', opt.enabled ? 'bg-emerald-500' : 'bg-slate-300')}>
                                                    <div className={clsx('absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm', opt.enabled ? 'left-4' : 'left-0.5')} />
                                                </div>
                                                <span className={clsx('text-[10px] font-bold', opt.enabled ? 'text-emerald-600' : 'text-slate-400')}>{opt.enabled ? 'JA' : 'NEIN'}</span>
                                            </div>
                                            {opt.enabled && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400 font-medium">Menge:</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={opt.qty}
                                                        onChange={e => opt.setQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                        className="w-12 h-7 text-center text-xs font-medium text-slate-700 border border-slate-200 rounded-sm outline-none focus:ring-1 focus:ring-brand-500"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1">MwSt. (19%) <FieldTip text="Umsatzsteuer auf den Nettobetrag." /></label>
                                    <div className="h-9 flex items-center gap-2 cursor-pointer" onClick={() => setWithTax(!withTax)}>
                                        <div className={clsx('w-8 h-4 rounded-full relative transition-colors', withTax ? 'bg-emerald-500' : 'bg-slate-300')}>
                                            <div className={clsx('absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm', withTax ? 'left-4' : 'left-0.5')} />
                                        </div>
                                        <span className={clsx('text-xs font-bold', withTax ? 'text-emerald-600' : 'text-slate-400')}>{withTax ? 'AKTIV' : 'AUS'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Copies */}
                            <div className="grid grid-cols-12 gap-4 pt-4">
                                <div className="col-span-4">
                                    <label className="text-xs font-medium text-slate-400 mb-1 block">Anzahl Kopien</label>
                                    <div className="flex items-center h-9 border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
                                        <button onClick={() => setCopies(Math.max(0, copies - 1))} className="h-full px-3 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-r border-slate-100"><FaMinus className="text-xs" /></button>
                                        <input type="number" value={copies} onChange={e => setCopies(Math.max(0, parseInt(e.target.value) || 0))} className="flex-1 w-full h-full text-center text-sm font-medium text-slate-700 outline-none" />
                                        <button onClick={() => setCopies(copies + 1)} className="h-full px-3 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition border-l border-slate-100"><FaPlus className="text-xs" /></button>
                                    </div>
                                </div>
                                <div className="col-span-4">
                                    <label className="text-xs font-medium text-slate-400 mb-1 block">Preis / Kopie</label>
                                    <Input type="number" step="0.01" value={copyPrice} onChange={e => setCopyPrice(e.target.value)} onBlur={() => setCopyPrice(parseFloat(copyPrice).toFixed(2))} containerClassName="h-9" />
                                </div>
                                <div className="col-span-4 flex items-end pb-1.5">
                                    <span className="text-xs text-slate-400 italic">Summe: <span className="text-slate-800 font-medium">{(copies * parseFloat(copyPrice || '0')).toFixed(2)} €</span></span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 6: Kalkulation */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>06</div>
                            <h3 className={SECTION_TITLE}>Kalkulation Positionen</h3>
                        </div>
                        <div className="px-6 pb-5">
                            <ProjectPositionsTable positions={positions} setPositions={setPositions} />
                        </div>
                    </section>

                    {/* Section 7: Zahlungen */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden" id="field-payments">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5 flex justify-between items-center')}>
                            <div className="flex items-center gap-3">
                                <div className={SECTION_NUM}>07</div>
                                <h3 className={SECTION_TITLE}>Anzahlungen / Teilzahlungen</h3>
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
                                    {payments.length}
                                </span>
                            </div>
                            <Button
                                onClick={() => { setEditingPayment(null); setIsPaymentModalOpen(true); }}
                                disabled={remainingBalance <= 0.01}
                                className={clsx(
                                    "h-8 px-4 text-xs font-bold",
                                    remainingBalance <= 0.01 ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none" : ""
                                )}
                            >
                                <FaPlus className="mr-1.5" /> {remainingBalance <= 0.01 ? 'Vollständig bezahlt' : 'Zahlung erfassen'}
                            </Button>
                        </div>
                        <div className="px-6 pb-5 pt-3">
                            <ProjectPaymentsTable
                                payments={payments}
                                onAddPayment={() => { setEditingPayment(null); setIsPaymentModalOpen(true); }}
                                onEditPayment={p => { setEditingPayment(p); setIsPaymentModalOpen(true); }}
                                onDeletePayment={pid => {
                                    const payment = payments.find(p => p.id === pid);
                                    setConfirmConfig({
                                        isOpen: true,
                                        title: 'Zahlung löschen',
                                        message: t('confirm.delete_payment_amount', { amount: payment?.amount || '0' }),
                                        type: 'danger',
                                        confirmLabel: 'Löschen',
                                        onConfirm: () => {
                                            setPayments(payments.filter(p => p.id !== pid));
                                            setConfirmConfig((p: any) => ({ ...p, isOpen: false }));
                                        }
                                    });
                                }}
                                hideHeader
                            />
                        </div>
                    </section>

                    {/* Section 8: Anmerkungen */}
                    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className={clsx(SECTION_HEADER, 'px-6 pt-5')}>
                            <div className={SECTION_NUM}>08</div>
                            <h3 className={SECTION_TITLE}>Anmerkungen</h3>
                        </div>
                        <div className="px-6 pb-5">
                            <FormRow label="Interne Notizen" tooltip="Nur für Sie sichtbar. Wird nicht an Kunden oder Partner weitergeleitet.">
                                <Input isTextArea placeholder="Wichtige Hinweise zum Projekt..." value={notes} onChange={e => setNotes(e.target.value)} />
                            </FormRow>
                        </div>
                    </section>
                </div>

                {/* ── Sidebar: Financial Summary ── */}
                <div className="w-full lg:w-80 shrink-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
                    {/* Meta */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <FaInfoCircle className="text-slate-400 text-xs" />
                            <h4 className="text-xs font-semibold text-slate-500">Meta Info</h4>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-slate-400">Erstellt:</span><span className="font-medium text-slate-700">{initialData?.createdAt || new Date().toLocaleDateString('de-DE')}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Manager:</span><span className="font-medium text-slate-700">{initialData?.pm || 'Admin'}</span></div>
                        </div>
                    </div>

                    {/* Invoice Preview */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
                        <h4 className="text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100">Rechnungsvorschau</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-slate-500"><span>Positionen Netto</span><span>{fmtEur(baseNet)}</span></div>
                            {isCertified && <div className="flex justify-between text-slate-400 pl-2"><span>+ Beglaubigung {certifiedQty > 1 ? `(${certifiedQty}×)` : ''}</span><span>{fmtEur(5 * certifiedQty)}</span></div>}
                            {hasApostille && <div className="flex justify-between text-slate-400 pl-2"><span>+ Apostille {apostilleQty > 1 ? `(${apostilleQty}×)` : ''}</span><span>{fmtEur(25 * apostilleQty)}</span></div>}
                            {isExpress && <div className="flex justify-between text-slate-400 pl-2"><span>+ Express {expressQty > 1 ? `(${expressQty}×)` : ''}</span><span>{fmtEur(15 * expressQty)}</span></div>}
                            {classification === 'ja' && <div className="flex justify-between text-slate-400 pl-2"><span>+ Klassifizierung {classificationQty > 1 ? `(${classificationQty}×)` : ''}</span><span>{fmtEur(15 * classificationQty)}</span></div>}
                            {copies > 0 && <div className="flex justify-between text-slate-400 pl-2"><span>+ Kopien ({copies}×)</span><span>{fmtEur(copies * Number(copyPrice))}</span></div>}
                            <div className="pt-2 border-t border-slate-100 flex justify-between font-medium text-slate-800"><span>Gesamt Netto</span><span>{fmtEur(calcNet)}</span></div>
                            <div className="flex justify-between text-slate-400"><span>MwSt. 19%</span><span>{fmtEur(calcTax)}</span></div>
                            <div className="pt-2 border-t-2 border-slate-100 flex justify-between text-lg font-semibold text-slate-900"><span>Gesamt</span><span>{fmtEur(calcGross)}</span></div>
                            {totalPaid > 0 && <div className="flex justify-between text-emerald-600 font-medium"><span>Bezahlt</span><span>-{fmtEur(totalPaid)}</span></div>}
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600">Restbetrag</span>
                                <span className={clsx('text-base font-semibold', remainingBalance <= 0.01 ? 'text-emerald-600' : 'text-slate-900')}>{remainingBalance <= 0.01 ? 'BEZAHLT' : fmtEur(remainingBalance)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Profit */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-slate-500">Gewinn</span>
                            <span className={clsx('text-xs font-medium', profit >= 0 ? 'text-slate-800' : 'text-red-600')}>{fmtEur(profit)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className={clsx('h-full transition-all duration-500', profitMargin > 40 ? 'bg-emerald-500' : profitMargin > 20 ? 'bg-slate-700' : 'bg-amber-500')} style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }} />
                        </div>
                        <div className="text-right text-xs font-medium text-slate-500">{profitMargin.toFixed(1)}% Marge</div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-10 border-t border-slate-200 pt-5 pb-6 flex justify-end gap-2">
                <div className="flex items-center gap-2">
                    {renderActionButtons()}
                </div>
            </div>

            {/* ── Modals ── */}
            <NewCustomerModal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} onSubmit={(d) => createCustomerMutation.mutate({ company_name: d.company_name, salutation: d.salutation, first_name: d.first_name, last_name: d.last_name, email: d.email, address: d.address_street, zip: d.address_zip, city: d.address_city, type: d.type })} />
            <CustomerSelectionModal isOpen={isCustomerSearchOpen} onClose={() => setIsCustomerSearchOpen(false)} onSelect={(id) => { setCustomer(id); setIsCustomerSearchOpen(false); }} />
            <NewPartnerModal isOpen={showPartnerModal} onClose={() => setShowPartnerModal(false)} onSubmit={(d) => createPartnerMutation.mutate({ company_name: d.company || d.company_name, salutation: d.salutation, first_name: d.firstName, last_name: d.lastName, email: d.emails?.[0] || d.email, street: d.street, zip: d.zip, city: d.city, phone: d.phones?.[0] || d.phone, languages: d.languages, price_list: d.priceList })} isLoading={createPartnerMutation.isPending} />
            <PartnerSelectionModal isOpen={isPartnerSearchOpen} onClose={() => setIsPartnerSearchOpen(false)} onSelect={(id) => { setTranslator(id); setIsPartnerSearchOpen(false); }} />
            <NewDocTypeModal isOpen={showDocTypeModal} onClose={() => setShowDocTypeModal(false)} onSubmit={(d) => createDocTypeMutation.mutate(d)} isLoading={createDocTypeMutation.isPending} />
            <NewMasterDataModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} onSubmit={(d) => createLanguageMutation.mutate(d)} type="languages" />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={(p) => { if (editingPayment) setPayments(payments.map(x => x.id === p.id ? p : x)); else setPayments([...payments, p]); setIsPaymentModalOpen(false); setEditingPayment(null); }} initialData={editingPayment} totalAmount={calcGross} />
            <ConfirmDialog isOpen={confirmConfig.isOpen} onCancel={() => setConfirmConfig((p: any) => ({ ...p, isOpen: false }))} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} confirmLabel={confirmConfig.confirmLabel} />
        </div>
    );
};

export default NewProject;
