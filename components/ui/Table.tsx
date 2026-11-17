export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${className ?? ''}`}>{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
}

export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={className}>{children}</tr>
  );
}

export function TableCell({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={className} colSpan={colSpan}>
      {children}
    </td>
  );
}
