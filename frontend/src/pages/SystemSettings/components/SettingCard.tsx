import { cn } from '@/lib/utils';

interface SettingCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SettingCard: React.FC<SettingCardProps> = ({
  title,
  description,
  children,
  actions,
  className,
}) => {
  return (
    <div className={cn(
      'bg-bg-secondary border border-border rounded-lg p-6',
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};
