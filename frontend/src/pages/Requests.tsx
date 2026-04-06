import { useState, useMemo } from 'react';
import { triggerBlobDownload } from '../utils/download';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaInbox, FaUserTimes, FaClock, FaFilter, FaTimes, FaUndo, FaChevronDown } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';
import { buildProjectColumns } from './projectColumns';
import NewProjectModal from '../components/modals/NewProjectModal';
import ConfirmModal from '../components/common/ConfirmModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, settingsService, customerService, partnerService } from '../api/services';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import SearchableSelect from '../components/common/SearchableSelect';
import { getFlagUrl, getLanguageName } from '../utils/flags';
import clsx from 'clsx';

const REQUEST_STATUSES = ['draft', 'pending', 'offer'];

const Requests = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | string[] | null>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<any>({
        customerId: '',
        partnerId: '',
        sourceLanguageId: '',
        targetLanguageId: '',
        priority: 'all',
    });

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getAll,
        refetchInterval: 15000,
        refetchOnWindowFocus: true,
    });
    const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: customerService.getAll });
    const { data: partners = [] } = useQuery({ queryKey: ['partners'], queryFn: partnerService.getAll });
    const { data: languages = [] } = useQuery({ queryKey: ['languages'], queryFn: settingsService.getLanguages });
    const { data: companySettings } = useQuery({ queryKey: ['companySettings'], queryFn: settingsService.getCompany });

    const createMutation = useMutation({
        mutationFn: projectService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            setIsModalOpen(false);
            toast.success(t('requests.created_success'));
        },
        onError: () => toast.error(t('requests.created_error')),
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: (args: { ids: string[]; data: any }) => projectService.bulkUpdate(args.ids, args.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
        onError: () => toast.error(t('projects.messages.bulk_error')),
    });

    const deleteMutation = useMutation({
        mutationFn: projectService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            toast.success(t('projects.messages.delete_success'));
        },
        onError: () => toast.error(t('projects.messages.delete_error')),
    });

    const baseRequests = useMemo(() => Array.isArray(projects) ? projects.filter((p: any) => REQUEST_STATUSES.includes(p.status?.toLowerCase())) : [], [projects]);
    const filteredRequests = useMemo(() => baseRequests.filter((p: any) => {
        if (advancedFilters.customerId && p.customer_id?.toString() !== advancedFilters.customerId) return false;
        if (advancedFilters.partnerId && p.partner_id?.toString() !== advancedFilters.partnerId) return false;
        if (advancedFilters.sourceLanguageId && p.source_lang_id?.toString() !== advancedFilters.sourceLanguageId) return false;
        if (advancedFilters.targetLanguageId && p.target_lang_id?.toString() !== advancedFilters.targetLanguageId) return false;
        if (advancedFilters.priority && advancedFilters.priority !== 'all' && p.priority !== advancedFilters.priority) return false;
        return true;
    }), [baseRequests, advancedFilters]);

    const unassignedCount = baseRequests.filter((p: any) => !p.partner_id).length;
    const todayCount = baseRequests.filter((p: any) => {
        if (!p.created_at) return false;
        const created = new Date(p.created_at);
        const today = new Date();
        return created.toDateString() === today.toDateString();
    }).length;
    const activeFilterCount = Object.values(advancedFilters).filter(v => v && v !== 'all').length;

    const resetFilters = () => setAdvancedFilters({
        customerId: '',
        partnerId: '',
        sourceLanguageId: '',
        targetLanguageId: '',
        priority: 'all',
    });

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (filteredRequests.length === 0) return;
        const headers = [t('tables.id'), t('tables.project_name'), t('tables.customer'), t('tables.source_lang'), t('tables.target_lang'), t('tables.status'), t('tables.deadline'), t('tables.price')];
        const rows = filteredRequests.map((p: any) => [p.project_number || p.id, p.project_name, p.customer?.company_name || `${p.customer?.first_name} ${p.customer?.last_name}`, p.source_language?.iso_code || '', p.target_language?.iso_code || '', p.status, p.deadline ? new Date(p.deadline).toLocaleDateString('de-DE') : '', p.price_total || '0']);
        const csvContent = [headers, ...rows].map(e => e.join(';')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerBlobDownload(blob, `requests_export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
    };

    const columns = buildProjectColumns({
        navigate,
        bulkUpdateMutation,
        setEditingProject: (p) => navigate(`/projects/${p.id}/edit`),
        setViewFilesProject: () => {},
        setIsModalOpen: () => {},
        setProjectToDelete,
        setConfirmTitle,
        setConfirmMessage,
        setIsConfirmOpen,
        t,
        companySettings,
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-16 py-6 md:py-8">
            <>
                {isFilterSidebarOpen && <div className="fixed inset-0 z-30 bg-black/[0.03]" onClick={() => setIsFilterSidebarOpen(false)} />}
                <div className={clsx('fixed top-12 right-0 bottom-0 z-40 w-72 bg-white border-l border-[#D1D9D8] shadow-[-4px_0_20px_rgba(0,0,0,0.08)] flex flex-col transition-transform duration-300 ease-in-out', isFilterSidebarOpen ? 'translate-x-0' : 'translate-x-full')}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#D1D9D8] bg-gradient-to-b from-white to-[#f0f0f0] shrink-0">
                        <div className="flex items-center gap-2">
                            <FaFilter className="text-[#1B4D4F] text-xs" />
                            <span className="text-sm font-bold text-slate-700">{t('common.filter')}</span>
                            {activeFilterCount > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{activeFilterCount}</span>}
                        </div>
                        <button onClick={() => setIsFilterSidebarOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition"><FaTimes className="text-xs" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{t('projects.filters.customers.label')}</label>
                            <SearchableSelect options={[{ value: '', label: t('projects.filters.customers.all') }, ...(Array.isArray(customers) ? customers : ((customers as any)?.data || [])).map((c: any) => ({ value: String(c.id), label: (c.company_name || `${c.first_name || ''} ${c.last_name || ''}`).trim() }))]} value={String(advancedFilters.customerId)} onChange={(v: any) => setAdvancedFilters((prev: any) => ({ ...prev, customerId: v }))} className="border-[#ccc] hover:border-[#adadad]" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{t('projects.filters.partners.label')}</label>
                            <SearchableSelect options={[{ value: '', label: t('projects.filters.partners.all') }, ...(Array.isArray(partners) ? partners : ((partners as any)?.data || [])).map((p: any) => ({ value: String(p.id), label: (p.company || `${p.first_name || ''} ${p.last_name || ''}`).trim() }))]} value={String(advancedFilters.partnerId)} onChange={(v: any) => setAdvancedFilters((prev: any) => ({ ...prev, partnerId: v }))} className="border-[#ccc] hover:border-[#adadad]" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{t('projects.filters.languages.source')}</label>
                            <SearchableSelect options={[{ value: '', label: t('projects.filters.languages.all') }, ...languages.map((l: any) => ({ value: String(l.id), label: getLanguageName(l.iso_code), icon: getFlagUrl(l.flag_icon || l.iso_code) }))]} value={String(advancedFilters.sourceLanguageId)} onChange={(v: any) => setAdvancedFilters((prev: any) => ({ ...prev, sourceLanguageId: v }))} className="border-[#ccc] hover:border-[#adadad]" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{t('projects.filters.languages.target')}</label>
                            <SearchableSelect options={[{ value: '', label: t('projects.filters.languages.all') }, ...languages.map((l: any) => ({ value: String(l.id), label: getLanguageName(l.iso_code), icon: getFlagUrl(l.flag_icon || l.iso_code) }))]} value={String(advancedFilters.targetLanguageId)} onChange={(v: any) => setAdvancedFilters((prev: any) => ({ ...prev, targetLanguageId: v }))} className="border-[#ccc] hover:border-[#adadad]" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{t('projects.filters.priority.label')}</label>
                            <div className="relative">
                                <select className="w-full h-9 text-xs border border-[#ccc] rounded-[3px] px-2.5 bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:border-[#1B4D4F] outline-none appearance-none pr-8 cursor-pointer hover:border-[#adadad] transition" value={advancedFilters.priority} onChange={e => setAdvancedFilters((prev: any) => ({ ...prev, priority: e.target.value }))}>
                                    <option value="all">{t('projects.filters.priority.all')}</option>
                                    <option value="low">{t('projects.filters.priority.standard')}</option>
                                    <option value="medium">{t('projects.filters.priority.normal')}</option>
                                    <option value="high">{t('projects.filters.priority.high')}</option>
                                    <option value="express">{t('projects.filters.priority.express')}</option>
                                </select>
                                <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 border-t border-[#D1D9D8] bg-[#f6f8f8] shrink-0">
                        <button onClick={resetFilters} className="w-full px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-[#ccc] rounded-[3px] hover:bg-slate-50 transition shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2"><FaUndo className="text-xs" /> {t('data_table.reset_filters')}</button>
                    </div>
                </div>
            </>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-tight">{t('requests.title')}</h1>
                    <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">{t('requests.subtitle')}</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} variant="default"><FaPlus className="mr-2 h-4 w-4" />{t('requests.new')}</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <KPICard label={t('requests.kpis.open')} value={baseRequests.length} icon={<FaInbox />} />
                <KPICard label={t('requests.kpis.today')} value={todayCount} icon={<FaClock />} subValue={todayCount > 0 ? t('requests.kpis.today_positive') : t('requests.kpis.today_empty')} />
                <KPICard label={t('requests.kpis.unassigned')} value={unassignedCount} icon={<FaUserTimes />} subValue={unassignedCount > 0 ? t('requests.kpis.unassigned_positive') : t('requests.kpis.unassigned_empty')} />
            </div>
            <div className="flex-1 min-h-0">
                <DataTable data={filteredRequests} columns={columns} isLoading={isLoading} searchPlaceholder={t('requests.search_placeholder')} onExport={handleExport} activeFilterCount={activeFilterCount} onFilterToggle={() => setIsFilterSidebarOpen(v => !v)} isFilterOpen_external={isFilterSidebarOpen} />
            </div>
            <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={(data: any) => createMutation.mutate(data)} initialData={{ status: 'draft' }} />
            <ConfirmModal isOpen={isConfirmOpen} title={confirmTitle} message={confirmMessage} onConfirm={() => {
                if (projectToDelete) {
                    if (Array.isArray(projectToDelete)) projectToDelete.forEach(id => deleteMutation.mutate(id));
                    else deleteMutation.mutate(projectToDelete);
                }
                setIsConfirmOpen(false);
            }} onClose={() => setIsConfirmOpen(false)} />
        </div>
    );
};

export default Requests;
