import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
 FaPlus, FaTrash, FaGlobe, FaEdit, FaEnvelopeOpenText, FaLanguage, FaFileAlt
} from 'react-icons/fa';
import clsx from 'clsx';
import { settingsService } from '../../api/services';
import DataTable from '../common/DataTable';
import TableSkeleton from '../common/TableSkeleton';
import NewMasterDataModal from '../modals/NewMasterDataModal';
import ConfirmModal from '../modals/ConfirmModal';
import { getFlagUrl } from '../../utils/flags';

const MasterDataTab = () => {
 const queryClient = useQueryClient();
 const [masterTab, setMasterTab] = useState<'languages' | 'doc_types' | 'services' | 'email_templates'>('languages');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingItem, setEditingItem] = useState<any>(null);
 const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: any | null }>({ isOpen: false, item: null });

 const { data: languages = [], isLoading: isLanguagesLoading } = useQuery<any[]>({
 queryKey: ['languages'],
 queryFn: settingsService.getLanguages
 });
 const { data: docTypes = [], isLoading: isDocTypesLoading } = useQuery<any[]>({
 queryKey: ['docTypes'],
 queryFn: settingsService.getDocTypes
 });
 const { data: services = [], isLoading: isServicesLoading } = useQuery<any[]>({
 queryKey: ['services'],
 queryFn: settingsService.getServices
 });
 const { data: emailTemplates = [], isLoading: isTemplatesLoading } = useQuery<any[]>({
 queryKey: ['emailTemplates'],
 queryFn: settingsService.getEmailTemplates
 });

 const createLanguageMutation = useMutation({ mutationFn: settingsService.createLanguage, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['languages'] }); setIsModalOpen(false); } });
 const updateLanguageMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateLanguage(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['languages'] }); setIsModalOpen(false); } });
 const deleteLanguageMutation = useMutation({ mutationFn: settingsService.deleteLanguage, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['languages'] }) });

 const createDocTypeMutation = useMutation({ mutationFn: settingsService.createDocType, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['docTypes'] }); setIsModalOpen(false); } });
 const updateDocTypeMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateDocType(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['docTypes'] }); setIsModalOpen(false); } });
 const deleteDocTypeMutation = useMutation({ mutationFn: settingsService.deleteDocType, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['docTypes'] }) });

 const createServiceMutation = useMutation({ mutationFn: settingsService.createService, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); setIsModalOpen(false); } });
 const updateServiceMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateService(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); setIsModalOpen(false); } });
 const deleteServiceMutation = useMutation({ mutationFn: settingsService.deleteService, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }) });

 const createTemplateMutation = useMutation({ mutationFn: settingsService.createEmailTemplate, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['emailTemplates'] }); setIsModalOpen(false); } });
 const updateTemplateMutation = useMutation({ mutationFn: ({ id, data }: any) => settingsService.updateEmailTemplate(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['emailTemplates'] }); setIsModalOpen(false); } });
 const deleteTemplateMutation = useMutation({ mutationFn: settingsService.deleteEmailTemplate, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emailTemplates'] }) });

 const handleOpenModal = (item?: any) => {
 setEditingItem(item || null);
 setIsModalOpen(true);
 };

 const handleModalSubmit = (data: any) => {
 if (editingItem) {
 const id = editingItem.id;
 if (masterTab === 'languages') updateLanguageMutation.mutate({ id, data });
 else if (masterTab === 'doc_types') updateDocTypeMutation.mutate({ id, data });
 else if (masterTab === 'services') updateServiceMutation.mutate({ id, data });
 else if (masterTab === 'email_templates') updateTemplateMutation.mutate({ id, data });
 } else {
 if (masterTab === 'languages') createLanguageMutation.mutate(data);
 else if (masterTab === 'doc_types') createDocTypeMutation.mutate(data);
 else if (masterTab === 'services') createServiceMutation.mutate(data);
 else if (masterTab === 'email_templates') createTemplateMutation.mutate(data);
 }
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
 }
 setDeleteConfirm({ isOpen: false, item: null });
 };

 return (
  <div className="flex flex-col animate-fadeIn">
  <div className="flex items-center justify-between border-b border-slate-200">
  <div className="flex items-center gap-6 overflow-x-auto">
  {(['languages', 'doc_types', 'services', 'email_templates'] as const).map(t => (
  <button
  key={t}
  onClick={() => setMasterTab(t)}
  className={clsx('py-3 text-sm font-medium border-b-2 transition whitespace-nowrap', masterTab === t ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600')}
  >
  {t === 'languages' ? 'Sprachen' : t === 'doc_types' ? 'Dokumentarten' : t === 'services' ? 'Dienstleistungen' : 'Email Vorlagen'}
  </button>
  ))}
  </div>
  <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-5 py-1.5 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition rounded shrink-0 ml-4 mb-px">
  <FaPlus className="text-xs" /> Neu hinzufügen
  </button>
  </div>
  <div className="bg-white shadow-sm border border-slate-200 rounded-sm overflow-hidden flex flex-col flex-1 mt-4">
 <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
 <h3 className="text-sm font-medium text-slate-800 flex items-center gap-3">
 {masterTab === 'languages' ? <FaLanguage /> : masterTab === 'doc_types' ? <FaFileAlt /> : masterTab === 'services' ? <FaGlobe /> : <FaEnvelopeOpenText />}
 {masterTab === 'languages' ? 'Sprachkonfiguration' : masterTab === 'doc_types' ? 'Dokumenten-Kategorien' : masterTab === 'services' ? 'Leistungskatalog' : 'Email Textvorlagen'}
 </h3>
 </div>
 <div className="flex-1 overflow-hidden flex flex-col">
 {masterTab === 'languages' && (isLanguagesLoading ? <TableSkeleton rows={5} columns={5} /> : <DataTable isLoading={isLanguagesLoading} data={languages} columns={[
 { id: 'code', header: 'Code (ISO)', accessor: (l: any) => <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 border border-slate-100 rounded">{l.iso_code}</span>, className: 'w-32' },
 { id: 'name', header: 'Sprache / Flagge', accessor: (l: any) => <div className="flex items-center gap-3"><div className="w-8 h-6 overflow-hidden shadow-sm border border-slate-200 bg-slate-50 rounded-sm">{l.flag_icon && <img src={getFlagUrl(l.flag_icon)} className="w-full h-full object-cover" />}</div><span className="font-medium text-slate-800 text-sm">{l.name_internal}</span></div> },
 { id: 'native', header: 'Native', accessor: 'name_native' },
 { id: 'status', header: 'Status', accessor: (l: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', l.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{l.status}</span>, align: 'center' },
 { id: 'actions', header: '', accessor: (l: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(l)} className="p-2 text-slate-400 hover:text-slate-700 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(l)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
 ]} pageSize={10} />)}
 {masterTab === 'doc_types' && (isDocTypesLoading ? <TableSkeleton rows={5} columns={4} /> : <DataTable isLoading={isDocTypesLoading} data={docTypes} columns={[
 { id: 'category', header: 'Kategorie', accessor: (d: any) => <span className="text-xs font-medium text-slate-400">{d.category || '-'}</span>, className: 'w-48' },
 { id: 'name', header: 'Dokumentart', accessor: (d: any) => <span className="font-medium text-slate-800 text-sm">{d.name}</span> },
 { id: 'status', header: 'Status', accessor: () => <span className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]">Aktiv</span>, align: 'center' },
 { id: 'actions', header: '', accessor: (d: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(d)} className="p-2 text-slate-400 hover:text-slate-700 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(d)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
 ]} pageSize={10} />)}
 {masterTab === 'services' && (isServicesLoading ? <TableSkeleton rows={5} columns={5} /> : <DataTable isLoading={isServicesLoading} data={services} columns={[
 { id: 'name', header: 'Dienstleistung', accessor: (s: any) => <span className="font-medium text-slate-800 text-sm">{s.name}</span> },
 { id: 'unit', header: 'Einheit', accessor: (s: any) => <span className="text-xs font-medium text-slate-400">{s.unit}</span> },
 { id: 'price', header: 'Basispreis', accessor: (s: any) => <span className="font-medium text-slate-900">{s.base_price} €</span> },
 { id: 'status', header: 'Status', accessor: (s: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{s.status}</span>, align: 'center' },
 { id: 'actions', header: '', accessor: (s: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-slate-700 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(s)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
 ]} pageSize={10} />)}
 {masterTab === 'email_templates' && (isTemplatesLoading ? <TableSkeleton rows={5} columns={5} /> : <DataTable isLoading={isTemplatesLoading} data={emailTemplates} columns={[
 { id: 'name', header: 'Name', accessor: (e: any) => <span className="font-medium text-slate-800 text-sm">{e.name}</span> },
 { id: 'subject', header: 'Betreff', accessor: (e: any) => <span className="text-xs text-slate-500">{e.subject}</span> },
 { id: 'type', header: 'Typ', accessor: 'type' },
 { id: 'status', header: 'Status', accessor: (e: any) => <span className={clsx('px-2 py-0.5 text-xs font-medium border tracking-tight rounded-[4px]', e.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200')}>{e.status}</span>, align: 'center' },
 { id: 'actions', header: '', accessor: (e: any) => <div className="flex justify-end gap-1"><button onClick={() => handleOpenModal(e)} className="p-2 text-slate-400 hover:text-slate-700 rounded"><FaEdit /></button><button onClick={() => handleDeleteMasterData(e)} className="p-2 text-slate-300 hover:text-red-500 rounded"><FaTrash /></button></div>, align: 'right' }
 ]} pageSize={10} />)}
 </div>
 </div>

 <NewMasterDataModal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 onSubmit={handleModalSubmit}
 type={masterTab}
 initialData={editingItem}
 />

 <ConfirmModal
 isOpen={deleteConfirm.isOpen}
 onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
 onConfirm={confirmDelete}
 title="Datensatz löschen?"
 message={`Möchten Sie "${deleteConfirm.item?.name || deleteConfirm.item?.name_internal || deleteConfirm.item?.subject || 'Eintrag'}" wirklich löschen?`}
 confirmText="Löschen"
 cancelText="Abbrechen"
 type="danger"
 isLoading={deleteLanguageMutation.isPending || deleteDocTypeMutation.isPending || deleteServiceMutation.isPending || deleteTemplateMutation.isPending}
 />
 </div>
 );
};

export default MasterDataTab;
