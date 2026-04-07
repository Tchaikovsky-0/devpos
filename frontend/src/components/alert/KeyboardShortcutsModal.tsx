import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { alertShortcutsHelp } from '../../hooks/useAlertShortcuts';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * KeyboardShortcutsModal — 键盘快捷键帮助弹窗
 */
export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  open,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-full max-w-md',
              'bg-surface/95 backdrop-blur-xl',
              'border border-border-strong rounded-xl',
              'shadow-2xl z-[501]',
              'p-6'
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">键盘快捷键</h3>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-secondary hover:bg-bg-hover"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {alertShortcutsHelp.map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-text-tertiary">{description}</span>
                  <kbd className="px-2 py-1 text-xs font-mono text-text-secondary bg-bg-hover rounded border border-border">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
