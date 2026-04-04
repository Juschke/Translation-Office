import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaPlus, FaChevronDown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { settingsService } from '../../api/services';
import SearchableSelect from './SearchableSelect';
import Input from './Input';
import clsx from 'clsx';
import { Button } from '../ui/button';

interface DocumentTypeSelectProps {
  options: { value: string; label: string; group?: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: boolean;
  className?: string;
  placeholder?: string;
  isMulti?: boolean;
}

interface QuickAddData {
  name: string;
  category: string;
}

const DocumentTypeSelect: React.FC<DocumentTypeSelectProps> = ({
  options,
  value,
  onChange,
  error,
  className,
  placeholder = 'Dokumentart auswählen...',
  isMulti = true
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [quickAddData, setQuickAddData] = useState<QuickAddData>({
    name: '',
    category: ''
  });

  const queryClient = useQueryClient();
  const formRef = React.useRef<HTMLDivElement>(null);

  const createDocTypeMutation = useMutation({
    mutationFn: settingsService.createDocType,
    onSuccess: (newDocType) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'docTypes'] });
      if (isMulti) {
        onChange([...value, newDocType.id.toString()]);
      } else {
        onChange([newDocType.id.toString()]);
      }
      setShowForm(false);
      setIsExpanded(false);
      setQuickAddData({ name: '', category: '' });
      setValidationErrors([]);
      toast.success('Dokumentart hinzugefügt');
    },
    onError: () => {
      toast.error('Fehler beim Erstellen der Dokumentart');
    }
  });

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!quickAddData.name.trim()) {
      errors.push('Name erforderlich');
    }

    if (!quickAddData.category.trim()) {
      errors.push('Kategorie erforderlich');
    }

    return errors;
  };

  const handleQuickAddSubmit = () => {
    const errors = validateForm();

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error(errors.length === 1 ? errors[0] : `${errors.length} Felder erforderlich: ${errors.join(', ')}`);
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return;
    }

    setValidationErrors([]);
    createDocTypeMutation.mutate(quickAddData);
  };

  return (
    <div className={clsx('w-full', className)}>
      {/* Dropdown + Toggle Button */}
      <div className="flex items-end gap-0">
        <div className="flex-1 min-w-0">
          <SearchableSelect
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            error={error}
            roundedSide="left"
            isMulti={isMulti}
          />
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              setIsExpanded(!isExpanded);
            } else {
              setShowForm(true);
              setIsExpanded(true);
            }
          }}
          className="h-9 px-3 bg-white text-slate-400 border border-brand-border border-l-0 rounded-r-sm hover:bg-slate-50 hover:text-brand-primary transition flex items-center shadow-sm shrink-0"
        >
          {showForm ? (
            <FaChevronDown className={clsx('text-xs transition-transform', isExpanded ? 'rotate-180' : '')} />
          ) : (
            <FaPlus className="text-xs" />
          )}
        </Button>
      </div>

      {/* Collapsible Form Section */}
      {showForm && (
        <div className="border border-t-0 border-slate-200 overflow-hidden">
          {/* Content */}
          {isExpanded && (
            <div className="p-6 bg-white space-y-6" ref={formRef}>
              {/* Error Message Box */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border-2 border-red-500 rounded-sm">
                  <div className="flex items-start gap-3">
                    <div className="text-red-500 mt-0.5">⚠</div>
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2">Folgende Felder sind erforderlich:</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {validationErrors.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Name <span className="text-red-500 font-bold">*</span></label>
                  <div className={clsx(validationErrors.some(e => e.includes('Name')) && "ring-2 ring-red-500/50 rounded-sm")}>
                    <Input
                      placeholder="z.B. Bedienungsanleitung"
                      value={quickAddData.name}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Kategorie <span className="text-red-500 font-bold">*</span></label>
                  <div className={clsx(validationErrors.some(e => e.includes('Kategorie')) && "ring-2 ring-red-500/50 rounded-sm")}>
                    <Input
                      placeholder="z.B. Technisch, Marketig, Rechtlich"
                      value={quickAddData.category}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setIsExpanded(false);
                    setQuickAddData({ name: '', category: '' });
                    setValidationErrors([]);
                  }}
                  className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleQuickAddSubmit}
                  disabled={createDocTypeMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90"
                >
                  <FaPlus className="text-xs" />
                  {createDocTypeMutation.isPending ? 'Speichern...' : 'Speichern'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentTypeSelect;
