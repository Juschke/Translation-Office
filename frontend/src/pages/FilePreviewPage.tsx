import { useEffect, useState, useRef } from 'react';
import { Button } from '../components/ui/button';
import {
    FaDownload, FaPrint, FaRedo, FaEnvelope, FaChevronDown, FaEdit, FaTrashAlt,
    FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive, FaFileAlt,
    FaSearchPlus, FaSearchMinus, FaChevronRight
} from 'react-icons/fa';
import { projectService } from '../api/services';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/modals/ConfirmModal';
import RenameFileModal from '../components/modals/RenameFileModal';
import clsx from 'clsx';

const getFileIcon = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.endsWith('.pdf')) return <FaFilePdf className="text-red-500 text-xl" />;
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) return <FaFileWord className="text-blue-500 text-xl" />;
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return <FaFileExcel className="text-emerald-500 text-xl" />;
    if (['.jpg', '.png', '.jpeg', '.gif', '.svg', '.webp'].some(e => lower.endsWith(e))) return <FaFileImage className="text-purple-500 text-xl" />;
    if (['.zip', '.rar', '.7z'].some(e => lower.endsWith(e))) return <FaFileArchive className="text-orange-500 text-xl" />;
    return <FaFileAlt className="text-slate-400 text-xl" />;
};

const FilePreviewPage = () => {
    const [file, setFile] = useState<any>(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [isMoveSubmenuOpen, setIsMoveSubmenuOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const data = localStorage.getItem('previewFileData');
        if (data) {
            setFile(JSON.parse(data));
        }

        const handleClickOutside = (e: MouseEvent) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
                setIsActionsOpen(false);
                setIsMoveSubmenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!file) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-400">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-400 mx-auto mb-2" />
                    <p className="text-[10px] font-bold  tracking-widest">Warte auf Daten...</p>
                </div>
            </div>
        );
    }

    const name = file.name || 'Datei';
    const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(name);
    const isPDF = /\.pdf$/i.test(name);
    const canPrint = isPDF || isImage;

    const handlePrint = () => {
        if (isPDF) {
            const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
            if (iframe?.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
        } else {
            window.print();
        }
    };

    const handleDownload = () => {
        const link = document.body.appendChild(document.createElement('a'));
        link.href = file.url;
        link.setAttribute('download', name);
        link.click();
        link.remove();
    };

    const handleRename = async () => {
        setIsRenameModalOpen(true);
        setIsActionsOpen(false);
    }

    const handleMove = async (newType: string) => {
        try {
            await projectService.updateFile(file.projectId, file.id, { type: newType });
            setFile({ ...file, type: newType });
            toast.success(`Datei nach "${newType}" verschoben`);
        } catch (e) {
            toast.error('Fehler beim Verschieben');
        }
        setIsActionsOpen(false);
        setIsMoveSubmenuOpen(false);
    }

    const handleEmail = () => {
        const sid = 'email_prefill_' + Date.now();
        localStorage.setItem(sid, JSON.stringify({
            projectId: file.projectId,
            subject: `Datei: ${name}`,
            attachments: [file.id]
        }));
        window.open(`/email/send?sid=${sid}`, 'EmailSend', 'width=1200,height=900');
    }

    const handleDelete = async () => {
        setIsDeleteConfirmOpen(true);
    }

    const rotate = () => setRotation((prev) => (prev + 90) % 360);
    const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

    return (
        <div className="h-screen w-full flex flex-col bg-white overflow-hidden text-slate-800">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded border border-slate-100 bg-slate-50 shrink-0">
                        {getFileIcon(name)}
                    </div>
                    <div className="min-w-0">
                        <h2 className="max-w-md truncate text-xs font-bold" title={name}>{name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold  tracking-widest text-slate-400">Dateivorschau</span>
                            <span className="text-slate-200">|</span>
                            <span className="text-[9px] font-bold  tracking-widest text-brand-primary">{file.type || 'Eingang'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canPrint && (
                        <Button onClick={handlePrint} variant="secondary" size="sm" className="h-8 px-3 text-[10px] font-bold ">
                            <FaPrint className="mr-2" /> Drucken
                        </Button>
                    )}

                    <Button onClick={handleDownload} variant="secondary" size="sm" className="h-8 px-3 text-[10px] font-bold ">
                        <FaDownload className="mr-2" /> Herunterladen
                    </Button>

                    <Button onClick={handleEmail} variant="default" size="sm" className="h-8 px-4 text-[10px] font-bold ">
                        <FaEnvelope className="mr-2" /> Per E-Mail senden
                    </Button>

                    <div className="relative" ref={actionsRef}>
                        <Button
                            onClick={() => setIsActionsOpen(!isActionsOpen)}
                            variant="secondary"
                            size="sm"
                            className="h-8 px-3 text-[10px] font-bold  flex items-center gap-2"
                        >
                            Mehr Aktionen <FaChevronDown className={isActionsOpen ? "rotate-180" : ""} />
                        </Button>

                        {isActionsOpen && (
                            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded shadow-lg py-1 z-50">
                                <div className="relative group">
                                    <button
                                        onMouseEnter={() => setIsMoveSubmenuOpen(true)}
                                        className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">Verschieben nach</div>
                                        <FaChevronRight size={8} />
                                    </button>

                                    {isMoveSubmenuOpen && (
                                        <div
                                            className="absolute left-full top-20  -translate-y-1/2 w-40 bg-white border border-slate-200 rounded shadow-lg py-1"
                                            onMouseLeave={() => setIsMoveSubmenuOpen(false)}
                                        >
                                            {['source', 'target', 'reference', 'delivery'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => handleMove(t)}
                                                    className={clsx(
                                                        "w-full text-left px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition capitalize",
                                                        file.type === t && "text-brand-primary"
                                                    )}
                                                >
                                                    {t === 'source' ? 'Eingang' : t === 'target' ? 'Ziel' : t === 'reference' ? 'Referenz' : 'Lieferung'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleRename}
                                    onMouseEnter={() => setIsMoveSubmenuOpen(false)}
                                    className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                >
                                    <FaEdit className="text-slate-400" /> Umbenennen
                                </button>

                                <div className="h-px bg-slate-100 my-0" />

                                <button
                                    onClick={handleDelete}
                                    onMouseEnter={() => setIsMoveSubmenuOpen(false)}
                                    className="w-full text-left px-4 py-2 text-[11px] font-bold text-red-600 hover:bg-slate-50 flex items-center gap-3"
                                >
                                    <FaTrashAlt /> Datei Löschen
                                </button>
                            </div>
                        )}
                    </div>



                    <Button onClick={() => window.close()} variant="destructive" size="sm" className="h-8 px-4 text-[10px] font-bold ">
                        Schließen X
                    </Button>
                </div>
            </div>

            {/* Content Container */}
            <div className={clsx("flex-1 relative overflow-auto bg-slate-100 flex flex-col items-center justify-center", !isPDF && "p-4 sm:p-10")}>

                {/* TOOLBAR OVERLAY */}
                {isImage && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-white border border-slate-200 p-1 shadow-md">
                        {isImage && (
                            <>
                                <Button onClick={zoomIn} variant="ghost" size="icon" className="h-7 w-7">
                                    <FaSearchPlus size={12} />
                                </Button>
                                <Button onClick={zoomOut} variant="ghost" size="icon" className="h-7 w-7">
                                    <FaSearchMinus size={12} />
                                </Button>
                                <div className="w-px h-4 bg-slate-200 mx-1" />
                                <Button onClick={rotate} variant="ghost" size="icon" className="h-7 w-7">
                                    <FaRedo size={12} />
                                </Button>
                            </>
                        )}
                    </div>
                )}

                <div
                    className={clsx("flex items-center justify-center", isPDF ? "w-full h-full" : "min-h-full min-w-full")}
                    style={{ transform: `rotate(${rotation}deg) scale(${zoom})`, transition: 'transform 0.2s' }}
                >
                    {isImage && (
                        <>
                            {!imgLoaded && (
                                <div className="absolute text-slate-400">
                                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-400 mb-2" />
                                    <p className="text-[10px] font-bold ">Laden...</p>
                                </div>
                            )}
                            <img
                                src={file.url}
                                alt={name}
                                className="max-h-[85vh] max-w-[90vw] object-contain shadow-lg bg-white"
                                onLoad={() => setImgLoaded(true)}
                            />
                        </>
                    )}

                    {isPDF && (
                        <iframe
                            id="preview-iframe"
                            src={file.url}
                            className="w-full h-full border-none bg-white"
                            title={name}
                        />
                    )}

                    {!isImage && !isPDF && (
                        <div className="bg-white p-10 border border-slate-200 shadow-sm text-center">
                            <h3 className="text-sm font-bold text-slate-800 mb-2">Vorschau nicht verfügbar</h3>
                            <p className="text-xs text-slate-500 mb-6">Für diesen Dateityp gibt es keine Browser-Ansicht.</p>
                            <Button onClick={handleDownload} variant="default" className="text-xs font-bold ">
                                <FaDownload className="mr-2" /> Herunterladen
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={async () => {
                    setIsDeleting(true);
                    try {
                        await projectService.deleteFile(file.projectId, file.id);
                        toast.success('Datei gelöscht');
                        setIsDeleteConfirmOpen(false);
                        setTimeout(() => window.close(), 500);
                    } catch (e) {
                        toast.error('Fehler beim Löschen');
                        setIsDeleting(false);
                    }
                }}
                isLoading={isDeleting}
                title="Datei löschen"
                message={`Möchten Sie die Datei "${name}" wirklich dauerhaft löschen?`}
                confirmText="Löschen"
            />

            <RenameFileModal
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                mode="single"
                initialName={file.name}
                onSubmit={async (data) => {
                    const newName = data.name;
                    if (!newName || newName === file.name) return;

                    try {
                        await projectService.updateFile(file.projectId, file.id, { file_name: newName });
                        setFile({ ...file, name: newName });
                        toast.success('Name geändert');
                        setIsRenameModalOpen(false);
                    } catch (e) {
                        toast.error('Fehler beim Umbenennen');
                    }
                }}
            />
        </div>
    );
};

export default FilePreviewPage;
