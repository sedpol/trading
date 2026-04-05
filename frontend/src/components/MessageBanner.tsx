type MessageVariant = 'error' | 'success' | 'info' | 'warning';

type MessageBannerProps = {
  variant: MessageVariant;
  message: string;
  compact?: boolean;
  prefix?: string;
};

const legacyVariantClass: Record<MessageVariant, string | null> = {
  error: 'error-banner',
  success: 'success-banner',
  info: null,
  warning: null,
};

export function MessageBanner({ variant, message, compact = false, prefix }: MessageBannerProps) {
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';
  const legacyClass = legacyVariantClass[variant];

  return (
    <div
      className={[
        'message-banner',
        `message-banner-${variant}`,
        compact ? 'message-banner-compact' : '',
        legacyClass ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
    >
      <p>
        {prefix}
        {message}
      </p>
    </div>
  );
}