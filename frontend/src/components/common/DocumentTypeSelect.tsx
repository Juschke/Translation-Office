import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FaPlus, FaChevronDown, FaFileContract, FaPassport, FaBriefcase, 
  FaUserGraduate, FaHeartbeat, FaCogs, FaGavel, FaGlobe, FaFileAlt 
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
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

const getCategoryIcon = (category: string) => {
    const c = category?.toLowerCase() || '';
    if (c.includes('urkunde') || c.includes('zeugnis') || c.includes('diplom')) return <FaUserGraduate className="text-[10px]" />;
    if (c.includes('vertrag') || c.includes('recht') || c.includes('justiz') || c.includes('legal')) return <FaFileContract className="text-[10px]" />;
    if (c.includes('ausweis') || c.includes('pass') || c.includes('ident')) return <FaPassport className="text-[10px]" />;
    if (c.includes('wirtschaft') || c.includes('business') || c.includes('finanz')) return <FaBriefcase className="text-[10px]" />;
    if (c.includes('medizin') || c.includes('arzt') || c.includes('klinik') || c.includes('gesundheit')) return <FaHeartbeat className="text-[10px]" />;
    if (c.includes('technik') || c.includes('industrie') || c.includes('bau')) return <FaCogs className="text-[10px]" />;
    if (c.includes('patent')) return <FaGavel className="text-[10px]" />;
    if (c.includes('web') || c.includes('it')) return <FaGlobe className="text-[10px]" />;
    return <FaFileAlt className="text-[10px]" />;
};

const DocumentTypeSelect: React.FC<DocumentTypeSelectProps> = ({
  options,
  value,
  onChange,
  error,
  className,
  placeholder,
  isMulti = true
}) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [quickAddData, setQuickAddData] = useState<QuickAddData>({
    name: '',
    category: ''
  });

  const queryClient = useQueryClient();
  const formRef = React.useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState('');

  const categories = React.useMemo(() => {
    const list = options.map(opt => opt.group).filter(Boolean) as string[];
    return [...new Set(list)].sort();
  }, [options]);

  const searchMatches = React.useMemo(() => {
    if (!searchInput.trim()) return true;
    return options.some(opt =>
      opt.label.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [searchInput, options]);

  const shouldShowAddNewOption = searchInput && !searchMatches;

  const handleAddNewClick = () => {
    setQuickAddData(prev => ({
      ...prev,
      name: searchInput.trim()
    }));
    setShowForm(true);
    setIsExpanded(true);
  };

  const extendedOptions = React.useMemo(() => {
    const baseOptions = options.map(opt => ({
        ...opt,
        icon: opt.group ? getCategoryIcon(opt.group) : <FaFileAlt className="text-[10px]" />
    }));

    if (shouldShowAddNewOption) {
      return [
        ...baseOptions,
        {
          value: `__new_${searchInput}__`,
          label: `+ ${searchInput} hinzufügen`,
          icon: <FaPlus className="text-[8px]" />
        }
      ];
    }
    return baseOptions;
  }, [options, shouldShowAddNewOption, searchInput]);

  const handleSelectChange = (val: any) => {
    if (Array.isArray(val)) {
        const lastVal = val[val.length - 1];
        if (typeof lastVal === 'string' && lastVal.startsWith('__new_')) {
            handleAddNewClick();
            onChange(val.slice(0, -1)); // Remove the temp value
            return;
        }
        onChange(val);
    } else {
        if (typeof val === 'string' && val.startsWith('__new_')) {
            handleAddNewClick();
        } else {
            onChange([val]);
        }
    }
  };

  const [categorySearchInput, setCategorySearchInput] = useState('');

  const extendedCategoryOptions = React.useMemo(() => {
    const list = categories.map(cat => ({ value: cat, label: cat }));
    const match = list.some(opt => opt.label.toLowerCase() === categorySearchInput.toLowerCase());
    
    if (categorySearchInput && !match) {
        return [
            ...list,
            {
                value: `__new_cat_${categorySearchInput}__`,
                label: `+ "${categorySearchInput}" als neue Kategorie`
            }
        ];
    }
    return list;
  }, [categories, categorySearchInput]);

  const handleCategorySelect = (val: string) => {
    if (val.startsWith('__new_cat_')) {
        const newCat = val.replace('__new_cat_', '').replace(/__$/, ''); // Clean up temp markers
        setQuickAddData(prev => ({ ...prev, category: newCat }));
    } else {
        setQuickAddData(prev => ({ ...prev, category: val }));
    }
  };

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
      toast.success(t('document_type_select.created_success'));
    },
    onError: () => {
      toast.error(t('document_type_select.created_error'));
    }
  });

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!quickAddData.name.trim()) errors.push(t('document_type_select.name_required'));
    if (!quickAddData.category.trim()) errors.push(t('document_type_select.category_required'));
    return errors;
  };

  const handleQuickAddSubmit = () => {
    const errors = validateForm();

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error(errors.length === 1 ? errors[0] : t('quick_add.fields_required', { count: errors.length, fields: errors.join(', ') }));
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
      <div className="flex items-end gap-0">
        <div className="flex-1 min-w-0">
          <SearchableSelect
            options={extendedOptions}
            value={value}
            onChange={handleSelectChange}
            placeholder={placeholder ?? t('document_type_select.placeholder')}
            error={error}
            roundedSide="left"
            isMulti={isMulti}
            onSearch={setSearchInput}
            badgeVariant="gray"
          />
        </div>
        <Button
          variant="default"
          onClick={() => {
            if (showForm) {
              setIsExpanded(!isExpanded);
            } else {
              setShowForm(true);
              setIsExpanded(true);
            }
          }}
          className="h-9 px-3 border-l-0 rounded-r-sm shadow-sm shrink-0"
          title={showForm ? t('actions.close') : t('document_type_select.quick_add')}
        >
          {isExpanded ? (
            <FaChevronDown className="text-xs text-white rotate-180 transition-transform" />
          ) : (
            <FaPlus className="text-xs text-white" />
          )}
        </Button>
      </div>

      {showForm && (
        <div className="border border-t-0 border-slate-200 overflow-hidden">
          {isExpanded && (
            <div className="p-6 bg-white space-y-6" ref={formRef}>
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border-2 border-red-500 rounded-sm">
                  <div className="flex items-start gap-3">
                    <div className="text-red-500 mt-0.5">!</div>
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2">{t('quick_add.required_fields')}</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {validationErrors.map((err, i) => (
                          <li key={i}>- {err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('fields.name')} <span className="text-red-500 font-bold">*</span></label>
                  <div className={clsx(validationErrors.some(e => e === t('document_type_select.name_required')) && 'ring-2 ring-red-500/50 rounded-sm')}>
                    <Input
                      placeholder={t('document_type_select.name_placeholder')}
                      value={quickAddData.name}
                      onChange={(e) => setQuickAddData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('document_type_select.category')} <span className="text-red-500 font-bold">*</span></label>
                  <div className={clsx(validationErrors.some(e => e === t('document_type_select.category_required')) && 'ring-2 ring-red-500/50 rounded-sm')}>
                    <SearchableSelect
                      options={extendedCategoryOptions}
                      value={quickAddData.category}
                      onChange={handleCategorySelect}
                      placeholder={t('document_type_select.category_placeholder')}
                      onSearch={setCategorySearchInput}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setIsExpanded(false);
                    setQuickAddData({ name: '', category: '' });
                    setValidationErrors([]);
                  }}
                  className="flex-1"
                >
                  {t('actions.cancel')}
                </Button>
                <Button
                  onClick={handleQuickAddSubmit}
                  disabled={createDocTypeMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <FaPlus className="text-xs text-white" />
                  {createDocTypeMutation.isPending ? t('actions.saving') : t('actions.save')}
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
