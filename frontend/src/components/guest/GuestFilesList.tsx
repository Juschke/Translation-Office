import React, { useState } from 'react';
import { FaDownload, FaFile, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileArchive } from 'react-icons/fa';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface GuestFilesListProps {
    files: any[];
    token: string;
    onDownload: (file: any) => Promise<void>;
}

const getFileIcon = (extension: string = '') => {
    const ext = extension.toLowerCase();
    if (['pdf'].includes(ext)) return { icon: FaFilePdf, color: 'text-red-500' };
    if (['doc', 'docx'].includes(ext)) return { icon: FaFileWord, color: 'text-blue-500' };
    if (['xls', 'xlsx'].includes(ext)) return { icon: FaFileExcel, color: 'text-green-600' };
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return { icon: FaFileImage, color: 'text-purple-500' };
    if (['zip', 'rar', '7z'].includes(ext)) return { icon: FaFileArchive, color: 'text-orange-500' };
    return { icon: FaFile, color: 'text-slate-400' };
};

const formatBytes = (bytes: number, decimals = 1) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const GuestFilesList: React.FC<GuestFilesListProps> = ({ files, token, onDownload }) => {
    const [downloading, setDownloading] = useState<number | null>(null);

    const handleDownload = async (file: any) => {
        setDownloading(file.id);
        try {
            await onDownload(file);
            toast.success('Download gestartet');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download fehlgeschlagen');
        } finally {
            setDownloading(null);
        }
    };

    if (!files || files.length === 0) {
        return (
            <div className="rounded-sm border border-slate-200 shadow-sm bg-white overflow-hidden">
                <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h2 className="text-sm font-semibold text-slate-900">Dateien</h2>
                </div>
                <div className="p-8 text-center">
                    <FaFile className="mx-auto text-4xl text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">Keine Dateien freigegeben</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-sm border border-slate-200 shadow-sm bg-white overflow-hidden">
            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-900">
                    Dateien <span className="text-slate-500 font-normal">({files.length})</span>
                </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-3">
                {files.map((file) => {
                    const { icon: Icon, color } = getFileIcon(file.extension);
                    const isDownloading = downloading === file.id;

                    return (
                        <div
                            key={file.id}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-slate-200 rounded hover:border-slate-300 transition bg-white"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <Icon className={clsx('text-2xl flex-shrink-0', color)} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-900 truncate" title={file.original_name}>
                                        {file.original_name}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {formatBytes(file.file_size)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleDownload(file)}
                                disabled={isDownloading}
                                variant="default"
                                size="sm"
                                className="w-full sm:w-auto"
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Lädt...
                                    </>
                                ) : (
                                    <>
                                        <FaDownload className="mr-2" />
                                        <span className="hidden sm:inline">Herunterladen</span>
                                        <span className="sm:hidden">Download</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
