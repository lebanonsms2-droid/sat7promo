import * as React from 'react';

export interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  multiple?: boolean;
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  children: React.ReactNode;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function Select({ multiple, onValueChange, disabled, placeholder, children }: SelectProps) {
  const handleChange = (e: React.ChangeEvent<any>) => {
    const values = Array.from(e.target.selectedOptions).map((o: any) => o.value);
    onValueChange?.(values);
  };

  return (
    <div className="relative">
      <select
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled}
        className="block w-full rounded border border-border px-3 py-2 bg-transparent text-input placeholder:text-text-faint"
      >
        {children}
      </select>
      <div className="absolute right-0 top-1/2 -translate-y-1 text-text-faint text-xs pointer-events-none">
        {placeholder}
      </div>
    </div>
  );
}

export function SelectTrigger({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center">{children}</div>;
}

export function SelectValue({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute z-10 max-h-80 overflow-y-auto rounded border border-border bg-surface shadow-card w-full"
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children }: SelectItemProps) {
  return (
    <option
      value={value}
      className="px-3 py-2 cursor-pointer select-none hover:bg-surface-2"
    >
      {children}
    </option>
  );
}