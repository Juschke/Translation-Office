import React from 'react';
import clsx from 'clsx';
import { ROW_CLASSES } from '@/constants/designTokens';

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  /**
   * Zusätzliche Variablen für Dunnig-Settings
   * Kann entweder Array von Objekten oder Array von Strings sein
   */
  variables?: Array<{ id: string; name: string } | string>;
  onVariableClick?: (id: string) => void;
  /**
   * Zentriert den Content vertikal
   */
  alignCenter?: boolean;
}

/**
 * Standardisierte Zeile für Settings/Einstellungsseiten
 * Nutzt konsistentes 2-Spalten-Layout (Label / Content)
 */
const SettingRow: React.FC<SettingRowProps> = ({
  label,
  description,
  children,
  className,
  required = false,
  variables,
  onVariableClick,
  alignCenter = false,
}) => {
  return (
    <div
      className={clsx(
        'grid grid-cols-12 gap-6 py-6 border-b border-slate-100 last:border-0',
        alignCenter ? 'items-center' : 'items-start',
        className
      )}
    >
      {/* Label / Description Column */}
      <div className={clsx('col-span-12 md:col-span-4', variables ? 'space-y-3' : 'space-y-1')}>
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && (
          <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        )}
        {variables && variables.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {variables.map((variable, idx) => {
              const isString = typeof variable === 'string';
              const id = isString ? variable : variable.id;
              const name = isString ? variable : variable.name;
              return (
                <button
                  key={isString ? idx : id}
                  onClick={() => onVariableClick?.(id)}
                  className="px-2 py-0.5 bg-white text-slate-500 rounded-sm text-[10px] font-mono
                    border border-slate-200 hover:border-[#1B4D4F] hover:text-[#1B4D4F]
                    hover:bg-[#1B4D4F]/5 transition-all cursor-pointer active:scale-95"
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Column */}
      <div className="col-span-12 md:col-span-8">{children}</div>
    </div>
  );
};

export default SettingRow;
