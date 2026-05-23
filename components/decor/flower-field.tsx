/**
 * Campo de florecitas decorativas para el fondo del Hero.
 * Flores blancas con centro amarillo, flotando suavemente.
 * Respeta prefers-reduced-motion.
 */

function Flower({
  className = "",
  variant = "a",
  size = 24
}: {
  className?: string;
  variant?: "a" | "b" | "c";
  size?: number;
}) {
  // Petal gradient: blanco con borde sutil suave para definición
  const petalFill = "url(#petal-white)";
  const centerFill = "url(#center-yellow)";

  // Definimos los gradients una sola vez en variant a (reutilizables)
  if (variant === "a") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="petal-white" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFFCF0" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="center-yellow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="100%" stopColor="#E0B020" stopOpacity="1" />
          </radialGradient>
        </defs>
        <g>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="50"
              cy="28"
              rx="14"
              ry="22"
              fill={petalFill}
              stroke="rgba(200,158,255,0.25)"
              strokeWidth="1"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="7" fill={centerFill} />
        </g>
      </svg>
    );
  }

  if (variant === "b") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
        aria-hidden="true"
      >
        <g>
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <circle
              key={angle}
              cx="50"
              cy="28"
              r="16"
              fill={petalFill}
              stroke="rgba(200,158,255,0.25)"
              strokeWidth="1"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="8" fill={centerFill} />
        </g>
      </svg>
    );
  }

  // Variant C: cerezo de 4 pétalos
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <g>
        {[0, 90, 180, 270].map((angle) => (
          <ellipse
            key={angle}
            cx="50"
            cy="25"
            rx="13"
            ry="24"
            fill={petalFill}
            stroke="rgba(200,158,255,0.25)"
            strokeWidth="1"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="6" fill={centerFill} />
      </g>
    </svg>
  );
}

type FlowerSpec = {
  id: number;
  variant: "a" | "b" | "c";
  size: number;
  top: string;
  left: string;
  delay: string;
  duration: string;
  opacity: number;
  drift: "drift-1" | "drift-2" | "drift-3";
};

// 26 flores distribuidas para llenar el fondo sin saturar (tamaños grandes)
const FLOWERS: FlowerSpec[] = [
  // Columna 1 (izquierda)
  { id: 1,  variant: "a", size: 64, top: "5%",  left: "3%",   delay: "0s",   duration: "18s", opacity: 0.85, drift: "drift-1" },
  { id: 2,  variant: "b", size: 44, top: "18%", left: "8%",   delay: "3s",   duration: "22s", opacity: 0.7,  drift: "drift-2" },
  { id: 3,  variant: "c", size: 56, top: "32%", left: "2%",   delay: "1.5s", duration: "24s", opacity: 0.8,  drift: "drift-3" },
  { id: 4,  variant: "a", size: 40, top: "48%", left: "10%",  delay: "5s",   duration: "20s", opacity: 0.7,  drift: "drift-1" },
  { id: 5,  variant: "b", size: 60, top: "62%", left: "4%",   delay: "2s",   duration: "26s", opacity: 0.8,  drift: "drift-2" },
  { id: 6,  variant: "c", size: 48, top: "78%", left: "11%",  delay: "7s",   duration: "19s", opacity: 0.75, drift: "drift-3" },
  { id: 7,  variant: "a", size: 36, top: "92%", left: "5%",   delay: "4s",   duration: "21s", opacity: 0.7,  drift: "drift-1" },

  // Columna 2 (centro-izquierda)
  { id: 8,  variant: "b", size: 52, top: "10%", left: "22%",  delay: "6s",   duration: "23s", opacity: 0.7,  drift: "drift-2" },
  { id: 9,  variant: "c", size: 40, top: "38%", left: "20%",  delay: "0.5s", duration: "20s", opacity: 0.65, drift: "drift-3" },
  { id: 10, variant: "a", size: 56, top: "70%", left: "24%",  delay: "3.5s", duration: "25s", opacity: 0.75, drift: "drift-1" },
  { id: 11, variant: "b", size: 32, top: "88%", left: "28%",  delay: "8s",   duration: "18s", opacity: 0.65, drift: "drift-2" },

  // Columna centro (puede competir con texto - opacidad más baja)
  { id: 12, variant: "c", size: 44, top: "3%",  left: "42%",  delay: "2.5s", duration: "24s", opacity: 0.5,  drift: "drift-3" },
  { id: 13, variant: "a", size: 36, top: "85%", left: "40%",  delay: "5.5s", duration: "22s", opacity: 0.55, drift: "drift-2" },
  { id: 14, variant: "b", size: 48, top: "95%", left: "52%",  delay: "1s",   duration: "20s", opacity: 0.6,  drift: "drift-1" },

  // Columna 3 (centro-derecha)
  { id: 15, variant: "c", size: 60, top: "6%",  left: "58%",  delay: "4.5s", duration: "23s", opacity: 0.75, drift: "drift-3" },
  { id: 16, variant: "a", size: 40, top: "92%", left: "62%",  delay: "2s",   duration: "21s", opacity: 0.7,  drift: "drift-1" },

  // Columna 4 (derecha-superior, no chocar con la foto)
  { id: 17, variant: "b", size: 68, top: "3%",  left: "72%",  delay: "1.5s", duration: "25s", opacity: 0.8,  drift: "drift-2" },
  { id: 18, variant: "a", size: 44, top: "12%", left: "92%",  delay: "6s",   duration: "19s", opacity: 0.7,  drift: "drift-1" },
  { id: 19, variant: "c", size: 56, top: "25%", left: "97%",  delay: "3s",   duration: "22s", opacity: 0.75, drift: "drift-3" },

  // Columna 5 (derecha-inferior, debajo de la foto)
  { id: 20, variant: "a", size: 52, top: "75%", left: "78%",  delay: "0s",   duration: "24s", opacity: 0.75, drift: "drift-2" },
  { id: 21, variant: "b", size: 64, top: "88%", left: "85%",  delay: "4s",   duration: "20s", opacity: 0.85, drift: "drift-3" },
  { id: 22, variant: "c", size: 40, top: "95%", left: "73%",  delay: "7s",   duration: "23s", opacity: 0.7,  drift: "drift-1" },
  { id: 23, variant: "a", size: 48, top: "82%", left: "94%",  delay: "2.5s", duration: "21s", opacity: 0.8,  drift: "drift-2" },

  // Extras dispersas
  { id: 24, variant: "b", size: 36, top: "55%", left: "95%",  delay: "5s",   duration: "18s", opacity: 0.65, drift: "drift-3" },
  { id: 25, variant: "c", size: 32, top: "65%", left: "88%",  delay: "8.5s", duration: "22s", opacity: 0.6,  drift: "drift-1" },
  { id: 26, variant: "a", size: 28, top: "42%", left: "90%",  delay: "1s",   duration: "20s", opacity: 0.55, drift: "drift-2" }
];

export function FlowerField() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none -z-10"
      aria-hidden="true"
    >
      {/* SVG global con defs reutilizables — montado una sola vez */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="petal-white" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFFCF0" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="center-yellow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="100%" stopColor="#E0B020" stopOpacity="1" />
          </radialGradient>
        </defs>
      </svg>

      {FLOWERS.map((f) => (
        <div
          key={f.id}
          className={`absolute flower-drift ${f.drift}`}
          style={{
            top: f.top,
            left: f.left,
            opacity: f.opacity,
            animationDelay: f.delay,
            animationDuration: f.duration,
            filter: "drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))"
          }}
        >
          <div
            className="flower-spin"
            style={{ animationDuration: `${parseInt(f.duration) * 2}s` }}
          >
            <Flower variant={f.variant} size={f.size} />
          </div>
        </div>
      ))}
    </div>
  );
}
