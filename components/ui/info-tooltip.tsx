'use client';

import { Info, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
    content: string | React.ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    iconSize?: 'sm' | 'md' | 'lg';
    variant?: 'info' | 'help';
}

/**
 * A reusable info tooltip component that shows helpful information on hover.
 * 
 * Usage:
 * <InfoTooltip content="This is helpful information about this feature" />
 * 
 * Or with JSX content:
 * <InfoTooltip content={<div><strong>Title</strong><p>Description</p></div>} />
 */
export function InfoTooltip({
    content,
    side = 'top',
    className,
    iconSize = 'sm',
    variant = 'info'
}: InfoTooltipProps) {
    const Icon = variant === 'info' ? Info : HelpCircle;

    const sizeClasses = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    return (
        <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-help",
                        className
                    )}
                >
                    <Icon className={cn(sizeClasses[iconSize], "text-blue-500")} />
                </button>
            </TooltipTrigger>
            <TooltipContent side={side} className="max-w-[280px]">
                {typeof content === 'string' ? (
                    <p className="text-xs">{content}</p>
                ) : (
                    content
                )}
            </TooltipContent>
        </Tooltip>
    );
}

/**
 * A label with an info tooltip - commonly used for form fields
 * 
 * Usage:
 * <LabelWithTooltip label="Module Address" tooltip="The 0x-prefixed address where your contract is deployed" />
 */
interface LabelWithTooltipProps {
    label: string;
    tooltip: string | React.ReactNode;
    required?: boolean;
    className?: string;
}

export function LabelWithTooltip({ label, tooltip, required, className }: LabelWithTooltipProps) {
    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <span className="text-sm font-medium">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </span>
            <InfoTooltip content={tooltip} iconSize="sm" />
        </div>
    );
}

/**
 * A feature badge with tooltip for explaining what something does
 */
interface FeatureBadgeProps {
    label: string;
    description: string;
    variant?: 'default' | 'success' | 'warning' | 'info';
}

export function FeatureBadge({ label, description, variant = 'default' }: FeatureBadgeProps) {
    const variantClasses = {
        default: 'bg-muted text-muted-foreground',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        info: 'bg-blue-100 text-blue-700',
    };

    return (
        <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
                <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-help",
                    variantClasses[variant]
                )}>
                    {label}
                    <Info className="w-3 h-3" />
                </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[250px]">
                <p className="text-xs">{description}</p>
            </TooltipContent>
        </Tooltip>
    );
}
