import React, { useState, useMemo } from 'react';
import { useEmailVariables } from '../../hooks/useEmailVariables';
import { FaSearch, FaSignature, FaCode, FaTerminal } from 'react-icons/fa';
import { ScrollArea, Button } from '../ui';
import { useQuery } from '@tanstack/react-query';
import { mailService } from '../../api/services/mail';
import clsx from 'clsx';
import DOMPurify from 'dompurify';

interface EmailSidebarPickerProps {
    onSelectVariable: (key: string) => void;
    onSelectSignature: (content: string) => void;
    currentBody?: string;
    currentSignature?: string | null;
    className?: string;
}

const EmailSidebarPicker: React.FC<EmailSidebarPickerProps> = ({ 
    onSelectVariable, 
    onSelectSignature,
    currentBody = '', 
    currentSignature = null,
    className 
}) => {
    const [activeTab, setActiveTab] = useState<'variables' | 'signatures'>('variables');
    const { ALL_VARIABLES, VAR_GROUPS } = useEmailVariables();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: signatures = [], isLoading: isLoadingSignatures } = useQuery({
        queryKey: ['mailSignatures'],
        queryFn: () => mailService.getSignatures(),
        enabled: activeTab === 'signatures'
    });

    const filteredVariables = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return ALL_VARIABLES.filter(v =>
            !q || v.label.toLowerCase().includes(q) || v.key.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q)
        );
    }, [searchTerm, ALL_VARIABLES]);

    const filteredSignatures = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return (signatures || []).filter((s: any) =>
            !q || s.name.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
        );
    }, [searchTerm, signatures]);

    return (
        <div className={clsx("flex flex-col h-full bg-slate-50/50 border-l border-slate-100", className)}>
            {/* Tab Switcher - Same as EmailComposeContent */}
            <div className="flex bg-white border-b border-slate-100 shrink-0 h-[60px] relative">
                <Button
                    variant="ghost"
                    type="button"
                    onClick={() => { setActiveTab('variables'); setSearchTerm(''); }}
                    className={clsx(
                        "flex-1 flex-col h-full rounded-none transition-all relative overflow-hidden flex items-center justify-center",
                        activeTab === 'variables' ? "text-brand-primary" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <FaTerminal size={12} className="mb-1" />
                    <span className="text-[9px] font-bold tracking-widest block">Variablen</span>
                    {activeTab === 'variables' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"></div>}
                </Button>
                <Button
                    variant="ghost"
                    type="button"
                    onClick={() => { setActiveTab('signatures'); setSearchTerm(''); }}
                    className={clsx(
                        "flex-1 flex-col h-full rounded-none transition-all relative overflow-hidden flex items-center justify-center",
                        activeTab === 'signatures' ? "text-brand-primary" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <FaSignature size={12} className="mb-1" />
                    <span className="text-[9px] font-bold tracking-widest block">Signaturen</span>
                    {activeTab === 'signatures' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"></div>}
                </Button>
            </div>

            {/* Search */}
            <div className="p-4 bg-white border-b border-slate-100 shrink-0">
                <div className="relative h-[38px]">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={activeTab === 'variables' ? "Variable suchen..." : "Signatur suchen..."}
                        className="w-full h-full bg-white border border-slate-200 rounded-sm px-3 pr-8 text-[11px] font-bold tracking-tight placeholder:text-slate-300 focus:border-brand-primary outline-none transition-all placeholder:font-normal"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <FaSearch size={11} className="text-slate-300" />
                    </div>
                </div>
            </div>

            {/* List content */}
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="p-3 pb-8 space-y-4">
                        {activeTab === 'variables' ? (
                            filteredVariables.length === 0 ? (
                                <EmptyState text="Keine Variablen gefunden" />
                            ) : (
                                searchTerm ? (
                                    <div className="space-y-1.5">
                                        {filteredVariables.map(v => (
                                            <VariableItem 
                                                key={v.key} 
                                                v={v} 
                                                isSelected={currentBody.includes(`{{${v.key}}}`) || currentBody.includes(`{${v.key}}`)}
                                                onClick={() => onSelectVariable(v.key)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    VAR_GROUPS.map(group => {
                                        const items = ALL_VARIABLES.filter(v => v.group === group);
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={group} className="space-y-2.5">
                                                <div className="flex items-center gap-2 px-1 py-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary/40"></div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] shrink-0">{group}</span>
                                                    <div className="flex-1 h-px bg-slate-100"></div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {items.map(v => (
                                                        <VariableItem 
                                                            key={v.key} 
                                                            v={v} 
                                                            isSelected={currentBody.includes(`{{${v.key}}}`) || currentBody.includes(`{${v.key}}`)}
                                                            onClick={() => onSelectVariable(v.key)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )
                        ) : (
                            isLoadingSignatures ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent animate-spin rounded-full"></div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lade Signaturen...</p>
                                </div>
                            ) : filteredSignatures.length === 0 ? (
                                <EmptyState text="Keine Signaturen gefunden" />
                            ) : (
                                <div className="space-y-1.5">
                                    {filteredSignatures.map((s: any) => {
                                        const isActive = currentSignature === s.content;
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => onSelectSignature(s.content)}
                                                className={clsx(
                                                    "w-full text-left p-2.5 rounded-lg transition-all group/sig border flex items-start gap-3 relative",
                                                    isActive ? "border-brand-primary bg-brand-primary/5 shadow-sm" : "bg-white border-slate-100 hover:border-brand-primary hover:bg-slate-50"
                                                )}
                                            >
                                                {/* Checkbox for status */}
                                                <div className={clsx(
                                                    "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 mt-0.5",
                                                    isActive ? "bg-brand-primary border-brand-primary" : "bg-white border-slate-200 group-hover/sig:border-brand-primary"
                                                )}>
                                                    {isActive && (
                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 pr-1">
                                                    <div className={clsx("text-[11px] font-bold mb-1 transition-colors", isActive ? "text-brand-primary" : "text-slate-700 group-hover/sig:text-brand-primary")}>
                                                        {s.name}
                                                    </div>
                                                    <div 
                                                        className="text-[9px] text-slate-400 line-clamp-2 italic leading-relaxed"
                                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(s.content) }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

const EmptyState = ({ text }: { text: string }) => (
    <div className="text-center py-12 px-4 rounded-sm border border-dashed border-slate-200 bg-white">
        <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase italic">{text}</p>
    </div>
);

const VariableItem = ({ v, isSelected, onClick }: { v: any, isSelected: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        type="button"
        className={clsx(
            "w-full text-left p-2 rounded-lg transition-all group/var border flex items-center gap-3",
            isSelected ? "border-brand-primary bg-brand-primary/5 shadow-sm" : "border-transparent hover:bg-slate-50 hover:border-slate-100"
        )}
    >
        {/* Checkbox */}
        <div className={clsx(
            "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
            isSelected ? "bg-brand-primary border-brand-primary" : "bg-white border-slate-200 group-hover/var:border-brand-primary"
        )}>
            {isSelected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
        </div>

        <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between mb-0.5">
                <span className={clsx(
                    "text-[11px] font-bold tracking-tight transition-colors truncate pr-2",
                    isSelected ? "text-brand-primary" : "text-slate-700 group-hover/var:text-brand-primary"
                )}>
                    {v.label}
                </span>
                <code className={clsx(
                    "text-[8px] px-1 rounded font-mono transition-all shrink-0",
                    isSelected ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-500 group-hover/var:bg-brand-primary group-hover/var:text-white"
                )}>
                    {`{{${v.key}}}`}
                </code>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight line-clamp-1">
                {v.description || v.desc}
            </p>
        </div>
    </button>
);

export default EmailSidebarPicker;
