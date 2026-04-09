import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import EmailComposeContent from '../components/EmailComposeContent';

const EmailSendPage = () => {
    const [searchParams] = useSearchParams();
    const sid = searchParams.get('sid');

    // Get from localStorage if sid is present, otherwise fallback to URL params
    const storedData = sid ? localStorage.getItem(sid) : null;
    let emailData = null;
    try {
        emailData = storedData ? JSON.parse(storedData) : null;
    } catch (e) {
        console.error("Error parsing stored email data", e);
    }

    // Clear once retrieved to keep it clean
    useEffect(() => {
        if (sid) {
            setTimeout(() => localStorage.removeItem(sid), 1000);
        }
    }, [sid]);

    const to = emailData?.to || searchParams.get('to') || '';
    const subject = emailData?.subject || searchParams.get('subject') || '';
    const body = emailData?.body || searchParams.get('body') || '';
    const projectId = emailData?.projectId || searchParams.get('projectId') || null;
    const draftId = emailData?.draftId || null;

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
            <div className="max-w-[1400px] mx-auto bg-white shadow-xl rounded-sm overflow-hidden h-full min-h-[800px]">
                <EmailComposeContent
                    isStandalone={false}
                    to={to}
                    subject={subject}
                    body={body}
                    projectId={projectId}
                    draftId={draftId}
                    attachments={emailData?.attachments || []}
                    onClose={() => window.history.back()}
                />
            </div>
        </div>
    );
};

export default EmailSendPage;
