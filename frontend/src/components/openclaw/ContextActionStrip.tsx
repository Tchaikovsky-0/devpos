import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ContextActionStripProps {
  title?: string;
  summary?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    tone?: 'default' | 'accent';
  }>;
  className?: string;
}

export function ContextActionStrip({
  title,
  summary,
  actions,
  className,
}: ContextActionStripProps) {
  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-[20px] bg-accent/5 px-4 py-3 lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      {title && (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{title}</p>
              {summary && <p className="mt-0.5 text-xs text-text-secondary">{summary}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant={action.tone === 'accent' ? 'primary' : 'secondary'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

export default ContextActionStrip;

