
function MiniBus() {
  return (
    <svg
      viewBox="0 0 64 32"
      width="46"
      height="23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Bus body */}
      <rect
        x="3"
        y="5"
        width="57"
        height="22"
        rx="6"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1"
      />

      {/* Red lower stripe */}
      <path
        d="M5 20H58V24H5Z"
        fill="#EF4444"
      />

      {/* Windows */}
      <rect x="9" y="9" width="12" height="9" rx="2" fill="#17202D"/>
      <rect x="24" y="9" width="12" height="9" rx="2" fill="#17202D"/>
      <rect x="39" y="9" width="10" height="9" rx="2" fill="#17202D"/>

      {/* Windshield */}
      <path
        d="M51 9H55C57 9 58 11 58 13V18H51V9Z"
        fill="#17202D"
      />

      {/* Door */}
      <path
        d="M37 9V23"
        stroke="#CBD5E1"
        strokeWidth="1"
      />

      {/* Wheels */}
      <circle cx="16" cy="26" r="4" fill="#111827"/>
      <circle cx="49" cy="26" r="4" fill="#111827"/>
      <circle cx="16" cy="26" r="1.5" fill="#94A3B8"/>
      <circle cx="49" cy="26" r="1.5" fill="#94A3B8"/>

      {/* Headlight */}
      <rect
        x="59"
        y="18"
        width="3"
        height="3"
        rx="1"
        fill="#FDE68A"
      />
    </svg>
  );
}

export default function AnimatedBus() {
  return (
    <div className="tmd-orbit" aria-hidden="true">
      <div className="tmd-orbit-track" />

      <div className="tmd-orbit-bus">
        <MiniBus />
      </div>

      <div className="tmd-orbit-bus tmd-orbit-bus-second">
        <MiniBus />
      </div>
    </div>
  );
}
