import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an issue while loading this content. Please try again.',
  onRetry,
  className,
  retryLabel = 'Try Again',
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-red-100 bg-red-50/50 space-y-4 max-w-lg mx-auto my-6',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-bold text-slate-800">{title}</h4>
        <p className="text-sm text-slate-600 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-100/50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
