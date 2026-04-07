import React, { forwardRef, useRef, useEffect, useState } from 'react';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: 'vertical' | 'horizontal' | 'both';
}

const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className = '', orientation = 'vertical', ...props }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollbar, setShowScrollbar] = useState(false);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;

      const handleScroll = () => {
        const hasVerticalScroll = el.scrollHeight > el.clientHeight;
        const hasHorizontalScroll = el.scrollWidth > el.clientWidth;
        
        setShowScrollbar(
          (orientation === 'vertical' && hasVerticalScroll) ||
          (orientation === 'horizontal' && hasHorizontalScroll) ||
          (orientation === 'both' && (hasVerticalScroll || hasHorizontalScroll))
        );
      };

      handleScroll();
      el.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);

      return () => {
        el.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }, [orientation]);

    return (
      <div ref={ref} className={`relative overflow-hidden ${className}`} {...props}>
        <div
          ref={scrollRef}
          className={`h-full w-full overflow-auto scrollbar-thin ${
            orientation === 'vertical' ? 'overflow-y-auto' : ''
          } ${
            orientation === 'horizontal' ? 'overflow-x-auto' : ''
          }`}
        >
          {children}
        </div>
        {/* Scrollbar */}
        {showScrollbar && orientation !== 'horizontal' && (
          <div className="absolute right-0 top-0 bottom-0 w-2 pointer-events-none">
            <div className="absolute right-0.5 top-0 bottom-0 w-1 bg-border/30 rounded-full hover:bg-border/50 transition-colors" />
          </div>
        )}
      </div>
    );
  }
);
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };

export type { ScrollAreaProps };
