interface StatusBadgeProps {
  status: string;
  variant?: 'active' | 'pending' | 'inactive' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles: Record<string, { dot: string; bg: string; text: string }> = {
  active: { dot: 'bg-success', bg: 'bg-success/10', text: 'text-success' },
  success: { dot: 'bg-success', bg: 'bg-success/10', text: 'text-success' },
  pending: { dot: 'bg-warning', bg: 'bg-warning/10', text: 'text-warning' },
  warning: { dot: 'bg-warning', bg: 'bg-warning/10', text: 'text-warning' },
  inactive: { dot: 'bg-muted-foreground', bg: 'bg-muted', text: 'text-muted-foreground' },
  danger: { dot: 'bg-destructive', bg: 'bg-destructive/10', text: 'text-destructive' },
  info: { dot: 'bg-primary', bg: 'bg-primary/10', text: 'text-primary' },
};

export default function StatusBadge({ status, variant = 'active' }: StatusBadgeProps) {
  const style = variantStyles[variant] || variantStyles.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
