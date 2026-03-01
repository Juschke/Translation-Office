import clsx from 'clsx';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
}

const Skeleton = ({ className, variant = 'text', width, height }: SkeletonProps) => {
    const isBrand = className?.includes('brand');
    const baseClasses = clsx("animate-pulse", isBrand ? "bg-brand-primary/10" : "bg-slate-200");

    const variantClasses = {
        text: "rounded-sm",
        circular: "rounded-full",
        rectangular: "",
        rounded: "rounded-sm"
    };

    return (
        <div
            className={clsx(baseClasses, variantClasses[variant], className)}
            style={{ width, height }}
        />
    );
};

export default Skeleton;
