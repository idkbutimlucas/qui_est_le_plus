export default function Footer() {
  return (
    <footer className="fixed bottom-2 left-2 z-10 pointer-events-none">
      <div className="flex items-start gap-1.5">
        {/* Made by */}
        <div className="neo-card px-1.5 py-0.5 pointer-events-auto opacity-50 hover:opacity-100 transition-opacity">
          <p className="text-[9px] font-semibold text-primary">
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
        <div className="pointer-events-auto opacity-50 hover:opacity-100 transition-opacity">
          <a
            href="https://www.buymeacoffee.com/idkbutimlucas"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=idkbutimlucas&button_colour=c08e6c&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00"
              alt="Buy Me A Coffee"
              style={{ height: '20px', width: 'auto' }}
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
