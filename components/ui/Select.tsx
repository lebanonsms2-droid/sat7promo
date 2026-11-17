import * as React from 'react';

export interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  multiple?: boolean;
  /** Receives a `string` for single-select, `string[]` for `multiple`. */
  onValueChange?: (value: any) => void;
  disabled?: boolean;
  placeholder?: string;
  children: React.ReactNode;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function Select({ multiple, onValueChange, disabled, placeholder, children }: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (multiple) {
      const values = Array.from(e.target.selectedOptions).map((o) => o.value);
      onValueChange?.(values);
    } else {
      onValueChange?.(e.target.value);
    }
  };

  return (
    <div className="relative">
      <select
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled}
        defaultValue={multiple ? undefined : ''}
        className="block w-full rounded border border-border px-3 py-2 bg-transparent text-input placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {!multiple && placeholder ? (
          <option value="">{placeholder}</option>
        ) : null}
        {children}
      </select>
    </div>
  );
}

/** Marker component — options are rendered directly inside the native <select>. */
export function SelectTrigger({ children }: { children?: React.ReactNode }) {
  return null;
}

/** Marker component for the selected value display. */
export function SelectValue({ children }: { children?: React.ReactNode }) {
  return null;
}

/** Marker component — its children (SelectItem options) become <select> options. */
export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
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
