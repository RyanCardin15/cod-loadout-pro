import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  WifiOff,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type ErrorType =
  | 'WEAPON_NOT_FOUND'
  | 'ENEMY_WEAPON_NOT_FOUND'
  | 'NO_COUNTERS_FOUND'
  | 'FIREBASE_CONNECTION_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR';

interface ErrorCardProps {
  type: ErrorType;
  title: string;
  message: string;
  suggestions?: string[];
  details?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  type,
  title,
  message,
  suggestions = [],
  details,
  onRetry,
  retryLabel = 'Try Again',
  className
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      // Reset after a short delay to prevent rapid clicking
      setTimeout(() => setIsRetrying(false), 1000);
    }
  };

  const getErrorIcon = () => {
    switch (type) {
      case 'FIREBASE_CONNECTION_ERROR':
      case 'NETWORK_ERROR':
        return <WifiOff className="w-16 h-16" />;
      case 'TIMEOUT_ERROR':
        return <AlertCircle className="w-16 h-16" />;
      case 'VALIDATION_ERROR':
        return <AlertTriangle className="w-16 h-16" />;
      case 'WEAPON_NOT_FOUND':
      case 'ENEMY_WEAPON_NOT_FOUND':
      case 'NO_COUNTERS_FOUND':
        return <Database className="w-16 h-16" />;
      default:
        return <XCircle className="w-16 h-16" />;
    }
  };

  const getErrorColor = () => {
    switch (type) {
      case 'FIREBASE_CONNECTION_ERROR':
      case 'NETWORK_ERROR':
      case 'TIMEOUT_ERROR':
        return 'text-yellow-500';
      case 'VALIDATION_ERROR':
        return 'text-orange-500';
      case 'WEAPON_NOT_FOUND':
      case 'ENEMY_WEAPON_NOT_FOUND':
      case 'NO_COUNTERS_FOUND':
        return 'text-gray-400';
      default:
        return 'text-red-500';
    }
  };

  const getRecoverySuggestions = () => {
    const baseSuggestions = [...suggestions];

    // Add type-specific suggestions
    switch (type) {
      case 'FIREBASE_CONNECTION_ERROR':
      case 'NETWORK_ERROR':
        baseSuggestions.push(
          'Check your internet connection',
          'Refresh the page',
          'Try again in a few moments'
        );
        break;
      case 'TIMEOUT_ERROR':
        baseSuggestions.push(
          'The server is taking too long to respond',
          'Try again with a simpler query',
          'Check your connection speed'
        );
        break;
      case 'WEAPON_NOT_FOUND':
      case 'ENEMY_WEAPON_NOT_FOUND':
        baseSuggestions.push(
          'Check the spelling of the weapon name',
          'Try using a different weapon name',
          'Browse available weapons first'
        );
        break;
    }

    return baseSuggestions.filter((s, i, arr) => arr.indexOf(s) === i); // Remove duplicates
  };

  const recoverySuggestions = getRecoverySuggestions();

  return (
    <motion.div
      className={cn(
        'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl',
        'border border-white/20 shadow-2xl rounded-xl p-8',
        'hover:border-cod-orange transition-all duration-300',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <div className={cn('mx-auto mb-4', getErrorColor())} aria-hidden="true">
        {getErrorIcon()}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-300 mb-2 text-center">
        {title}
      </h3>

      {/* Message */}
      <p className="text-gray-400 mb-6 max-w-md mx-auto text-center">
        {message}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        {onRetry && (
          <motion.button
            onClick={handleRetry}
            disabled={isRetrying}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-6 py-3',
              'bg-cod-orange/20 border border-cod-orange/50 rounded-lg',
              'text-cod-orange font-semibold',
              'hover:bg-cod-orange/30 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-cod-orange/50 focus:ring-offset-2 focus:ring-offset-cod-black',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            whileHover={!isRetrying ? { scale: 1.05 } : {}}
            whileTap={!isRetrying ? { scale: 0.95 } : {}}
          >
            <RefreshCw
              className={cn(
                'w-5 h-5',
                isRetrying && 'animate-spin'
              )}
            />
            {isRetrying ? 'Retrying...' : retryLabel}
          </motion.button>
        )}
      </div>

      {/* Recovery Suggestions */}
      {recoverySuggestions.length > 0 && (
        <motion.div
          className="bg-cod-black/50 rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-cod-orange font-semibold mb-3 text-sm uppercase tracking-wide">
            What you can try:
          </p>
          <ul className="space-y-2">
            {recoverySuggestions.map((suggestion, idx) => (
              <motion.li
                key={idx}
                className="text-white text-sm flex items-start gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
              >
                <span className="text-cod-orange mt-0.5">•</span>
                <span className="text-gray-300">{suggestion}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Technical Details (Expandable) */}
      {details && (
        <div className="mt-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={cn(
              'flex items-center justify-center gap-2 mx-auto',
              'text-gray-500 hover:text-gray-400',
              'text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-cod-orange/50 rounded px-3 py-1'
            )}
          >
            What went wrong?
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                className="mt-3 p-4 bg-cod-black/30 rounded border border-gray-700"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-gray-400 text-xs font-mono break-all">
                  {details}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

// Specialized error cards for common scenarios

interface ConnectionErrorCardProps {
  onRetry?: () => void;
  message?: string;
  className?: string;
}

export const ConnectionErrorCard: React.FC<ConnectionErrorCardProps> = ({
  onRetry,
  message = 'Unable to connect to the server. Please check your internet connection.',
  className
}) => {
  return (
    <ErrorCard
      type="FIREBASE_CONNECTION_ERROR"
      title="Connection Error"
      message={message}
      onRetry={onRetry}
      retryLabel="Reconnect"
      className={className}
    />
  );
};

interface NotFoundErrorCardProps {
  title: string;
  message: string;
  suggestions?: string[];
  className?: string;
}

export const NotFoundErrorCard: React.FC<NotFoundErrorCardProps> = ({
  title,
  message,
  suggestions,
  className
}) => {
  return (
    <ErrorCard
      type="WEAPON_NOT_FOUND"
      title={title}
      message={message}
      suggestions={suggestions}
      className={className}
    />
  );
};
