import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaGlobe, FaSpinner, FaCheck, FaTimes, FaShieldAlt, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { authService, twoFactorService } from '../api/services';
import { QRCodeSVG } from 'qrcode.react';
import clsx from 'clsx';
import Input from '../components/common/Input';

const Profile = () => {
    const { user, refreshUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile Form State
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', language: 'de' });

    // Password Form State
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({ current_password: '', password: '', password_confirmation: '' });

    // 2FA State
    const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string, otpauth_url: string } | null>(null);
    const [showTwoFactorInline, setShowTwoFactorInline] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
    const [showRecoveryCodesInline, setShowRecoveryCodesInline] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [showDisableConfirmInline, setShowDisableConfirmInline] = useState(false);

    useEffect(() => {
        if (user) {
            const nameParts = user.name ? user.name.split(' ') : ['', ''];
            setFormData({
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: user.email || '',
                language: user.language || 'de'
            });
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        setIsLoading(true); setMessage(null);
        try {
            await authService.updateProfile({
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                language: formData.language
            });
            await refreshUser();
            setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Fehler beim Aktualisieren des Profils.' });
        } finally { setIsLoading(false); }
    };

    const handleChangePassword = async () => {
        setIsLoading(true); setMessage(null);
        try {
            await authService.changePassword(passwordData);
            setMessage({ type: 'success', text: 'Passwort erfolgreich geändert.' });
            setShowPasswordForm(false);
            setPasswordData({ current_password: '', password: '', password_confirmation: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Fehler beim Ändern des Passworts.' });
        } finally { setIsLoading(false); }
    };

    const handleEnable2FA = async () => {
        setIsLoading(true);
        try {
            const data = await twoFactorService.enable();
            setTwoFactorSetup(data);
            setShowTwoFactorInline(true);
            setTwoFactorCode('');
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Fehler beim Starten der 2FA-Einrichtung.' });
        } finally { setIsLoading(false); }
    };

    const handleConfirm2FA = async () => {
        if (!twoFactorCode) return;
        setIsLoading(true);
        try {
            const response = await twoFactorService.confirm(twoFactorCode);
            setRecoveryCodes(response.recovery_codes);
            setShowTwoFactorInline(false);
            setShowRecoveryCodesInline(true);
            await refreshUser();
            setMessage({ type: 'success', text: '2FA erfolgreich aktiviert!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Ungültiger Code. Bitte versuchen Sie es erneut.' });
        } finally { setIsLoading(false); }
    };

    const handleDisable2FA = async () => {
        if (!disablePassword) return;
        setIsLoading(true);
        try {
            await twoFactorService.disable(disablePassword);
            setShowDisableConfirmInline(false);
            setDisablePassword('');
            await refreshUser();
            setMessage({ type: 'success', text: '2FA deaktiviert.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Passwort falsch.' });
        } finally { setIsLoading(false); }
    };

    const showRecoveryCodes = async () => {
        setIsLoading(true);
        try {
            const codes = await twoFactorService.getRecoveryCodes();
            setRecoveryCodes(codes);
            setShowRecoveryCodesInline(true);
        } catch (error) {
            setMessage({ type: 'error', text: 'Fehler beim Abrufen der Wiederherstellungscodes.' });
        } finally { setIsLoading(false); }
    };

    const handleRegenerateRecoveryCodes = async () => {
        setIsLoading(true);
        try {
            const codes = await twoFactorService.regenerateRecoveryCodes();
            setRecoveryCodes(codes);
            setMessage({ type: 'success', text: 'Neue Wiederherstellungscodes generiert.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Fehler beim Generieren neuer Codes.' });
        } finally { setIsLoading(false); }
    };


    if (!user) return <div className="p-8 text-center"><FaSpinner className="animate-spin text-2xl mx-auto" /></div>;

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    return (
        <div className="max-w-4xl mx-auto fade-in pb-10">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-medium text-slate-800">Mein Profil</h1>
                <p className="text-slate-500 text-sm">Verwalten Sie Ihre persönlichen Informationen und Sicherheitseinstellungen.</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-sm flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <FaCheck /> : <FaTimes />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                        <div className="h-20 bg-[#003333]"></div>
                        <div className="px-6 pb-6 text-center">
                            <div className="relative -mt-10 mb-4 inline-block">
                                <div className="w-20 h-20 rounded-sm bg-white p-1 shadow-sm mx-auto">
                                    <div className="w-full h-full rounded bg-slate-100 flex items-center justify-center text-2xl font-bold text-brand-primary border border-slate-100">
                                        {formData.firstName || formData.lastName ? getInitials(`${formData.firstName} ${formData.lastName}`) : 'JD'}
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-lg font-medium text-slate-800 truncate px-2">{formData.firstName} {formData.lastName}</h2>
                            <p className="text-xs font-medium text-slate-400 mt-1">{user.role || 'User'}</p>
                            <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-3">
                                <div className="flex items-center text-sm text-slate-600">
                                    <FaEnvelope className="w-4 flex-shrink-0 mr-3 text-slate-400" />
                                    <span className="truncate">{formData.email}</span>
                                    {user.email_verified_at && <FaCheck className="ml-2 text-emerald-500 text-xs" title="Verifiziert" />}
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <FaGlobe className="w-4 flex-shrink-0 mr-3 text-slate-400" />
                                    <span>{formData.language === 'en' ? 'English (EN)' : 'Deutsch (DE)'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Personal Info Form */}
                    <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-sm bg-slate-50 text-brand-primary flex items-center justify-center border border-slate-100 shadow-sm font-bold"><FaUser className="text-sm" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Persönliche Daten</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Ihre Grundinformationen</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <Input
                                label="Vorname"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="Vorname"
                            />
                            <Input
                                label="Nachname"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="Nachname"
                            />
                            <div className="sm:col-span-2">
                                <Input
                                    label="E-Mail ADRESSE"
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@beispiel.de"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Input
                                    isSelect
                                    label="Sprache / Language"
                                    value={formData.language}
                                    onChange={e => setFormData({ ...formData, language: e.target.value })}
                                >
                                    <option value="de">Deutsch (DE)</option>
                                    <option value="en">English (EN)</option>
                                </Input>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleUpdateProfile}
                                disabled={isLoading}
                                className="px-8 py-2.5 bg-brand-primary text-white rounded text-sm font-bold hover:bg-brand-primary/90 transition-all shadow-sm disabled:opacity-50"
                            >
                                Profil speichern
                            </button>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-sm bg-slate-50 text-brand-primary flex items-center justify-center border border-slate-100 shadow-sm font-bold"><FaShieldAlt className="text-sm" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Sicherheit & Zugang</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Passwort & Authentifizierung</p>
                            </div>
                        </div>

                        {/* Password Change */}
                        <div className="mb-10 pb-10 border-b border-slate-100">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-sm src-slate-700 font-medium">Passwort ändern</h4>
                                    <p className="text-sm text-slate-500 mt-1">Geben Sie Ihr aktuelles und ein neues Passwort ein.</p>
                                </div>
                                <button
                                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                                    className={clsx(
                                        "px-4 py-2 rounded text-xs font-bold transition-all",
                                        showPasswordForm ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-sm"
                                    )}
                                >
                                    {showPasswordForm ? 'Abbrechen' : 'Passwort ändern'}
                                </button>
                            </div>

                            {showPasswordForm && (
                                <div className="bg-slate-50 p-6 rounded-sm border border-slate-200 space-y-5 animate-slideDown">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <Input
                                                type="password"
                                                label="Aktuelles Passwort"
                                                placeholder="••••••••"
                                                value={passwordData.current_password}
                                                onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                type="password"
                                                label="Neues Passwort"
                                                placeholder="••••••••"
                                                value={passwordData.password}
                                                onChange={e => setPasswordData({ ...passwordData, password: e.target.value })}
                                            />
                                            <div className="mt-1.5">
                                                <div className="flex gap-1 h-1">
                                                    {[1, 2, 3, 4].map((level) => (
                                                        <div
                                                            key={level}
                                                            className={clsx(
                                                                "flex-1 rounded-full bg-slate-200 transition-all duration-300",
                                                                passwordData.password.length >= level * 3 && (level === 1 ? "bg-red-400" : level === 2 ? "bg-amber-400" : level === 3 ? "bg-blue-400" : "bg-emerald-400")
                                                            )}>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                    {passwordData.password.length === 0 ? 'Passwortstärke' :
                                                        passwordData.password.length < 6 ? 'Sehr schwach' :
                                                            passwordData.password.length < 9 ? 'Schwach' :
                                                                passwordData.password.length < 12 ? 'Mittel' : 'Stark'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <Input
                                                type="password"
                                                label="Wiederholen"
                                                placeholder="••••••••"
                                                value={passwordData.password_confirmation}
                                                onChange={e => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={isLoading}
                                            className="px-8 py-2.5 bg-brand-primary text-white rounded text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-sm disabled:opacity-70"
                                        >
                                            Sicherheitsupdate bestätigen
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2FA Section */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-sm src-slate-700 font-medium flex items-center gap-2">
                                        Zwei-Faktor-Authentifizierung (2FA)
                                        {user.two_factor_confirmed_at ? <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded font-medium">Aktiv</span> : <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-xs rounded font-medium">Inaktiv</span>}
                                    </h4>
                                    <p className="text-sm text-slate-500 mt-1">Schützen Sie Ihr Konto zusätzlich mit einem Code von Ihrem Smartphone.</p>
                                </div>
                                {!user.two_factor_confirmed_at ? (
                                    <button
                                        onClick={handleEnable2FA}
                                        disabled={isLoading}
                                        className={clsx(
                                            "px-4 py-2 rounded text-xs font-semibold transition-all",
                                            showTwoFactorInline ? "bg-slate-100 text-slate-500" : "bg-slate-50 text-slate-900 hover:bg-slate-100"
                                        )}
                                    >
                                        {showTwoFactorInline ? 'Abbrechen' : 'Aktivieren'}
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => { setShowRecoveryCodesInline(!showRecoveryCodesInline); if (!showRecoveryCodesInline) showRecoveryCodes(); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-xs font-bold hover:bg-slate-200">Codes</button>
                                        <button onClick={() => setShowDisableConfirmInline(!showDisableConfirmInline)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-xs font-bold hover:bg-red-100">Deaktivieren</button>
                                    </div>
                                )}
                            </div>

                            {/* 2FA Setup Inline */}
                            {showTwoFactorInline && twoFactorSetup && (
                                <div className="bg-slate-50 p-6 rounded-sm border border-slate-200 animate-slideDown">
                                    <div className="flex flex-col md:flex-row gap-8 items-center">
                                        <div className="bg-white p-3 rounded-sm border border-slate-200 shadow-sm">
                                            <QRCodeSVG value={twoFactorSetup.otpauth_url} size={150} />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h5 className="text-xs font-medium text-slate-700 mb-1">Authenticator scannen</h5>
                                                <p className="text-sm text-slate-500">Scannen Sie diesen QR-Code mit Ihrer Authenticator-App (z.B. Google Authenticator).</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-400 block ml-1">Verifizierungscode</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="000 000"
                                                        value={twoFactorCode}
                                                        onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                                        className="flex-1 text-center text-xl font-semibold border border-slate-300 rounded-sm py-2 focus:border-slate-900 outline-none"
                                                        maxLength={6}
                                                    />
                                                    <button
                                                        onClick={handleConfirm2FA}
                                                        disabled={twoFactorCode.length < 6 || isLoading}
                                                        className="px-6 bg-brand-primary text-white font-bold text-xs rounded-sm hover:bg-brand-primary/90 disabled:opacity-50 transition-all shadow-sm"
                                                    >
                                                        Bestätigen
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recovery Codes Inline */}
                            {showRecoveryCodesInline && recoveryCodes && (
                                <div className="bg-slate-50 p-6 rounded-sm border border-slate-200 animate-slideDown">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FaLock className="text-amber-500" />
                                        <h5 className="text-xs font-medium text-slate-700">Wiederherstellungscodes</h5>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">Speichern Sie diese Codes an einem sicheren Ort. Sie können verwendet werden, wenn Sie keinen Zugriff auf Ihr Gerät haben.</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                                        {recoveryCodes.map((code, i) => (
                                            <div key={i} className="text-center py-1.5 bg-white border border-slate-200 rounded-sm text-sm font-medium text-slate-700 shadow-sm">{code}</div>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleRegenerateRecoveryCodes} disabled={isLoading} className="flex-1 py-2 bg-slate-50 text-slate-900 font-bold text-xs rounded hover:bg-slate-100 transition-all border border-slate-200">Neue Codes generieren</button>
                                        <button onClick={() => setShowRecoveryCodesInline(false)} className="flex-1 py-2 bg-slate-800 text-white font-bold text-xs rounded hover:bg-black transition-all">Verstanden</button>
                                    </div>
                                </div>
                            )}

                            {/* Disable Confirm Inline */}
                            {showDisableConfirmInline && (
                                <div className="bg-rose-50 p-6 rounded-sm border border-rose-100 animate-slideDown">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FaShieldAlt className="text-rose-600" />
                                        <h5 className="text-xs font-medium text-rose-700">2FA Deaktivieren</h5>
                                    </div>
                                    <p className="text-sm text-rose-600/80 mb-4 font-medium">Bitte bestätigen Sie Ihr Passwort, um die Zwei-Faktor-Authentifizierung für Ihr Konto zu deaktivieren.</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            placeholder="Passwort bestätigen"
                                            value={disablePassword}
                                            onChange={e => setDisablePassword(e.target.value)}
                                            className="flex-1 px-4 py-2 border border-rose-200 rounded-sm text-sm outline-none focus:border-rose-500 bg-white shadow-inner"
                                        />
                                        <button
                                            onClick={handleDisable2FA}
                                            disabled={!disablePassword || isLoading}
                                            className="px-6 bg-rose-600 text-white font-semibold text-xs rounded-sm hover:bg-rose-700 disabled:opacity-50 transition-all shadow-sm shadow-rose-500/10"
                                        >
                                            Deaktivieren
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
