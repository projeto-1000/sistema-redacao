interface ProfileHeaderProps {
  title: string;
  subtitle: string;
}

export function PageHeader({ title, subtitle }: ProfileHeaderProps) {

  return (
    <>
      <h2 className="text-3xl font-extrabold tracking-tight mb-2">
        {title}
      </h2>
      <p className="text-[#8B8265]">
        {subtitle}
      </p>
    </>
  )
}