import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Rocket, MessageSquare, Briefcase, Activity, Flame, TrendingUp, Menu, X, ChevronUp, ChevronDown } from 'lucide-react';
import { getTrending, getCoins, formatPrice, formatPercent } from '../utils/api';

function TickerBar() {
  const { data: coins = [] } = useQuery({
    queryKey: ['tickerCoins'],
    queryFn: () => getCoins({ per_page: 20 }),
    staleTime: 60000,
  });

  if (!coins.length) return null;

  const items = [...coins, ...coins];

  return (
    <div className="bg-[#0d0e14] border-b border-[#1a1d2e] overflow-hidden py-1.5">
      <div className="ticker-track flex gap-8 w-max animate-ticker">
        {items.map((coin, i) => {
          const chg = coin.price_change_percentage_24h;
          const isPos = chg >= 0;
          return (
            <Link key={`${coin.id}-${i}`} to={`/coin/${coin.id}`}
              className="flex items-center gap-1.5 text-[11px] whitespace-nowrap hover:opacity-80 transition-opacity flex-shrink-0">
              <img src={coin.image} alt={coin.name} className="w-4 h-4 rounded-full" />
              <span className="text-gray-300 font-medium">{coin.symbol?.toUpperCase()}</span>
              <span className="font-mono text-gray-200">{formatPrice(coin.current_price)}</span>
              <span className={`font-mono flex items-center gap-0.5 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPos ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                {Math.abs(chg ?? 0).toFixed(2)}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Markets', icon: <Activity size={15} />, end: true },
    { to: '/trending', label: 'Trending', icon: <Flame size={15} /> },
    { to: '/services', label: 'Services', icon: <Briefcase size={15} /> },
    { to: '/promote', label: 'Boost / List', icon: <TrendingUp size={15} /> },
    { to: '/support', label: 'Support', icon: <MessageSquare size={15} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0b10]">
      {/* Live Ticker */}
      <TickerBar />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0d0e14]/95 backdrop-blur border-b border-[#1e2130] px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-extrabold tracking-tight hover:opacity-90 transition-opacity">
            <span className="text-[#7c3aed]">NOM</span><span className="text-white">ICS</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                    isActive ? 'text-white bg-[#7c3aed]/15 text-[#a78bfa]' : 'text-gray-400 hover:text-white hover:bg-[#1a1d2e]'
                  }`
                }>
                {item.icon}{item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/promote"
            className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-lg shadow-[#7c3aed]/20">
            <Rocket size={14} />
            Get Listed
          </Link>
          <a href="https://t.me/Cariz_bot" target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 bg-[#1a1d2e] hover:bg-[#2d3748] border border-[#2d3748] text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#7c3aed]">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.376l-2.967-.924c-.645-.203-.657-.645.136-.953l11.57-4.461c.537-.194 1.006.131.833.938l-.524.245z"/>
            </svg>
            @Cariz_bot
          </a>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-gray-400 hover:text-white p-1">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0d0e14] border-b border-[#1e2130] px-4 py-3 flex flex-col gap-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-md transition-colors ${
                  isActive ? 'text-white bg-[#7c3aed]/15' : 'text-gray-400 hover:text-white hover:bg-[#1a1d2e]'
                }`
              }>
              {item.icon}{item.label}
            </NavLink>
          ))}
          <a href="https://t.me/Cariz_bot" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-md text-[#7c3aed] hover:bg-[#1a1d2e] transition-colors">
            @Cariz_bot
          </a>
        </div>
      )}

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-6 py-6">
        <Outlet />
      </main>

      <footer className="bg-[#0d0e14] border-t border-[#1e2130] py-8 mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xl font-extrabold tracking-tight mb-1">
              <span className="text-[#7c3aed]">NOM</span><span className="text-white">ICS</span>
            </div>
            <div className="text-gray-500 text-xs">Web3 Marketing & Crypto Market Data</div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-white transition-colors">Markets</Link>
            <Link to="/services" className="hover:text-white transition-colors">Services</Link>
            <Link to="/promote" className="hover:text-white transition-colors">List Token</Link>
            <Link to="/support" className="hover:text-white transition-colors">Support</Link>
            <a href="https://t.me/Cariz_bot" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Telegram</a>
          </div>
          <div className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} Nomics. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
