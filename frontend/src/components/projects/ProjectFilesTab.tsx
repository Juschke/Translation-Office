import { FaCloudUploadAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive, FaFileAlt, FaEye, FaDownload, FaTrashAlt } from 'react-icons/fa';
import clsx from 'clsx';

interface ProjectFilesTabProps {
    projectData: any;
    fileFilterTab: 'all' | 'source' | 'target';
    setFileFilterTab: (tab: 'all' | 'source' | 'target') => void;
    setIsUploadModalOpen: (open: boolean) => void;
    handlePreviewFile: (file: any) => Promise<void>;
    handleDownloadFile: (file: any) => Promise<void>;
    setDeleteFileConfirm: (confirm: { isOpen: boolean; fileId: string | null; fileName: string }) => void;
    toggleFileType: (file: any) => Promise<void>;
    formatFileSize: (bytes: any) => string;
}

const ProjectFilesTab = ({
    projectData,
    fileFilterTab,
    setFileFilterTab,
    setIsUploadModalOpen,
    handlePreviewFile,
    handleDownloadFile,
    setDeleteFileConfirm,
    toggleFileType,
    formatFileSize,
}: ProjectFilesTabProps) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn px-6 mb-10">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-white gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Projekt-Dateien</h3>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{projectData.files.length}</span>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-sm w-fit">
                        <button
                            onClick={() => setFileFilterTab('all')}
                            className={clsx("px-3 py-1 text-[10px] font-bold rounded-md transition", fileFilterTab === 'all' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            Alle
                        </button>
                        <button
                            onClick={() => setFileFilterTab('source')}
                            className={clsx("px-3 py-1 text-[10px] font-bold rounded-md transition", fileFilterTab === 'source' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            Quelle
                        </button>
                        <button
                            onClick={() => setFileFilterTab('target')}
                            className={clsx("px-3 py-1 text-[10px] font-bold rounded-md transition", fileFilterTab === 'target' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            Ziel
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-4 py-2 bg-brand-600 text-white rounded text-[10px] font-black uppercase hover:bg-brand-700 transition shadow-sm flex items-center gap-2"
                >
                    <FaCloudUploadAlt className="text-sm" /> Datei hochladen
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 text-slate-400 text-[9px] font-black uppercase tracking-wider border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Dateiname</th>
                            <th className="px-6 py-4">Typ</th>
                            <th className="px-6 py-4">Vers.</th>
                            <th className="px-6 py-4">Größe</th>
                            <th className="px-6 py-4">Hochgeladen von</th>
                            <th className="px-6 py-4">Datum / Zeit</th>
                            <th className="px-6 py-4 text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                        {projectData.files
                            .filter((f: any) => fileFilterTab === 'all' || f.type === fileFilterTab)
                            .length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                    Keine Dateien für diesen Filter vorhanden.
                                </td>
                            </tr>
                        ) : (
                            projectData.files
                                .filter((f: any) => fileFilterTab === 'all' || f.type === fileFilterTab)
                                .map((file: any) => {
                                    const fileName = file.name || file.fileName || file.file_name || file.original_name || 'Unbenannte Datei';

                                    let displaySize = file.size || file.file_size || '0 B';
                                    if (typeof displaySize === 'number' || (typeof displaySize === 'string' && !isNaN(Number(displaySize)))) {
                                        displaySize = formatFileSize(Number(displaySize));
                                    }

                                    const rawDate = file.upload_date || file.created_at;
                                    const dateObj = rawDate ? new Date(rawDate) : null;
                                    const isValidDate = dateObj && !isNaN(dateObj.getTime());
                                    const displayDate = isValidDate ? dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                                    const displayTime = isValidDate ? dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

                                    return (
                                        <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                                            <td
                                                className="px-6 py-4 font-bold text-slate-700 flex items-center gap-3 cursor-pointer hover:text-brand-600 transition"
                                                onClick={() => handlePreviewFile(file)}
                                            >
                                                {fileName.endsWith('.pdf') ? <FaFilePdf className="text-red-500 text-lg" /> :
                                                    fileName.endsWith('.doc') || fileName.endsWith('.docx') ? <FaFileWord className="text-blue-500 text-lg" /> :
                                                        fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ? <FaFileExcel className="text-emerald-500 text-lg" /> :
                                                            fileName.endsWith('.jpg') || fileName.endsWith('.png') ? <FaFileImage className="text-purple-500 text-lg" /> :
                                                                fileName.endsWith('.zip') || fileName.endsWith('.rar') ? <FaFileArchive className="text-orange-500 text-lg" /> :
                                                                    <FaFileAlt className="text-slate-400 text-lg" />}
                                                <div className="flex flex-col">
                                                    <span>{fileName}</span>
                                                    <span className="text-[8px] text-slate-400 font-normal uppercase tracking-tighter">{file.original_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFileType(file);
                                                    }}
                                                    title="Klicken zum Wechseln des Typs"
                                                    className={clsx(
                                                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border hover:opacity-80 transition cursor-pointer",
                                                        file.type === 'source' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                            file.type === 'target' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                                "bg-slate-50 text-slate-600 border-slate-100"
                                                    )}>
                                                    {file.type === 'source' ? 'Quelle' : file.type === 'target' ? 'Ziel' : file.type}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">V{file.version || '1.0'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{displaySize}</td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-[9px] font-bold text-brand-600">
                                                        {(file.uploaded_by?.[0] || file.uploader?.name?.[0] || '?')}
                                                    </div>
                                                    <span className="font-medium">{file.uploaded_by || file.uploader?.name || 'System'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{displayDate}</span>
                                                    <span className="text-[10px] text-slate-400">{displayTime}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 transition-opacity">
                                                    <button
                                                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition"
                                                        title="Ansehen"
                                                        onClick={() => handlePreviewFile(file)}
                                                    >
                                                        <FaEye className="text-[12px]" />
                                                    </button>
                                                    <button
                                                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition"
                                                        title="Herunterladen"
                                                        onClick={() => handleDownloadFile(file)}
                                                    >
                                                        <FaDownload className="text-[12px]" />
                                                    </button>
                                                    <button
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                        title="Löschen"
                                                        onClick={() => setDeleteFileConfirm({ isOpen: true, fileId: file.id, fileName: fileName })}
                                                    >
                                                        <FaTrashAlt className="text-[12px]" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectFilesTab;
