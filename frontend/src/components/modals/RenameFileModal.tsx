import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useTranslation } from 'react-i18next';

interface RenameFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { prefix?: string; suffix?: string; name?: string }) => void;
    mode: 'single' | 'bulk';
    initialName?: string;
}

function splitExtension(filename: string): { base: string; ext: string } {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot <= 0) return { base: filename, ext: '' };
    return {
        base: filename.slice(0, lastDot),
        ext: filename.slice(lastDot), // includes the dot, e.g. ".pdf"
    };
}

const RenameFileModal = ({ isOpen, onClose, onSubmit, mode, initialName }: RenameFileModalProps) => {
    const { t } = useTranslation();
    const [baseName, setBaseName] = useState('');
    const [ext, setExt] = useState('');
    const [prefix, setPrefix] = useState('');
    const [suffix, setSuffix] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const raw = initialName || '';
            const { base, ext: fileExt } = splitExtension(raw);
            setBaseName(base);
            setExt(fileExt);
            setPrefix('');
            setSuffix('');
            // Select all text in input after open
            setTimeout(() => inputRef.current?.select(), 50);
        }
    }, [isOpen, initialName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'single') {
            const fullName = baseName.trim() + ext;
            onSubmit({ name: fullName });
        } else {
            onSubmit({ prefix, suffix });
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {mode === 'single' ? t('files.renameFile', 'Datei umbenennen') : t('files.bulkRename', 'Dateien umbenennen')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 px-2">
                    {mode === 'single' ? (
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                {t('common.name', 'Dateiname')}
                            </Label>
                            <div className="flex items-center gap-0">
                                <Input
                                    ref={inputRef}
                                    value={baseName}
                                    onChange={(e) => setBaseName(e.target.value)}
                                    autoFocus
                                    className="h-10 text-sm border-slate-200 focus:border-brand-primary/50 rounded-r-none"
                                />
                                {ext && (
                                    <span className="h-10 flex items-center px-3 text-sm text-slate-500 bg-slate-100 border border-l-0 border-slate-200 rounded-r-md select-none whitespace-nowrap">
                                        {ext}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    {t('files.prefix', 'Präfix (vorne)')}
                                </Label>
                                <Input
                                    value={prefix}
                                    onChange={(e) => setPrefix(e.target.value)}
                                    placeholder="z.B. Final_"
                                    autoFocus
                                    className="h-10 text-sm border-slate-200 focus:border-brand-primary/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    {t('files.suffix', 'Suffix (hinten)')}
                                </Label>
                                <Input
                                    value={suffix}
                                    onChange={(e) => setSuffix(e.target.value)}
                                    placeholder="_v2"
                                    className="h-10 text-sm border-slate-200 focus:border-brand-primary/50"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="pt-4 mt-2 border-t border-slate-100 flex gap-2">
                        <Button type="button" variant="secondary" onClick={onClose} className="h-10 px-6 font-bold uppercase text-[11px] tracking-widest">
                            {t('common.cancel', 'Abbrechen')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={mode === 'single' ? !baseName.trim() : (!prefix.trim() && !suffix.trim())}
                            className="h-10 px-6 font-bold uppercase text-[11px] tracking-widest"
                        >
                            {t('common.save', 'Speichern')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RenameFileModal;
