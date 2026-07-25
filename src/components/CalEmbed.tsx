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
      class={`rounded-xl border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400 hover:shadow-md ${className}`}
    >
      {buttonText}
    </button>
  );
}
