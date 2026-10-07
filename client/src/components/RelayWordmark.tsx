export default function RelayWordmark() {
  return (
    <span className="relay-wordmark">
      <svg
        aria-hidden="true"
        className="relay-mark"
        viewBox="0 0 40 40"
        fill="none"
      >
        <path
          d="M10 22.5a10 10 0 0 1 17.1-7.1l2.7 2.7M30 17.5a10 10 0 0 1-17.1 7.1l-2.7-2.7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.8"
        />
        <circle cx="30.5" cy="18" r="3.5" fill="currentColor" />
      </svg>
      <span className="relay-wordmark-type">
        <span>Lumistro</span>
        <strong>Relay</strong>
      </span>
    </span>
  );
}
