import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaPlus, FaChevronDown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { settingsService } from '../../api/services';
import SearchableSelect from './SearchableSelect';
import Input from './Input';
import clsx from 'clsx';
import { Button } from '../ui/button';

interface ProjectStatusSelectProps {
    options: { value: string; label: string; }[];
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    className?: string;
    placeholder?: string;
}

const ProjectStatusSelect: React.FC<ProjectStatusSelectProps> = ({
    options,
    value,
    onChange,
    error,
    className,
    placeholder = 'Status auswählen...'
}) => {
    const [showForm, setShowForm] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [newName, setNewName] = useState('');

    const queryClient = useQueryClient();
    const formRef = React.useRef<HTMLDivElement>(null);

    const createStatusMutation = useMutation({
        mutationFn: settingsService.createProjectStatus,
        onSuccess: (newStatus) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'projectStatuses'] });
            onChange(newStatus.key || newStatus.id.toString());
            setShowForm(false);
            setIsExpanded(false);
            setNewName('');
            toast.success('Status hinzugefügt');
        },
        onError: () => {
            toast.error('Fehler beim Erstellen des Status');
        }
    });

    const handleQuickAddSubmit = () => {
        if (!newName.trim()) {
            toast.error('Name erforderlich');
            return;
        }
        createStatusMutation.mutate({ name: newName, key: newName.toLowerCase().replace(/\s+/g, '_') });
    };

    return (
        <div className={clsx('w-full', className)}>
            <div className="flex items-end gap-0">
                <div className="flex-1 min-w-0">
                    <SearchableSelect
                        options={options}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        error={error}
                        roundedSide="left"
                        preserveOrder={true}
                    />
                </div>
                <Button
                    type="button"
                    onClick={() => {
                        if (showForm) {
                            setIsExpanded(!isExpanded);
                        } else {
                            setShowForm(true);
                            setIsExpanded(true);
                        }
                    }}
                    className="h-9 px-3 bg-white text-slate-400 border border-slate-300 border-l-0 rounded-r-sm hover:bg-slate-50 hover:text-brand-primary transition flex items-center shadow-sm shrink-0"
                >
                    {showForm ? (
                        <FaChevronDown className={clsx('text-xs transition-transform', isExpanded ? 'rotate-180' : '')} />
                    ) : (
                        <FaPlus className="text-xs" />
                    )}
                </Button>
            </div>

            {showForm && (
                <div className="border border-t-0 border-slate-200 overflow-hidden bg-white shadow-sm mt-0.5 rounded-b-sm">
                    {isExpanded && (
                        <div className="p-4 space-y-4" ref={formRef}>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Neuer Status</label>
                                <Input
                                    placeholder="z.B. Wartet auf Feedback"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowForm(false);
                                        setIsExpanded(false);
                                        setNewName('');
                                    }}
                                    className="flex-1 h-8 text-xs font-semibold"
                                >
                                    Abbrechen
                                </Button>
                                <Button
                                    onClick={handleQuickAddSubmit}
                                    disabled={createStatusMutation.isPending}
                                    className="flex-1 h-8 text-xs font-bold bg-brand-primary hover:bg-brand-primary/90 text-white"
                                >
                                    {createStatusMutation.isPending ? 'Speichern...' : 'Speichern'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectStatusSelect;
