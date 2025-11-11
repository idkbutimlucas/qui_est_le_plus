export default function Footer() {
  return (
    <footer className="fixed bottom-2 left-2 z-10 pointer-events-none">
      <div className="flex items-start gap-2">
        {/* Made by */}
        <div className="neo-card px-2 py-1 pointer-events-auto opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-semibold text-primary">
            by{' '}
            <a
              href="https://lucashochart.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-bold"
            >
              Lucas Hochart
            </a>
          </p>
        </div>

        {/* Buy Me a Coffee */}
        <a
          href="https://buymeacoffee.com/idkbutimlucas"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto"
        >
          <div className="neo-card px-2 py-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150 opacity-60 hover:opacity-100">
            <div className="flex items-center gap-1">
              <span className="text-sm">☕</span>
              <span className="text-[10px] font-bold text-primary">Coffee</span>
            </div>
          </div>
        </a>
      </div>
    </footer>
  );
}
