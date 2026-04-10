import React from 'react';
import clsx from 'clsx';
import { DIVIDER_CLASSES, SPACING } from '@/constants/designTokens';

interface SectionDividerProps {
  /**
   * Divider variant/style
   */
  variant?: keyof typeof DIVIDER_CLASSES;

  /**
   * Position of the divider
   */
  position?: 'top' | 'bottom' | 'both';

  /**
   * Custom spacing
   */
  spacing?: keyof typeof SPACING;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Optional content to display in the middle
   */
  children?: React.ReactNode;
}

/**
 * Standardisierte Section Divider Komponente
 * Ersetzt 119+ manuelle border-Deklarationen
 */
const SectionDivider: React.FC<SectionDividerProps> = ({
  variant = 'default',
  position = 'bottom',
  spacing = 'md',
  className,
  children,
}) => {
  const spacingClasses: Record<keyof typeof SPACING, string> = {
    xs: 'my-1',
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-6',
    xl: 'my-8',
    '2xl': 'my-10',
    '3xl': 'my-12',
    '4xl': 'my-16',
  };

  const baseClass = clsx(
    {
      'border-t': position === 'top' || position === 'both',
      'border-b': position === 'bottom' || position === 'both',
    },
    DIVIDER_CLASSES[variant],
    spacingClasses[spacing as keyof typeof SPACING],
    className
  );

  // If children are provided, render as a divider with content
  if (children) {
    return (
      <div className={clsx('flex items-center gap-4', spacingClasses[spacing as keyof typeof SPACING])}>
        <div className={clsx('flex-1', DIVIDER_CLASSES[variant])} />
        <div className="flex-shrink-0 text-sm text-slate-500 font-medium">{children}</div>
        <div className={clsx('flex-1', DIVIDER_CLASSES[variant])} />
      </div>
    );
  }

  return <div className={baseClass} />;
};

export default SectionDivider;
