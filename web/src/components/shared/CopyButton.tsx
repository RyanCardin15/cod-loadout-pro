import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useClipboard } from '@/hooks/useClipboard';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { Tooltip } from './Tooltip';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  variant?: 'icon' | 'button' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  className,
  variant = 'icon',
  size = 'md',
  showLabel = false
}) => {
  const { copied, copy } = useClipboard({
    timeout: 2000,
  });
  const { showSuccess, showError, triggerHaptic } = useMicroInteractions();

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent event bubbling

    const success = await copy(text);

    if (success) {
      showSuccess('Copied to clipboard!');
      triggerHaptic([5, 5, 10]); // Success pattern
    } else {
      showError('Failed to copy');
      triggerHaptic([30, 10, 30]); // Error pattern
    }
  };

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (variant === 'icon') {
    return (
      <Tooltip content={copied ? 'Copied!' : label}>
        <motion.button
          onClick={handleCopy}
          className={cn(
            sizeClasses[size],
            'inline-flex items-center justify-center rounded-lg',
            'bg-cod-gray/50 hover:bg-cod-orange/20',
            'border border-white/10 hover:border-cod-orange/50',
            'text-gray-400 hover:text-cod-orange',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-cod-orange/50 focus:ring-offset-2 focus:ring-offset-cod-black',
            className
          )}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          aria-label={copied ? 'Copied!' : label}
        >
          <motion.div
            initial={false}
            animate={{
              scale: copied ? [1, 1.2, 1] : 1,
              rotate: copied ? [0, -10, 10, 0] : 0
            }}
            transition={{ duration: 0.3 }}
          >
            {copied ? (
              <Check className={cn(iconSizeClasses[size], 'text-green-400')} />
            ) : (
              <Copy className={iconSizeClasses[size]} />
            )}
          </motion.div>
        </motion.button>
      </Tooltip>
    );
  }

  if (variant === 'inline') {
    return (
      <motion.button
        onClick={handleCopy}
        className={cn(
          'inline-flex items-center gap-2 px-2 py-1 rounded',
          'text-cod-orange hover:text-yellow-500',
          'hover:bg-cod-orange/10',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-cod-orange/50',
          className
        )}
        whileTap={{ scale: 0.95 }}
        aria-label={copied ? 'Copied!' : label}
      >
        {showLabel && (
          <span className="text-xs font-medium">
            {copied ? 'Copied!' : label}
          </span>
        )}
        <motion.div
          initial={false}
          animate={{
            scale: copied ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </motion.div>
      </motion.button>
    );
  }

  // variant === 'button'
  return (
    <motion.button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
        'bg-cod-gray/50 hover:bg-cod-orange/20',
        'border border-white/10 hover:border-cod-orange/50',
        'text-gray-300 hover:text-cod-orange',
        'font-medium text-sm',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-cod-orange/50 focus:ring-offset-2 focus:ring-offset-cod-black',
        className
      )}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      aria-label={copied ? 'Copied!' : label}
    >
      <span>{copied ? 'Copied!' : label}</span>
      <motion.div
        initial={false}
        animate={{
          scale: copied ? [1, 1.2, 1] : 1,
          rotate: copied ? [0, -10, 10, 0] : 0
        }}
        transition={{ duration: 0.3 }}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </motion.div>
    </motion.button>
  );
};

// Specialized copy button for weapon names
interface CopyWeaponButtonProps {
  weaponName: string;
  className?: string;
}

export const CopyWeaponButton: React.FC<CopyWeaponButtonProps> = ({
  weaponName,
  className
}) => {
  return (
    <CopyButton
      text={weaponName}
      label="Copy weapon name"
      variant="icon"
      size="sm"
      className={className}
    />
  );
};

// Specialized copy button for loadout codes
interface CopyLoadoutCodeButtonProps {
  loadoutCode: string;
  className?: string;
}

export const CopyLoadoutCodeButton: React.FC<CopyLoadoutCodeButtonProps> = ({
  loadoutCode,
  className
}) => {
  return (
    <CopyButton
      text={loadoutCode}
      label="Copy loadout code"
      variant="button"
      className={className}
    />
  );
};
