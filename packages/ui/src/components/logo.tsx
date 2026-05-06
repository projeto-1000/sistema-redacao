import React from "react";

type LogoVariant = "default" | "icon" | "white";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: LogoVariant;
}

const LOGO_PATHS: Record<LogoVariant, string> = {
  default: "/logo.svg",
  icon: "/logo-icon.svg",
  white: "/logo-white.svg",
};

export function Logo({ variant = "default", className = "", ...props }: LogoProps) {

  return (
    <img
      src={LOGO_PATHS[variant]}
      alt="Logo Projeto 1000"
      className={`object-fit ${className}`}
      {...props}
    />
  );
}