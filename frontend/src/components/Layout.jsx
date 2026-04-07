import { Outlet, NavLink, Link } from 'react-router-dom';
import { Rocket, MessageSquare, Briefcase, Activity } from 'lucide-react';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="sticky top-0 z-50 bg-[#1a1d2e] border-b border-[#2d3748] px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold text-[#7c3aed] tracking-tight hover:text-[#8b5cf6] transition-colors">
            NOMICS
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              <div className="flex items-center gap-2"><Activity size={16} /> Markets</div>
            </NavLink>
            <NavLink to="/services" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              <div className="flex items-center gap-2"><Briefcase size={16} /> Services</div>
            </NavLink>
            <NavLink to="/promote" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              <div className="flex items-center gap-2"><Rocket size={16} /> Promote</div>
            </NavLink>
            <NavLink to="/support" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              <div className="flex items-center gap-2"><MessageSquare size={16} /> Support</div>
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://t.me/Cariz_bot" target="_blank" rel="noopener noreferrer" className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2">
            <Rocket size={16} />
            Launch on Telegram
          </a>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <Outlet />
      </main>

      <footer className="bg-[#0d0e14] border-t border-[#2d3748] py-8 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between text-gray-500 text-sm">
          <div>&copy; {new Date().getFullYear()} Nomics. All rights reserved.</div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/services" className="hover:text-white transition-colors">Services</Link>
            <Link to="/promote" className="hover:text-white transition-colors">Promote</Link>
            <Link to="/support" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
