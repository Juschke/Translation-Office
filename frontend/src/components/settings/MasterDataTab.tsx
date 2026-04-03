import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
    FaPlus, FaTrash, FaEdit, FaCheck, FaBan
} from 'react-icons/fa';
import clsx from 'clsx';
import { Button } from '../ui/button';
import { settingsService } from '../../api/services';
import DataTable from '../common/DataTable';
import TableSkeleton from '../common/TableSkeleton';
import NewMasterDataModal from '../modals/NewMasterDataModal';
import ConfirmModal from '../common/ConfirmModal';
import toast from 'react-hot-toast';
import { getFlagUrl } from '../../utils/flags';
import SearchableSelect from '../common/SearchableSelect';

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
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; items: any[] }>({ isOpen: false, items: [] });
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

    useEffect(() => {
        const sub = searchParams.get('sub') as any;
        if (sub && (['languages', 'doc_types', 'services', 'email_templates', 'specializations', 'units', 'currencies', 'project_statuses'] as const).includes(sub)) {
            setMasterTab(sub);
            setSelectedIds([]); // Clear selection when tab changes
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
        setDeleteConfirm({ isOpen: true, items: [item] });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        const itemsToDelete = getActiveData().filter((item: any) => selectedIds.includes(item.id));
        setDeleteConfirm({ isOpen: true, items: itemsToDelete });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.items.length > 0) {
            const ids = deleteConfirm.items.map(i => i.id);
            const mutation = getMutationForTab('delete');

            toast.loading(t('common_ui.deleting'), { id: 'bulk-delete' });
            try {
                await Promise.all(ids.map(id => mutation.mutateAsync(id)));
                toast.success(t('messages.file_deleted_success'), { id: 'bulk-delete' });
                setSelectedIds([]);
            } catch (err) {
                toast.error(t('messages.error'), { id: 'bulk-delete' });
            }
        }
        setDeleteConfirm({ isOpen: false, items: [] });
    };

    const handleBulkDuplicate = async () => {
        if (selectedIds.length === 0) return;
        const itemsToDuplicate = getActiveData().filter((item: any) => selectedIds.includes(item.id));
        const mutation = getMutationForTab('create');

        toast.loading('Dupliziere...', { id: 'bulk-duplicate' });
        try {
            await Promise.all(itemsToDuplicate.map(item => {
                const { id, created_at, updated_at, tenant_id, ...data } = item;
                // Add suffix to names to identify copy
                if (data.name) data.name = `${data.name} (Kopie)`;
                if (data.name_internal) data.name_internal = `${data.name_internal} (Kopie)`;
                if (data.label) data.label = `${data.label} (Kopie)`;

                // For codes/ISO codes, we might need a suffix to avoid unique constraints
                if (data.iso_code) data.iso_code = `${data.iso_code}_copy`.substring(0, 10);
                if (data.code) data.code = `${data.code}_copy`.substring(0, 20);
                if (data.service_code) data.service_code = `${data.service_code}_copy`.substring(0, 20);
                if (data.abbreviation) data.abbreviation = `${data.abbreviation}_c`.substring(0, 10);

                return mutation.mutateAsync(data);
            }));
            toast.success('Erfolgreich dupliziert', { id: 'bulk-duplicate' });
            setSelectedIds([]);
        } catch (err) {
            console.error('Duplicate error:', err);
            toast.error('Fehler beim Duplizieren. Überprüfen Sie eindeutige Kürzel.', { id: 'bulk-duplicate' });
        }
    };

    const handleBulkUpdate = async (type: 'active' | 'inactive') => {
        if (selectedIds.length === 0) return;
        const mutation = getMutationForTab('update');

        toast.loading('Aktualisiere...', { id: 'bulk-update' });
        try {
            await Promise.all(selectedIds.map(id => {
                let data: any = {};

                // Map status fields based on the active tab's requirements
                if (masterTab === 'project_statuses') {
                    data = { is_active: type === 'active' };
                } else if (['languages', 'units', 'currencies', 'specializations'].includes(masterTab)) {
                    // These use 'archived' for inactive state in the backend
                    data = { status: type === 'active' ? 'active' : 'archived' };
                } else {
                    // services, email_templates, doc_types use 'active' / 'inactive'
                    data = { status: type === 'active' ? 'active' : 'inactive' };
                }

                return mutation.mutateAsync({ id, data });
            }));
            toast.success('Erfolgreich aktualisiert', { id: 'bulk-update' });
            setSelectedIds([]);
        } catch (err) {
            console.error('Bulk update error:', err);
            toast.error('Fehler beim Aktualisieren', { id: 'bulk-update' });
        }
    };

    const getActiveData = () => {
        switch (masterTab) {
            case 'languages': return languages;
            case 'doc_types': return docTypes;
            case 'services': return services;
            case 'email_templates': return emailTemplates;
            case 'specializations': return specializations;
            case 'units': return units;
            case 'currencies': return currencies;
            case 'project_statuses': return projectStatuses;
            default: return [];
        }
    };

    const getMutationForTab = (action: 'create' | 'update' | 'delete') => {
        switch (masterTab) {
            case 'languages': return action === 'create' ? createLanguageMutation : action === 'update' ? updateLanguageMutation : deleteLanguageMutation;
            case 'doc_types': return action === 'create' ? createDocTypeMutation : action === 'update' ? updateDocTypeMutation : deleteDocTypeMutation;
            case 'services': return action === 'create' ? createServiceMutation : action === 'update' ? updateServiceMutation : deleteServiceMutation;
            case 'email_templates': return action === 'create' ? createTemplateMutation : action === 'update' ? updateTemplateMutation : deleteTemplateMutation;
            case 'specializations': return action === 'create' ? createSpecializationMutation : action === 'update' ? updateSpecializationMutation : deleteSpecializationMutation;
            case 'units': return action === 'create' ? createUnitMutation : action === 'update' ? updateUnitMutation : deleteUnitMutation;
            case 'currencies': return action === 'create' ? createCurrencyMutation : action === 'update' ? updateCurrencyMutation : deleteCurrencyMutation;
            case 'project_statuses': return action === 'create' ? createProjectStatusMutation : action === 'update' ? updateProjectStatusMutation : deleteProjectStatusMutation;
            default: throw new Error('Unknown tab');
        }
    };

    const commonBulkActions = [
        { label: 'Duplizieren', icon: <FaPlus />, onClick: handleBulkDuplicate, variant: 'default' as const },
        { label: 'Aktivieren', icon: <FaCheck />, onClick: () => handleBulkUpdate('active'), variant: 'success' as const },
        { label: 'Deaktivieren', icon: <FaBan />, onClick: () => handleBulkUpdate('inactive'), variant: 'warning' as const },
        { label: 'Löschen', icon: <FaTrash />, onClick: handleBulkDelete, variant: 'danger' as const },
    ];

    return (
        <>
            <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-hidden flex flex-col h-[750px] max-h-[calc(100vh-280px)] animate-fadeIn">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0 sticky top-0 z-20">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 italic">
                        {t(`settings.master_data.${masterTab === 'languages' ? 'language_config' : masterTab === 'doc_types' ? 'doc_categories' : masterTab === 'services' ? 'service_catalog' : masterTab === 'email_templates' ? 'email_templates' : masterTab === 'specializations' ? 'specializations' : masterTab === 'units' ? 'units' : masterTab === 'currencies' ? 'currencies' : 'project_statuses'}`)}
                    </h3>
                    <Button variant="default" size="sm" onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
                        <FaPlus className="text-2xs" /> {t('settings.master_data.add_new')}
                    </Button>
                </div>



                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {masterTab === 'languages' && (isLanguagesLoading ? <TableSkeleton rows={5} columns={6} /> : <DataTable
                        isLoading={isLanguagesLoading}
                        data={languages}
                        selectable
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        bulkActions={commonBulkActions}
                        columns={[
                            { id: 'name', header: t('fields.name'), accessor: (l: any) => <span className="font-medium text-slate-800 text-sm">{l.name_internal}</span> },
                            { id: 'code', header: t('settings.master_data.code_iso'), accessor: (l: any) => <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 border border-slate-100 rounded-sm">{l.iso_code}</span>, className: 'w-32' },
                            { id: 'flag', header: 'Flagge', accessor: (l: any) => <div className="w-8 h-6 overflow-hidden shadow-sm border border-slate-200 bg-slate-50 rounded-sm flex items-center justify-center">{l.flag_icon ? <img src={getFlagUrl(l.flag_icon)} className="w-full h-full object-cover" /> : <span className="text-2xs text-slate-300 font-bold">no</span>}</div>, align: 'center' },
                            { id: 'native', header: t('settings.master_data.native'), accessor: 'name_native', className: 'text-slate-500 italic text-sm' },
                            { id: 'status', header: t('settings.master_data.status'), accessor: (l: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', l.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{l.status || 'active'}</span>, align: 'center' },
                            { id: 'actions', header: '', accessor: (l: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(l)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(l)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                        ]} pageSize={10} />)}

                    {masterTab === 'doc_types' && (isDocTypesLoading ? <TableSkeleton rows={5} columns={4} /> : (
                        <>
                            <DataTable
                                isLoading={isDocTypesLoading}
                                data={docTypes.filter((d: any) => !docTypeCategoryFilter || d.category === docTypeCategoryFilter)}
                                selectable
                                selectedIds={selectedIds}
                                onSelectionChange={setSelectedIds}
                                bulkActions={commonBulkActions}
                                actions={(
                                    <div className="flex items-center gap-3">
                                        <SearchableSelect
                                            options={[
                                                { value: '', label: t('settings.master_data.all_items') },
                                                ...Array.from(new Set(docTypes.map((d: any) => d.category)))
                                                    .filter(Boolean)
                                                    .sort()
                                                    .map(cat => ({ value: cat as string, label: cat as string }))
                                            ]}
                                            value={docTypeCategoryFilter}
                                            onChange={(val: string) => setDocTypeCategoryFilter(val)}
                                            placeholder={t('settings.master_data.category_filter')}
                                            className="w-60"
                                        />
                                    </div>
                                )}
                                columns={[
                                    { id: 'code', header: t('fields.code'), accessor: (d: any) => <span className="text-2xs font-mono font-bold text-slate-400 bg-slate-50/50 px-2 py-0.5 border border-slate-200/50 rounded-sm">{d.code || '-'}</span>, className: 'w-28' },
                                    {
                                        id: 'name',
                                        header: t('fields.name'),
                                        accessor: (d: any) => (
                                            <div className="flex flex-col py-1">
                                                <span className="font-semibold text-slate-800 text-sm leading-tight">{d.name}</span>
                                                <span className="text-2xs text-slate-400 font-medium mt-0.5">{d.category || '-'}</span>
                                            </div>
                                        )
                                    },
                                    { id: 'status', header: t('settings.master_data.status'), accessor: (d: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', d.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{d.status || 'active'}</span>, align: 'center' },
                                    { id: 'actions', header: '', accessor: (d: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(d)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(d)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                                ]}
                                pageSize={10}
                            />
                        </>
                    ))}

                    {masterTab === 'services' && (isServicesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable
                        isLoading={isServicesLoading}
                        data={services}
                        selectable
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        bulkActions={commonBulkActions}
                        columns={[
                            { id: 'name', header: t('settings.master_data.service_name'), accessor: (s: any) => <span className="font-medium text-slate-800 text-sm">{s.name}</span> },
                            { id: 'description', header: t('fields.description'), accessor: (s: any) => <span className="text-2xs text-slate-400 italic line-clamp-1 max-w-[200px]">{s.description || '-'}</span> },
                            { id: 'extra', header: 'Extra', accessor: (s: any) => s.is_extra ? <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-sm">Ja</span> : <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-400 border border-slate-200 rounded-sm">Nein</span>, align: 'center' },
                            { id: 'status', header: t('settings.master_data.status'), accessor: (s: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{s.status || 'active'}</span>, align: 'center' },
                            { id: 'actions', header: '', accessor: (s: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(s)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                        ]} pageSize={10} />)}

                    {masterTab === 'email_templates' && (isTemplatesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable
                        isLoading={isTemplatesLoading}
                        data={emailTemplates}
                        selectable
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        bulkActions={commonBulkActions}
                        columns={[
                            { id: 'name', header: t('settings.master_data.template_name'), accessor: (t: any) => <span className="font-medium text-slate-800 text-sm">{t.name}</span> },
                            { id: 'subject', header: t('settings.master_data.subject'), accessor: (t: any) => <span className="text-xs text-slate-500">{t.subject}</span> },
                            { id: 'status', header: t('settings.master_data.status'), accessor: (t: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', t.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{t.status || 'active'}</span>, align: 'center' },
                            { id: 'actions', header: '', accessor: (t: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(t)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(t)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                        ]} pageSize={10} />)}

                    {masterTab === 'specializations' && (isSpecializationsLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable
                        isLoading={isSpecializationsLoading}
                        data={specializations}
                        selectable
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        bulkActions={commonBulkActions}
                        columns={[
                            { id: 'name', header: t('fields.name'), accessor: (s: any) => <span className="font-medium text-slate-800 text-sm">{s.name}</span> },
                            { id: 'description', header: t('fields.description'), accessor: (s: any) => <span className="text-xs text-slate-400">{s.description || '-'}</span> },
                            { id: 'status', header: t('settings.master_data.status'), accessor: (s: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{s.status || 'active'}</span>, align: 'center' },
                            { id: 'actions', header: '', accessor: (s: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(s)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                        ]} pageSize={10} />)}

                    {masterTab === 'units' && (isUnitsLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable
                        isLoading={isUnitsLoading}
                        data={units}
                        selectable
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        bulkActions={commonBulkActions}
                        columns={[
                            { id: 'name', header: t('fields.name'), accessor: (u: any) => <span className="font-medium text-slate-800 text-sm">{u.name}</span> },
                            { id: 'abbreviation', header: t('settings.master_data.abbreviation'), accessor: (u: any) => <span className="text-xs font-medium text-slate-500">{u.abbreviation}</span> },
                            { id: 'type', header: t('settings.master_data.type'), accessor: (u: any) => <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full font-medium">{t(`settings.master_data.unit_types.${u.type || 'quantity'}`)}</span> },
                            { id: 'description', header: t('fields.description'), accessor: (u: any) => <span className="text-xs text-slate-400 italic line-clamp-1 max-w-[200px]">{u.description || '-'}</span> },
                            { id: 'status', header: t('settings.master_data.status'), accessor: (u: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{u.status || 'active'}</span>, align: 'center' },
                            { id: 'actions', header: '', accessor: (u: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(u)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(u)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                        ]} pageSize={10} />)}

                    {masterTab === 'currencies' && (isCurrenciesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable
                        isLoading={isCurrenciesLoading}
                        data={currencies}
                        selectable
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        bulkActions={commonBulkActions}
                        columns={[
                            { id: 'code', header: t('settings.master_data.currency_code'), accessor: (c: any) => <span className="font-medium text-slate-800 text-sm">{c.code}</span> },
                            { id: 'symbol', header: t('settings.master_data.symbol'), accessor: (c: any) => <span className="text-xs text-slate-500">{c.symbol}</span> },
                            { id: 'status', header: t('settings.master_data.status'), accessor: (c: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{c.status || 'active'}</span>, align: 'center' },
                            { id: 'actions', header: '', accessor: (c: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(c)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(c)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                        ]} pageSize={10} />)}

                    {masterTab === 'project_statuses' && (isProjectStatusesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable
                        isLoading={isProjectStatusesLoading}
                        data={projectStatuses}
                        selectable
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        bulkActions={commonBulkActions}
                        columns={[
                            { id: 'name', header: 'Key (Intern)', accessor: (s: any) => <span className="font-mono text-xs text-slate-500">{s.name}</span> },
                            { id: 'label', header: t('fields.name'), accessor: (s: any) => <span className="font-medium text-slate-800 text-sm">{s.label}</span> },
                            { id: 'preview', header: 'Vorschau', accessor: (s: any) => <span className={clsx('px-2.5 py-0.5 rounded-sm text-xs font-semibold border tracking-tight', s.style || 'bg-slate-50 text-slate-400 border-slate-200')}>{s.label}</span>, align: 'center' },
                            { id: 'status', header: t('settings.master_data.status'), accessor: (s: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{s.is_active ? 'Aktiv' : 'Inaktiv'}</span>, align: 'center' },
                            { id: 'actions', header: '', accessor: (s: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-slate-700 rounded-sm transition-colors"><FaEdit /></button><button onClick={() => handleDeleteMasterData(s)} className="p-2 text-slate-300 hover:text-red-500 rounded-sm transition-colors"><FaTrash /></button></div>, align: 'right' }
                        ]} pageSize={10} />)}
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
                onClose={() => setDeleteConfirm({ isOpen: false, items: [] })}
                onConfirm={confirmDelete}
                title={t('confirm.deleteTitle')}
                message={deleteConfirm.items.length > 1
                    ? `Möchten Sie wirklich ${deleteConfirm.items.length} Einträge unwiderruflich löschen?`
                    : t('confirm.deleteMessage')}
            />
        </>
    );
};

export default MasterDataTab;
