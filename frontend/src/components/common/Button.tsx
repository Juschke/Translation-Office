// DEPRECATED: Use @/components/ui/button instead
// This file exists for backward compatibility only
import React from 'react';
import { Button as ShadcnButton, type ButtonProps as ShadcnButtonProps } from '@/components/ui/button';

interface LegacyButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
 variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost' | 'outline';
 size?: 'sm' | 'md' | 'lg';
 isLoading?: boolean;
}

const variantMap: Record<string, ShadcnButtonProps['variant']> = {
 primary: 'default',
 secondary: 'secondary',
 danger: 'destructive',
 warning: 'warning',
 success: 'success',
 ghost: 'ghost',
 outline: 'outline',
};

const sizeMap: Record<string, ShadcnButtonProps['size']> = {
 sm: 'sm',
 md: 'default',
 lg: 'lg',
};

const Button = React.forwardRef<HTMLButtonElement, LegacyButtonProps>(
 ({ variant = 'primary', size = 'md', ...props }, ref) => {
 return (
 <ShadcnButton
 ref={ref}
 variant={variantMap[variant] || 'default'}
 size={sizeMap[size] || 'default'}
 {...props}
 />
 );
 }
);

Button.displayName = 'Button';

export { Button };
export default Button;
