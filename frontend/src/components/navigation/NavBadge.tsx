import clsx from 'clsx';

interface NavBadgeProps {
    count: number | undefined;
    label: string;
    activeColor?: string;
    isPriority?: boolean;
    isMobile?: boolean;
}

const NavBadge = ({
    count,
    label,
    activeColor = "bg-rose-500",
    isPriority = false,
    isMobile = false
}: NavBadgeProps) => {
    const displayCount = count || 0;
    return (
        <div className="relative group ml-1.5 flex items-center">
            <span className={clsx(
                "text-xs w-5 h-5 flex items-center justify-center rounded-full font-semibold shadow-sm transition-all duration-300",
                displayCount === 0
                    ? (isMobile ? "bg-brand-primary text-white" : "bg-white/10 text-white/50 group-hover:bg-white/20 text-white")
                    : `${activeColor} text-white`,
                isPriority && displayCount > 0 && "animate-pulse ring-2 ring-rose-500/20"
            )}>
                {displayCount}
            </span>
            {/* Tooltip */}
            {!isMobile && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-2.5 py-1.5 bg-brand-primary text-white text-sm rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-white/10 backdrop-blur-sm transform -translate-y-1 group-hover:translate-y-0 hidden sm:block">
                    <div className="font-semibold">{label}</div>
                    <div className="text-xs text-white/70 mt-0.5">{displayCount} insgesamt</div>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-brand-primary"></span>
                </div>
            )}
        </div>
    );
};

export default NavBadge;
