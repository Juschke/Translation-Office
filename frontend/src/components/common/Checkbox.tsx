// DEPRECATED: Use @/components/ui/checkbox instead
// This file exists for backward compatibility only
import React from 'react';
import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox';

interface CheckboxProps {
 checked: boolean;
 onChange: () => void;
 className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, className = '' }) => {
 return (
 <ShadcnCheckbox
 checked={checked}
 onCheckedChange={onChange}
 className={className}
 onClick={(e: React.MouseEvent) => e.stopPropagation()}
 />
 );
};

export default Checkbox;
