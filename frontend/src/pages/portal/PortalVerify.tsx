import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Spin, Alert } from 'antd';
import { CircleAlert, CircleCheckBig } from 'lucide-react';
import { portalAuthService } from '../../api/services/portal';
import { usePortal } from '../../context/PortalContext';

const PortalVerify: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = usePortal();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setErrorMessage('Kein Token in der URL gefunden. Bitte fordern Sie einen neuen Anmeldelink an.');
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        const result = await portalAuthService.verify(token);
        await login(result.token);
        setStatus('success');
        setTimeout(() => {
          navigate('/portal', { replace: true });
        }, 1500);
      } catch (err: any) {
        setErrorMessage(
          err?.response?.data?.message ||
            'Der Anmeldelink ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.'
        );
        setStatus('error');
      }
    };

    verify();
  }, [token, login, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-800 to-teal-600 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Kundenportal</h1>
          <p className="mt-2 text-sm text-teal-200">Anmeldung wird überprüft...</p>
        </div>

        <Card className="rounded-xl border-0 shadow-xl" styles={{ body: { padding: '2rem' } }}>
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Spin size="large" />
              <p className="text-sm text-slate-500">Anmeldung wird überprüft...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4 text-center">
              <CircleCheckBig className="mx-auto mb-4 h-12 w-12 text-teal-600" />
              <h2 className="mb-2 text-xl font-semibold text-slate-800">Anmeldung erfolgreich</h2>
              <p className="text-sm text-slate-500">Sie werden zum Portal weitergeleitet...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 text-center">
              <CircleAlert className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h2 className="mb-3 text-xl font-semibold text-slate-800">Anmeldung fehlgeschlagen</h2>
              <Alert type="error" message={errorMessage} showIcon className="mb-6 text-left" />
              <Link
                to="/portal/login"
                className="inline-block rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800"
              >
                Zurück zur Anmeldung
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PortalVerify;
