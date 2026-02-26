import React, { useState } from 'react';
import { FaSearch, FaTimes, FaFolderOpen, FaHashtag } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../../api/services';
import { Button } from '../ui/button';
import TableSkeleton from '../common/TableSkeleton';

interface ProjectSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (project: any) => void;
}

const ProjectSelectionModal: React.FC<ProjectSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [search, setSearch] = useState('');

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects', 'minimal'],
        queryFn: projectService.getAll,
        enabled: isOpen
    });

    const filteredProjects = projects.filter((p: any) =>
    (p.project_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.customer?.company_name?.toLowerCase().includes(search.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-sm shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-fadeInUp">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Projekt auswählen</h2>
                        <p className="text-xs text-slate-500 font-medium">Wählen Sie ein Projekt für den Dolmetschereinsatz aus.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><FaTimes /></button>
                </div>

                {/* Search */}
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            placeholder="Nach Projektnummer, Name oder Kunde suchen..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <TableSkeleton rows={5} columns={1} />
                    ) : filteredProjects.length === 0 ? (
                        <div className="py-20 text-center">
                            <FaFolderOpen className="mx-auto text-slate-200 text-4xl mb-4" />
                            <p className="text-slate-400 text-sm font-medium">Keine Projekte gefunden</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-1">
                            {filteredProjects.map((p: any) => (
                                <button
                                    key={p.id}
                                    onClick={() => onSelect(p)}
                                    className="flex items-center justify-between p-3 rounded-sm hover:bg-slate-50 transition-colors text-left group border border-transparent hover:border-slate-100"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                            <FaHashtag />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-slate-800 truncate">{p.project_number || `P-${p.id}`}</h4>
                                            <p className="text-xs text-slate-500 truncate">{p.project_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-bold text-slate-700">{p.customer?.company_name || `${p.customer?.first_name} ${p.customer?.last_name}`}</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{p.status}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-white">
                    <Button variant="secondary" onClick={onClose} size="sm">Abbrechen</Button>
                </div>
            </div>
        </div>
    );
};

export default ProjectSelectionModal;
