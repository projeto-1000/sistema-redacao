export function BrandWordmark({
  variant = "claro",
  className = "",
  height = 36,
}: {
  variant?: "padrao" | "perfil-azul" | "claro" | "escuro";
  className?: string;
  height?: number;
}) {
  const onDark = variant === "escuro" || variant === "perfil-azul";

  return (
    <Image
      src={
        onDark
          ? "/images/projeto1000-logo-transparent.png"
          : "/images/logo-saas.png"
      }
      alt="Projeto 1000"
      width={onDark ? 760 : 1506}
      height={onDark ? 332 : 658}
      style={{ height, width: "auto" }}
      className={`w-auto ${className}`}
    />
  );
}
import Image from "next/image";
