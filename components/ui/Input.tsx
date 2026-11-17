import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

export function Input({ placeholder, ...props }: InputProps) {
  return (
    <input
      {...props}
      className="w-full rounded border border-border px-3 py-2 bg-transparent text-input placeholder:text-text-faint transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      placeholder={placeholder}
    />
  );
}