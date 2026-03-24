import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

export function Avatar({ src, name, className = "size-11" }: AvatarProps) {

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={`relative overflow-hidden rounded-full shrink-0 flex items-center justify-center font-bold text-sm bg-slate-100 text-[#1E3A8A] border border-slate-200 ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 44px"
          className="object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}