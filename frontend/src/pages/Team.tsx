import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaPlus, FaEdit, FaTrash, FaUser, FaUserShield, FaUserTie } from 'react-icons/fa';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { userService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';

type Role = 'manager' | 'employee';

interface TeamUser {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    last_login_at: string | null;
    created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
    owner: 'Inhaber',
    manager: 'Manager',
    employee: 'Mitarbeiter',
};

const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-amber-100 text-amber-800',
    manager: 'bg-slate-100 text-slate-800',
    employee: 'bg-slate-100 text-slate-700',
};

const RoleIcon = ({ role }: { role: string }) => {
    if (role === 'owner') return <FaUserShield className="text-amber-500" />;
    if (role === 'manager') return <FaUserTie className="text-slate-600" />;
    return <FaUser className="text-slate-400" />;
};

interface UserFormProps {
    initial?: Partial<TeamUser>;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    loading: boolean;
    isEdit?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ initial, onSubmit, onCancel, loading, isEdit }) => {
    const [form, setForm] = useState({
        name: initial?.name ?? '',
        email: initial?.email ?? '',
        role: (initial?.role ?? 'employee') as Role,
        password: '',
        status: initial?.status ?? 'active',
    });

    const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = { name: form.name, email: form.email, role: form.role };
        if (!isEdit || form.password) payload.password = form.password;
        if (isEdit) payload.status = form.status;
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                    type="text"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="Max Mustermann"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="max@beispiel.de"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rolle</label>
                <select
                    value={form.role}
                    onChange={e => set('role', e.target.value as Role)}
                    className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                    <option value="employee">Mitarbeiter</option>
                    <option value="manager">Manager</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                    Manager haben Zugriff auf Rechnungen, Berichte und Einstellungen.
                </p>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isEdit ? 'Neues Passwort (leer lassen = unverändert)' : 'Passwort'}
                </label>
                <input
                    type="password"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    required={!isEdit}
                    minLength={8}
                    className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder={isEdit ? '••••••••' : 'Mindestens 8 Zeichen'}
                />
            </div>
            {isEdit && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                        value={form.status}
                        onChange={e => set('status', e.target.value)}
                        className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    >
                        <option value="active">Aktiv</option>
                        <option value="inactive">Inaktiv</option>
                    </select>
                </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-slate-200 rounded-sm hover:bg-slate-50">
                    Abbrechen
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-brand-primary text-white font-bold rounded-sm hover:bg-brand-primary/90 disabled:opacity-50 transition shadow-sm"
                >
                    {loading ? 'Speichern…' : isEdit ? 'Speichern' : 'Hinzufügen'}
                </button>
            </div>
        </form>
    );
};

const Team: React.FC = () => {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'delete'; user?: TeamUser } | null>(null);

    const { data: users = [], isLoading } = useQuery<TeamUser[]>({
        queryKey: ['team-users'],
        queryFn: userService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => userService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-users'] });
            toast.success('Mitarbeiter wurde hinzugefügt.');
            setModal(null);
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? 'Fehler beim Erstellen.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => userService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-users'] });
            toast.success('Mitarbeiter wurde aktualisiert.');
            setModal(null);
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? 'Fehler beim Aktualisieren.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => userService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-users'] });
            toast.success('Mitarbeiter wurde gelöscht.');
            setModal(null);
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? 'Fehler beim Löschen.'),
    });

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl font-medium text-slate-800 truncate">Team & Mitarbeiter</h1>
                    <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">Verwalten Sie die Benutzer Ihres Mandanten.</p>
                </div>
                <div className="shrink-0">
                    <button
                        onClick={() => setModal({ type: 'add' })}
                        className="flex items-center justify-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-sm text-sm font-bold hover:bg-brand-primary/90 shadow-sm transition"
                    >
                        <FaPlus className="text-xs" /> <span className="hidden xs:inline">Mitarbeiter hinzufügen</span><span className="xs:hidden">Hinzufügen</span>
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-sm border border-slate-200 overflow-x-auto shadow-sm custom-scrollbar">
                {isLoading ? (
                    <div className="p-8 text-center text-sm text-slate-500">Wird geladen…</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Name</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">E-Mail</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Rolle</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Status</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Letzter Login</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-900 flex-shrink-0">
                                                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <span className="font-medium text-slate-800">
                                                {u.name}
                                                {u.id === currentUser?.id && (
                                                    <span className="ml-1.5 text-xs text-slate-400 font-normal">(Sie)</span>
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[u.role])}>
                                            <RoleIcon role={u.role} />
                                            {ROLE_LABELS[u.role] ?? u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                                            {u.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{formatDate(u.last_login_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setModal({ type: 'edit', user: u })}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors"
                                                title="Bearbeiten"
                                            >
                                                <FaEdit />
                                            </button>
                                            {u.id !== currentUser?.id && !u.role.includes('owner') && (
                                                <button
                                                    onClick={() => setModal({ type: 'delete', user: u })}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Löschen"
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                                        Noch keine weiteren Mitarbeiter vorhanden.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Role legend */}
            <div className="mt-4 flex items-center gap-6 text-xs text-slate-500">
                <span className="font-medium text-slate-600">Rollenübersicht:</span>
                <span className="flex items-center gap-1"><FaUserShield className="text-amber-500" /> Inhaber – Vollzugriff, Abonnement, Team</span>
                <span className="flex items-center gap-1"><FaUserTie className="text-slate-600" /> Manager – Rechnungen, Berichte, Einstellungen</span>
                <span className="flex items-center gap-1"><FaUser className="text-slate-400" /> Mitarbeiter – Projekte, Kunden</span>
            </div>

            {/* Add Modal */}
            {modal?.type === 'add' && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm shadow-sm w-full max-w-md p-6">
                        <h2 className="text-base font-medium text-slate-800 mb-4">Mitarbeiter hinzufügen</h2>
                        <UserForm
                            onSubmit={data => createMutation.mutate(data)}
                            onCancel={() => setModal(null)}
                            loading={createMutation.isPending}
                        />
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {modal?.type === 'edit' && modal.user && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm shadow-sm w-full max-w-md p-6">
                        <h2 className="text-base font-medium text-slate-800 mb-4">Mitarbeiter bearbeiten</h2>
                        <UserForm
                            initial={modal.user}
                            isEdit
                            onSubmit={data => updateMutation.mutate({ id: modal.user!.id, data })}
                            onCancel={() => setModal(null)}
                            loading={updateMutation.isPending}
                        />
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            <ConfirmModal
                isOpen={modal?.type === 'delete'}
                onClose={() => setModal(null)}
                onConfirm={() => modal?.user && deleteMutation.mutate(modal.user.id)}
                title="Mitarbeiter löschen"
                message={`Möchten Sie „${modal?.user?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
                confirmLabel="Löschen"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

export default Team;
