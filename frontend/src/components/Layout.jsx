import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, TrendingUp, BarChart2, Zap, MessageSquare, Menu, X, Search, ChevronUp, ChevronDown, Rocket } from 'lucide-react';
import { getTicker, formatPrice, formatPercent } from '../utils/api';

function TickerBar() {
  const { data: coins = [] } = useQuery({
    queryKey: ['ticker'],
    queryFn: getTicker,
    staleTime: 30000,
    refetchInterval: 30000,
  });
  if (!coins.length) return <div style={{ height: 32, background: '#080808', borderBottom: '1px solid #1e1e1e' }} />;
  const doubled = [...coins, ...coins];
  return (
    <div className="ticker-wrap" style={{ height: 32 }}>
      <div className="ticker-inner" style={{ gap: 0 }}>
        {doubled.map((c, i) => {
          const chg = c.change_1h;
          const pos = chg >= 0;
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 24px', fontSize: 12, color: '#aaa' }}>
              <span style={{ fontWeight: 700, color: '#e0e0e0' }}>{c.symbol}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatPrice(c.price)}</span>
              <span style={{ color: pos ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 2 }}>
                {pos ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {Math.abs(chg ?? 0).toFixed(2)}%
              </span>
              <span style={{ color: '#2a2a2a', marginLeft: 6 }}>•</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'Markets', icon: <BarChart2 size={14} />, end: true },
    { to: '/listed', label: 'Listed', icon: <Rocket size={14} /> },
    { to: '/trending', label: 'Trending', icon: <Flame size={14} /> },
    { to: '/hot', label: 'Hot', icon: <TrendingUp size={14} /> },
    { to: '/support', label: 'Support', icon: <MessageSquare size={14} /> },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim().length > 20) {
      navigate(`/token/${search.trim()}`);
      setSearch('');
    } else if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0a0a' }}>
      <TickerBar />

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,10,0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1e1e1e',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1 }}>
            <span style={{ color: '#f97316' }}>NOM</span>
            <span style={{ color: '#f0f0f0' }}>ICS</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, paddingLeft: 24 }} className="hide-mobile">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
                color: isActive ? '#f0f0f0' : '#888',
                background: isActive ? '#1a1a1a' : 'transparent',
                transition: 'all .15s'
              })}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Search */}
          <form onSubmit={handleSearch} className="hide-mobile" style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search or enter contract…"
              style={{
                width: 220, background: '#141414', border: '1px solid #222',
                borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 12,
                color: '#e0e0e0', outline: 'none'
              }}
            />
          </form>

          <Link to="/submit"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f97316', color: '#000', fontWeight: 700,
              fontSize: 13, padding: '8px 16px', borderRadius: 8,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
            <Zap size={13} />
            Get Listed
          </Link>

          <a href="https://t.me/nomicsbot" target="_blank" rel="noopener noreferrer"
            className="hide-mobile"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#141414', border: '1px solid #252525',
              color: '#aaa', fontWeight: 600, fontSize: 12,
              padding: '7px 12px', borderRadius: 8, whiteSpace: 'nowrap'
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#29b6f6">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.501c-.147.65-.537.81-1.086.503l-3.01-2.214-1.452 1.396c-.16.16-.297.297-.608.297l.216-3.04 5.547-5.008c.24-.214-.055-.333-.374-.12L7.656 13.81 4.703 12.9c-.652-.203-.663-.648.137-.96l10.884-4.19c.543-.196 1.018.132.838.498z" />
            </svg>
            Telegram Bot
          </a>

          <button onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}
            className="show-mobile">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e', padding: '8px 16px 12px' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                color: isActive ? '#f0f0f0' : '#888',
                background: isActive ? '#1a1a1a' : 'transparent',
                marginBottom: 2
              })}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </div>
      )}

      <main style={{ flex: 1, width: '100%', maxWidth: 1440, margin: '0 auto', padding: '24px 20px' }}>
        <Outlet />
      </main>

      <footer style={{ background: '#0d0d0d', borderTop: '1px solid #1e1e1e', padding: '32px 20px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
              <span style={{ color: '#f97316' }}>NOM</span><span>ICS</span>
            </div>
            <div style={{ fontSize: 12, color: '#555', maxWidth: 220 }}>
              The leading Web3 token listing &amp; marketing platform. Real data. Real results.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Platform</div>
              {[['/', 'Markets'], ['/listed', 'Listed'], ['/trending', 'Trending'], ['/hot', 'Hot & Gainers']].map(([to, label]) => (
                <Link key={to} to={to} style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8, transition: 'color .15s' }}
                  onMouseEnter={e => e.target.style.color = '#aaa'} onMouseLeave={e => e.target.style.color = '#666'}>
                  {label}
                </Link>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Services</div>
              {[['/submit', 'List Token'], ['/submit', 'Premium Listing'], ['/support', 'Support']].map(([to, label]) => (
                <Link key={label} to={to} style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8 }}
                  onMouseEnter={e => e.target.style.color = '#aaa'} onMouseLeave={e => e.target.style.color = '#666'}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#444', alignSelf: 'flex-end' }}>
            © {new Date().getFullYear()} Nomics. All rights reserved.<br />
            <span style={{ color: '#2a2a2a' }}>Data provided by CoinGecko &amp; DexScreener</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
