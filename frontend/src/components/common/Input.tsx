// DEPRECATED: Use @/components/ui/input, @/components/ui/textarea, or @/components/ui/select instead
// This file exists for backward compatibility only
import React, { type ReactNode } from 'react';
import { Input as ShadcnInput } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
 label?: string;
 error?: boolean;
 helperText?: string;
 startIcon?: ReactNode;
 endIcon?: ReactNode;
 onEndIconClick?: () => void;
 containerClassName?: string;
 isTextArea?: boolean;
 isSelect?: boolean;
}

const Input: React.FC<InputProps> = ({
 label,
 error,
 helperText,
 startIcon,
 endIcon,
 onEndIconClick,
 className,
 containerClassName,
 isTextArea,
 isSelect,
 children,
 ...props
}) => {
 if (isTextArea) {
 return (
 <Textarea
 label={label}
 error={error}
 helperText={helperText}
 containerClassName={containerClassName}
 className={className}
 {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
 />
 );
 }

 if (isSelect) {
 return (
 <Select
 label={label}
 error={error}
 helperText={helperText}
 containerClassName={containerClassName}
 className={className}
 {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
 >
 {children}
 </Select>
 );
 }

 return (
 <ShadcnInput
 label={label}
 error={error}
 helperText={helperText}
 startIcon={startIcon}
 endIcon={endIcon}
 onEndIconClick={onEndIconClick}
 containerClassName={containerClassName}
 className={className}
 {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
 />
 );
};

export default Input;
