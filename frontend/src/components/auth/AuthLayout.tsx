import type { ReactNode } from 'react';
import { FaFolderOpen, FaFileInvoiceDollar, FaUsers } from 'react-icons/fa';

interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
    return (
        <div className="min-h-screen flex">
            {/* Left Side - Hero Image & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1B4D4F] via-teal-700 to-teal-900 relative overflow-hidden">
                {/* Background Image Placeholder - Replace src with your image */}
                <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/auth-hero-placeholder.jpg)' }}></div>

                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-300 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo & Title */}
                    <div>
                        <div className="inline-flex items-center gap-3 mb-8">
                            <div className="bg-white w-14 h-14 rounded-lg flex items-center justify-center font-bold text-[#1B4D4F] text-2xl shadow-lg">
                                TO
                            </div>
                            <span className="text-2xl font-bold text-white">Translator Office</span>
                        </div>

                        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                            Die moderne Lösung für Ihr Übersetzungsbüro
                        </h1>
                        <p className="text-lg text-teal-100 max-w-lg">
                            Verwalten Sie Projekte, Kunden, Partner und Rechnungen — alles an einem Ort.
                            Professionell, effizient und GoBD-konform.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        <FeatureItem
                            icon={<FaFolderOpen className="w-6 h-6" />}
                            title="Vollständige Projektverwaltung"
                            description="Von Anfrage bis Rechnung — alles im Blick"
                        />
                        <FeatureItem
                            icon={<FaFileInvoiceDollar className="w-6 h-6" />}
                            title="GoBD-konforme Rechnungen"
                            description="ZUGFeRD & DATEV-Export inklusive"
                        />
                        <FeatureItem
                            icon={<FaUsers className="w-6 h-6" />}
                            title="Partner-Portal"
                            description="Nahtlose Zusammenarbeit mit Übersetzern"
                        />
                    </div>

                    {/* Footer */}
                    <div className="text-sm text-teal-200">
                        © 2024 Translator Office — Made in Germany
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="bg-[#1B4D4F] w-16 h-16 rounded-lg flex items-center justify-center font-bold text-white text-2xl shadow-lg">
                            TO
                        </div>
                    </div>

                    {title && (
                        <div className="mb-8 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
                            {subtitle && (
                                <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface FeatureItemProps {
    icon: ReactNode;
    title: string;
    description: string;
}

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => {
    return (
        <div className="flex items-start gap-4">
            <div className="shrink-0 text-teal-200">{icon}</div>
            <div>
                <h3 className="font-semibold text-white text-base">{title}</h3>
                <p className="text-sm text-teal-100">{description}</p>
            </div>
        </div>
    );
};

export default AuthLayout;
