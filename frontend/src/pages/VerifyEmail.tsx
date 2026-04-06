import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import api from '../api/axios';
import { Button } from '../components/ui/button';

const VerifyEmail = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            const id = searchParams.get('id');
            const hash = searchParams.get('hash');
            const expires = searchParams.get('expires');
            const signature = searchParams.get('signature');

            if (!id || !hash || !expires || !signature) {
                setStatus('error');
                setMessage(t('verify_email.invalid_link'));
                return;
            }

            try {
                const url = `/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`;

                await api.get(url);
                setStatus('success');
                setMessage(t('verify_email.success_message'));

                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || t('verify_email.error_message'));
            }
        };

        verify();
    }, [navigate, searchParams, t]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-sm shadow-sm max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <FaSpinner className="text-4xl text-slate-700 animate-spin mb-4" />
                        <h2 className="text-xl font-medium text-slate-800">{t('verify_email.loading_title')}</h2>
                        <p className="text-slate-500 mt-2">{t('verify_email.loading_description')}</p>
                    </div>
                )}
                {status === 'success' && (
                    <div className="flex flex-col items-center animate-fadeIn">
                        <FaCheckCircle className="text-5xl text-emerald-500 mb-4" />
                        <h2 className="text-xl font-medium text-slate-800">{t('verify_email.success_title')}</h2>
                        <p className="text-slate-600 mt-2">{message}</p>
                        <p className="text-sm text-slate-400 mt-4">{t('verify_email.redirecting')}</p>
                    </div>
                )}
                {status === 'error' && (
                    <div className="flex flex-col items-center animate-fadeIn">
                        <FaExclamationCircle className="text-5xl text-red-500 mb-4" />
                        <h2 className="text-xl font-medium text-slate-800">{t('actions.error')}</h2>
                        <p className="text-red-600 mt-2">{message}</p>
                        <Button onClick={() => navigate('/login')} className="mt-6">
                            {t('verify_email.back_to_login')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
