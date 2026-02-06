import clsx from 'clsx';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
}

const Skeleton = ({ className, variant = 'text', width, height }: SkeletonProps) => {
    const baseClasses = "animate-pulse bg-slate-200";

    const variantClasses = {
        text: "rounded-md",
        circular: "rounded-full",
        rectangular: "",
        rounded: "rounded-lg"
    };

    return (
        <div
            className={clsx(baseClasses, variantClasses[variant], className)}
            style={{ width, height }}
        />
    );
};

export default Skeleton;
