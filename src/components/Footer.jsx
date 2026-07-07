import { navLinks } from '../data/mockData'
import logo from '../assets/darklogo.png'

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-black">
      {/* accent bar — green → coral */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-claude-500 to-claude-400" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <a href="#home" className="flex items-center">
            <img src={logo} alt="Technical Hub" className="h-9 w-auto" />
          </a>

          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-sm font-medium text-white/50 transition-colors hover:text-claude-400"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Technical Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
