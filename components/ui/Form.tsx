import * as React from 'react';

/** Field label used above inputs/selects. */
export function Label({ children, htmlFor, className }: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-medium text-text-dim mb-1.5 ${className ?? ''}`}
    >
      {children}
    </label>
  );
}

/** Wraps a form control with consistent spacing. */
export function FormControl({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mb-4 ${className ?? ''}`}>{children}</div>;
}
