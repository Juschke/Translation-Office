import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Spin, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
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
      setErrorMessage('Kein Token in der URL gefunden. Bitte fordern Sie einen neuen Anmelde-Link an.');
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
            'Der Anmelde-Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.'
        );
        setStatus('error');
      }
    };

    verify();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-800 to-teal-600 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Kundenportal</h1>
          <p className="text-teal-200 mt-2 text-sm">Anmeldung wird überprüft...</p>
        </div>

        <Card className="rounded-xl shadow-xl border-0" styles={{ body: { padding: '2rem' } }}>
          {status === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <Spin size="large" />
              <p className="text-slate-500 text-sm">Anmeldung wird überprüft...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <CheckCircleOutlined className="text-5xl text-teal-600 mb-4" />
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Anmeldung erfolgreich</h2>
              <p className="text-slate-500 text-sm">
                Sie werden zum Dashboard weitergeleitet...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <CloseCircleOutlined className="text-5xl text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-slate-800 mb-3">Anmeldung fehlgeschlagen</h2>
              <Alert
                type="error"
                message={errorMessage}
                showIcon
                className="text-left mb-6"
              />
              <Link
                to="/portal/login"
                className="inline-block px-5 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
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
