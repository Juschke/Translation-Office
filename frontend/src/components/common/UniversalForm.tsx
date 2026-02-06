import React, { useState, useEffect } from 'react';
import Input from './Input';
import clsx from 'clsx';
import { FaTimes } from 'react-icons/fa';

export interface FormField {
    name: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'custom';
    placeholder?: string;
    required?: boolean;
    options?: { value: string | number; label: string }[];
    colSpan?: number; // 4, 6, 8, 12, etc.
    defaultValue?: any;
    renderCustom?: (props: any) => React.ReactNode;
}

export interface UniversalFormProps {
    fields: FormField[];
    initialValues?: any;
    onSubmit: (data: any) => void;
    onCancel?: () => void;
    isLoading?: boolean;
    submitLabel?: string;
    title?: string;
    className?: string; // Container class overrides
}

const UniversalForm: React.FC<UniversalFormProps> = ({
    fields,
    initialValues = {},
    onSubmit,
    onCancel,
    isLoading = false,
    submitLabel = 'Speichern',
    title,
    className
}) => {
    const [values, setValues] = useState<any>(initialValues);
    const [errors, setErrors] = useState<Set<string>>(new Set());

    // Update internal state if initialValues change
    useEffect(() => {
        if (initialValues) {
            setValues((prev: any) => ({ ...prev, ...initialValues }));
        }
    }, [initialValues]);

    const handleChange = (name: string, value: any) => {
        setValues((prev: any) => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors.has(name)) {
            const newErrors = new Set(errors);
            newErrors.delete(name);
            setErrors(newErrors);
        }
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const newErrors = new Set<string>();
        fields.forEach(f => {
            if (f.required && !values[f.name]) {
                newErrors.add(f.name);
            }
        });

        if (newErrors.size > 0) {
            setErrors(newErrors);
            return; // Stop submission
        }

        onSubmit(values);
    };

    // Helper to map colSpan to generic Tailwind classes
    // We handle common spans explicitly to ensure PurgeCSS/Tailwind picks them up
    const getColSpanClass = (span?: number) => {
        switch (span) {
            case 12: return 'col-span-12';
            case 10: return 'col-span-12 sm:col-span-10';
            case 8: return 'col-span-12 sm:col-span-8';
            case 6: return 'col-span-12 sm:col-span-6';
            case 4: return 'col-span-12 sm:col-span-4';
            case 3: return 'col-span-6 sm:col-span-3';
            case 2: return 'col-span-6 sm:col-span-2';
            default: return 'col-span-12';
        }
    };

    return (
        <div className={clsx("animate-fadeIn space-y-4 pt-2 bg-slate-50 p-4 rounded-lg border border-slate-200", className)}>
            {/* Header / Title */}
            {(title || onCancel) && (
                <div className="flex justify-between items-center">
                    {title && <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h5>}
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="text-[10px] text-red-500 font-bold flex items-center gap-1 hover:text-red-700 transition"
                        >
                            <FaTimes /> Abbrechen
                        </button>
                    )}
                </div>
            )}

            {/* Form Grid */}
            <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-x-4 gap-y-4">
                {fields.map((field) => (
                    <div key={field.name} className={getColSpanClass(field.colSpan)}>
                        {field.type === 'custom' && field.renderCustom ? (
                            // Allow Custom Rendering
                            field.renderCustom({
                                value: values[field.name],
                                onChange: (val: any) => handleChange(field.name, val),
                                error: errors.has(field.name)
                            })
                        ) : field.type === 'select' ? (
                            <Input
                                isSelect
                                label={field.label}
                                value={values[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                error={errors.has(field.name)}
                            >
                                {field.options?.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Input>
                        ) : (
                            <Input
                                type={field.type || 'text'}
                                label={field.label}
                                placeholder={field.placeholder}
                                value={values[field.name] || ''} // ensure controlled
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                error={errors.has(field.name)}
                                isTextArea={field.type === 'textarea'}
                            />
                        )}
                    </div>
                ))}

                {/* Submit Action */}
                <div className="col-span-12 sm:col-span-4 flex items-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 bg-brand-700 text-white rounded text-[10px] font-bold uppercase hover:bg-brand-800 transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Speichern...' : (
                            <>
                                {submitLabel}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UniversalForm;
