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
            // Give it a tiny delay to ensure the component has read it (though it already has above)
            setTimeout(() => localStorage.removeItem(sid), 1000);
        }
    }, [sid]);

    const to = emailData?.to || searchParams.get('to') || '';
    const subject = emailData?.subject || searchParams.get('subject') || '';
    const body = emailData?.body || searchParams.get('body') || '';
    const projectId = emailData?.projectId || searchParams.get('projectId') || null;

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 items-center">
            <div className="h-full w-full md:min-w-[1250px] max-w-[1400px] flex flex-col bg-white shadow-2xl overflow-hidden">
                <EmailComposeContent
                    isStandalone
                    onClose={() => window.close()}
                    to={to}
                    subject={subject}
                    body={body}
                    projectId={projectId}
                    attachments={emailData?.attachments || []}
                />
            </div>
        </div>
    );
};

export default EmailSendPage;
