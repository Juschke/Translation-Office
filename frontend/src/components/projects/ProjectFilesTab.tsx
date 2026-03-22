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
    formatFileSize: (bytes: any) => string;
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
    formatFileSize,
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
                formatFileSize={formatFileSize}
            />
        </div>
    );
};

export default ProjectFilesTab;
