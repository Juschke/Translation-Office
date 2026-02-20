import React, { useState, useEffect } from 'react';
import { FaTimes, FaServer, FaKey, FaUser, FaInfoCircle } from 'react-icons/fa';
import Input from '../common/Input';

interface NewEmailAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

const NewEmailAccountModal: React.FC<NewEmailAccountModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        smtp_host: '',
        smtp_port: 587,
        smtp_encryption: 'tls',
        imap_host: '',
        imap_port: 993,
        imap_encryption: 'ssl',
        username: '',
        password: '',
        is_default: false,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
            });
        } else if (isOpen) {
            setFormData({
                name: '',
                email: '',
                smtp_host: '',
                smtp_port: 587,
                smtp_encryption: 'tls',
                imap_host: '',
                imap_port: 993,
                imap_encryption: 'ssl',
                username: '',
                password: '',
                is_default: false,
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'smtp_port' || name === 'imap_port' ? parseInt(value) || 0 : value)
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in-up transform transition-all">
                <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-3">
                            {initialData ? 'E-Mail Konto bearbeiten' : 'Neues E-Mail Konto anlegen'}
                            <span className="text-xs font-normal text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full uppercase">
                                SMTP / IMAP Konfiguration
                            </span>
                        </h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10 bg-white">
                        {/* Section 1: Account Details */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                <FaUser className="text-brand-600" /> Konto-Details
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Input
                                        label="Konto-Bezeichnung *"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="z.B. Hauptkonto, Support, Info"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        label="E-Mail Adresse *"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        type="email"
                                        placeholder="beispiel@domain.de"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100"></div>

                        {/* Section 2: SMTP Configuration */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                <FaServer className="text-brand-600" /> Ausgangsserver (SMTP)
                            </label>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3">
                                    <Input
                                        label="SMTP Host *"
                                        name="smtp_host"
                                        value={formData.smtp_host}
                                        onChange={handleChange}
                                        placeholder="smtp.domain.de"
                                        required
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Input
                                        label="Port *"
                                        name="smtp_port"
                                        value={formData.smtp_port.toString()}
                                        onChange={handleChange}
                                        type="number"
                                        placeholder="587"
                                        required
                                    />
                                </div>
                                <div className="col-span-4">
                                    <Input
                                        isSelect
                                        label="Verschlüsselung"
                                        name="smtp_encryption"
                                        value={formData.smtp_encryption}
                                        onChange={handleChange}
                                    >
                                        <option value="tls">TLS (empfohlen)</option>
                                        <option value="ssl">SSL</option>
                                        <option value="none">Keine</option>
                                    </Input>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100"></div>

                        {/* Section 2b: IMAP Configuration */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                <FaServer className="text-brand-600" /> Eingangsserver (IMAP)
                            </label>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3">
                                    <Input
                                        label="IMAP Host *"
                                        name="imap_host"
                                        value={formData.imap_host}
                                        onChange={handleChange}
                                        placeholder="imap.domain.de"
                                        required
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Input
                                        label="Port *"
                                        name="imap_port"
                                        value={formData.imap_port.toString()}
                                        onChange={handleChange}
                                        type="number"
                                        placeholder="993"
                                        required
                                    />
                                </div>
                                <div className="col-span-4">
                                    <Input
                                        isSelect
                                        label="Verschlüsselung"
                                        name="imap_encryption"
                                        value={formData.imap_encryption}
                                        onChange={handleChange}
                                    >
                                        <option value="ssl">SSL (empfohlen)</option>
                                        <option value="tls">TLS</option>
                                        <option value="none">Keine</option>
                                    </Input>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100"></div>

                        {/* Section 3: Authentication */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                <FaKey className="text-brand-600" /> Authentifizierung
                            </label>

                            <div className="grid grid-cols-1 gap-4">
                                <Input
                                    label="Benutzername *"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Meist identisch mit E-Mail Adresse"
                                    required
                                />
                                <Input
                                    label="Passwort *"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    type="password"
                                    placeholder="••••••••"
                                    required={!initialData}
                                />
                            </div>
                        </div>

                        <div className="border-t border-slate-100"></div>

                        {/* Section 4: Settings */}
                        <div className="space-y-4 pb-8">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                <FaInfoCircle className="text-brand-600" /> Einstellungen
                            </label>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded">
                                <input
                                    type="checkbox"
                                    id="is_default"
                                    name="is_default"
                                    checked={formData.is_default}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                                />
                                <label htmlFor="is_default" className="text-xs font-bold text-slate-700 cursor-pointer">
                                    Als Standard-Konto festlegen
                                    <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                                        Dieses Konto wird automatisch für neue E-Mails verwendet
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded border border-slate-300 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-white transition"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2.5 bg-brand-700 text-white rounded text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-brand-800 transition transform hover:scale-105 active:scale-95"
                        >
                            Konto speichern
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewEmailAccountModal;
