import Image from "next/image";
import { cn } from "../lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  textClassName?: string;
}

export function Avatar({ src, name, className, textClassName }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 font-bold text-[#1E3A8A]",
        "size-11 text-sm md:size-12 md:text-base",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 100px"
          className="object-cover"
        />
      ) : (
        <span className={cn("text-sm leading-none font-bold md:text-base", textClassName)}>
          {initials}
        </span>
      )}
    </div>
  );
}
