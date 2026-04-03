import clsx from 'clsx';
import { useState, useRef, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaTrash, FaChevronDown, FaGripVertical } from 'react-icons/fa';
import { Button } from '../ui/button';
import type { ProjectPosition } from './projectType';

export type { ProjectPosition } from './projectType';

export interface ExtraServiceRow {
    key: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    taxRate?: string;
}

interface ProjectPositionsTableProps {
    positions: ProjectPosition[];
    setPositions: (p: ProjectPosition[]) => void;
    disabled?: boolean;
    extraRows?: ExtraServiceRow[];
    onToggleExtra?: (key: string) => void;
    onUpdateExtra?: (key: string, patch: any) => void;
    onSave?: () => void;
    isSaving?: boolean;
}

const SortableRow = ({
    pos,
    index,
    disabled,
    update,
    remove,
    t,
    inlineInput,
    toGerman,
    toEnglish,
    filterDecimalInput,
    fmt2,
    UNITS,
    MiniDropdown
}: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: pos.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.8 : 1,
        position: 'relative' as any
    };

    const descInvalid = !disabled && pos.description.trim() === '';

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={clsx(
                "group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors",
                isDragging && "bg-white shadow-lg ring-1 ring-slate-200"
            )}
        >
            <td className="px-1 py-1.5 w-6">
                {!disabled && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1 cursor-grab active:cursor-grabbing text-slate-200 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <FaGripVertical className="text-[10px]" />
                    </button>
                )}
            </td>
            <td className="px-2 py-1.5 text-center text-[10px] font-bold text-slate-300 w-6">
                {index + 1}
            </td>

            <td className="px-3 py-1.5">
                <input
                    type="text"
                    disabled={disabled}
                    placeholder="Bezeichnung eingeben…"
                    className={inlineInput(descInvalid)}
                    value={pos.description}
                    onChange={e => update(index, { description: e.target.value })}
                />
            </td>

            <td className="px-3 py-1.5">
                <input
                    type="text"
                    inputMode="decimal"
                    disabled={disabled}
                    className={inlineInput(false, 'right', true)}
                    value={toGerman(pos.quantity)}
                    onFocus={() => {
                        if (parseFloat(toEnglish(pos.quantity)) === 0) {
                            update(index, { quantity: '' });
                        }
                    }}
                    onChange={e => {
                        const filtered = filterDecimalInput(e.target.value);
                        update(index, { quantity: toEnglish(filtered) });
                    }}
                    onBlur={e => update(index, { quantity: (parseFloat(toEnglish(e.target.value)) || 0).toFixed(2) })}
                />
            </td>

            <td className="px-3 py-1.5 text-right w-24">
                <div className="flex justify-end">
                    <MiniDropdown
                        value={pos.unit}
                        options={UNITS.map((u: any) => ({ value: u, label: u }))}
                        onChange={(unit: string) => update(index, { unit })}
                        disabled={disabled}
                    />
                </div>
            </td>

            <td className="px-3 py-1.5">
                <div className="flex items-center justify-end gap-1.5">
                    <input
                        type="text"
                        inputMode="decimal"
                        disabled={disabled}
                        className={clsx(inlineInput(false, 'right', true), 'w-24')}
                        value={toGerman(pos.customerRate)}
                        onBlur={e => update(index, { customerRate: (parseFloat(toEnglish(e.target.value)) || 0).toFixed(2) })}
                        onChange={e => {
                            const filtered = filterDecimalInput(e.target.value);
                            update(index, { customerRate: toEnglish(filtered) });
                        }}
                    />
                    <span className="text-[10px] font-bold text-slate-300 pb-px">€</span>
                </div>
            </td>

            <td className="px-3 py-1.5">
                <div className="flex justify-end">
                    <MiniDropdown
                        value={pos.taxRate || '19.00'}
                        options={[
                            { value: '19.00', label: '19%' },
                            { value: '0.00', label: '0%' },
                        ]}
                        onChange={(taxRate: string) => update(index, { taxRate })}
                        disabled={disabled}
                    />
                </div>
            </td>

            <td className="px-3 py-1.5 text-right min-w-[100px]">
                <span className="font-bold text-xs text-slate-800 tabular-nums">
                    {fmt2(pos.customerTotal)} €
                </span>
            </td>

            <td className="px-2 py-1.5 text-center">
                {!disabled ? (
                    <button
                        onClick={() => remove(index)}
                        className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
                        title={t('actions.delete')}
                    >
                        <FaTrash className="text-xs" />
                    </button>
                ) : (
                    <span className="p-1.5 block text-slate-100">
                        <FaTrash className="text-xs" />
                    </span>
                )}
            </td>
        </tr>
    );
};


const UNITS = ['Wörter', 'Normzeile', 'Seiten', 'Stunden', 'Pauschal', 'Stück', 'Minuten', 'Tage'];

const EMPTY_POSITION = (): ProjectPosition => ({
    id: crypto.randomUUID?.() || Date.now().toString() + Math.random(),
    description: '',
    unit: 'Normzeile',
    amount: '0.00',
    quantity: '1.00',
    partnerRate: '0.00',
    partnerMode: 'unit',
    partnerTotal: '0.00',
    customerRate: '0.00',
    customerMode: 'rate',
    customerTotal: '0.00',
    marginType: 'markup',
    marginPercent: '0.00',
    taxRate: '19.00',
});

const fmt2 = (v: string | number) =>
    (parseFloat(v as string) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inlineInput = (invalid = false, align: 'left' | 'right' = 'left', mono = false) =>
    clsx(
        'w-full bg-transparent outline-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 border-b-2 font-medium text-xs',
        invalid ? 'border-red-400' : 'border-transparent hover:border-slate-300 focus:border-brand-primary',
        align === 'right' ? 'text-right' : 'text-left',
        mono ? 'font-mono' : 'font-sans'
    );

const ProjectPositionsTable = ({
    positions,
    setPositions,
    disabled = false,
    extraRows = [],
    onToggleExtra,
    onUpdateExtra,
    onSave,
    isSaving = false,
}: ProjectPositionsTableProps) => {
    const { t } = useTranslation();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = positions.findIndex(p => p.id === active.id);
            const newIndex = positions.findIndex(p => p.id === over.id);
            setPositions(arrayMove(positions, oldIndex, newIndex));
        }
    };

    const update = (idx: number, patch: Partial<ProjectPosition>) => {
        const next = [...positions];
        next[idx] = { ...next[idx], ...patch };
        setPositions(next);
    };

    const remove = (idx: number) => {
        setPositions(positions.filter((_, i) => i !== idx));
    };

    const toGerman = (val: string) => val.replace('.', ',');
    const toEnglish = (val: string) => val.replace(',', '.');
    const filterDecimalInput = (val: string) => val.replace(/[^0-9,.]/g, '');

    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center px-1 mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Positionen</span>
                {!disabled && onSave && (
                    <Button
                        size="sm"
                        onClick={onSave}
                        disabled={isSaving}
                        className="h-7 text-[10px] font-bold px-3 transition-all"
                    >
                        {isSaving ? 'Speichert...' : t('actions.save')}
                    </Button>
                )}
            </div>

            <div className="overflow-x-auto min-h-[150px]">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/30">
                            <th className="px-1 py-1.5 w-6"></th>
                            <th className="px-2 py-1.5 w-6 text-center text-[10px] font-bold text-slate-400 uppercase">#</th>
                            <th className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase">Leistung</th>
                            <th className="px-3 py-1.5 w-24 text-right text-[10px] font-bold text-slate-400 uppercase">Menge</th>
                            <th className="px-3 py-1.5 w-24 text-right text-[10px] font-bold text-slate-400 uppercase">Einheit</th>
                            <th className="px-3 py-1.5 w-32 text-right text-[10px] font-bold text-slate-400 uppercase">Basispreis</th>
                            <th className="px-3 py-1.5 w-24 text-right text-[10px] font-bold text-slate-400 uppercase">MwSt</th>
                            <th className="px-3 py-1.5 w-28 text-right text-[10px] font-bold text-slate-400 uppercase">Gesamt</th>
                            <th className="px-2 py-1.5 w-8"></th>
                        </tr>
                    </thead>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <tbody className="divide-y divide-slate-100">
                            <SortableContext
                                items={positions.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {positions.map((pos, index) => (
                                    <SortableRow
                                        key={pos.id}
                                        pos={pos}
                                        index={index}
                                        disabled={disabled}
                                        update={update}
                                        remove={remove}
                                        t={t}
                                        inlineInput={inlineInput}
                                        toGerman={toGerman}
                                        toEnglish={toEnglish}
                                        filterDecimalInput={filterDecimalInput}
                                        fmt2={fmt2}
                                        UNITS={UNITS}
                                        MiniDropdown={MiniDropdown}
                                    />
                                ))}
                            </SortableContext>

                            {/* Zusatzleistungen (statisch am Ende) */}
                            {extraRows.map((row, extraIndex) => {
                                return (
                                    <tr key={row.key} className="group border-b border-slate-50 last:border-0 bg-slate-50/20">
                                        <td className="px-1 py-1.5 w-6"></td>
                                        <td className="px-2 py-1.5 text-center text-[10px] font-bold text-slate-300 w-6">
                                            {positions.length + extraIndex + 1}
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-bold px-1 py-0.5 rounded-xs bg-slate-100 text-slate-400 border border-slate-200 uppercase">Extra</span>
                                                <input
                                                    type="text"
                                                    disabled={disabled}
                                                    className={inlineInput()}
                                                    value={row.description}
                                                    onChange={e => onUpdateExtra?.(row.key, { description: e.target.value })}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                disabled={disabled}
                                                className={inlineInput(false, 'right', true)}
                                                value={toGerman(row.quantity.toString())}
                                                onBlur={e => onUpdateExtra?.(row.key, { quantity: parseFloat((parseFloat(toEnglish(e.target.value)) || 0).toFixed(2)) })}
                                                onChange={e => {
                                                    const filtered = filterDecimalInput(e.target.value);
                                                    onUpdateExtra?.(row.key, { quantity: toEnglish(filtered) === '' ? 0 : parseFloat(toEnglish(filtered)) });
                                                }}
                                            />
                                        </td>
                                        <td className="px-3 py-1.5 text-right w-24">
                                            <div className="flex justify-end">
                                                <MiniDropdown
                                                    value={row.unit}
                                                    options={UNITS.map((u: any) => ({ value: u, label: u }))}
                                                    onChange={(unit: string) => onUpdateExtra?.(row.key, { unit })}
                                                    disabled={disabled}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    disabled={disabled}
                                                    className={clsx(inlineInput(false, 'right', true), 'w-24')}
                                                    value={toGerman(row.unitPrice.toString())}
                                                    onBlur={e => onUpdateExtra?.(row.key, { unitPrice: parseFloat((parseFloat(toEnglish(e.target.value)) || 0).toFixed(2)) })}
                                                    onChange={e => {
                                                        const filtered = filterDecimalInput(e.target.value);
                                                        onUpdateExtra?.(row.key, { unitPrice: toEnglish(filtered) === '' ? 0 : parseFloat(toEnglish(filtered)) });
                                                    }}
                                                />
                                                <span className="text-[10px] font-bold text-slate-300 pb-px">€</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <div className="flex justify-end">
                                                <MiniDropdown
                                                    value={row.taxRate || '19.00'}
                                                    options={[
                                                        { value: '19.00', label: '19%' },
                                                        { value: '0.00', label: '0%' },
                                                    ]}
                                                    onChange={(taxRate: string) => onUpdateExtra?.(row.key, { taxRate })}
                                                    disabled={disabled}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5 text-right min-w-[100px]">
                                            <span className="font-bold text-xs text-slate-800 tabular-nums">
                                                {fmt2(row.total)} €
                                            </span>
                                        </td>
                                        <td className="px-2 py-1.5 text-center">
                                            {!disabled && (
                                                <button
                                                    onClick={() => onToggleExtra?.(row.key)}
                                                    className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Entfernen"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </DndContext>
                </table>
            </div>

            {!disabled && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={() => setPositions([...positions, EMPTY_POSITION()])}
                        className="group flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-brand-primary transition-all bg-white border border-slate-200 border-dashed rounded-sm hover:border-brand-primary"
                    >
                        <div className="w-4 h-4 rounded-full bg-slate-50 group-hover:bg-brand-primary/10 flex items-center justify-center transition-colors">
                            <FaPlus className="text-[8px]" />
                        </div>
                        Position hinzufügen
                    </button>
                </div>
            )}
        </div>
    );
};


const MiniDropdown = ({ value, options, onChange, disabled }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find((o: any) => o.value === value)?.label || value;

    return (
        <div className="relative inline-block" ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-sm transition-colors tabular-nums min-w-[50px] justify-between",
                    disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"
                )}
            >
                <span className="text-[10px] font-bold text-slate-600">{selectedLabel}</span>
                {!disabled && <FaChevronDown className="text-[8px] text-slate-300" />}
            </button>

            {isOpen && !disabled && (
                <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded-sm shadow-xl z-[100] py-1 animate-in fade-in zoom-in duration-100">
                    {options.map((opt: any) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={clsx(
                                "w-full text-left px-3 py-1.5 text-xs transition-colors",
                                value === opt.value ? "bg-brand-primary/10 text-brand-primary font-bold" : "text-slate-600 hover:bg-slate-50"
                            )}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectPositionsTable;
