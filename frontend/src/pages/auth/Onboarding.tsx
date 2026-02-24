import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUniversity
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';
import { Button, Input, Select, Progress, Typography, Card, Space, Tag } from 'antd';
import { BankOutlined, CreditCardOutlined, SafetyCertificateOutlined, RightOutlined, LeftOutlined, RocketOutlined, InfoCircleOutlined, CheckCircleFilled } from '@ant-design/icons';
import { IMaskInput } from 'react-imask';
import { fetchBankByIban, fetchCityByZip } from '../../utils/autoFill';

const { Title, Text } = Typography;
const { Option } = Select;

const steps = [
    { title: 'Unternehmen', icon: <BankOutlined />, description: 'Grunddaten' },
    { title: 'Finanzen', icon: <CreditCardOutlined />, description: 'Bankverbindung' },
    { title: 'Plan & Lizenz', icon: <SafetyCertificateOutlined />, description: 'Konfiguration' }
];

const OnboardingPage = () => {
    const { onboard } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidatingBank, setIsValidatingBank] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        company_name: '',
        legal_form: '',
        address_street: '',
        address_house_no: '',
        address_zip: '',
        address_city: '',
        address_country: 'Deutschland',
        bank_name: '',
        bank_iban: '',
        bank_bic: '',
        tax_number: '',
        vat_id: '',
        subscription_plan: 'basic',
        license_key: '',
    });

    // Auto-fetch City by ZIP
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.address_zip.length >= 5 && !formData.address_city) {
                const city = await fetchCityByZip(formData.address_zip, formData.address_country);
                if (city) {
                    setFormData(prev => ({ ...prev, address_city: city }));
                }
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.address_zip, formData.address_country]);

    // Handle IBAN Change with Auto-fill
    const handleIbanChange = async (value: string) => {
        const cleanIban = value.replace(/\s/g, '').toUpperCase();
        setFormData(prev => ({ ...prev, bank_iban: value }));

        if (cleanIban.length >= 15) {
            setIsValidatingBank(true);
            try {
                const bankData = await fetchBankByIban(cleanIban);
                if (bankData) {
                    setFormData(prev => ({
                        ...prev,
                        bank_name: bankData.bankName,
                        bank_bic: bankData.bic
                    }));
                }
            } finally {
                setIsValidatingBank(false);
            }
        }
    };

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleNext = () => {
        // Simple validation
        if (currentStep === 0) {
            if (!formData.company_name || !formData.address_street || !formData.address_zip || !formData.address_city) {
                setError('Bitte füllen Sie alle Pflichtfelder aus.');
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
        setError(null);
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        setError(null);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onboard(formData);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Onboarding fehlgeschlagen. Bitte prüfen Sie Ihre Eingaben.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name des Übersetzungsbüros</label>
                                <Input
                                    size="large"
                                    placeholder="z.B. WordFlow Translations GmbH"
                                    value={formData.company_name}
                                    onChange={(e) => handleChange('company_name', e.target.value)}
                                    className="skeuo-input h-12 rounded-lg"
                                />
                                <Text type="secondary" style={{ fontSize: '11px' }}>Offizieller Firmenname für Rechnungen.</Text>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rechtsform</label>
                                <Input
                                    placeholder="z.B. GmbH, Einzelunternehmen"
                                    value={formData.legal_form}
                                    onChange={(e) => handleChange('legal_form', e.target.value)}
                                    className="skeuo-input h-11 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Land</label>
                                <Select
                                    className="w-full h-11"
                                    value={formData.address_country}
                                    onChange={(val) => handleChange('address_country', val)}
                                >
                                    <Option value="Deutschland">Deutschland</Option>
                                    <Option value="Österreich">Österreich</Option>
                                    <Option value="Schweiz">Schweiz</Option>
                                </Select>
                            </div>

                            <div className="col-span-2 grid grid-cols-4 gap-4">
                                <div className="col-span-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Straße</label>
                                    <Input
                                        placeholder="Musterweg"
                                        value={formData.address_street}
                                        onChange={(e) => handleChange('address_street', e.target.value)}
                                        className="skeuo-input h-11 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nr.</label>
                                    <Input
                                        placeholder="12"
                                        value={formData.address_house_no}
                                        onChange={(e) => handleChange('address_house_no', e.target.value)}
                                        className="skeuo-input h-11 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PLZ</label>
                                    <Input
                                        placeholder="12345"
                                        value={formData.address_zip}
                                        onChange={(e) => handleChange('address_zip', e.target.value)}
                                        className="skeuo-input h-11 rounded-lg"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Stadt</label>
                                    <Input
                                        placeholder="Berlin"
                                        value={formData.address_city}
                                        onChange={(e) => handleChange('address_city', e.target.value)}
                                        className="skeuo-input h-11 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <Card className="bg-blue-50/50 border-blue-100/50 rounded-xl">
                            <Space align="start">
                                <InfoCircleOutlined className="text-blue-500 mt-1" />
                                <Text type="secondary" style={{ fontSize: '13px' }}>
                                    Ihre Bankdaten werden für Rechnungen und Auszahlungen benötigt. Wir nutzen eine Schnittstelle zur automatischen Erkennung Ihrer Bank.
                                </Text>
                            </Space>
                        </Card>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">IBAN</label>
                                <div className="relative">
                                    <IMaskInput
                                        mask="EE00 0000 0000 0000 0000 00" // Generic European mask, but works well
                                        definitions={{
                                            'E': /[a-zA-Z]/,
                                        }}
                                        prepare={(str) => str.toUpperCase()}
                                        value={formData.bank_iban}
                                        unmask={false}
                                        onAccept={(value) => handleIbanChange(value)}
                                        className="ant-input ant-input-lg skeuo-input h-12 rounded-lg w-full px-3 py-1 font-mono tracking-wider"
                                        placeholder="DE00 1234 5678 9012 3456 78"
                                    />
                                    {isValidatingBank && (
                                        <div className="absolute right-3 top-3.5">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bankname</label>
                                    <Input
                                        size="large"
                                        placeholder="Wird automatisch erkannt..."
                                        prefix={<FaUniversity className="text-slate-300 mr-2" />}
                                        value={formData.bank_name}
                                        onChange={(e) => handleChange('bank_name', e.target.value)}
                                        className="skeuo-input h-11 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">BIC / SWIFT</label>
                                    <Input
                                        placeholder="BIC Code"
                                        value={formData.bank_bic}
                                        onChange={(e) => handleChange('bank_bic', e.target.value)}
                                        className="skeuo-input h-11 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <Title level={5} className="mb-4">Steuerliche Angaben</Title>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Steuernummer</label>
                                        <Input
                                            placeholder="12/345/67890"
                                            value={formData.tax_number}
                                            onChange={(e) => handleChange('tax_number', e.target.value)}
                                            className="skeuo-input h-11 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">USt-IdNr.</label>
                                        <Input
                                            placeholder="DE123456789"
                                            value={formData.vat_id}
                                            onChange={(e) => handleChange('vat_id', e.target.value)}
                                            className="skeuo-input h-11 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'basic', name: 'Lite', price: '49', color: 'blue' },
                                { id: 'pro', name: 'Professional', price: '99', color: 'indigo' },
                                { id: 'premium', name: 'Enterprise', price: '199', color: 'slate' }
                            ].map((p) => (
                                <Card
                                    key={p.id}
                                    onClick={() => handleChange('subscription_plan', p.id)}
                                    className={clsx(
                                        "cursor-pointer transition-all duration-300 rounded-2xl border-2",
                                        formData.subscription_plan === p.id
                                            ? "border-blue-500 bg-blue-50/30 shadow-md scale-105"
                                            : "border-slate-100 hover:border-slate-200"
                                    )}
                                    styles={{ body: { padding: '24px 16px' } }}
                                >
                                    <div className="text-center">
                                        <Text strong className="block uppercase text-[10px] tracking-widest text-slate-400 mb-1">{p.name}</Text>
                                        <Title level={2} style={{ margin: 0 }} className="tabular-nums">
                                            €{p.price}<span className="text-xs text-slate-400">/m</span>
                                        </Title>
                                        {formData.subscription_plan === p.id && <CheckCircleFilled className="text-blue-500 mt-2 text-lg" />}
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Haben Sie einen Lizenzschlüssel?</label>
                            <Input
                                size="large"
                                prefix={<SafetyCertificateOutlined className="text-slate-400 mr-2" />}
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                value={formData.license_key}
                                onChange={(e) => handleChange('license_key', e.target.value)}
                                className="skeuo-input h-12 rounded-xl"
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 sm:p-6 lg:p-12 text-slate-800 font-sans">
            <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col lg:flex-row min-h-[700px]">

                {/* Visual Sidebar */}
                <div className="lg:w-1/3 bg-[#0d6efd] p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <Space className="mb-12">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-xl">
                                <RocketOutlined className="text-2xl" />
                            </div>
                            <Title level={4} style={{ color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>TransOffice</Title>
                        </Space>

                        <div className="space-y-10">
                            {steps.map((step, i) => (
                                <div key={i} className={clsx(
                                    "flex items-center gap-5 transition-all duration-500",
                                    currentStep === i ? "opacity-100 translate-x-3" : "opacity-40"
                                )}>
                                    <div className={clsx(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 shadow-lg border",
                                        currentStep > i ? "bg-emerald-400 border-white/20" :
                                            currentStep === i ? "bg-white text-blue-600 border-white shadow-white/20" : "bg-white/10 border-white/10"
                                    )}>
                                        {currentStep > i ? <CheckCircleFilled className="text-white" /> : step.icon}
                                    </div>
                                    <div>
                                        <Text className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Schritt 0{i + 1}</Text>
                                        <Text strong className="text-white text-lg">{step.title}</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 bg-white/10 p-6 rounded-[24px] backdrop-blur-md border border-white/20">
                        <Text className="text-white/80 text-xs leading-relaxed block italic">
                            "Wir digitalisieren Ihren Übersetzungsprozess von Grund auf. Starten Sie jetzt Ihre Reise."
                        </Text>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-8 lg:p-16 flex flex-col justify-between overflow-y-auto">
                    <div>
                        <div className="mb-10 text-center lg:text-left">
                            <Tag color="blue" className="rounded-full px-4 py-0.5 border-none font-bold uppercase text-[10px] mb-4">Onboarding</Tag>
                            <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em', fontSize: '32px' }}>
                                {steps[currentStep].title}
                            </Title>
                            <Text type="secondary" style={{ fontSize: '16px' }}>{steps[currentStep].description}</Text>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-8 flex items-center gap-3 animate-shake">
                                <InfoCircleOutlined />
                                <Text strong className="text-red-600">{error}</Text>
                            </div>
                        )}

                        <div className="min-h-[350px]">
                            {renderStep()}
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100/60">
                        {/* Progress */}
                        <div className="flex justify-between items-center mb-6">
                            <Text strong className="text-[10px] uppercase tracking-widest text-slate-400">Fortschritt</Text>
                            <Text strong className="text-blue-600 text-xs">{Math.round(((currentStep + 1) / steps.length) * 100)}%</Text>
                        </div>
                        <Progress
                            percent={((currentStep + 1) / steps.length) * 100}
                            showInfo={false}
                            strokeColor={{
                                '0%': '#3391ff',
                                '100%': '#0d6efd',
                            }}
                            className="mb-8"
                        />

                        <div className="flex justify-between items-center">
                            <Button
                                size="large"
                                icon={<LeftOutlined />}
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className={clsx("h-12 px-6 rounded-xl border-none shadow-none font-bold text-slate-400 transition-all", currentStep === 0 && "opacity-0")}
                            >
                                Zurück
                            </Button>

                            {currentStep < steps.length - 1 ? (
                                <Button
                                    type="primary"
                                    size="large"
                                    className="skeuo-button h-14 px-10 rounded-2xl font-bold shadow-xl flex items-center gap-2 group"
                                    onClick={handleNext}
                                >
                                    Weiter <RightOutlined className="group-hover:translate-x-1 transition-transform" />
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    size="large"
                                    className="h-14 px-12 rounded-2xl font-bold bg-emerald-600 border-none shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3 animate-pulse"
                                    onClick={handleSubmit}
                                    loading={isLoading}
                                >
                                    System starten <RocketOutlined />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 40% { transform: translateX(10px); } 60% { transform: translateX(-10px); } 80% { transform: translateX(10px); } }
                .animate-shake { animation: shake 0.5s ease-in-out; }
                .skeuo-input { transition: all 0.2s ease !important; }
                .skeuo-input:focus { transform: translateY(-1px); }
            `}</style>
        </div>
    );
};

export default OnboardingPage;

