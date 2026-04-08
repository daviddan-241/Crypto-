import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, TrendingUp, BarChart2, Zap, MessageSquare, Menu, X, Search, ChevronUp, ChevronDown, Rocket, Wrench, Star } from 'lucide-react';
import { getTicker, formatPrice } from '../utils/api';

function TickerBar() {
  const { data: coins = [] } = useQuery({
    queryKey: ['ticker'],
    queryFn: getTicker,
    staleTime: 30000,
    refetchInterval: 30000,
  });
  if (!coins.length) return <div style={{ height: 32, background: '#060606', borderBottom: '1px solid #1a1a1a' }} />;
  const doubled = [...coins, ...coins];
  return (
    <div className="ticker-wrap" style={{ height: 32 }}>
      <div className="ticker-inner">
        {doubled.map((c, i) => {
          const chg = c.change_1h;
          const pos = chg >= 0;
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 24px', fontSize: 12, color: '#777' }}>
              <span style={{ fontWeight: 700, color: '#d0d0d0' }}>{c.symbol}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#aaa' }}>{formatPrice(c.price)}</span>
              <span style={{ color: pos ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 2, fontSize: 11 }}>
                {pos ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                {Math.abs(chg ?? 0).toFixed(2)}%
              </span>
              <span style={{ color: '#222', marginLeft: 4 }}>·</span>
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
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navItems = [
    { to: '/', label: 'Markets', icon: <BarChart2 size={14} />, end: true },
    { to: '/listed', label: 'Listed', icon: <Rocket size={14} /> },
    { to: '/trending', label: 'Trending', icon: <Flame size={14} /> },
    { to: '/hot', label: 'Hot', icon: <TrendingUp size={14} /> },
    { to: '/services', label: 'Services', icon: <Wrench size={14} />, highlight: true },
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#080808' }}>
      <TickerBar />

      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(8,8,8,0.98)' : 'rgba(8,8,8,0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? '#1e1e1e' : '#161616'}`,
        padding: '0 24px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        transition: 'border-color .2s'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} fill="#000" color="#000" />
            </div>
            <span style={{ fontSize: 21, fontWeight: 900, letterSpacing: -1 }}>
              <span style={{ color: '#f97316' }}>NOM</span>
              <span style={{ color: '#f0f0f0' }}>ICS</span>
            </span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, paddingLeft: 20 }} className="hide-mobile">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 13, fontWeight: 600, padding: '6px 13px', borderRadius: 8,
                color: isActive ? '#f0f0f0' : item.highlight ? '#f97316' : '#777',
                background: isActive ? '#181818' : 'transparent',
                border: item.highlight && !isActive ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent',
                transition: 'all .15s'
              })}>
              {item.icon}{item.label}
              {item.highlight && <span style={{ fontSize: 9, background: '#f97316', color: '#000', padding: '1px 5px', borderRadius: 8, fontWeight: 800 }}>NEW</span>}
            </NavLink>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <form onSubmit={handleSearch} className="hide-mobile" style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search or enter contract…"
              style={{
                width: 210, background: '#111', border: '1px solid #1e1e1e',
                borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 12,
                color: '#e0e0e0', outline: 'none'
              }}
            />
          </form>

          <Link to="/submit"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#000', fontWeight: 800,
              fontSize: 13, padding: '8px 18px', borderRadius: 8,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 12px rgba(249,115,22,0.25)'
            }}>
            <Zap size={13} fill="#000" />
            Get Listed
          </Link>

          <a href="https://t.me/Cariz_bot" target="_blank" rel="noopener noreferrer"
            className="hide-mobile"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#0088cc', border: 'none',
              color: '#fff', fontWeight: 700, fontSize: 12,
              padding: '8px 14px', borderRadius: 8, whiteSpace: 'nowrap'
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.501c-.147.65-.537.81-1.086.503l-3.01-2.214-1.452 1.396c-.16.16-.297.297-.608.297l.216-3.04 5.547-5.008c.24-.214-.055-.333-.374-.12L7.656 13.81 4.703 12.9c-.652-.203-.663-.648.137-.96l10.884-4.19c.543-.196 1.018.132.838.498z" />
            </svg>
            Bot
          </a>

          <button onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'transparent', border: 'none', color: '#777', cursor: 'pointer', padding: 6, display: 'none' }}
            className="show-mobile">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', padding: '8px 16px 16px' }}>
          <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: 10 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search or enter contract…"
              style={{ paddingLeft: 30, fontSize: 13 }} />
          </form>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                color: isActive ? '#f0f0f0' : item.highlight ? '#f97316' : '#777',
                background: isActive ? '#181818' : 'transparent',
                marginBottom: 2
              })}>
              {item.icon}{item.label}
              {item.highlight && <span style={{ fontSize: 9, background: '#f97316', color: '#000', padding: '1px 5px', borderRadius: 8, fontWeight: 800 }}>NEW</span>}
            </NavLink>
          ))}
          <a href="https://t.me/Cariz_bot" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#0088cc', marginTop: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#0088cc"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.501c-.147.65-.537.81-1.086.503l-3.01-2.214-1.452 1.396c-.16.16-.297.297-.608.297l.216-3.04 5.547-5.008c.24-.214-.055-.333-.374-.12L7.656 13.81 4.703 12.9c-.652-.203-.663-.648.137-.96l10.884-4.19c.543-.196 1.018.132.838.498z" /></svg>
            @Cariz_bot
          </a>
        </div>
      )}

      <main style={{ flex: 1, width: '100%', maxWidth: 1440, margin: '0 auto', padding: '28px 24px' }}>
        <Outlet />
      </main>

      <footer style={{ background: '#060606', borderTop: '1px solid #141414', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between', marginBottom: 32 }}>
            <div style={{ maxWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={14} fill="#000" color="#000" />
                </div>
                <span style={{ fontSize: 19, fontWeight: 900 }}>
                  <span style={{ color: '#f97316' }}>NOM</span><span>ICS</span>
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>
                The #1 Web3 token listing & marketing platform. Real data. Real results. Real growth.
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <a href="https://t.me/Cariz_bot" target="_blank" rel="noopener noreferrer"
                  style={{ background: '#0088cc', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.501c-.147.65-.537.81-1.086.503l-3.01-2.214-1.452 1.396c-.16.16-.297.297-.608.297l.216-3.04 5.547-5.008c.24-.214-.055-.333-.374-.12L7.656 13.81 4.703 12.9c-.652-.203-.663-.648.137-.96l10.884-4.19c.543-.196 1.018.132.838.498z" /></svg>
                  @Cariz_bot
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Platform</div>
                {[['/', 'Markets'], ['/listed', 'Listed Tokens'], ['/trending', 'Trending'], ['/hot', 'Hot & Gainers'], ['/services', 'Services']].map(([to, label]) => (
                  <Link key={to + label} to={to} style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 10, transition: 'color .15s' }}
                    onMouseEnter={e => e.target.style.color = '#aaa'} onMouseLeave={e => e.target.style.color = '#555'}>
                    {label}
                  </Link>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Services</div>
                {[
                  ['/submit', 'Premium Listing'],
                  ['/services', 'DEX Trending'],
                  ['/services', 'KOL / Calls'],
                  ['/services', 'Alpha Access'],
                  ['/services', 'Volume Bot'],
                  ['/support', 'Support'],
                ].map(([to, label]) => (
                  <Link key={label} to={to} style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 10, transition: 'color .15s' }}
                    onMouseEnter={e => e.target.style.color = '#aaa'} onMouseLeave={e => e.target.style.color = '#555'}>
                    {label}
                  </Link>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Connect</div>
                <a href="https://t.me/Cariz_bot" target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 10, transition: 'color .15s' }}
                  onMouseEnter={e => e.target.style.color = '#0088cc'} onMouseLeave={e => e.target.style.color = '#555'}>Telegram Bot</a>
                <a href="https://t.me/+QJVQUQIhP-82ZDk8" target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 10, transition: 'color .15s' }}
                  onMouseEnter={e => e.target.style.color = '#a855f7'} onMouseLeave={e => e.target.style.color = '#555'}>Alpha Group 🔑</a>
                <Link to="/support" style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 10 }}
                  onMouseEnter={e => e.target.style.color = '#aaa'} onMouseLeave={e => e.target.style.color = '#555'}>Contact Us</Link>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #141414', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#333' }}>
              © {new Date().getFullYear()} Nomics. All rights reserved.
            </div>
            <div style={{ fontSize: 11, color: '#2a2a2a' }}>
              Data: CoinGecko & DexScreener • For informational purposes only
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
