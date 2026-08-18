export function Icon({ name, size = 16 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.75',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  return (
    <svg {...common}>
      {name === 'building' && (
        <>
          <rect x="4" y="8" width="16" height="13" rx="1.5" />
          <path d="M9 21V12h6v9M4 12h16M8 4h8v4H8z" />
        </>
      )}
      {name === 'user' && (
        <>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19.5c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" />
        </>
      )}
      {name === 'pill' && (
        <>
          <rect x="3.5" y="8" width="17" height="8" rx="4" />
          <path d="M12 8v8" />
        </>
      )}
      {name === 'shield' && <path d="M12 3l8 3.5v5.2c0 4.3-3.2 7.6-8 9.3-4.8-1.7-8-5-8-9.3V6.5L12 3z" />}
      {name === 'barcode' && <path d="M4 6v12M7 6v12M9 6v12M13 6v12M16 6v12M20 6v12" />}
      {name === 'calendar' && (
        <>
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M8 4v4M16 4v4M4 10h16" />
        </>
      )}
      {name === 'list' && <path d="M8 7h12M8 12h12M8 17h12M5 7h.01M5 12h.01M5 17h.01" />}
      {name === 'chevron' && <path d="M7 10l5 5 5-5" />}
      {name === 'refresh' && <path d="M20 12a8 8 0 1 1-2.2-5.5M20 4v5h-5" />}
      {name === 'submit' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.2l2.6 2.6L16.2 9.4" />
        </>
      )}
      {name === 'send' && <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />}
      {name === 'paperclip' && <path d="M21 12.5V17a5 5 0 0 1-10 0V7a3.5 3.5 0 0 1 7 0v9.5a2 2 0 1 1-4 0V8" />}
      {name === 'wand' && (
        <>
          <path d="M4 20l8.5-8.5" />
          <path d="M14 4l1.15 2.6L18 8l-2.85 1.15L14 12l-1.15-2.85L10 8l2.85-1.4L14 4z" />
          <path d="M19 13l.7 1.5L21 15l-1.3.5L19 17l-.7-1.5L17 15l1.3-.5L19 13z" />
        </>
      )}
      {name === 'doc' && (
        <>
          <path d="M7 4h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          <path d="M14 4v5h5M9 13h6M9 17h4" />
        </>
      )}
      {name === 'docbot' && (
        <>
          <path d="M7 3.5h7.2L19 8.2V20a1.8 1.8 0 0 1-1.8 1.8H7A1.8 1.8 0 0 1 5.2 20V5.3A1.8 1.8 0 0 1 7 3.5z" />
          <path d="M14.2 3.5V8H19" />
          <circle cx="12" cy="14.2" r="3.1" />
          <path d="M10.7 13.6h.01M13.3 13.6h.01M10.8 15.2c.4.5 1 .8 1.2.8s.8-.3 1.2-.8" />
        </>
      )}
      {name === 'check' && <path d="M5 12.5l4 4 10-10" />}
      {name === 'check-circle' && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.2 12.2l2.5 2.5 5.2-5.3" />
        </>
      )}
      {name === 'sun' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v1.5M12 19.5V21M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3 12h1.5M19.5 12H21M4.9 19.1L6 18M18 6l1.1-1.1" />
        </>
      )}
      {name === 'moon' && <path d="M20 14.5A7.5 7.5 0 1 1 9.5 4 6 6 0 0 0 20 14.5z" />}
    </svg>
  )
}

export function HexMark() {
  return (
    <svg className="hex-mark" viewBox="0 0 36 36" aria-hidden="true">
      <defs>
        <linearGradient id="hexg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path
        d="M18 2.2 31.2 9.6v14.8L18 33.8 4.8 24.4V9.6L18 2.2z"
        fill="url(#hexg)"
      />
      <text x="18" y="22.5" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="Inter, system-ui">
        A
      </text>
    </svg>
  )
}
