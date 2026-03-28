import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FaClock, FaCircle } from 'react-icons/fa';

interface GuestProjectHeaderProps {
    project: any;
    tenant: any;
}

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = d.getDate();
    const weekday = d.toLocaleDateString('de-DE', { weekday: 'long' });
    const month = d.toLocaleDateString('de-DE', { month: 'long' });
    const year = d.getFullYear();
    return `${weekday}, ${day}. ${month} ${year}`;
};

const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
        draft: 'bg-slate-100 text-slate-700',
        offer: 'bg-blue-100 text-blue-700',
        pending: 'bg-yellow-100 text-yellow-700',
        processing: 'bg-blue-500 text-white',
        translating: 'bg-blue-500 text-white',
        review: 'bg-purple-100 text-purple-700',
        ready_for_pickup: 'bg-emerald-100 text-emerald-700',
        delivered: 'bg-emerald-500 text-white',
        completed: 'bg-emerald-600 text-white',
        invoiced: 'bg-teal-100 text-teal-700',
        paid: 'bg-green-600 text-white',
        archived: 'bg-slate-300 text-slate-700',
    };
    return statusColors[status] || 'bg-slate-100 text-slate-600';
};

const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        draft: 'Entwurf',
        offer: 'Angebot',
        pending: 'Eingegangen',
        processing: 'In Bearbeitung',
        translating: 'In Übersetzung',
        review: 'In Prüfung',
        ready_for_pickup: 'Bereit zur Abholung',
        delivered: 'Geliefert',
        completed: 'Abgeschlossen',
        invoiced: 'Berechnet',
        paid: 'Bezahlt',
        archived: 'Archiviert',
    };
    return labels[status] || status;
};

export const GuestProjectHeader: React.FC<GuestProjectHeaderProps> = ({ project, tenant }) => {
    return (
        <div className="rounded-sm border border-slate-200 shadow-sm bg-white overflow-hidden">
            {/* Header mit Brand-Gradient */}
            <div className="bg-gradient-to-r from-[#1B4D4F] to-[#2a6b6e] px-4 sm:px-6 md:px-8 py-6 text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold">{project.project_name}</h1>
                        <p className="text-sm text-white/80 mt-1">
                            Projekt-Nr: {project.project_number} • {project.role === 'partner' ? 'Partner-Portal' : 'Kunden-Portal'}
                        </p>
                    </div>
                    {tenant?.company_name && (
                        <div className="text-sm font-medium bg-white/10 px-4 py-2 rounded-sm">
                            {tenant.company_name}
                        </div>
                    )}
                </div>
            </div>

            {/* Status & Deadline Section */}
            <div className="px-4 sm:px-6 md:px-8 py-5 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <span className="block text-xs font-medium text-slate-600 mb-2">Status</span>
                        <span
                            className={clsx(
                                'inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-semibold',
                                getStatusColor(project.status)
                            )}
                        >
                            <FaCircle className="text-[8px]" />
                            {getStatusLabel(project.status)}
                        </span>
                    </div>
                    {project.deadline && (
                        <div>
                            <span className="block text-xs font-medium text-slate-600 mb-2">Liefertermin</span>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <FaClock className="text-slate-400" />
                                {formatDate(project.deadline)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
