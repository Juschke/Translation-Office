import React, { useState } from 'react';
import { Card, Form, Input, Alert } from 'antd';
import { MailOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Button } from '../../components/ui/button';
import { portalAuthService } from '../../api/services/portal';

const PortalLogin: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    setError(null);
    try {
      await portalAuthService.requestLink(values.email);
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-800 to-teal-600 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Titel */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Kundenportal</h1>
          <p className="text-teal-200 mt-2 text-sm">Translation Office — Sicherer Zugang für Kunden</p>
        </div>

        <Card
          className="rounded-xl shadow-xl border-0"
          styles={{ body: { padding: '2rem' } }}
        >
          {submitted ? (
            <div className="text-center py-4">
              <CheckCircleOutlined className="text-5xl text-teal-600 mb-4" />
              <h2 className="text-xl font-semibold text-slate-800 mb-2">E-Mail versendet</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Wir haben Ihnen einen Anmelde-Link geschickt. Bitte prüfen Sie Ihr Postfach und
                klicken Sie auf den Link, um sich anzumelden.
              </p>
              <p className="text-slate-400 text-xs mt-4">
                Kein E-Mail erhalten?{' '}
                <button
                  className="text-teal-600 hover:underline font-medium"
                  onClick={() => {
                    setSubmitted(false);
                    form.resetFields();
                  }}
                >
                  Erneut versuchen
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Anmelden</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen sicheren Anmelde-Link.
                </p>
              </div>

              {error && (
                <Alert
                  type="error"
                  message={error}
                  showIcon
                  className="mb-4"
                  closable
                  onClose={() => setError(null)}
                />
              )}

              <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
                <Form.Item
                  name="email"
                  label="E-Mail-Adresse"
                  rules={[
                    { required: true, message: 'Bitte geben Sie Ihre E-Mail-Adresse ein.' },
                    { type: 'email', message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined className="text-slate-400" />}
                    placeholder="ihre@email.de"
                    autoComplete="email"
                    autoFocus
                  />
                </Form.Item>

                <Form.Item className="mb-0 mt-2">
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Wird gesendet...' : 'Anmelde-Link anfordern'}
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PortalLogin;
