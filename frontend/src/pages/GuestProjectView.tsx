import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { guestService } from '@/api/services';


import { GuestProjectHeader } from '@/components/guest/GuestProjectHeader';
import { GuestProjectDetails } from '@/components/guest/GuestProjectDetails';
import { GuestFilesList } from '@/components/guest/GuestFilesList';
import { GuestMessagesSection } from '@/components/guest/GuestMessagesSection';
import { GuestCustomerInfoEdit } from '@/components/guest/GuestCustomerInfoEdit';

const GuestProjectView = () => {
    const { t } = useTranslation();
    const { token } = useParams<{ token: string }>();
    const queryClient = useQueryClient();

    // Data Fetching with polling
    const { data: project, isLoading, error } = useQuery({
        queryKey: ['guestProject', token],
        queryFn: () => guestService.getProject(token!),
        enabled: !!token,
        refetchInterval: 10000, // Poll every 10 seconds
    });

    // File Download Handler
    const handleFileDownload = async (file: any) => {
        try {
            const blob = await guestService.downloadFile(token!, file.id);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.original_name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            throw error;
        }
    };

    // File Upload Handler
    const handleFileUpload = async (file: File) => {
        try {
            await guestService.uploadFile(token!, file);
            // Refresh project data to show new file
            queryClient.invalidateQueries({ queryKey: ['guestProject', token] });
        } catch (error) {
            throw error;
        }
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-slate-600">{t('guest_portal.loading')}</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error || !project) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="rounded-sm border border-red-200 shadow-sm bg-white p-8 max-w-md text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-2">{t('guest_portal.access_denied')}</h1>
                    <p className="text-sm text-slate-600">
                        {t('guest_portal.invalid_link')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 space-y-6">
                {/* Header */}
                <GuestProjectHeader project={project} tenant={project.tenant} />

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3 width on desktop) */}
                    <div className="lg:col-span-2 space-y-6">
                        <GuestProjectDetails project={project} />
                        <GuestFilesList
                            files={project.files || []}
                            onDownload={handleFileDownload}
                            onUpload={handleFileUpload}
                            canUpload={true}
                        />
                        <GuestMessagesSection
                            messages={project.messages || []}
                            token={token!}
                            tenantName={project.tenant?.company_name}
                        />
                    </div>

                    {/* Right Column (1/3 width on desktop) - Only for Customer Role */}
                    <div className="space-y-6">
                        {project.role === 'customer' && project.customer && (
                            <GuestCustomerInfoEdit customer={project.customer} token={token!} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestProjectView;
