import Image from "next/image";

/** Logo officiel HawaeMD — fichier `public/logo.jpeg` */
export const HAWAE_LOGO_SRC = "/logo.jpeg";

type HawaeLogoProps = {
  /** Taille carrée en pixels */
  size?: number;
  className?: string;
  priority?: boolean;
  rounded?: "md" | "lg" | "xl" | "full";
};

const ROUNDED: Record<NonNullable<HawaeLogoProps["rounded"]>, string> = {
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  full: "rounded-full",
};

export function HawaeLogo({
  size = 42,
  className = "",
  priority = false,
  rounded = "lg",
}: HawaeLogoProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden bg-white ${ROUNDED[rounded]} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={HAWAE_LOGO_SRC}
        alt="Logo HawaeMD"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        priority={priority}
      />
    </span>
  );
}
