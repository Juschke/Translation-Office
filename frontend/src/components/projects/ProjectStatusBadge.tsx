import React from 'react';
import clsx from 'clsx';

interface ProjectStatusBadgeProps {
    status: string;
}

const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = ({ status }) => {
    const labels: { [key: string]: string } = {
        'draft': 'Neu',
        'offer': 'Neu',
        'pending': 'Neu',
        'in_progress': 'Bearbeitung',
        'review': 'Bearbeitung',
        'ready_for_pickup': 'Abholbereit',
        'delivered': 'Geliefert',
        'invoiced': 'Rechnung',
        'completed': 'Abgeschlossen',
        'cancelled': 'Storniert',
        'archived': 'Archiviert',
        'deleted': 'Gelöscht'
    };
    const styles: { [key: string]: string } = {
        'draft': 'bg-slate-50 text-slate-600 border-slate-200',
        'offer': 'bg-orange-50 text-orange-700 border-orange-200',
        'pending': 'bg-orange-50 text-orange-700 border-orange-200',
        'in_progress': 'bg-blue-50 text-blue-700 border-blue-200',
        'review': 'bg-blue-50 text-blue-700 border-blue-200',
        'ready_for_pickup': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'invoiced': 'bg-purple-50 text-purple-700 border-purple-200',
        'completed': 'bg-emerald-600 text-white border-emerald-700',
        'cancelled': 'bg-gray-100 text-gray-500 border-gray-300',
        'archived': 'bg-slate-100 text-slate-500 border-slate-300',
        'deleted': 'bg-red-50 text-red-700 border-red-200'
    };
    return <span className={clsx("px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border tracking-tight shadow-sm", styles[status] || styles['draft'])}>{labels[status] || status}</span>;
};

export default ProjectStatusBadge;
