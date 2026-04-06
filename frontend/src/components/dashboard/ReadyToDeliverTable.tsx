import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

interface ReadyProject {
    id: string;
    project_number?: string;
    name: string;
    customer?: {
        name: string;
    };
    deadline?: string;
    updated_at: string;
}

interface ReadyToDeliverTableProps {
    projects: ReadyProject[];
}

const ReadyToDeliverTable: React.FC<ReadyToDeliverTableProps> = ({ projects }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                <h2 className="text-sm font-medium text-slate-700">
                    Versandbereit
                </h2>
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {projects.length}
                </span>
            </div>
            <div className="overflow-auto flex-1 custom-scrollbar flex flex-col">
                {projects.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-medium sticky top-0">
                            <tr>
                                <th className="px-5 py-3 border-b border-slate-100">Projekt</th>
                                <th className="px-5 py-3 border-b border-slate-100 text-right">Fertigstellung</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {projects.map((project) => (
                                <tr
                                    key={project.id}
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className="hover:bg-slate-50 transition cursor-pointer group"
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition truncate max-w-[180px]">
                                                {project.name}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium truncate">
                                                {project.customer?.name || 'Unbekannt'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-medium text-slate-600">
                                                {new Date(project.updated_at).toLocaleDateString('de-DE')}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {project.deadline ? `${new Date(project.deadline).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}` : '-'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm mb-2">
                            <FaCheckCircle className="text-sm text-slate-200" />
                        </div>
                        <span className="text-xs font-bold text-slate-600">Nichts zu versenden</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Momentan sind keine fertigen Projekte in der Warteschlange.</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ReadyToDeliverTable;
