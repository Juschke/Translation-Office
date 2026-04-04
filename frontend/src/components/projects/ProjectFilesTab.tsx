import { FaFileAlt } from 'react-icons/fa';
import FileExplorer from './FileExplorer';

interface ProjectFilesTabProps {
    projectData: any;
    handlePreviewFile: (file: any) => Promise<void>;
    handleDownloadFile: (file: any) => Promise<void>;
    setDeleteFileConfirm: (confirm: { isOpen: boolean; fileId: string | null; fileName: string }) => void;
    onBulkMove: (ids: string[], newType: string) => Promise<void>;
    onBulkDelete: (ids: string[]) => void | Promise<void>;
    onBulkDownloadZip: (ids: string[]) => Promise<void>;
    formatFileSize: (bytes: any) => string;
    onUpload: (files: any[], onProgress: (id: string, progress: number) => void) => Promise<void>;
}

const ProjectFilesTab = ({
    projectData,
    handlePreviewFile,
    handleDownloadFile,
    setDeleteFileConfirm,
    onBulkMove,
    onBulkDelete,
    onBulkDownloadZip,
    formatFileSize,
    onUpload,
}: ProjectFilesTabProps) => {
    return (
        <div className="bg-white rounded-sm border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-slate-100 bg-slate-50/10 flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center">
                        <FaFileAlt className="text-slate-600 text-sm" />
                    </div>
                    Dateien
                </h3>
            </div>
            <div className="p-0">
                <FileExplorer
                    projectData={projectData}
                    handlePreviewFile={handlePreviewFile}
                    handleDownloadFile={handleDownloadFile}
                    setDeleteFileConfirm={setDeleteFileConfirm}
                    onBulkMove={onBulkMove}
                    onBulkDelete={onBulkDelete}
                    onBulkDownloadZip={onBulkDownloadZip}
                    formatFileSize={formatFileSize}
                    onUpload={onUpload}
                />
            </div>
        </div>
    );
};

export default ProjectFilesTab;
