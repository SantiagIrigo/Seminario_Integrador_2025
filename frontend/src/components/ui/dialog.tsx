import * as React from 'react';

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ open = true, onOpenChange, children }: DialogProps) {
  // Minimal controlled wrapper; renders children when open
  if (!open) return null;
  return <div role="dialog" aria-modal="true">{children}</div>;
}

type DialogContentProps = React.HTMLAttributes<HTMLDivElement>;
export function DialogContent({ className, ...props }: DialogContentProps) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-lg ${className || ''}`} {...props} />
  );
}

type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={`mb-4 ${className || ''}`} {...props} />;
}

type DialogTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h3 className={`text-lg font-semibold ${className || ''}`} {...props} />;
}

type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;
export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return <div className={`mt-4 flex justify-end gap-2 ${className || ''}`} {...props} />;
}