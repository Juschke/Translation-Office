import React, { useMemo, useState, useEffect } from 'react';
import { Alert, Form, Input } from 'antd';
import { ArrowLeft, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { portalAuthService } from '../../api/services/portal';

type LoginMode = 'login' | 'reset';
type ResetStep = 1 | 2 | 3;

const CODE_SLOTS = 6;

const panelFormClass =
  '[&_.ant-form-item]:mb-4 ' +
  '[&_.ant-form-item-label]:pb-1 ' +
  '[&_.ant-form-item-label>label]:text-[12px] ' +
  '[&_.ant-form-item-label>label]:font-semibold ' +
  '[&_.ant-form-item-label>label]:uppercase ' +
  '[&_.ant-form-item-label>label]:tracking-wide ' +
  '[&_.ant-form-item-label>label]:text-slate-500 ' +
  '[&_.ant-input-affix-wrapper]:rounded-lg ' +
  '[&_.ant-input-affix-wrapper]:border-slate-200 ' +
  '[&_.ant-input-affix-wrapper]:bg-slate-50 ' +
  '[&_.ant-input-affix-wrapper]:px-3 ' +
  '[&_.ant-input-affix-wrapper]:py-2.5 ' +
  '[&_.ant-input-affix-wrapper:focus-within]:border-[#0e5a67] ' +
  '[&_.ant-input-affix-wrapper:focus-within]:shadow-[0_0_0_2px_rgba(14,90,103,0.12)] ' +
  '[&_.ant-input-prefix]:mr-3 ' +
  '[&_.ant-input-prefix]:text-slate-400 ' +
  '[&_.ant-input]:bg-transparent ' +
  '[&_.ant-input]:text-[14px] ' +
  '[&_.ant-input]:text-slate-900';

const PortalAuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<LoginMode>(() =>
    searchParams.get('mode') === 'activate' ? 'reset' : 'login'
  );
  const [resetStep, setResetStep] = useState<ResetStep>(1);

  useEffect(() => {
    if (searchParams.get('mode') === 'activate') {
      setMode('reset');
    }
  }, [searchParams]);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loginForm] = Form.useForm();
  const [resetEmailForm] = Form.useForm();
  const [resetCodeForm] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();

  const switchToReset = () => {
    setMode('reset');
    setResetStep(1);
    setError(null);
    setSuccessMessage(null);
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    resetEmailForm.resetFields();
    resetCodeForm.resetFields();
    resetPasswordForm.resetFields();
  };

  const switchToLogin = () => {
    setMode('login');
    setError(null);
    setSuccessMessage(null);
  };

  const passwordChecks = useMemo(() => {
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const passed = [hasMinLength, hasUppercase, hasNumber].filter(Boolean).length;
    const strength = passed <= 1 ? 'Niedrig' : passed === 2 ? 'Mittel' : 'Gut';
    const strengthColor =
      passed <= 1 ? 'bg-red-500' : passed === 2 ? 'bg-amber-500' : 'bg-emerald-500';
    return { hasMinLength, hasUppercase, hasNumber, passed, strength, strengthColor };
  }, [newPassword]);

  /* ── Handlers ── */

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await portalAuthService.login(values);
      if (res.type === 'staff') {
        setError('Dieser Zugang ist für Kunden und Partner. Bitte nutzen Sie die Teamanmeldung.');
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

  const handleRequestCode = async (values: { email: string }) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await portalAuthService.requestLink(values.email);
      setResetEmail(values.email);
      setResetStep(2);
      setSuccessMessage(
        'Wenn Ihr Portalzugang freigeschaltet ist, wurde ein Sicherheitscode per E-Mail versendet.',
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Der Sicherheitscode konnte nicht angefordert werden. Bitte versuchen Sie es erneut.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (values: Record<string, string>) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const code = Array.from({ length: CODE_SLOTS }, (_, i) => values[`code_${i}`] || '').join('');
    try {
      await portalAuthService.verifyResetCode({ email: resetEmail, code });
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

  const handleSetPassword = async (values: {
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
      setSuccessMessage(
        'Das Passwort wurde erfolgreich gesetzt. Bitte melden Sie sich jetzt an.',
      );
      setMode('login');
      setResetStep(1);
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
      loginForm.resetFields();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Das Passwort konnte nicht neu gesetzt werden. Bitte prüfen Sie Ihre Eingaben.',
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Code-Slot Inputs ── */
  const renderCodeInputs = () => (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {Array.from({ length: CODE_SLOTS }, (_, i) => (
        <Form.Item
          key={i}
          name={`code_${i}`}
          rules={[
            { required: true, message: '' },
            { len: 1, message: '' },
            { pattern: /^[0-9A-Za-z]$/, message: '' },
          ]}
          className="mb-0"
        >
          <Input
            id={`code_${i}`}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            className="h-12 w-11 !rounded-lg !border-slate-200 !bg-slate-50 text-center !text-lg font-bold uppercase tracking-widest sm:h-14 sm:w-12"
            onChange={(e) => {
              if (e.target.value && i < CODE_SLOTS - 1) {
                document.getElementById(`code_${i + 1}`)?.focus();
              }
            }}
            onKeyDown={(e) => {
              if (
                e.key === 'Backspace' &&
                !(e.target as HTMLInputElement).value &&
                i > 0
              ) {
                document.getElementById(`code_${i - 1}`)?.focus();
              }
            }}
          />
        </Form.Item>
      ))}
    </div>
  );

  /* ── Step indicator for reset flow ── */
  const resetSteps = ['E-Mail', 'Code', 'Passwort'];
  const renderStepBar = () => (
    <div className="mb-6 flex items-center justify-center gap-2">
      {resetSteps.map((label, idx) => {
        const stepNum = (idx + 1) as ResetStep;
        const active = resetStep === stepNum;
        const done = resetStep > stepNum;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-[#0e5a67] text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done ? '✓' : stepNum}
              </div>
              <span
                className={`text-[10px] font-medium uppercase tracking-wide ${
                  active ? 'text-[#0e5a67]' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < resetSteps.length - 1 && (
              <div
                className={`mb-4 h-px w-8 transition-colors ${
                  resetStep > stepNum ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  /* ── Footer action row ── */
  const renderActions = (
    onBack?: () => void,
    submitLabel = 'Weiter',
    isLastStep = false,
  ) => (
    <div className="mt-6 flex items-center justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>
      ) : (
        <span />
      )}
      <Button
        type="submit"
        variant="default"
        className="rounded-lg bg-[#0e5a67] px-6 py-2 text-sm font-semibold text-white hover:bg-[#0b4b56]"
        disabled={loading}
        isLoading={loading}
      >
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0e5a67] px-4 py-10 sm:px-6">
      {/* Top navigation */}
      <div className="mx-auto mb-6 flex max-w-md items-center justify-between">
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Zur Teamanmeldung
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
          <ShieldCheck className="h-3.5 w-3.5" />
          Kundenportal
        </span>
      </div>

      {/* Card */}
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.20)]">
          {/* Card header */}
          <div className="border-b border-slate-100 px-8 py-6 text-center">
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
              {mode === 'login' ? 'Portal-Anmeldung' : 'Konto aktivieren / Passwort setzen'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'login'
                ? 'Zugang für Kunden und Partner'
                : 'Geben Sie Ihre E-Mail ein — Sie erhalten einen 6-stelligen Code'}
            </p>
          </div>

          {/* Card body */}
          <div className="px-8 py-6">
            {successMessage && (
              <Alert
                type="success"
                message={successMessage}
                showIcon
                closable
                className="mb-5"
                onClose={() => setSuccessMessage(null)}
              />
            )}
            {error && (
              <Alert
                type="error"
                message={error}
                showIcon
                closable
                className="mb-5"
                onClose={() => setError(null)}
              />
            )}

            {/* ── Login ── */}
            {mode === 'login' && (
              <Form
                form={loginForm}
                layout="vertical"
                onFinish={handleLogin}
                size="middle"
                requiredMark={false}
                className={panelFormClass}
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
                    prefix={<Mail className="h-4 w-4" />}
                    placeholder="name@beispiel.de"
                    autoComplete="email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Passwort"
                  rules={[{ required: true, message: 'Bitte geben Sie Ihr Passwort ein.' }]}
                >
                  <Input.Password
                    prefix={<Lock className="h-4 w-4" />}
                    placeholder="Ihr Passwort"
                    autoComplete="current-password"
                  />
                </Form.Item>

                <div className="-mt-2 mb-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Noch kein Passwort?</span>
                  <button
                    type="button"
                    onClick={switchToReset}
                    className="text-sm text-[#0e5a67] hover:underline"
                  >
                    Konto aktivieren / Passwort vergessen
                  </button>
                </div>

                {renderActions(undefined, 'Anmelden')}
              </Form>
            )}

            {/* ── Reset Step 1: E-Mail ── */}
            {mode === 'reset' && resetStep === 1 && (
              <Form
                form={resetEmailForm}
                layout="vertical"
                onFinish={handleRequestCode}
                size="middle"
                requiredMark={false}
                className={panelFormClass}
              >
                {renderStepBar()}
                <Form.Item
                  name="email"
                  label="E-Mail-Adresse"
                  rules={[
                    { required: true, message: 'Bitte geben Sie Ihre E-Mail-Adresse ein.' },
                    { type: 'email', message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
                  ]}
                >
                  <Input
                    prefix={<Mail className="h-4 w-4" />}
                    placeholder="name@beispiel.de"
                    autoComplete="email"
                  />
                </Form.Item>
                {renderActions(switchToLogin, 'Code anfordern')}
              </Form>
            )}

            {/* ── Reset Step 2: Code ── */}
            {mode === 'reset' && resetStep === 2 && (
              <Form
                form={resetCodeForm}
                layout="vertical"
                onFinish={handleVerifyCode}
                size="middle"
                requiredMark={false}
                className={panelFormClass}
              >
                {renderStepBar()}
                <Form.Item label="E-Mail-Adresse">
                  <Input
                    value={resetEmail}
                    prefix={<Mail className="h-4 w-4" />}
                    disabled
                    className="!rounded-lg !bg-slate-50"
                  />
                </Form.Item>
                <div className="mb-4">
                  <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Sicherheitscode (6 Stellen)
                  </label>
                  {renderCodeInputs()}
                </div>
                {renderActions(
                  () => {
                    setResetStep(1);
                    setError(null);
                  },
                  'Weiter',
                )}
              </Form>
            )}

            {/* ── Reset Step 3: Neues Passwort ── */}
            {mode === 'reset' && resetStep === 3 && (
              <Form
                form={resetPasswordForm}
                layout="vertical"
                onFinish={handleSetPassword}
                size="middle"
                initialValues={{ email: resetEmail }}
                requiredMark={false}
                className={panelFormClass}
              >
                {renderStepBar()}
                <Form.Item name="email" label="E-Mail-Adresse">
                  <Input
                    prefix={<Mail className="h-4 w-4" />}
                    disabled
                    className="!rounded-lg !bg-slate-50"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Neues Passwort"
                  rules={[
                    { required: true, message: 'Bitte geben Sie ein neues Passwort ein.' },
                    {
                      validator(_, value) {
                        if (!value) return Promise.resolve();
                        if (value.length < 8)
                          return Promise.reject(
                            new Error('Das Passwort muss mindestens 8 Zeichen lang sein.'),
                          );
                        if (!/[A-Z]/.test(value))
                          return Promise.reject(
                            new Error(
                              'Das Passwort muss mindestens einen Großbuchstaben enthalten.',
                            ),
                          );
                        if (!/\d/.test(value))
                          return Promise.reject(
                            new Error('Das Passwort muss mindestens eine Zahl enthalten.'),
                          );
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<Lock className="h-4 w-4" />}
                    placeholder="Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Zahl"
                    autoComplete="new-password"
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Form.Item>

                {/* Password strength indicator */}
                {newPassword.length > 0 && (
                  <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Passwortsicherheit</span>
                      <span className="font-semibold text-slate-800">
                        {passwordChecks.strength}
                      </span>
                    </div>
                    <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-1.5 rounded-full transition-all ${passwordChecks.strengthColor}`}
                        style={{ width: `${(passwordChecks.passed / 3) * 100}%` }}
                      />
                    </div>
                    <div className="grid gap-1 text-[11px]">
                      <span className={passwordChecks.hasMinLength ? 'text-emerald-600' : 'text-slate-400'}>
                        Mindestens 8 Zeichen
                      </span>
                      <span className={passwordChecks.hasUppercase ? 'text-emerald-600' : 'text-slate-400'}>
                        Mindestens ein Großbuchstabe
                      </span>
                      <span className={passwordChecks.hasNumber ? 'text-emerald-600' : 'text-slate-400'}>
                        Mindestens eine Zahl
                      </span>
                    </div>
                  </div>
                )}

                <Form.Item
                  name="password_confirmation"
                  label="Passwort bestätigen"
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
                  <Input.Password
                    prefix={<Lock className="h-4 w-4" />}
                    placeholder="Passwort wiederholen"
                    autoComplete="new-password"
                  />
                </Form.Item>

                {renderActions(
                  () => {
                    setResetStep(2);
                    setError(null);
                  },
                  'Passwort setzen',
                  true,
                )}
              </Form>
            )}
          </div>
        </div>

        {/* Below-card hint */}
        <p className="mt-4 text-center text-xs text-white/60">
          Sie sind Mitarbeiter?{' '}
          <Link to="/auth" className="font-medium text-white/80 hover:text-white hover:underline">
            Zur Teamanmeldung
          </Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-10">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/60">
          <Link to="/" className="hover:text-white">
            Startseite
          </Link>
          <a href="/landing-page/impressum.html" className="hover:text-white">
            Impressum
          </a>
          <a href="/landing-page/datenschutz.html" className="hover:text-white">
            Datenschutz
          </a>
          <a href="/landing-page/agb.html" className="hover:text-white">
            AGB
          </a>
          <a href="/landing-page/cookie.html" className="hover:text-white">
            Cookies
          </a>
        </nav>
      </footer>
    </div>
  );
};

export default PortalAuthPage;
