import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
    FaPlus, FaTrash, FaEdit, FaDatabase
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

// ── Shared cell helpers ───────────────────────────────────────────────────────

const NameCell = ({ name, sub }: { name: string; sub?: string }) => (
    <div className="flex flex-col py-0.5">
        <span className="text-sm font-medium text-slate-800 leading-snug">{name}</span>
        {sub && <span className="text-[11px] text-slate-400 mt-0.5">{sub}</span>}
    </div>
);

const StatusDot = ({ active }: { active: boolean }) => (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', active ? 'bg-emerald-400' : 'bg-slate-300')} />
        {active ? 'Aktiv' : 'Inaktiv'}
    </span>
);

const ActionButtons = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
        >
            <FaEdit size={12} />
        </button>
        <button
            onClick={onDelete}
            className="p-1.5 text-slate-300 hover:text-red-500 rounded transition-colors"
        >
            <FaTrash size={12} />
        </button>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────

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

    const { data: languages = [], isLoading: isLanguagesLoading } = useQuery<any[]>({ queryKey: ['settings', 'languages'], queryFn: settingsService.getLanguages });
    const { data: docTypes = [], isLoading: isDocTypesLoading } = useQuery<any[]>({ queryKey: ['settings', 'docTypes'], queryFn: settingsService.getDocTypes });
    const { data: services = [], isLoading: isServicesLoading } = useQuery<any[]>({ queryKey: ['settings', 'services'], queryFn: settingsService.getServices });
    const { data: emailTemplates = [], isLoading: isTemplatesLoading } = useQuery<any[]>({ queryKey: ['emailTemplates'], queryFn: settingsService.getEmailTemplates });
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

    const actions = () => ({
        id: 'actions',
        header: '',
        accessor: (row: any) => (
            <ActionButtons
                onEdit={() => handleOpenModal(row)}
                onDelete={() => handleDeleteMasterData(row)}
            />
        ),
        align: 'right' as const,
        className: 'w-16',
    });

    return (
        <>
            <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-hidden flex flex-col h-full min-h-[500px] sm:min-h-0 animate-fadeIn">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-2.5">
                        <FaDatabase className="text-slate-400" size={13} />
                        <h3 className="text-sm font-medium text-slate-700">
                            {t(`settings.master_data.${masterTab === 'languages' ? 'language_config' : masterTab === 'doc_types' ? 'doc_categories' : masterTab === 'services' ? 'service_catalog' : masterTab === 'email_templates' ? 'email_templates' : masterTab === 'specializations' ? 'specializations' : masterTab === 'units' ? 'units' : masterTab === 'currencies' ? 'currencies' : 'project_statuses'}`)}
                        </h3>
                    </div>
                    <Button variant="default" size="sm" onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-1.5">
                        <FaPlus size={10} /> {t('settings.master_data.add_new')}
                    </Button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                    {/* LANGUAGES */}
                    {masterTab === 'languages' && (isLanguagesLoading ? <TableSkeleton rows={5} columns={5} /> : (
                        <DataTable
                            isLoading={isLanguagesLoading}
                            data={languages}
                            pageSize={1000}
                            onAddClick={() => handleOpenModal()}
                            columns={[
                                {
                                    id: 'name',
                                    header: 'Sprache',
                                    accessor: (l: any) => (
                                        <NameCell
                                            name={l.name_internal}
                                            sub={[l.code || l.iso_code, l.iso_code].filter(Boolean).join(' · ')}
                                        />
                                    ),
                                },
                                {
                                    id: 'flag',
                                    header: 'Flagge',
                                    accessor: (l: any) => (
                                        <div className="w-8 h-5 overflow-hidden border border-slate-200 rounded-sm flex items-center justify-center bg-slate-50">
                                            {l.flag_icon
                                                ? <img src={getFlagUrl(l.flag_icon)} className="w-full h-full object-cover" />
                                                : <span className="text-[9px] text-slate-300">–</span>
                                            }
                                        </div>
                                    ),
                                    align: 'center',
                                    className: 'w-16',
                                },
                                {
                                    id: 'native',
                                    header: 'Nativname',
                                    accessor: (l: any) => <span className="text-sm text-slate-500">{l.name_native || '–'}</span>,
                                },
                                {
                                    id: 'status',
                                    header: 'Status',
                                    accessor: (l: any) => <StatusDot active={l.status === 'active' || !l.status} />,
                                    className: 'w-24',
                                },
                                actions(),
                            ]}
                        />
                    ))}

                    {/* DOC TYPES */}
                    {masterTab === 'doc_types' && (isDocTypesLoading ? <TableSkeleton rows={5} columns={4} /> : (
                        <DataTable
                            isLoading={isDocTypesLoading}
                            data={docTypes.filter((d: any) => !docTypeCategoryFilter || d.category === docTypeCategoryFilter)}
                            pageSize={100}
                            onAddClick={() => handleOpenModal()}
                            preSearchControls={(
                                <div className="flex-1 min-w-[150px]">
                                    <SearchableSelect
                                        options={[
                                            { value: '', label: 'Alle Kategorien' },
                                            ...Array.from(new Set(docTypes.map((d: any) => d.category).filter(Boolean))).map(cat => ({
                                                value: cat as string,
                                                label: cat as string,
                                            }))
                                        ]}
                                        value={docTypeCategoryFilter}
                                        onChange={(val) => setDocTypeCategoryFilter(val)}
                                        placeholder={t('settings.master_data_category_placeholder')}
                                        className="!h-8 !shadow-none w-full"
                                    />
                                </div>
                            )}
                            columns={[
                                {
                                    id: 'name',
                                    header: 'Dokumentenart',
                                    accessor: (d: any) => (
                                        <NameCell
                                            name={d.name}
                                            sub={[d.code, d.category].filter(Boolean).join(' · ')}
                                        />
                                    ),
                                },
                                {
                                    id: 'status',
                                    header: 'Status',
                                    accessor: (d: any) => <StatusDot active={d.status === 'active' || !d.status} />,
                                    className: 'w-24',
                                },
                                actions(),
                            ]}
                        />
                    ))}

                    {/* SERVICES */}
                    {masterTab === 'services' && (isServicesLoading ? <TableSkeleton rows={5} columns={4} /> : (
                        <DataTable
                            isLoading={isServicesLoading}
                            data={services}
                            pageSize={1000}
                            onAddClick={() => handleOpenModal()}
                            columns={[
                                {
                                    id: 'name',
                                    header: 'Dienstleistung',
                                    accessor: (s: any) => (
                                        <NameCell
                                            name={s.name}
                                            sub={s.service_code || undefined}
                                        />
                                    ),
                                },
                                {
                                    id: 'description',
                                    header: 'Beschreibung',
                                    accessor: (s: any) => <span className="text-sm text-slate-400 line-clamp-1">{s.description || '–'}</span>,
                                },
                                {
                                    id: 'status',
                                    header: 'Status',
                                    accessor: (s: any) => <StatusDot active={s.status === 'active' || !s.status} />,
                                    className: 'w-24',
                                },
                                actions(),
                            ]}
                        />
                    ))}

                    {/* EMAIL TEMPLATES */}
                    {masterTab === 'email_templates' && (isTemplatesLoading ? <TableSkeleton rows={5} columns={4} /> : (
                        <DataTable
                            isLoading={isTemplatesLoading}
                            data={emailTemplates}
                            pageSize={1000}
                            onAddClick={() => handleOpenModal()}
                            columns={[
                                {
                                    id: 'name',
                                    header: 'Vorlage',
                                    accessor: (tmpl: any) => (
                                        <NameCell
                                            name={tmpl.name}
                                            sub={tmpl.code || undefined}
                                        />
                                    ),
                                },
                                {
                                    id: 'subject',
                                    header: 'Betreff',
                                    accessor: (tmpl: any) => <span className="text-sm text-slate-500 line-clamp-1">{tmpl.subject || '–'}</span>,
                                },
                                {
                                    id: 'status',
                                    header: 'Status',
                                    accessor: (tmpl: any) => <StatusDot active={tmpl.status === 'active' || !tmpl.status} />,
                                    className: 'w-24',
                                },
                                actions(),
                            ]}
                        />
                    ))}

                    {/* SPECIALIZATIONS */}
                    {masterTab === 'specializations' && (isSpecializationsLoading ? <TableSkeleton rows={5} columns={4} /> : (
                        <DataTable
                            isLoading={isSpecializationsLoading}
                            data={specializations}
                            pageSize={1000}
                            onAddClick={() => handleOpenModal()}
                            columns={[
                                {
                                    id: 'name',
                                    header: 'Fachgebiet',
                                    accessor: (s: any) => (
                                        <NameCell
                                            name={s.name}
                                            sub={s.code || undefined}
                                        />
                                    ),
                                },
                                {
                                    id: 'description',
                                    header: 'Beschreibung',
                                    accessor: (s: any) => <span className="text-sm text-slate-400 line-clamp-1">{s.description || '–'}</span>,
                                },
                                {
                                    id: 'status',
                                    header: 'Status',
                                    accessor: (s: any) => <StatusDot active={s.status === 'active' || !s.status} />,
                                    className: 'w-24',
                                },
                                actions(),
                            ]}
                        />
                    ))}

                    {/* UNITS */}
                    {masterTab === 'units' && (isUnitsLoading ? <TableSkeleton rows={5} columns={5} /> : (
                        <DataTable
                            isLoading={isUnitsLoading}
                            data={units}
                            pageSize={1000}
                            onAddClick={() => handleOpenModal()}
                            columns={[
                                {
                                    id: 'name',
                                    header: 'Einheit',
                                    accessor: (u: any) => (
                                        <NameCell
                                            name={u.name}
                                            sub={u.code || undefined}
                                        />
                                    ),
                                },
                                {
                                    id: 'abbreviation',
                                    header: 'Kürzel',
                                    accessor: (u: any) => <span className="text-sm font-medium text-slate-600">{u.abbreviation || '–'}</span>,
                                    className: 'w-24',
                                },
                                {
                                    id: 'type',
                                    header: 'Typ',
                                    accessor: (u: any) => <span className="text-sm text-slate-500">{t(`settings.master_data.unit_types.${u.type || 'quantity'}`)}</span>,
                                    className: 'w-32',
                                },
                                {
                                    id: 'description',
                                    header: 'Beschreibung',
                                    accessor: (u: any) => <span className="text-sm text-slate-400 line-clamp-1">{u.description || '–'}</span>,
                                },
                                {
                                    id: 'status',
                                    header: 'Status',
                                    accessor: (u: any) => <StatusDot active={u.status === 'active' || !u.status} />,
                                    className: 'w-24',
                                },
                                actions(),
                            ]}
                        />
                    ))}

                    {/* CURRENCIES */}
                    {masterTab === 'currencies' && (isCurrenciesLoading ? <TableSkeleton rows={5} columns={4} /> : (
                        <DataTable
                            isLoading={isCurrenciesLoading}
                            data={currencies}
                            pageSize={1000}
                            onAddClick={() => handleOpenModal()}
                            columns={[
                                {
                                    id: 'name',
                                    header: 'Währung',
                                    accessor: (c: any) => (
                                        <NameCell
                                            name={c.name || c.code}
                                            sub={c.code !== (c.name || c.code) ? c.code : undefined}
                                        />
                                    ),
                                },
                                {
                                    id: 'symbol',
                                    header: 'Symbol',
                                    accessor: (c: any) => <span className="text-base text-slate-600 font-medium">{c.symbol || '–'}</span>,
                                    className: 'w-20',
                                    align: 'center',
                                },
                                {
                                    id: 'status',
                                    header: 'Status',
                                    accessor: (c: any) => <StatusDot active={c.status === 'active' || !c.status} />,
                                    className: 'w-24',
                                },
                                actions(),
                            ]}
                        />
                    ))}

                    {/* PROJECT STATUSES */}
                    {masterTab === 'project_statuses' && (isProjectStatusesLoading ? <TableSkeleton rows={5} columns={4} /> : (
                        <DataTable
                            isLoading={isProjectStatusesLoading}
                            data={projectStatuses}
                            pageSize={1000}
                            onAddClick={() => handleOpenModal()}
                            columns={[
                                {
                                    id: 'name',
                                    header: 'Status',
                                    accessor: (s: any) => (
                                        <NameCell
                                            name={s.label}
                                            sub={[s.code, s.name].filter(Boolean).join(' · ')}
                                        />
                                    ),
                                },
                                {
                                    id: 'preview',
                                    header: 'Vorschau',
                                    accessor: (s: any) => (
                                        <span className={clsx('px-2.5 py-0.5 rounded-sm text-xs font-medium border', s.style || 'bg-slate-50 text-slate-500 border-slate-200')}>
                                            {s.label}
                                        </span>
                                    ),
                                    align: 'center',
                                    className: 'w-32',
                                },
                                {
                                    id: 'active',
                                    header: 'Status',
                                    accessor: (s: any) => <StatusDot active={!!s.is_active} />,
                                    className: 'w-24',
                                },
                                actions(),
                            ]}
                        />
                    ))}

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
