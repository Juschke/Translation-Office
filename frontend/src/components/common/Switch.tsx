// DEPRECATED: Use @/components/ui/switch instead
// This file exists for backward compatibility only
import React from 'react';
import { Switch as ShadcnSwitch } from '@/components/ui/switch';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    size?: 'sm' | 'md';
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange }) => {
    return (
        <ShadcnSwitch
            checked={checked}
            onCheckedChange={onChange}
        />
    );
};

export default Switch;
