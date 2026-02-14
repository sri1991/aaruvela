import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Button = ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    children,
    ...props
}) => {
    const variants = {
        primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-lg shadow-primary/20',
        secondary: 'bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-dark)]',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700',
        ghost: 'hover:bg-gray-100 text-gray-700',
    };

    const sizes = {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-6 text-sm',
        lg: 'h-13 px-8 text-base',
        icon: 'h-10 w-10',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {children}
        </button>
    );
};

export const Input = React.forwardRef(
    ({ className, label, error, icon, ...props }, ref) => {
        return (
            <div className="w-full space-y-1 text-left">
                {label && <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 ml-1">{label}</label>}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[var(--color-primary)]">
                            {icon}
                        </div>
                    )}
                    <input
                        className={cn(
                            'flex h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 font-medium placeholder:text-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-light)]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 focus:border-[var(--color-primary)] focus:shadow-sm',
                            icon && 'pl-11',
                            error && 'border-red-500 focus-visible:ring-red-500',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            </div>
        );
    }
);
