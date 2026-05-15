import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
}

const sizes = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

export default function Logo({ size = "md", variant = "default" }: LogoProps) {
  const isWhite = variant === "white";

  return (
    <Link href="/" className="flex items-center gap-1 select-none">
      {/* Ícono píldora */}
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 shadow-md shadow-primary-500/30">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
          <path
            d="M10.5 3.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"
            fill="white"
            fillOpacity="0.9"
          />
          <path
            d="M13.5 8.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"
            fill="white"
            fillOpacity="0.5"
          />
          <path
            d="M10.5 3.5a6 6 0 0 1 3 0.72L7.22 10.5A6 6 0 0 1 10.5 3.5z"
            fill="#1f9871"
          />
        </svg>
      </span>

      {/* Wordmark bicolor */}
      <span className={`${sizes[size]} font-bold tracking-tight leading-none`}>
        <span className={isWhite ? "text-white" : "text-primary-500"}>Farma</span>
        <span className={isWhite ? "text-primary-300" : "text-secondary-500"}>Compara</span>
      </span>
    </Link>
  );
}
