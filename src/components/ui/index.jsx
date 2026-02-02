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
                'inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer',
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
            <div className="w-full space-y-1.5 text-left">
                {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700">{label}</label>}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                            {icon}
                        </div>
                    )}
                    <input
                        className={cn(
                            'flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:border-[var(--color-primary)]',
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
