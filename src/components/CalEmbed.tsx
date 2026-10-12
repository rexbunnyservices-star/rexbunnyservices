import { trackMetaEvent } from '../lib/metaTracking';

interface CalEmbedProps {
  buttonText?: string;
  className?: string;
}

export default function CalEmbed({
  buttonText = 'Book a Strategy Call →',
  className = '',
}: CalEmbedProps) {
  const handleClick = () => {
    // Booking happens on a different origin (link-out, not an embed), so the
    // pixel can't see the actual booking. Record the intent click as a custom
    // event rather than a Lead — don't inflate the Lead count.
    trackMetaEvent('BookCallClick', { content_name: buttonText });
    window.open(
      'https://cal.rexbunnyservices.online/org/rexbunny/rexbunny/30min',
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <button
      onClick={handleClick}
      class={`rounded-xl border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400 hover:shadow-md ${className}`}
    >
      {buttonText}
    </button>
  );
}
