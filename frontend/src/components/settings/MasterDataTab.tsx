import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
    FaPlus, FaTrash, FaEdit
} from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';
import { settingsService } from '../../api/services';
import DataTable from '../common/DataTable';
import TableSkeleton from '../common/TableSkeleton';
import SearchableSelect from '../common/SearchableSelect';
import NewMasterDataModal from '../modals/NewMasterDataModal';
import ConfirmModal from '../modals/ConfirmModal';
import { getFlagUrl } from '../../utils/flags';

const MasterDataTab = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const initialSubTab = searchParams.get('sub') as any;
    const [masterTab, setMasterTab] = useState<'languages' | 'doc_types' | 'services' | 'email_templates' | 'specializations' | 'units' | 'currencies' | 'project_statuses'>(
        (['languages', 'doc_types', 'services', 'email_templates', 'specializations', 'units', 'currencies', 'project_statuses'] as const).includes(initialSubTab)
            ? initialSubTab
            : 'languages'
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [docTypeCategoryFilter, setDocTypeCategoryFilter] = useState<string>('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: any | null }>({ isOpen: false, item: null });

    useEffect(() => {
        const sub = searchParams.get('sub') as any;
        if (sub && (['languages', 'doc_types', 'services', 'email_templates', 'specializations', 'units', 'currencies', 'project_statuses'] as const).includes(sub)) {
            setMasterTab(sub);
        }
    }, [searchParams]);

    const { data: languages = [], isLoading: isLanguagesLoading } = useQuery<any[]>({
        queryKey: ['settings', 'languages'],
        queryFn: settingsService.getLanguages
    });
    const { data: docTypes = [], isLoading: isDocTypesLoading } = useQuery<any[]>({
        queryKey: ['settings', 'docTypes'],
        queryFn: settingsService.getDocTypes
    });
    const { data: services = [], isLoading: isServicesLoading } = useQuery<any[]>({
        queryKey: ['settings', 'services'],
        queryFn: settingsService.getServices
    });
    const { data: emailTemplates = [], isLoading: isTemplatesLoading } = useQuery<any[]>({
        queryKey: ['emailTemplates'],
        queryFn: settingsService.getEmailTemplates
    });

    const { data: specializations = [], isLoading: isSpecializationsLoading } = useQuery<any[]>({ queryKey: ['settings', 'specializations'], queryFn: settingsService.getSpecializations });
    const { data: units = [], isLoading: isUnitsLoading } = useQuery<any[]>({ queryKey: ['settings', 'units'], queryFn: settingsService.getUnits });
    const { data: currencies = [], isLoading: isCurrenciesLoading } = useQuery<any[]>({ queryKey: ['settings', 'currencies'], queryFn: settingsService.getCurrencies });
    const { data: projectStatuses = [], isLoading: isProjectStatusesLoading } = useQuery<any[]>({ queryKey: ['settings', 'projectStatuses'], queryFn: settingsService.getProjectStatuses });

    const createLanguageMutation = useMutation({ mutationFn: settingsService.createLanguage, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'languages'] }); setIsModalOpen(false); } });
    const updateLanguageMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateLanguage(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'languages'] }); setIsModalOpen(false); } });
    const deleteLanguageMutation = useMutation({ mutationFn: settingsService.deleteLanguage, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'languages'] }) });

    const createDocTypeMutation = useMutation({ mutationFn: settingsService.createDocType, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'docTypes'] }); setIsModalOpen(false); } });
    const updateDocTypeMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateDocType(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'docTypes'] }); setIsModalOpen(false); } });
    const deleteDocTypeMutation = useMutation({ mutationFn: settingsService.deleteDocType, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'docTypes'] }) });

    const createServiceMutation = useMutation({ mutationFn: settingsService.createService, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'services'] }); setIsModalOpen(false); } });
    const updateServiceMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateService(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'services'] }); setIsModalOpen(false); } });
    const deleteServiceMutation = useMutation({ mutationFn: settingsService.deleteService, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'services'] }) });

    const createTemplateMutation = useMutation({ mutationFn: settingsService.createEmailTemplate, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['emailTemplates'] }); setIsModalOpen(false); } });
    const updateTemplateMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateEmailTemplate(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['emailTemplates'] }); setIsModalOpen(false); } });
    const deleteTemplateMutation = useMutation({ mutationFn: settingsService.deleteEmailTemplate, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emailTemplates'] }) });

    const createSpecializationMutation = useMutation({ mutationFn: settingsService.createSpecialization, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'specializations'] }); setIsModalOpen(false); } });
    const updateSpecializationMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateSpecialization(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'specializations'] }); setIsModalOpen(false); } });
    const deleteSpecializationMutation = useMutation({ mutationFn: settingsService.deleteSpecialization, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'specializations'] }) });

    const createUnitMutation = useMutation({ mutationFn: settingsService.createUnit, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'units'] }); setIsModalOpen(false); } });
    const updateUnitMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateUnit(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'units'] }); setIsModalOpen(false); } });
    const deleteUnitMutation = useMutation({ mutationFn: settingsService.deleteUnit, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'units'] }) });

    const createCurrencyMutation = useMutation({ mutationFn: settingsService.createCurrency, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'currencies'] }); setIsModalOpen(false); } });
    const updateCurrencyMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateCurrency(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'currencies'] }); setIsModalOpen(false); } });
    const deleteCurrencyMutation = useMutation({ mutationFn: settingsService.deleteCurrency, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'currencies'] }) });

    const createProjectStatusMutation = useMutation({ mutationFn: settingsService.createProjectStatus, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'projectStatuses'] }); setIsModalOpen(false); } });
    const updateProjectStatusMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateProjectStatus(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings', 'projectStatuses'] }); setIsModalOpen(false); } });
    const deleteProjectStatusMutation = useMutation({ mutationFn: settingsService.deleteProjectStatus, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'projectStatuses'] }) });

    const handleOpenModal = (item?: any) => {
        setEditingItem(item || null);
        setIsModalOpen(true);
    };

    const handleDeleteMasterData = (item: any) => {
        setDeleteConfirm({ isOpen: true, item });
    };

    const confirmDelete = () => {
        if (deleteConfirm.item) {
            const id = deleteConfirm.item.id;
            if (masterTab === 'languages') deleteLanguageMutation.mutate(id);
            else if (masterTab === 'doc_types') deleteDocTypeMutation.mutate(id);
            else if (masterTab === 'services') deleteServiceMutation.mutate(id);
            else if (masterTab === 'email_templates') deleteTemplateMutation.mutate(id);
            else if (masterTab === 'specializations') deleteSpecializationMutation.mutate(id);
            else if (masterTab === 'units') deleteUnitMutation.mutate(id);
            else if (masterTab === 'currencies') deleteCurrencyMutation.mutate(id);
            else if (masterTab === 'project_statuses') deleteProjectStatusMutation.mutate(id);
        }
        setDeleteConfirm({ isOpen: false, item: null });
    };

    return (
        <>
            <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-hidden flex flex-col h-full min-h-[500px] sm:min-h-0 animate-fadeIn">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0 sticky top-0 z-20">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 italic">
                        {t(`settings.master_data.${masterTab === 'languages' ? 'language_config' : masterTab === 'doc_types' ? 'doc_categories' : masterTab === 'services' ? 'service_catalog' : masterTab === 'email_templates' ? 'email_templates' : masterTab === 'specializations' ? 'specializations' : masterTab === 'units' ? 'units' : masterTab === 'currencies' ? 'currencies' : 'project_statuses'}`)}
                    </h3>
                    <Button variant="default" size="sm" onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
                        <FaPlus className="text-[10px]" /> {t('settings.master_data.add_new')}
                    </Button>
                </div>



                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {masterTab === 'languages' && (isLanguagesLoading ? <TableSkeleton rows={5} columns={6} /> : <DataTable isLoading={isLanguagesLoading} data={languages} columns={[
                        { id: 'code', header: t('fields.code'), accessor: (l: any) => <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50/50 px-2 py-0.5 border border-slate-200/50 rounded-sm">{l.code || l.iso_code}</span>, className: 'w-24' },
                        { id: 'iso', header: t('settings.master_data.code_iso'), accessor: (l: any) => <span className="text-[10px] font-medium text-slate-400 uppercase">{l.iso_code}</span>, className: 'w-24' },
                        { id: 'name', header: t('fields.name'), accessor: (l: any) => <span className="font-medium text-slate-800 text-sm">{l.name_internal}</span> },
                        { id: 'flag', header: t('settings.master_data_flag'), accessor: (l: any) => <div className="w-8 h-6 overflow-hidden shadow-sm border border-slate-200 bg-slate-50 rounded-sm flex items-center justify-center">{l.flag_icon ? <img src={getFlagUrl(l.flag_icon)} className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-300 uppercase font-bold">no</span>}</div>, align: 'center' },
                        { id: 'native', header: t('settings.master_data.native'), accessor: 'name_native', className: 'text-slate-500 italic text-sm' },
                        { id: 'status', header: t('settings.master_data.status'), accessor: (l: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', l.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{l.status || 'active'}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (l: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(l)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(l)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={1000} onAddClick={() => handleOpenModal()} />)}

                    {masterTab === 'doc_types' && (isDocTypesLoading ? <TableSkeleton rows={5} columns={4} /> : (
                        <DataTable
                            isLoading={isDocTypesLoading}
                            data={docTypes.filter((d: any) => !docTypeCategoryFilter || d.category === docTypeCategoryFilter)}
                            columns={[
                                { id: 'code', header: t('fields.code'), accessor: (d: any) => <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50/50 px-2 py-0.5 border border-slate-200/50 rounded-sm">{d.code || '-'}</span>, className: 'w-28' },
                                {
                                    id: 'name',
                                    header: t('fields.name'),
                                    accessor: (d: any) => (
                                        <div className="flex flex-col py-1">
                                            <span className="font-semibold text-slate-800 text-sm leading-tight">{d.name}</span>
                                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{d.category || '-'}</span>
                                        </div>
                                    )
                                },
                                { id: 'status', header: t('settings.master_data.status'), accessor: (d: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', d.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{d.status || 'active'}</span>, align: 'center' },
                                { id: 'actions', header: '', accessor: (d: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(d)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(d)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                            ]}
                            pageSize={100}
                            onAddClick={() => handleOpenModal()}
                            preSearchControls={(
                                <div className="flex gap-3">
                                    <SearchableSelect
                                        options={[
                                            { value: '', label: 'Alle Kategorien' },
                                            ...Array.from(new Set(docTypes.map((d: any) => d.category).filter(Boolean))).map(cat => ({
                                                value: cat as string,
                                                label: cat as string
                                            }))
                                        ]}
                                        value={docTypeCategoryFilter}
                                        onChange={(val) => setDocTypeCategoryFilter(val)}
                                        placeholder={t('settings.master_data_category_placeholder')}
                                        className="min-w-[250px] !h-8  !shadow-none"
                                    />
                                </div>
                            )}
                        />

                    ))}


                    {masterTab === 'services' && (isServicesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isServicesLoading} data={services} columns={[
                        { id: 'code', header: t('fields.code'), accessor: (s: any) => <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50/50 px-2 py-0.5 border border-slate-200/50 rounded-sm">{s.service_code || '-'}</span>, className: 'w-32' },
                        { id: 'name', header: t('settings.master_data.service_name'), accessor: (s: any) => <span className="font-medium text-slate-800 text-sm">{s.name}</span> },
                        { id: 'description', header: t('fields.description'), accessor: (s: any) => <span className="text-xs text-slate-400">{s.description || '-'}</span> },
                        { id: 'status', header: t('settings.master_data.status'), accessor: (s: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{s.status || 'active'}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (s: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(s)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={1000} onAddClick={() => handleOpenModal()} />)}

                    {masterTab === 'email_templates' && (isTemplatesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isTemplatesLoading} data={emailTemplates} columns={[
                        { id: 'code', header: t('fields.code'), accessor: (t: any) => <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50/50 px-2 py-0.5 border border-slate-200/50 rounded-sm">{t.code || '-'}</span>, className: 'w-32' },
                        { id: 'name', header: t('settings.master_data.template_name'), accessor: (t: any) => <span className="font-medium text-slate-800 text-sm">{t.name}</span> },
                        { id: 'subject', header: t('settings.master_data.subject'), accessor: (t: any) => <span className="text-xs text-slate-500">{t.subject}</span> },
                        { id: 'status', header: t('settings.master_data.status'), accessor: (t: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', t.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{t.status || 'active'}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (t: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(t)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(t)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={1000} onAddClick={() => handleOpenModal()} />)}

                    {masterTab === 'specializations' && (isSpecializationsLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isSpecializationsLoading} data={specializations} columns={[
                        { id: 'code', header: t('fields.code'), accessor: (s: any) => <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50/50 px-2 py-0.5 border border-slate-200/50 rounded-sm">{s.code || '-'}</span>, className: 'w-32' },
                        { id: 'name', header: t('fields.name'), accessor: (s: any) => <span className="font-medium text-slate-800 text-sm">{s.name}</span> },
                        { id: 'description', header: t('fields.description'), accessor: (s: any) => <span className="text-xs text-slate-400">{s.description || '-'}</span> },
                        { id: 'status', header: t('settings.master_data.status'), accessor: (s: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{s.status || 'active'}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (s: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(s)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={1000} onAddClick={() => handleOpenModal()} />)}

                    {masterTab === 'units' && (isUnitsLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isUnitsLoading} data={units} columns={[
                        { id: 'code', header: t('fields.code'), accessor: (u: any) => <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50/50 px-2 py-0.5 border border-slate-200/50 rounded-sm">{u.code || '-'}</span>, className: 'w-32' },
                        { id: 'name', header: t('fields.name'), accessor: (u: any) => <span className="font-medium text-slate-800 text-sm">{u.name}</span> },
                        { id: 'abbreviation', header: t('settings.master_data.abbreviation'), accessor: (u: any) => <span className="text-xs font-medium text-slate-500">{u.abbreviation}</span> },
                        { id: 'type', header: t('settings.master_data.type'), accessor: (u: any) => <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full font-medium">{t(`settings.master_data.unit_types.${u.type || 'quantity'}`)}</span> },
                        { id: 'description', header: t('fields.description'), accessor: (u: any) => <span className="text-xs text-slate-400 italic line-clamp-1 max-w-[200px]">{u.description || '-'}</span> },
                        { id: 'status', header: t('settings.master_data.status'), accessor: (u: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{u.status || 'active'}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (u: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(u)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(u)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={1000} onAddClick={() => handleOpenModal()} />)}

                    {masterTab === 'currencies' && (isCurrenciesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isCurrenciesLoading} data={currencies} columns={[
                        { id: 'code', header: t('fields.code'), accessor: (c: any) => <span className="font-medium text-slate-800 text-sm">{c.code}</span> },
                        { id: 'symbol', header: t('settings.master_data.symbol'), accessor: (c: any) => <span className="text-xs text-slate-500">{c.symbol}</span> },
                        { id: 'status', header: t('settings.master_data.status'), accessor: (c: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{c.status || 'active'}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (c: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(c)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(c)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={1000} onAddClick={() => handleOpenModal()} />)}

                    {masterTab === 'project_statuses' && (isProjectStatusesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isProjectStatusesLoading} data={projectStatuses} columns={[
                        { id: 'code', header: t('fields.code'), accessor: (s: any) => <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50/50 px-2 py-0.5 border border-slate-200/50 rounded-sm">{s.code || '-'}</span>, className: 'w-24' },
                        { id: 'name', header: t('settings.master_data_key'), accessor: (s: any) => <span className="font-mono text-[10px] text-slate-400">{s.name}</span>, className: 'w-32' },
                        { id: 'label', header: t('fields.name'), accessor: (s: any) => <span className="font-medium text-slate-800 text-sm">{s.label}</span> },
                        { id: 'preview', header: t('settings.master_data_preview'), accessor: (s: any) => <span className={clsx('px-2.5 py-0.5 rounded-sm text-xs font-semibold border tracking-tight', s.style || 'bg-slate-50 text-slate-400 border-slate-200')}>{s.label}</span>, align: 'center' },
                        { id: 'status', header: t('settings.master_data.status'), accessor: (s: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{s.is_active ? t('settings.master_data_active') : t('settings.master_data_inactive')}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (s: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(s)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={1000} onAddClick={() => handleOpenModal()} />)}
                </div>
            </div>

            <NewMasterDataModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                type={masterTab}
                initialData={editingItem}
                onSubmit={(data: any) => {
                    const id = editingItem?.id;
                    if (masterTab === 'languages') id ? updateLanguageMutation.mutate({ id, data }) : createLanguageMutation.mutate(data);
                    else if (masterTab === 'doc_types') id ? updateDocTypeMutation.mutate({ id, data }) : createDocTypeMutation.mutate(data);
                    else if (masterTab === 'services') id ? updateServiceMutation.mutate({ id, data }) : createServiceMutation.mutate(data);
                    else if (masterTab === 'email_templates') id ? updateTemplateMutation.mutate({ id, data }) : createTemplateMutation.mutate(data);
                    else if (masterTab === 'specializations') id ? updateSpecializationMutation.mutate({ id, data }) : createSpecializationMutation.mutate(data);
                    else if (masterTab === 'units') id ? updateUnitMutation.mutate({ id, data }) : createUnitMutation.mutate(data);
                    else if (masterTab === 'currencies') id ? updateCurrencyMutation.mutate({ id, data }) : createCurrencyMutation.mutate(data);
                    else if (masterTab === 'project_statuses') id ? updateProjectStatusMutation.mutate({ id, data }) : createProjectStatusMutation.mutate(data);
                }}
            />

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
                onConfirm={confirmDelete}
                title={t('confirm.deleteTitle')}
                message={t('confirm.deleteMessage')}
            />
        </>
    );
};

export default MasterDataTab;
