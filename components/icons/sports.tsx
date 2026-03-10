// components/icons/sports.tsx

type Props = { className?: string };

// 🏀 Basketball — líneas curvas + costuras muy reconocibles
export function BasketballIcon({ className = "w-4 h-4" }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      {/* costura horizontal */}
      <path d="M3.2 12h17.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {/* dos costuras curvas (las que lo hacen “basket”) */}
      <path
        d="M12 3a12 12 0 0 1 0 18"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M12 3a12 12 0 0 0 0 18"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* arco adicional para dar “realismo” */}
      <path
        d="M5.2 6.6c2.2 1.3 4.5 3.6 4.5 5.4s-2.3 4.1-4.5 5.4"
        stroke="currentColor"
        strokeWidth="1.0"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

// ⚽ Soccer — pentágono central + paneles laterales (se reconoce al toque)
export function SoccerIcon({ className = "w-4 h-4" }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      {/* pentágono central */}
      <path
        d="M12 7.1l3 2.2-1.1 3.5H10.1L9 9.3 12 7.1z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* “paneles” alrededor */}
      <path
        d="M9 9.3 6.6 10.6 7.4 13.4 10.1 12.8"
        stroke="currentColor"
        strokeWidth="1.0"
        strokeLinejoin="round"
      />
      <path
        d="M15 9.3 17.4 10.6 16.6 13.4 13.9 12.8"
        stroke="currentColor"
        strokeWidth="1.0"
        strokeLinejoin="round"
      />
      <path
        d="M10.1 12.8 9.2 15.6 12 17.1 14.8 15.6 13.9 12.8"
        stroke="currentColor"
        strokeWidth="1.0"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 🏈 Football — forma “balón” + costura central + laces (los tiritos)
export function FootballIcon({ className = "w-4 h-4" }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      {/* forma */}
      <path
        d="M4.6 14.7c-1.1-2.1-1.1-4.3 0-6.4C6.4 5 9.7 3.4 12 3.4s5.6 1.6 7.4 4.9c1.1 2.1 1.1 4.3 0 6.4-1.8 3.3-5.1 4.9-7.4 4.9s-5.6-1.6-7.4-4.9z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* costura central */}
      <path d="M7.2 12h9.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* laces */}
      <path d="M10.2 10.8v2.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M12 10.5v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M13.8 10.8v2.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}