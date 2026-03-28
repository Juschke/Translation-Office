import React from 'react';
import {
    FaTimes, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel,
    FaFileImage, FaFileArchive, FaDownload, FaInbox, FaCheckCircle
} from 'react-icons/fa';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { projectService } from '../../api/services';
import toast from 'react-hot-toast';

interface ProjectFilesModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (fileName: string) => {
    const lowerName = (fileName || '').toLowerCase();
    if (lowerName.endsWith('.pdf')) return <FaFilePdf className="text-red-500" />;
    if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FaFileWord className="text-blue-500" />;
    if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return <FaFileExcel className="text-emerald-500" />;
    if (['.jpg', '.png', '.jpeg', '.gif', '.svg', '.webp'].some(ext => lowerName.endsWith(ext))) return <FaFileImage className="text-purple-500" />;
    if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) return <FaFileArchive className="text-orange-500" />;
    return <FaFileAlt className="text-slate-400" />;
};

const ProjectFilesModal: React.FC<ProjectFilesModalProps> = ({ isOpen, onClose, project }) => {
    if (!isOpen || !project) return null;

    const files = project.files || [];
    const sourceFiles = files.filter((f: any) => f.type === 'source');
    const targetFiles = files.filter((f: any) => f.type === 'target');

    const handleDownload = async (file: any) => {
        const toastId = toast.loading('Download wird vorbereitet...');
        try {
            const response = await projectService.downloadFile(project.id, file.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.original_name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Download gestartet', { id: toastId });
        } catch (error) {
            toast.error('Download fehlgeschlagen', { id: toastId });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <FaFileAlt size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                                Projekt-Dateien
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {project.project_name || project.project_number}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm transition-colors"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                            <FaFileAlt size={48} className="opacity-10" />
                            <p className="text-sm font-medium">Keine Dateien für dieses Projekt gefunden.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Source Files Section */}
                            {sourceFiles.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <FaInbox className="text-brand-primary text-xs" />
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Quell-Dokumente (Eingang)</h4>
                                        <div className="h-[1px] flex-1 bg-slate-100" />
                                    </div>
                                    <div className="grid gap-2">
                                        {sourceFiles.map((file: any) => (
                                            <div key={file.id} className="group flex items-center justify-between p-3 rounded-sm border border-slate-100 hover:border-brand-primary/20 hover:bg-brand-primary/[0.02] transition-all">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="text-xl shrink-0">{getFileIcon(file.original_name)}</div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-bold text-slate-700 truncate leading-snug group-hover:text-brand-primary transition-colors">
                                                            {file.original_name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            VER {file.version} • {formatFileSize(file.file_size || 0)} • {format(new Date(file.created_at), 'dd.MM.yy', { locale: de })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDownload(file)}
                                                    className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-sm transition-all shadow-sm bg-white"
                                                    title="Download"
                                                >
                                                    <FaDownload size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Target Files Section */}
                            {targetFiles.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <FaCheckCircle className="text-emerald-500 text-xs" />
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ziel-Dokumente (Ausspielung)</h4>
                                        <div className="h-[1px] flex-1 bg-slate-100" />
                                    </div>
                                    <div className="grid gap-2">
                                        {targetFiles.map((file: any) => (
                                            <div key={file.id} className="group flex items-center justify-between p-3 rounded-sm border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="text-xl shrink-0">{getFileIcon(file.original_name)}</div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-bold text-slate-700 truncate leading-snug group-hover:text-emerald-600 transition-colors">
                                                            {file.original_name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            VER {file.version} • {formatFileSize(file.file_size || 0)} • {format(new Date(file.created_at), 'dd.MM.yy', { locale: de })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDownload(file)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-sm transition-all shadow-sm bg-white"
                                                    title="Download"
                                                >
                                                    <FaDownload size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectFilesModal;
