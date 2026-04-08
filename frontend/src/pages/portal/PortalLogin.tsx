import React, { useState } from 'react';
import { Card, Form, Input, Alert, Tabs } from 'antd';
import { MailOutlined, LockOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import { Button } from '../../components/ui/button';
import { portalAuthService } from '../../api/services/portal';

const PortalLogin: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'password' | 'magic'>('password');
  const [form] = Form.useForm();

  const handlePasswordLogin = async (values: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await portalAuthService.login(values);
      // If it's a staff member, redirect to main dashboard
      if (res.type === 'staff') {
        localStorage.setItem('token', res.token);
        localStorage.setItem('portal_token', res.token);
        window.location.href = '/';
      } else {
        localStorage.setItem('portal_token', res.token);
        window.location.href = '/portal';
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'Ungültige E-Mail-Adresse oder Passwort.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkRequest = async (values: { email: string }) => {
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

  const handleDemoLogin = () => {
    form.setFieldsValue({
      email: 'demo@itc-ks.com',
      password: 'demo1234'
    });
    form.submit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-800 to-teal-600 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Titel */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Serviceportal</h1>
          <p className="text-teal-200 mt-2 text-sm">Translation Office — Sicherer Zugang für Kunden & Partner</p>
        </div>

        <Card
          className="rounded-xl shadow-xl border-0 overflow-hidden"
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
                  Willkommen im ITC Translation Office Serviceportal.
                </p>
              </div>

              {error && (
                <Alert
                  type="error"
                  message={error}
                  showIcon
                  className="mb-6"
                  closable
                  onClose={() => setError(null)}
                />
              )}

              <Tabs
                activeKey={loginMode}
                onChange={(key) => setLoginMode(key as any)}
                className="mb-6 auth-tabs"
                items={[
                  { key: 'password', label: 'Passwort-Login' },
                  { key: 'magic', label: 'Magic Link' },
                ]}
              />

              <Form
                form={form}
                layout="vertical"
                onFinish={loginMode === 'password' ? handlePasswordLogin : handleMagicLinkRequest}
                size="large"
              >
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
                    placeholder="name@beispiel.de"
                    autoComplete="email"
                  />
                </Form.Item>

                {loginMode === 'password' && (
                  <Form.Item
                    name="password"
                    label="Passwort"
                    rules={[{ required: true, message: 'Bitte geben Sie Ihr Passwort ein.' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-slate-400" />}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </Form.Item>
                )}

                <Form.Item className="mb-4">
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full"
                    disabled={loading}
                    isLoading={loading}
                  >
                    {loginMode === 'password' ? 'Anmelden' : 'Anmelde-Link anfordern'}
                  </Button>
                </Form.Item>

                {loginMode === 'password' && (
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleDemoLogin}
                      className="w-full mt-2 flex items-center justify-center gap-2"
                    >
                      <UserOutlined /> Demo-Zugang testen
                    </Button>
                    <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-medium">
                      Kein Passwort? Nutzen Sie den <b>Magic Link</b> Tab.
                    </p>
                  </div>
                )}
              </Form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PortalLogin;
