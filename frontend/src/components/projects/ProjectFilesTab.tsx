import FileExplorer from './FileExplorer';

interface ProjectFilesTabProps {
    projectData: any;
    setIsUploadModalOpen: (open: boolean) => void;
    handlePreviewFile: (file: any) => Promise<void>;
    handleDownloadFile: (file: any) => Promise<void>;
    toggleFileType: (file: any) => Promise<void>;
    onRenameFile: (file: any, newName: string) => Promise<void>;
    onMoveFile: (file: any, newType: string) => Promise<void>;
    onBulkMove: (ids: string[], newType: string) => Promise<void>;
    onBulkDownloadZip: (ids: string[]) => Promise<void>;
    onBulkDelete: (ids: string[]) => Promise<void>;
    onBulkRename: (ids: string[], prefix: string, suffix: string) => Promise<void>;
    onBulkEmail: (ids: string[]) => void;
    formatFileSize: (bytes: any) => string;
    onUpload: (files: any[], onProgress: (id: string, progress: number) => void) => Promise<void>;
}

const ProjectFilesTab = ({
    projectData,
    setIsUploadModalOpen,
    handlePreviewFile,
    handleDownloadFile,
    toggleFileType,
    onRenameFile,
    onMoveFile,
    onBulkMove,
    onBulkDownloadZip,
    onBulkDelete,
    onBulkRename,
    onBulkEmail,
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
                toggleFileType={toggleFileType}
                onRenameFile={onRenameFile}
                onMoveFile={onMoveFile}
                onBulkMove={onBulkMove}
                onBulkDownloadZip={onBulkDownloadZip}
                onBulkDelete={onBulkDelete}
                onBulkRename={onBulkRename}
                onBulkEmail={onBulkEmail}
                formatFileSize={formatFileSize}
                onUpload={onUpload}
            />
        </div>
    );
};

export default ProjectFilesTab;
