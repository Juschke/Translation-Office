import React, { useMemo, useState } from 'react';
import { Alert, Form, Input } from 'antd';
import { Lock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { portalAuthService } from '../../api/services/portal';
import i18n from '../../i18n';

type LoginMode = 'password' | 'reset';
type ResetStep = 1 | 2 | 3;

const codeSlots = 6;

const PortalLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [resetStep, setResetStep] = useState<ResetStep>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [locale, setLocale] = useState<'de' | 'en'>((localStorage.getItem('locale') as 'de' | 'en') || 'de');
  const [loginForm] = Form.useForm();
  const [resetEmailForm] = Form.useForm();
  const [resetCodeForm] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();

  const handleLanguageChange = (nextLocale: 'de' | 'en') => {
    setLocale(nextLocale);
    localStorage.setItem('locale', nextLocale);
    void i18n.changeLanguage(nextLocale);
  };

  const switchMode = (mode: LoginMode) => {
    setLoginMode(mode);
    setError(null);
    setSuccessMessage(null);
    if (mode === 'reset') {
      setResetStep(1);
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
      resetEmailForm.resetFields();
      resetCodeForm.resetFields();
      resetPasswordForm.resetFields();
    }
  };

  const passwordChecks = useMemo(() => {
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const passed = [hasMinLength, hasUppercase, hasNumber].filter(Boolean).length;
    const strength = passed <= 1 ? 'Niedrig' : passed === 2 ? 'Mittel' : 'Gut';
    const strengthColor = passed <= 1 ? 'bg-red-500' : passed === 2 ? 'bg-amber-500' : 'bg-emerald-600';

    return { hasMinLength, hasUppercase, hasNumber, passed, strength, strengthColor };
  }, [newPassword]);

  const handlePasswordLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await portalAuthService.login(values);

      if (res.type === 'staff') {
        localStorage.setItem('token', res.token);
        localStorage.setItem('portal_token', res.token);
        window.location.href = '/dashboard';
        return;
      }

      localStorage.setItem('portal_token', res.token);
      window.location.href = '/portal';
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'Die Anmeldung war nicht erfolgreich. Bitte prüfen Sie E-Mail-Adresse und Passwort.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (values: { email: string }) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await portalAuthService.requestLink(values.email);
      setResetEmail(values.email);
      setResetStep(2);
      setSuccessMessage('Wenn Ihr Portalzugang freigeschaltet ist, wurde ein Sicherheitscode per E-Mail versendet.');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'Der Sicherheitscode konnte nicht angefordert werden. Bitte versuchen Sie es erneut.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetCode = async (values: Record<string, string>) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const code = Array.from({ length: codeSlots }, (_, index) => values[`code_${index}`] || '').join('');

    try {
      await portalAuthService.verifyResetCode({
        email: resetEmail,
        code,
      });
      setResetCode(code);
      resetPasswordForm.setFieldValue('email', resetEmail);
      setResetStep(3);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'Der Code konnte nicht bestätigt werden. Bitte prüfen Sie Ihre Eingabe.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: {
    email: string;
    password: string;
    password_confirmation: string;
  }) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await portalAuthService.resetPassword({
        email: values.email,
        code: resetCode,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });

      setSuccessMessage('Das Passwort wurde erfolgreich gesetzt. Bitte melden Sie sich jetzt mit dem neuen Passwort an.');
      setLoginMode('password');
      setResetStep(1);
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
      resetEmailForm.resetFields();
      resetCodeForm.resetFields();
      resetPasswordForm.resetFields();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'Das Passwort konnte nicht neu gesetzt werden. Bitte prüfen Sie Ihre Eingaben.',
      );
    } finally {
      setLoading(false);
    }
  };

  const renderLanguageSwitcher = () => (
    <div className="mt-8 flex justify-center">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => handleLanguageChange('de')}
          className={`border-2 px-2 py-1 transition ${locale === 'de' ? 'border-[#c8ee61] bg-white' : 'border-transparent opacity-80 hover:opacity-100'}`}
          aria-label="Deutsch"
        >
          <img src="https://flagcdn.com/w80/de.png" srcSet="https://flagcdn.com/w160/de.png 2x" alt="Deutsch" className="block h-[54px] w-[82px] object-cover" />
        </button>
        <button
          type="button"
          onClick={() => handleLanguageChange('en')}
          className={`border-2 px-2 py-1 transition ${locale === 'en' ? 'border-[#c8ee61] bg-white' : 'border-transparent opacity-80 hover:opacity-100'}`}
          aria-label="English"
        >
          <img src="https://flagcdn.com/w80/gb.png" srcSet="https://flagcdn.com/w160/gb.png 2x" alt="English" className="block h-[54px] w-[82px] object-cover" />
        </button>
      </div>
    </div>
  );

  const renderCodeInputs = () => (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {Array.from({ length: codeSlots }, (_, index) => (
        <Form.Item
          key={index}
          name={`code_${index}`}
          rules={[
            { required: true, message: '' },
            { len: 1, message: '' },
            { pattern: /^[0-9A-Za-z]$/, message: '' },
          ]}
          className="mb-0"
        >
          <Input
            id={`code_${index}`}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            className="h-12 w-11 !rounded-none !border-slate-300 !bg-[#dde7f5] text-center !text-lg font-semibold uppercase sm:h-14 sm:w-12"
            onChange={(event) => {
              const value = event.target.value;
              if (value && index < codeSlots - 1) {
                document.getElementById(`code_${index + 1}`)?.focus();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !(event.target as HTMLInputElement).value && index > 0) {
                document.getElementById(`code_${index - 1}`)?.focus();
              }
            }}
          />
        </Form.Item>
      ))}
    </div>
  );

  const panelFormClass = "[&_.ant-form-item]:mb-3 [&_.ant-form-item-label]:pb-1 [&_.ant-form-item-label>label]:text-[12px] [&_.ant-form-item-label>label]:font-medium [&_.ant-form-item-label>label]:text-slate-700 [&_.ant-input-affix-wrapper]:rounded-none [&_.ant-input-affix-wrapper]:border-slate-300 [&_.ant-input-affix-wrapper]:bg-[#dde7f5] [&_.ant-input-affix-wrapper]:px-3 [&_.ant-input-affix-wrapper]:py-2.5 [&_.ant-input-prefix]:mr-3 [&_.ant-input-prefix]:text-slate-500 [&_.ant-input]:bg-transparent [&_.ant-input]:text-[14px] [&_.ant-input]:text-slate-900";

  return (
    <div className="min-h-screen bg-[#0e5a67] px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="w-full max-w-5xl bg-[#f6f6f4] shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
          <div className="px-6 pb-4 pt-8 sm:px-12 sm:pt-10">
            <div className="text-center">
              <h1 className="text-[28px] font-normal tracking-tight text-slate-900 sm:text-[34px]">
                Serviceportal
              </h1>
            </div>

            <div className="mx-auto mt-8 max-w-4xl">
              {successMessage && (
                <Alert type="success" message={successMessage} showIcon closable className="mb-5" onClose={() => setSuccessMessage(null)} />
              )}

              {error && (
                <Alert type="error" message={error} showIcon closable className="mb-5" onClose={() => setError(null)} />
              )}

              {loginMode === 'password' && (
                <Form
                  form={loginForm}
                  layout="vertical"
                  onFinish={handlePasswordLogin}
                  size="middle"
                  requiredMark={(label, { required }) => (
                    <>
                      {label}
                      {required ? <span className="ml-1 text-slate-600">*</span> : null}
                    </>
                  )}
                  className={panelFormClass}
                >
                  <div className="mb-4 text-center text-sm text-slate-700">
                    Zugang für Projektmanager, Kunden und Partner.
                  </div>

                  <Form.Item
                    name="email"
                    label="E-Mail-Adresse"
                    rules={[
                      { required: true, message: 'Bitte geben Sie Ihre E-Mail-Adresse ein.' },
                      { type: 'email', message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
                    ]}
                  >
                    <Input prefix={<Mail className="h-4 w-4" />} placeholder="name@beispiel.de" autoComplete="email" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Passwort"
                    rules={[{ required: true, message: 'Bitte geben Sie Ihr Passwort ein.' }]}
                  >
                    <Input.Password prefix={<Lock className="h-4 w-4" />} placeholder="Ihr zugesandtes Passwort" autoComplete="current-password" />
                  </Form.Item>

                  <div className="-mt-1 mb-3 text-right">
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="text-sm text-[#0e5a67] hover:underline"
                    >
                      Passwort vergessen
                    </button>
                  </div>

                  {renderLanguageSwitcher()}

                  <div className="mt-10 border-t border-slate-300 px-3 py-4 sm:px-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div />
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button type="submit" variant="default" className="rounded bg-[#0e5a67] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0b4b56]" disabled={loading} isLoading={loading}>
                          Anmelden
                        </Button>
                      </div>
                    </div>
                  </div>
                </Form>
              )}

              {loginMode === 'reset' && resetStep === 1 && (
                <Form
                  form={resetEmailForm}
                  layout="vertical"
                  onFinish={handleRequestResetCode}
                  size="middle"
                  initialValues={{ email: resetEmail }}
                  requiredMark={(label, { required }) => (
                    <>
                      {label}
                      {required ? <span className="ml-1 text-slate-600">*</span> : null}
                    </>
                  )}
                  className={panelFormClass}
                >
                  <div className="mb-4 text-center text-sm text-slate-700">
                    Die Passwort-Zurücksetzung gilt für Kunden- und Partnerzugänge mit freigeschaltetem Portalzugang.
                  </div>

                  <Form.Item
                    name="email"
                    label="E-Mail-Adresse"
                    rules={[
                      { required: true, message: 'Bitte geben Sie Ihre E-Mail-Adresse ein.' },
                      { type: 'email', message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
                    ]}
                  >
                    <Input prefix={<Mail className="h-4 w-4" />} placeholder="name@beispiel.de" autoComplete="email" />
                  </Form.Item>

                  {renderLanguageSwitcher()}

                  <div className="mt-10 border-t border-slate-300 px-3 py-4 sm:px-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div />
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button type="button" onClick={() => switchMode('password')} className="inline-flex items-center rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 hover:border-slate-400">
                          Zurück
                        </button>
                        <Button type="submit" variant="default" className="rounded bg-[#0e5a67] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0b4b56]" disabled={loading} isLoading={loading}>
                          Weiter
                        </Button>
                      </div>
                    </div>
                  </div>
                </Form>
              )}

              {loginMode === 'reset' && resetStep === 2 && (
                <Form
                  form={resetCodeForm}
                  layout="vertical"
                  onFinish={handleVerifyResetCode}
                  size="middle"
                  requiredMark={(label, { required }) => (
                    <>
                      {label}
                      {required ? <span className="ml-1 text-slate-600">*</span> : null}
                    </>
                  )}
                  className={panelFormClass}
                >
                  <Form.Item label="E-Mail-Adresse">
                    <Input value={resetEmail} prefix={<Mail className="h-4 w-4" />} disabled />
                  </Form.Item>

                  <div className="mb-4">
                    <label className="mb-2 block text-[12px] font-medium text-slate-700">Sicherheitscode</label>
                    {renderCodeInputs()}
                  </div>

                  {renderLanguageSwitcher()}

                  <div className="mt-10 border-t border-slate-300 px-3 py-4 sm:px-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div />
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button type="button" onClick={() => { setResetStep(1); setError(null); }} className="inline-flex items-center rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 hover:border-slate-400">
                          Zurück
                        </button>
                        <Button type="submit" variant="default" className="rounded bg-[#0e5a67] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0b4b56]" disabled={loading} isLoading={loading}>
                          Weiter
                        </Button>
                      </div>
                    </div>
                  </div>
                </Form>
              )}

              {loginMode === 'reset' && resetStep === 3 && (
                <Form
                  form={resetPasswordForm}
                  layout="vertical"
                  onFinish={handleResetPassword}
                  size="middle"
                  initialValues={{ email: resetEmail }}
                  requiredMark={(label, { required }) => (
                    <>
                      {label}
                      {required ? <span className="ml-1 text-slate-600">*</span> : null}
                    </>
                  )}
                  className={panelFormClass}
                >
                  <Form.Item name="email" label="E-Mail-Adresse">
                    <Input prefix={<Mail className="h-4 w-4" />} disabled />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Neues Passwort"
                    rules={[
                      { required: true, message: 'Bitte geben Sie ein neues Passwort ein.' },
                      {
                        validator(_, value) {
                          if (!value) return Promise.resolve();
                          if (value.length < 8) return Promise.reject(new Error('Das Passwort muss mindestens 8 Zeichen lang sein.'));
                          if (!/[A-Z]/.test(value)) return Promise.reject(new Error('Das Passwort muss mindestens einen Großbuchstaben enthalten.'));
                          if (!/\d/.test(value)) return Promise.reject(new Error('Das Passwort muss mindestens eine Zahl enthalten.'));
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input.Password
                      prefix={<Lock className="h-4 w-4" />}
                      placeholder="Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Zahl"
                      autoComplete="new-password"
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </Form.Item>

                  <div className="mb-4 border border-slate-300 bg-[#eef2f6] px-4 py-3">
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                      <span>Passwortsicherheit</span>
                      <span className="font-medium text-slate-900">{passwordChecks.strength}</span>
                    </div>
                    <div className="mb-3 h-2 w-full bg-slate-300">
                      <div className={`h-2 transition-all ${passwordChecks.strengthColor}`} style={{ width: `${(passwordChecks.passed / 3) * 100}%` }} />
                    </div>
                    <div className="grid gap-1 text-xs text-slate-600">
                      <div className={passwordChecks.hasMinLength ? 'text-emerald-700' : ''}>Mindestens 8 Zeichen</div>
                      <div className={passwordChecks.hasUppercase ? 'text-emerald-700' : ''}>Mindestens ein Großbuchstabe</div>
                      <div className={passwordChecks.hasNumber ? 'text-emerald-700' : ''}>Mindestens eine Zahl</div>
                    </div>
                  </div>

                  <Form.Item
                    name="password_confirmation"
                    label="Neues Passwort bestätigen"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Bitte bestätigen Sie das neue Passwort.' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Die Passwörter stimmen nicht überein.'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<Lock className="h-4 w-4" />} placeholder="Passwort wiederholen" autoComplete="new-password" />
                  </Form.Item>

                  {renderLanguageSwitcher()}

                  <div className="mt-10 border-t border-slate-300 px-3 py-4 sm:px-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div />
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button type="button" onClick={() => { setResetStep(2); setError(null); }} className="inline-flex items-center rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 hover:border-slate-400">
                          Zurück
                        </button>
                        <Button type="submit" variant="default" className="rounded bg-[#0e5a67] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0b4b56]" disabled={loading} isLoading={loading}>
                          Passwort setzen
                        </Button>
                      </div>
                    </div>
                  </div>
                </Form>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-6">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/70">
          <Link to="/" className="hover:text-white">Startseite</Link>
          <a href="/landing-page/impressum.html" className="hover:text-white">Impressum</a>
          <a href="/landing-page/datenschutz.html" className="hover:text-white">Datenschutz</a>
          <a href="/landing-page/agb.html" className="hover:text-white">AGB</a>
          <a href="/landing-page/cookie.html" className="hover:text-white">Cookies</a>
        </nav>
      </footer>
    </div>
  );
};

export default PortalLogin;
