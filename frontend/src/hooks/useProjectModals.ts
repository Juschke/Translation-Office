import { useState } from 'react';

/** Kapselt sämtliche Modal-Öffnen/Schließen-States für ProjectDetail. */
export function useProjectModals() {
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isCustomerEditModalOpen, setIsCustomerEditModalOpen] = useState(false);
    const [isPartnerEditModalOpen, setIsPartnerEditModalOpen] = useState(false);
    const [isProjectDeleteConfirmOpen, setIsProjectDeleteConfirmOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isInterpreterModalOpen, setIsInterpreterModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<{
        name: string;
        url: string;
        type?: string;
        id?: string;
    } | null>(null);
    const [deleteFileConfirm, setDeleteFileConfirm] = useState<{
        isOpen: boolean;
        fileId: string | null;
        fileName: string;
    }>({ isOpen: false, fileId: null, fileName: '' });

    return {
        isPartnerModalOpen, setIsPartnerModalOpen,
        isEditModalOpen, setIsEditModalOpen,
        isUploadModalOpen, setIsUploadModalOpen,
        isInvoiceModalOpen, setIsInvoiceModalOpen,
        isPaymentModalOpen, setIsPaymentModalOpen,
        isCustomerSearchOpen, setIsCustomerSearchOpen,
        isCustomerEditModalOpen, setIsCustomerEditModalOpen,
        isPartnerEditModalOpen, setIsPartnerEditModalOpen,
        isProjectDeleteConfirmOpen, setIsProjectDeleteConfirmOpen,
        isInviteModalOpen, setIsInviteModalOpen,
        isInterpreterModalOpen, setIsInterpreterModalOpen,
        previewFile, setPreviewFile,
        deleteFileConfirm, setDeleteFileConfirm,
    };
}
