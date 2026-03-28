import { useTranslation } from 'react-i18next';
import FileExplorer from './FileExplorer';

interface ProjectFilesTabProps {
    projectData: any;
    setIsUploadModalOpen: (open: boolean) => void;
    handlePreviewFile: (file: any) => Promise<void>;
    handleDownloadFile: (file: any) => Promise<void>;
    setDeleteFileConfirm: (confirm: { isOpen: boolean; fileId: string | null; fileName: string }) => void;
    toggleFileType: (file: any) => Promise<void>;
    onRenameFile: (file: any, newName: string) => Promise<void>;
    onMoveFile: (file: any, newType: string) => Promise<void>;
    onBulkMove: (ids: string[], newType: string) => Promise<void>;
    onBulkDownloadZip: (ids: string[]) => Promise<void>;
    formatFileSize: (bytes: any) => string;
    onUpload: (files: any[], onProgress: (id: string, progress: number) => void) => Promise<void>;
}

const ProjectFilesTab = ({
    projectData,
    setIsUploadModalOpen,
    handlePreviewFile,
    handleDownloadFile,
    setDeleteFileConfirm,
    toggleFileType,
    onRenameFile,
    onMoveFile,
    onBulkMove,
    onBulkDownloadZip,
    formatFileSize,
    onUpload,
}: ProjectFilesTabProps) => {
    return (
        <div className="flex flex-col gap-4 animate-fadeIn pb-10">
            <FileExplorer
                projectData={projectData}
                setIsUploadModalOpen={setIsUploadModalOpen}
                handlePreviewFile={handlePreviewFile}
                handleDownloadFile={handleDownloadFile}
                setDeleteFileConfirm={setDeleteFileConfirm}
                toggleFileType={toggleFileType}
                onRenameFile={onRenameFile}
                onMoveFile={onMoveFile}
                onBulkMove={onBulkMove}
                onBulkDownloadZip={onBulkDownloadZip}
                formatFileSize={formatFileSize}
                onUpload={onUpload}
            />
        </div>
    );
};

export default ProjectFilesTab;
