import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUser, FaEnvelope, FaGlobe, FaSpinner, FaCheck, FaTimes, FaShieldAlt, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { authService, twoFactorService } from '../api/services';
import { QRCodeSVG } from 'qrcode.react';
import clsx from 'clsx';
import Input from '../components/common/Input';
import { Button } from '../components/ui/button';

const Profile = () => {
    const { t, i18n } = useTranslation();
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
            setMessage({ type: 'success', text: t('profile.messages.profile_updated') });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || t('profile.messages.profile_update_error') });
        } finally { setIsLoading(false); }
    };

    const handleChangePassword = async () => {
        setIsLoading(true); setMessage(null);
        try {
            await authService.changePassword(passwordData);
            setMessage({ type: 'success', text: t('profile.messages.password_changed') });
            setShowPasswordForm(false);
            setPasswordData({ current_password: '', password: '', password_confirmation: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || t('profile.messages.password_change_error') });
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
            setMessage({ type: 'error', text: t('profile.messages.two_factor_enabled_error') });
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
            setMessage({ type: 'success', text: t('profile.messages.two_factor_activated') });
        } catch (error: any) {
            setMessage({ type: 'error', text: t('profile.messages.two_factor_invalid_code') });
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
            setMessage({ type: 'success', text: t('profile.messages.two_factor_disabled') });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || t('profile.messages.wrong_password') });
        } finally { setIsLoading(false); }
    };

    const showRecoveryCodes = async () => {
        setIsLoading(true);
        try {
            const codes = await twoFactorService.getRecoveryCodes();
            setRecoveryCodes(codes);
            setShowRecoveryCodesInline(true);
        } catch (error) {
            setMessage({ type: 'error', text: t('profile.messages.recovery_codes_error') });
        } finally { setIsLoading(false); }
    };

    const handleRegenerateRecoveryCodes = async () => {
        setIsLoading(true);
        try {
            const codes = await twoFactorService.regenerateRecoveryCodes();
            setRecoveryCodes(codes);
            setMessage({ type: 'success', text: t('profile.messages.new_recovery_codes') });
        } catch (error) {
            setMessage({ type: 'error', text: t('profile.messages.new_recovery_codes_error') });
        } finally { setIsLoading(false); }
    };


    if (!user) return <div className="p-8 text-center"><FaSpinner className="animate-spin text-2xl mx-auto" /></div>;

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('locale', lng);
    };

    return (
        <div className="max-w-4xl mx-auto fade-in pb-10">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-medium text-slate-800">{t('profile.title')}</h1>
                <p className="text-slate-500 text-sm">{t('profile.subtitle')}</p>
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
                        <div className="h-20 bg-brand-primary"></div>
                        <div className="px-6 pb-6 text-center">
                            <div className="relative -mt-10 mb-4 inline-block">
                                <div className="w-20 h-20 rounded-sm bg-white p-1 shadow-sm mx-auto">
                                    <div className="w-full h-full rounded-sm bg-slate-100 flex items-center justify-center text-2xl font-bold text-brand-primary border border-slate-100">
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
                                    {user.email_verified_at && <FaCheck className="ml-2 text-emerald-500 text-xs" title={t('profile.verified')} />}
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <FaGlobe className="w-4 flex-shrink-0 mr-3 text-slate-400" />
                                    <span>{i18n.language === 'en' ? 'English (EN)' : 'Deutsch (DE)'}</span>
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
                                <h3 className="text-sm font-semibold text-slate-800">{t('profile.personal_data')}</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{t('profile.basic_info')}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <Input
                                label={t('profile.first_name')}
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder={t('profile.first_name')}
                            />
                            <Input
                                label={t('profile.last_name')}
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder={t('profile.last_name')}
                            />
                            <div className="sm:col-span-2">
                                <Input
                                    label={t('profile.email_address')}
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@beispiel.de"
                                />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <Button
                                variant="default"
                                onClick={handleUpdateProfile}
                                disabled={isLoading}
                                isLoading={isLoading}
                                className="px-8 py-2.5 text-sm font-bold"
                            >
                                {t('profile.save_profile')}
                            </Button>
                        </div>
                    </div>

                    {/* Language Selection */}
                    <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-sm bg-slate-50 text-brand-primary flex items-center justify-center border border-slate-100 shadow-sm font-bold"><FaGlobe className="text-sm" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">{t('profile.language')}</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Wählen Sie Ihre bevorzugte Sprache.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => changeLanguage('de')}
                                className={clsx(
                                    "p-4 rounded-sm border-2 transition-all flex flex-col items-center gap-2",
                                    i18n.language === 'de' ? "border-brand-primary bg-emerald-50/30 font-bold" : "border-slate-100 bg-white hover:border-slate-200"
                                )}
                            >
                                <span className={clsx("text-sm", i18n.language === 'de' ? "text-brand-primary" : "text-slate-600")}>Deutsch (DE)</span>
                            </button>
                            <button
                                onClick={() => changeLanguage('en')}
                                className={clsx(
                                    "p-4 rounded-sm border-2 transition-all flex flex-col items-center gap-2",
                                    i18n.language === 'en' ? "border-brand-primary bg-emerald-50/30 font-bold" : "border-slate-100 bg-white hover:border-slate-200"
                                )}
                            >
                                <span className={clsx("text-sm", i18n.language === 'en' ? "text-brand-primary" : "text-slate-600")}>English (EN)</span>
                            </button>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-sm bg-slate-50 text-brand-primary flex items-center justify-center border border-slate-100 shadow-sm font-bold"><FaShieldAlt className="text-sm" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">{t('profile.security')}</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{t('profile.auth_info')}</p>
                            </div>
                        </div>

                        {/* Password Change */}
                        <div className="mb-10 pb-10 border-b border-slate-100">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-sm src-slate-700 font-medium">{t('profile.change_password')}</h4>
                                    <p className="text-sm text-slate-500 mt-1">{t('profile.password_desc')}</p>
                                </div>
                                <button
                                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                                    className={clsx(
                                        "px-4 py-2 rounded-sm text-xs font-bold transition-all",
                                        showPasswordForm ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-sm"
                                    )}
                                >
                                    {showPasswordForm ? t('actions.cancel') : t('profile.change_password')}
                                </button>
                            </div>

                            {showPasswordForm && (
                                <div className="bg-slate-50 p-6 rounded-sm border border-slate-200 space-y-5 animate-slideDown">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <Input
                                                type="password"
                                                label={t('profile.current_password')}
                                                placeholder="••••••••"
                                                value={passwordData.current_password}
                                                onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                type="password"
                                                label={t('profile.new_password')}
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
                                                <p className="text-sm text-slate-400 mt-1 font-medium">
                                                    {passwordData.password.length === 0 ? t('profile.password_strength') :
                                                        passwordData.password.length < 6 ? t('profile.strength.very_weak') :
                                                            passwordData.password.length < 9 ? t('profile.strength.weak') :
                                                                passwordData.password.length < 12 ? t('profile.strength.medium') : t('profile.strength.strong')}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <Input
                                                type="password"
                                                label={t('profile.confirm_password')}
                                                placeholder="••••••••"
                                                value={passwordData.password_confirmation}
                                                onChange={e => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            variant="default"
                                            onClick={handleChangePassword}
                                            disabled={isLoading}
                                            isLoading={isLoading}
                                            className="px-8 py-2.5 text-xs font-bold"
                                        >
                                            {t('profile.confirm_security_update')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2FA Section */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-sm src-slate-700 font-medium flex items-center gap-2">
                                        {t('profile.two_factor')}
                                        {user.two_factor_confirmed_at ? <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-sm font-medium">{t('profile.active')}</span> : <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-sm font-medium">{t('profile.inactive')}</span>}
                                    </h4>
                                    <p className="text-sm text-slate-500 mt-1">{t('profile.two_factor_desc')}</p>
                                </div>
                                {!user.two_factor_confirmed_at ? (
                                    <button
                                        onClick={handleEnable2FA}
                                        disabled={isLoading}
                                        className={clsx(
                                            "px-4 py-2 rounded-sm text-xs font-semibold transition-all",
                                            showTwoFactorInline ? "bg-slate-100 text-slate-500" : "bg-slate-50 text-slate-900 hover:bg-slate-100"
                                        )}
                                    >
                                        {showTwoFactorInline ? t('actions.cancel') : t('profile.enable')}
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => { setShowRecoveryCodesInline(!showRecoveryCodesInline); if (!showRecoveryCodesInline) showRecoveryCodes(); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-sm text-xs font-bold hover:bg-slate-200">{t('profile.recovery_codes_btn')}</button>
                                        <button onClick={() => setShowDisableConfirmInline(!showDisableConfirmInline)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-sm text-xs font-bold hover:bg-red-100">{t('profile.disable')}</button>
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
                                                <h5 className="text-xs font-medium text-slate-700 mb-1">{t('profile.scan_qr')}</h5>
                                                <p className="text-sm text-slate-500">{t('profile.scan_qr_desc')}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-400 block ml-1">{t('profile.verification_code')}</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="000 000"
                                                        value={twoFactorCode}
                                                        onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                                        className="flex-1 text-center text-xl font-semibold border border-slate-300 rounded-sm py-2 focus:border-slate-900 outline-none"
                                                        maxLength={6}
                                                    />
                                                    <Button
                                                        onClick={handleConfirm2FA}
                                                        disabled={twoFactorCode.length < 6 || isLoading}
                                                    >
                                                        {t('profile.confirm')}
                                                    </Button>
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
                                        <h5 className="text-xs font-medium text-slate-700">{t('profile.recovery_codes_title')}</h5>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">{t('profile.recovery_codes_desc')}</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                                        {recoveryCodes.map((code, i) => (
                                            <div key={i} className="text-center py-1.5 bg-white border border-slate-200 rounded-sm text-sm font-medium text-slate-700 shadow-sm">{code}</div>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleRegenerateRecoveryCodes} disabled={isLoading} className="flex-1 py-2 bg-slate-50 text-slate-900 font-bold text-xs rounded-sm hover:bg-slate-100 transition-all border border-slate-200">{t('profile.regenerate_codes')}</button>
                                        <button onClick={() => setShowRecoveryCodesInline(false)} className="flex-1 py-2 bg-slate-800 text-white font-bold text-xs rounded-sm hover:bg-black transition-all">{t('profile.got_it')}</button>
                                    </div>
                                </div>
                            )}

                            {/* Disable Confirm Inline */}
                            {showDisableConfirmInline && (
                                <div className="bg-rose-50 p-6 rounded-sm border border-rose-100 animate-slideDown">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FaShieldAlt className="text-rose-600" />
                                        <h5 className="text-xs font-medium text-rose-700">{t('profile.disable_2fa_title')}</h5>
                                    </div>
                                    <p className="text-sm text-rose-600/80 mb-4 font-medium">{t('profile.disable_2fa_desc')}</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            placeholder={t('profile.confirm_password_placeholder')}
                                            value={disablePassword}
                                            onChange={e => setDisablePassword(e.target.value)}
                                            className="flex-1 px-4 py-2 border border-rose-200 rounded-sm text-sm outline-none focus:border-rose-500 bg-white shadow-inner"
                                        />
                                        <button
                                            onClick={handleDisable2FA}
                                            disabled={!disablePassword || isLoading}
                                            className="px-6 bg-rose-600 text-white font-semibold text-xs rounded-sm hover:bg-rose-700 disabled:opacity-50 transition-all shadow-sm shadow-rose-500/10"
                                        >
                                            {t('profile.disable')}
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
