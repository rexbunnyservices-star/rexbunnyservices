interface CalEmbedProps {
  buttonText?: string;
  className?: string;
}

export default function CalEmbed({ buttonText = "Book a Strategy Call →", className = "" }: CalEmbedProps) {
  const handleClick = () => {
    window.open("https://cal.rexbunnyservices.online/strategy-call", "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      class={`rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-500 ${className}`}
    >
      {buttonText}
    </button>
  );
}
