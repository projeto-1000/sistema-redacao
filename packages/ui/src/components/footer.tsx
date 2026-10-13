export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-b border-solid border-slate-200 bg-white/80 py-6 shadow-sm backdrop-blur-md">
      <div className="container mx-auto px-6 text-center text-sm text-gray-400">
        <p>© {currentYear} Projeto 1000. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
