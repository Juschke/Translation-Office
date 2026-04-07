import clsx from 'clsx';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { FaPlus, FaTrash, FaBook, FaChevronDown, FaSearch, FaGripVertical } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../api/services';
import { Button } from '../ui/button';
import type { ProjectPosition } from './projectTypes';

export type { ProjectPosition } from './projectTypes';

interface ProjectPositionsTableProps {
    positions: ProjectPosition[];
    setPositions: (positions: ProjectPosition[]) => void;
    disabled?: boolean;
    isSaving?: boolean;
}

const UNITS = ['Wörter', 'Normzeile', 'Seiten', 'Stunden', 'Pauschal', 'Stück', 'Minuten', 'Tage'];

const EMPTY_POSITION = (): ProjectPosition => ({
    id: Date.now().toString(),
    description: '',
    unit: 'Normzeile',
    amount: '0.00',
    quantity: '0.00',
    partnerRate: '0.00',
    partnerMode: 'unit',
    partnerTotal: '0.00',
    customerRate: '0.00',
    customerMode: 'rate',
    customerTotal: '0.00',
    marginType: 'markup',
    marginPercent: '0.00',
    taxRate: '19',
    discountPercent: '0',
});

const EMPTY_SERVICE = () => ({ name: '', unit: 'Normzeile', base_price: '' });

const fmt2 = (v: string | number) =>
    (parseFloat(v as string) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inlineInput = (invalid = false, align: 'left' | 'right' = 'left', mono = false) =>
    clsx(
        'w-full bg-transparent outline-none transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 border-none',
        mono ? 'font-mono text-[11px]' : 'font-medium text-xs',
        align === 'right' ? 'text-right' : 'text-left',
        invalid
            ? 'text-red-500 placeholder:text-red-300'
            : 'text-slate-700 placeholder:text-slate-300 focus:placeholder:opacity-0',
    );

/* ─── Generic Mini Dropdown ─── */
export const MiniDropdown = ({
    value,
    options,
    onChange,
    disabled,
    width = '85px',
    onActionLabel,
    onAction
}: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
    disabled?: boolean;
    width?: string;
    onActionLabel?: string;
    onAction?: () => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            const handleScroll = (e: Event) => {
                if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
                setIsOpen(false);
            };
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', updateCoords);
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', updateCoords);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) return;
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    const displayLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(o => !o)}
                className={clsx(
                    'px-2 py-1 text-[10px] font-bold text-slate-500 border border-transparent hover:bg-slate-100 rounded-sm transition-colors flex items-center justify-between gap-1.5 min-w-fit whitespace-nowrap',
                    disabled && 'opacity-40 cursor-not-allowed'
                )}
            >
                {displayLabel}
                <FaChevronDown className={clsx('text-[7px] transition-transform opacity-40', isOpen ? 'rotate-180' : '')} />
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed z-[9999] bg-white border border-slate-200 shadow-xl rounded-sm overflow-hidden"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        minWidth: width !== '85px' ? width : coords.width,
                        width: 'max-content',
                        maxWidth: '12rem'
                    }}
                >
                    <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {options.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                onClick={() => handleSelect(o.value)}
                                className={clsx(
                                    'w-full text-left px-2 py-1.5 text-[11px] font-medium transition-colors border-b border-slate-50 last:border-0 whitespace-nowrap',
                                    value === o.value
                                        ? 'bg-slate-100 text-slate-900 border-l-2 border-brand-primary'
                                        : 'text-slate-700 hover:bg-slate-50'
                                )}
                            >
                                {o.label}
                            </button>
                        ))}
                        {onAction && (
                            <button
                                type="button"
                                onClick={() => { onAction(); setIsOpen(false); }}
                                className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-brand-primary bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
                            >
                                <FaPlus className="text-[8px]" /> {onActionLabel || 'Neu hinzufügen'}
                            </button>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const filterDecimalInput = (raw: string): string => {
    if (!raw) return '';
    let v = raw.replace(/[^0-9,]/g, '');
    const ci = v.indexOf(',');
    if (ci !== -1) v = v.slice(0, ci + 1) + v.slice(ci + 1).replace(/,/g, '');
    return v;
};
const toEnglish = (v: any) => String(v || '').replace(',', '.');
const toGerman = (v: any) => String(v || '').replace('.', ',');

const ProjectPositionsTable = ({
    positions,
    setPositions,
    disabled,
}: ProjectPositionsTableProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [availableUnits, setAvailableUnits] = useState(UNITS);
    const [availableTaxRates, setAvailableTaxRates] = useState([{ value: '19', label: '19%' }, { value: '7', label: '7%' }, { value: '0', label: '0%' }]);
    const [catalogOpen, setCatalogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newSvc, setNewSvc] = useState(EMPTY_SERVICE);
    const [catalogCoords, setCatalogCoords] = useState({ top: 0, left: 0 });
    const catalogRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const { data: catalog = [] } = useQuery<any[]>({
        queryKey: ['settings', 'services'],
        queryFn: settingsService.getServices,
    });

    const createServiceMutation = useMutation({
        mutationFn: settingsService.createService,
        onSuccess: (created: any) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'services'] });
            addFromCatalog(created);
            setShowCreate(false);
            setNewSvc(EMPTY_SERVICE());
        },
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const trigger = document.getElementById('catalog-trigger');
            if (catalogRef.current && !catalogRef.current.contains(event.target as Node) &&
                trigger && !trigger.contains(event.target as Node)) {
                setCatalogOpen(false);
            }
        };
        if (catalogOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [catalogOpen]);

    const updateCatalogCoords = () => {
        const trigger = document.getElementById('catalog-trigger');
        if (trigger) {
            const rect = trigger.getBoundingClientRect();
            setCatalogCoords({
                top: rect.bottom,
                left: rect.right - 320
            });
        }
    };

    useEffect(() => {
        if (catalogOpen) {
            updateCatalogCoords();
            setTimeout(() => searchRef.current?.focus(), 50);
            const handleScroll = () => updateCatalogCoords();
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', updateCatalogCoords);
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', updateCatalogCoords);
            };
        }
    }, [catalogOpen]);

    const update = (index: number, patch: Partial<ProjectPosition>) => {
        if (disabled) return;
        const next = [...positions];
        next[index] = { ...next[index], ...patch };
        setPositions(next);
    };

    const addFromCatalog = (item: any) => {
        const newPos: ProjectPosition = {
            id: Date.now().toString(),
            description: item.name,
            unit: UNITS.includes(item.unit) ? item.unit : 'Normzeile',
            amount: '0.00',
            quantity: '0.00',
            partnerRate: '0.00',
            partnerMode: 'unit',
            partnerTotal: '0.00',
            customerRate: (parseFloat(item.base_price) || 0).toFixed(2),
            customerMode: 'rate',
            customerTotal: '0.00',
            marginType: 'markup',
            marginPercent: '0.00',
            taxRate: '19',
            discountPercent: '0',
        };
        setPositions([...positions, newPos]);
        setCatalogOpen(false);
        setSearch('');
    };

    const activeItems = catalog.filter(
        (s: any) => s.status === 'active' &&
            (search === '' || s.name.toLowerCase().includes(search.toLowerCase())),
    );

    const onDragEnd = (result: DropResult) => {
        if (!result.destination || disabled) return;
        const items = Array.from(positions);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setPositions(items);
    };

    return (
        <div className="bg-white">
            {!disabled && (
                <div className="relative flex justify-end gap-2 py-2 mb-2">
                    <Button
                        id="catalog-trigger"
                        onClick={() => { setCatalogOpen(o => !o); setShowCreate(false); setSearch(''); }}
                        className="h-8 px-4 text-xs font-bold gap-2"
                        variant="default"
                    >
                        <FaBook className="text-[10px]" />
                        Leistungskatalog
                    </Button>

                    {!disabled && catalogOpen && createPortal(
                        <div
                            ref={catalogRef}
                            className="fixed z-[1000] w-80 border border-slate-200 rounded-sm bg-white shadow-2xl overflow-hidden"
                            style={{ top: catalogCoords.top, left: catalogCoords.left }}
                        >
                            <div className="p-2 border-b border-slate-100 bg-white">
                                <div className="relative group">
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        placeholder="Leistung suchen…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full h-9 pl-8 pr-3 text-xs border border-slate-200 rounded-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none transition-all placeholder:text-slate-400"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                                        <FaSearch className="text-[10px]" />
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {activeItems.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-4 italic">
                                        {search ? 'Keine Treffer' : 'Noch keine Leistungen im Katalog'}
                                    </p>
                                ) : (
                                    activeItems.map((item: any) => (
                                        <button
                                            key={item.id}
                                            onClick={() => addFromCatalog(item)}
                                            className="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-brand-primary/5 transition-colors border-b border-slate-50 last:border-0 group/item"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-slate-700 group-hover/item:text-brand-primary transition-colors">{item.name}</span>
                                                {item.service_code && <span className="text-[10px] font-bold text-slate-400">{item.service_code}</span>}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-700">{fmt2(item.base_price)} €</div>
                                                <div className="text-[10px] text-slate-400">/ {item.unit}</div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                            <div className="border-t border-slate-100 bg-white p-2">
                                <Button variant="secondary" onClick={() => { setShowCreate(true); setCatalogOpen(false); }} className="w-full h-9 text-xs font-bold gap-2">
                                    <FaPlus className="text-[10px]" />
                                    Neue Leistung anlegen
                                </Button>
                            </div>
                        </div>,
                        document.body
                    )}

                    {showCreate && createPortal(
                        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
                            <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h4 className="text-sm font-bold text-slate-800">Neue Leistung im Katalog anlegen</h4>
                                    <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <FaPlus className="text-xs rotate-45" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bezeichnung</label>
                                        <input type="text" placeholder="z.B. Lektorat Spanisch" autoFocus value={newSvc.name} onChange={e => setNewSvc(s => ({ ...s, name: e.target.value }))} className="w-full text-sm border-b-2 border-slate-200 focus:border-brand-primary bg-transparent outline-none pb-px text-slate-700 placeholder:text-slate-300 transition-colors" />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Einheit</label>
                                            <select value={newSvc.unit} onChange={e => setNewSvc(s => ({ ...s, unit: e.target.value }))} className="w-full text-sm border-b-2 border-slate-200 focus:border-brand-primary bg-transparent outline-none pb-px text-slate-600 transition-colors">
                                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                        <div className="w-32 space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Grundpreis</label>
                                            <div className="flex items-end gap-1">
                                                <input type="number" step="0.01" min="0" placeholder="0,00" value={newSvc.base_price} onChange={e => setNewSvc(s => ({ ...s, base_price: e.target.value }))} className="w-full text-right text-sm font-mono border-b-2 border-slate-200 focus:border-brand-primary bg-transparent outline-none pb-px text-slate-700 placeholder:text-slate-300 transition-colors" />
                                                <span className="text-sm text-slate-400 pb-px">€</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex gap-3">
                                    <Button variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Abbrechen</Button>
                                    <Button disabled={!newSvc.name.trim() || createServiceMutation.isPending} onClick={() => createServiceMutation.mutate({ name: newSvc.name.trim(), unit: newSvc.unit, base_price: parseFloat(newSvc.base_price) || 0, status: 'active' })} className="flex-1">
                                        {createServiceMutation.isPending ? 'Speichern…' : 'Leistung anlegen'}
                                    </Button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </div>
            )}

            <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-lg shadow-sm bg-white overflow-visible">
                <DragDropContext onDragEnd={onDragEnd}>
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <th className="px-4 py-3 text-center w-[70px]"></th>
                                <th className="px-4 py-3">{t('invoice.form.description')}</th>
                                <th className="px-3 py-3 w-20 text-right">{t('invoice.form.quantity')}</th>
                                <th className="px-3 py-3 w-28 text-right">{t('invoice.form.unit')}</th>
                                <th className="px-3 py-3 w-28 text-right">Preis (€)</th>
                                <th className="px-2 py-3 w-20 text-right">MwSt</th>
                                <th className="px-2 py-3 w-20 text-right">Rabatt</th>
                                <th className="px-6 py-3 w-32 text-right">{t('invoice.form.total_price')}</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <Droppable droppableId="positions">
                            {(provided) => (
                                <tbody {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-slate-50">
                                    {positions.map((pos, index) => {
                                        const qtyInvalid = !disabled && (parseFloat(pos.quantity) || 0) < 0;
                                        const descInvalid = !disabled && pos.description.trim() === '';
                                        const isPriceZero = (parseFloat(pos.customerRate) || 0) === 0;
                                        const rateInvalid = !disabled && (parseFloat(pos.customerRate) || 0) < 0;

                                        return (
                                            <Draggable key={pos.id} draggableId={pos.id} index={index} isDragDisabled={disabled}>
                                                {(provided, snapshot) => (
                                                    <tr
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={clsx(
                                                            "group transition-all duration-200 border-b border-slate-100",
                                                            snapshot.isDragging ? "bg-white shadow-xl ring-1 ring-brand-primary/20 scale-[1.01] z-50" : "hover:bg-slate-50/50"
                                                        )}
                                                    >
                                                        <td className="w-[70px] bg-slate-50/30 border-r border-slate-50 text-center py-2 relative group-hover:bg-slate-100/50 transition-colors">
                                                            <div
                                                                {...provided.dragHandleProps}
                                                                className="flex flex-row items-center justify-center gap-2 cursor-grab active:cursor-grabbing text-slate-200 hover:text-brand-primary transition-colors py-1"
                                                                title="Gedrückt halten zum Verschieben"
                                                            >
                                                                <FaGripVertical size={11} />
                                                                <span className="text-[10px] font-mono font-bold text-slate-500">{index + 1}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="text"
                                                                disabled={disabled}
                                                                placeholder="Bezeichnung eingeben…"
                                                                className={clsx(inlineInput(descInvalid), "text-slate-700 font-medium")}
                                                                value={pos.description}
                                                                onChange={e => update(index, { description: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                disabled={disabled}
                                                                className={inlineInput(qtyInvalid, 'right', true)}
                                                                value={toGerman(pos.quantity)}
                                                                onChange={e => update(index, { quantity: toEnglish(filterDecimalInput(e.target.value)) })}
                                                                onBlur={e => update(index, { quantity: (parseFloat(toEnglish(e.target.value)) || 0).toFixed(2) })}
                                                            />
                                                        </td>
                                                        <td className="px-0 py-2 text-right">
                                                            <div className="flex justify-end">
                                                                <MiniDropdown
                                                                    value={pos.unit}
                                                                    options={availableUnits.map(u => ({ value: u, label: u }))}
                                                                    onChange={unit => update(index, { unit })}
                                                                    disabled={disabled}
                                                                    width="60px"
                                                                    onAction={() => {
                                                                        const val = window.prompt(t('invoice.form.new_unit') || 'Neue Einheit:');
                                                                        if (val && val.trim()) {
                                                                            const newVal = val.trim();
                                                                            if (!availableUnits.includes(newVal)) setAvailableUnits(prev => [...prev, newVal]);
                                                                            update(index, { unit: newVal });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                disabled={disabled}
                                                                className={clsx(inlineInput(rateInvalid, 'right', true), isPriceZero ? 'text-slate-400' : 'text-slate-900 font-semibold')}
                                                                value={toGerman(pos.customerRate)}
                                                                onChange={e => update(index, { customerRate: toEnglish(filterDecimalInput(e.target.value)) })}
                                                                onBlur={e => update(index, { customerRate: (parseFloat(toEnglish(e.target.value)) || 0).toFixed(2) })}
                                                            />
                                                        </td>
                                                        <td className="px-0 py-2 text-right">
                                                            <div className="flex justify-end">
                                                                <MiniDropdown
                                                                    value={pos.taxRate}
                                                                    options={availableTaxRates}
                                                                    onChange={taxRate => update(index, { taxRate })}
                                                                    disabled={disabled}
                                                                    width="40px"
                                                                    onAction={() => {
                                                                        const val = window.prompt('Neuer Steuersatz (%):');
                                                                        if (val && !isNaN(parseFloat(val))) {
                                                                            const newVal = parseFloat(val).toString();
                                                                            setAvailableTaxRates(prev => [...prev, { value: newVal, label: newVal + '%' }]);
                                                                            update(index, { taxRate: newVal });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-1 py-2 text-right">
                                                            <div className="flex justify-end items-center gap-1">
                                                                <div className="flex-1 min-w-[30px]">
                                                                    <input
                                                                        type="text"
                                                                        inputMode="decimal"
                                                                        disabled={disabled}
                                                                        className={inlineInput(false, 'right', true)}
                                                                        value={toGerman(pos.discountPercent)}
                                                                        onChange={e => update(index, { discountPercent: toEnglish(filterDecimalInput(e.target.value)) })}
                                                                    />
                                                                </div>
                                                                <MiniDropdown
                                                                    value={pos.discountMode || 'percent'}
                                                                    options={[{ value: 'percent', label: '%' }, { value: 'fixed', label: '€' }]}
                                                                    onChange={mode => update(index, { discountMode: mode as 'percent' | 'fixed' })}
                                                                    disabled={disabled}
                                                                    width="35px"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-2 text-right text-slate-900 font-bold tabular-nums text-[11px]">
                                                            {fmt2(pos.customerTotal)} €
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            {!disabled && positions.length > 1 ? (
                                                                <button onClick={() => setPositions(positions.filter(p => p.id !== pos.id))} className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100" title={t('actions.delete')}><FaTrash size={10} /></button>
                                                            ) : (
                                                                <span className="p-1.5 block text-slate-100"><FaTrash size={10} /></span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </tbody>
                            )}
                        </Droppable>
                    </table>
                </DragDropContext>
            </div>

            {!disabled && (
                <div className="border-t border-dashed border-slate-200 flex justify-center py-6 bg-slate-50/5 mt-4">
                    <button onClick={() => setPositions([...positions, EMPTY_POSITION()])} className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-600 border border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:text-slate-800 hover:bg-white hover:shadow-md transition-all group/addbtn bg-transparent">
                        <FaPlus className="text-[10px] group-hover/addbtn:scale-110 transition-transform" />
                        Position hinzufügen
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProjectPositionsTable;
