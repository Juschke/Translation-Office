import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FaPlus, FaTrash, FaGlobe, FaEdit, FaEnvelopeOpenText, FaLanguage, FaFileAlt, FaTag, FaRuler, FaMoneyBillWave
} from 'react-icons/fa';
import clsx from 'clsx';
import { settingsService } from '../../api/services';
import DataTable from '../common/DataTable';
import TableSkeleton from '../common/TableSkeleton';
import NewMasterDataModal from '../modals/NewMasterDataModal';
import ConfirmModal from '../modals/ConfirmModal';
import { getFlagUrl } from '../../utils/flags';

const MasterDataTab = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [masterTab, setMasterTab] = useState<'languages' | 'doc_types' | 'services' | 'email_templates' | 'specializations' | 'units' | 'currencies'>('languages');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: any | null }>({ isOpen: false, item: null });

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
        }
        setDeleteConfirm({ isOpen: false, item: null });
    };

    return (
        <div className="flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-6 overflow-x-auto">
                    {(['languages', 'doc_types', 'services', 'email_templates', 'specializations', 'units', 'currencies'] as const).map(tab_key => (
                        <button
                            key={tab_key}
                            onClick={() => setMasterTab(tab_key)}
                            className={clsx('py-3 text-sm font-medium border-b-2 transition whitespace-nowrap', masterTab === tab_key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600')}
                        >
                            {t(`settings.tabs.${tab_key}`)}
                        </button>
                    ))}
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-5 py-1.5 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition rounded shrink-0 ml-4 mb-px">
                    <FaPlus className="text-xs" /> {t('settings.master_data.add_new')}
                </button>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-hidden flex flex-col flex-1 mt-4">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                    <h3 className="text-sm font-medium text-slate-800 flex items-center gap-3">
                        {masterTab === 'languages' ? <FaLanguage /> : masterTab === 'doc_types' ? <FaFileAlt /> : masterTab === 'services' ? <FaGlobe /> : masterTab === 'email_templates' ? <FaEnvelopeOpenText /> : masterTab === 'specializations' ? <FaTag /> : masterTab === 'units' ? <FaRuler /> : <FaMoneyBillWave />}
                        {t(`settings.master_data.${masterTab === 'languages' ? 'language_config' : masterTab === 'doc_types' ? 'doc_categories' : masterTab === 'services' ? 'service_catalog' : masterTab === 'email_templates' ? 'email_templates' : masterTab === 'specializations' ? 'specializations' : masterTab === 'units' ? 'units' : 'currencies'}`)}
                    </h3>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                    {masterTab === 'languages' && (isLanguagesLoading ? <TableSkeleton rows={5} columns={5} /> : <DataTable isLoading={isLanguagesLoading} data={languages} columns={[
                        { id: 'code', header: t('settings.master_data.code_iso'), accessor: (l: any) => <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 border border-slate-100 rounded">{l.iso_code}</span>, className: 'w-32' },
                        { id: 'name', header: t('settings.master_data.language_flag'), accessor: (l: any) => <div className="flex items-center gap-3"><div className="w-8 h-6 overflow-hidden shadow-sm border border-slate-200 bg-slate-50 rounded-sm">{l.flag_icon && <img src={getFlagUrl(l.flag_icon)} className="w-full h-full object-cover" />}</div><span className="font-medium text-slate-800 text-sm">{l.name_internal}</span></div> },
                        { id: 'native', header: t('settings.master_data.native'), accessor: 'name_native' },
                        { id: 'status', header: t('settings.master_data.status'), accessor: (l: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', l.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{l.status}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (l: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(l)} className="p-2 text-slate-400 hover:text-slate-700 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(l)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                    {masterTab === 'doc_types' && (isDocTypesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isDocTypesLoading} data={docTypes} columns={[
                        { id: 'category', header: t('settings.master_data.category'), accessor: (d: any) => <span className="text-xs font-medium text-slate-400">{d.category || '-'}</span>, className: 'w-48' },
                        { id: 'name', header: t('fields.name'), accessor: (d: any) => <span className="font-medium text-slate-800 text-sm">{d.name}</span> },
                        { id: 'status', header: t('settings.master_data.status'), accessor: (d: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', d.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{d.status}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (d: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(d)} className="p-2 text-slate-400 hover:text-slate-700 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(d)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                    {masterTab === 'services' && (isServicesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isServicesLoading} data={services} columns={[
                        { id: 'name', header: t('settings.master_data.service_name'), accessor: (s: any) => <span className="font-medium text-slate-800 text-sm">{s.name}</span> },
                        { id: 'description', header: t('fields.description'), accessor: (s: any) => <span className="text-xs text-slate-400">{s.description || '-'}</span> },
                        { id: 'status', header: t('settings.master_data.status'), accessor: (s: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{s.status}</span>, align: 'center' },
                        { id: 'actions', header: '', accessor: (s: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-slate-700 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(s)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                    {masterTab === 'email_templates' && (isTemplatesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isTemplatesLoading} data={emailTemplates} columns={[
                        { id: 'name', header: t('settings.master_data.template_name'), accessor: (t: any) => <span className="font-medium text-slate-800 text-sm">{t.name}</span> },
                        { id: 'subject', header: t('settings.master_data.subject'), accessor: (t: any) => <span className="text-xs text-slate-500">{t.subject}</span> },
                        { id: 'actions', header: '', accessor: (t: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(t)} className="p-2 text-slate-400 hover:text-slate-700 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(t)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                    {masterTab === 'specializations' && (isSpecializationsLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isSpecializationsLoading} data={specializations} columns={[
                        { id: 'name', header: t('fields.name'), accessor: (s: any) => <span className="font-medium text-slate-800 text-sm">{s.name}</span> },
                        { id: 'description', header: t('fields.description'), accessor: (s: any) => <span className="text-xs text-slate-400">{s.description || '-'}</span> },
                        { id: 'actions', header: '', accessor: (s: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-slate-700 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(s)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                    {masterTab === 'units' && (isUnitsLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isUnitsLoading} data={units} columns={[
                        { id: 'name', header: t('fields.name'), accessor: (u: any) => <span className="font-medium text-slate-800 text-sm">{u.name}</span> },
                        { id: 'code', header: t('settings.master_data.unit'), accessor: (u: any) => <span className="text-xs font-medium text-slate-500">{u.code}</span> },
                        { id: 'actions', header: '', accessor: (u: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(u)} className="p-2 text-slate-400 hover:text-slate-700 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(u)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                    {masterTab === 'currencies' && (isCurrenciesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isCurrenciesLoading} data={currencies} columns={[
                        { id: 'code', header: t('settings.master_data.currency_code'), accessor: (c: any) => <span className="font-medium text-slate-800 text-sm">{c.code}</span> },
                        { id: 'symbol', header: t('settings.master_data.symbol'), accessor: (c: any) => <span className="text-xs text-slate-500">{c.symbol}</span> },
                        { id: 'actions', header: '', accessor: (c: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(c)} className="p-2 text-slate-400 hover:text-slate-700 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(c)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
                    ]} pageSize={10} />)}
                </div>
            </div>

            <NewMasterDataModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                type={masterTab}
                editingItem={editingItem}
                onSubmit={(data: any) => {
                    const id = editingItem?.id;
                    if (masterTab === 'languages') id ? updateLanguageMutation.mutate({ id, data }) : createLanguageMutation.mutate(data);
                    else if (masterTab === 'doc_types') id ? updateDocTypeMutation.mutate({ id, data }) : createDocTypeMutation.mutate(data);
                    else if (masterTab === 'services') id ? updateServiceMutation.mutate({ id, data }) : createServiceMutation.mutate(data);
                    else if (masterTab === 'email_templates') id ? updateTemplateMutation.mutate({ id, data }) : createTemplateMutation.mutate(data);
                    else if (masterTab === 'specializations') id ? updateSpecializationMutation.mutate({ id, data }) : createSpecializationMutation.mutate(data);
                    else if (masterTab === 'units') id ? updateUnitMutation.mutate({ id, data }) : createUnitMutation.mutate(data);
                    else if (masterTab === 'currencies') id ? updateCurrencyMutation.mutate({ id, data }) : createCurrencyMutation.mutate(data);
                }}
            />

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
                onConfirm={confirmDelete}
                title={t('confirm.deleteTitle')}
                message={t('confirm.deleteMessage')}
            />
        </div>
    );
};

export default MasterDataTab;
