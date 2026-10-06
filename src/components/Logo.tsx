import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const PuntoMorfiLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const pixelSizes = {
    sm: 40,
    md: 56,
    lg: 84,
    xl: 130,
  };

  const px = pixelSizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Exact Vector Re-creation of the User's Punto Morfi Logo */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md transition-transform hover:scale-105 duration-300"
        aria-label="Punto Morfi - Casa de Comidas Logo"
      >
        <defs>
          {/* Shadow for the central Morfi text */}
          <filter id="morfiShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="5" dy="9" stdDeviation="5" floodColor="#273737" floodOpacity="0.45" />
          </filter>

          {/* Upper curve path for PUNTO */}
          <path id="curvePunto" d="M 120 120 A 135 135 0 0 1 280 120" />
          {/* Lower curve path for CASA DE COMIDAS */}
          <path id="curveCasaDeComidas" d="M 90 280 A 145 145 0 0 0 310 280" />
        </defs>

        {/* Outer Circular Base matching logo's teal/sage background */}
        <circle cx="200" cy="200" r="192" fill="#759694" />

        {/* Coral / Salmon Outer Ring */}
        <circle cx="200" cy="200" r="150" fill="none" stroke="#f88d63" strokeWidth="11" />

        {/* Upper curved text: PUNTO */}
        <text fill="#e2e663" fontSize="26" fontWeight="900" letterSpacing="4" fontFamily="'Fredoka', 'Plus Jakarta Sans', sans-serif">
          <textPath href="#curvePunto" startOffset="50%" textAnchor="middle">
            PUNTO
          </textPath>
        </text>

        {/* Central Lime-Yellow Sun Circle */}
        <circle cx="200" cy="200" r="108" fill="#e2e663" />

        {/* Lower curved text: CASA DE COMIDAS */}
        <text fill="#e2e663" fontSize="19" fontWeight="900" letterSpacing="3" fontFamily="'Fredoka', 'Plus Jakarta Sans', sans-serif">
          <textPath href="#curveCasaDeComidas" startOffset="50%" textAnchor="middle">
            CASA DE COMIDAS
          </textPath>
        </text>

        {/* Main "Morfi" text with exact playful typography and 3D shadow */}
        <g filter="url(#morfiShadow)">
          <text
            x="200"
            y="235"
            textAnchor="middle"
            fill="#f88d63"
            fontSize="106"
            fontWeight="900"
            fontFamily="'Fredoka', 'DynaPuff', 'Cabinet Grotesk', sans-serif"
            letterSpacing="-2"
            transform="rotate(-2 200 200)"
          >
            Morfi
          </text>
        </g>
      </svg>

      {showSubtitle && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#f88d63] font-['Fredoka']">
              Punto
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#e2e663] font-['Fredoka']">
              Morfi
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#d5dc74] -mt-1 font-['Plus_Jakarta_Sans']">
            Casa de Comidas
          </span>
        </div>
      )}
    </div>
  );
};
