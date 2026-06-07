import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
}

const sizes = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-5xl",
};

export default function Logo({ size = "md", variant = "default" }: LogoProps) {
  const isWhite = variant === "white";

  return (
    <Link href="/" className="flex items-center gap-1 select-none">
      <Image src="/logo.png" alt="MediOfertas" width={40} height={40} className="w-10 h-10 object-contain" />

      {/* Wordmark bicolor */}
      <span className={`${sizes[size]} font-bold tracking-tight leading-none`}>
        <span className={isWhite ? "text-white" : "text-primary-500"}>Medi</span>
        <span className={isWhite ? "text-primary-300" : "text-secondary-500"}>Ofertas</span>
      </span>
    </Link>
  );
}
