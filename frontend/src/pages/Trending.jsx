import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Flame, TrendingUp, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { getTrending, getGainers, formatPrice, formatMarketCap, formatVolume, formatPercent } from '../utils/api';

const PctCell = ({ val }) => {
  if (val == null) return <span style={{ color: '#555' }}>—</span>;
  const pos = parseFloat(val) >= 0;
  return (
    <span style={{ color: pos ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
      {pos ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      {Math.abs(parseFloat(val)).toFixed(2)}%
    </span>
  );
};

function CoinGrid({ coins, label, icon, navigate }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {icon}
        <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {coins.slice(0, 10).map((coin, i) => {
          const price = coin.current_price || parseFloat(coin.data?.price || 0);
          const chg24h = coin.price_change_percentage_24h ?? parseFloat(coin.data?.price_change_percentage_24h?.usd ?? 0);
          const cap = coin.market_cap || 0;
          return (
            <div key={coin.id || coin.name} className="token-row"
              style={{ gridTemplateColumns: '32px 2fr 1fr 1fr 1fr', gap: 8, cursor: 'pointer' }}
              onClick={() => navigate(`/coin/${coin.id}`)}>
              <div style={{ fontSize: 12, color: '#555', fontWeight: 700 }}>{i + 1}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={coin.image || coin.thumb || coin.large} alt={coin.name}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0 }}
                  onError={e => e.target.style.display = 'none'} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{coin.name}</div>
                  <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase' }}>{coin.symbol}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{formatPrice(price)}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><PctCell val={chg24h} /></div>
              <div style={{ textAlign: 'right', fontSize: 11, color: '#666', fontFamily: 'JetBrains Mono, monospace' }}>{formatMarketCap(cap)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Trending() {
  const navigate = useNavigate();

  const { data: trendingData, isLoading: tLoading } = useQuery({ queryKey: ['trending'], queryFn: getTrending, staleTime: 120000 });
  const { data: gainersData, isLoading: gLoading } = useQuery({ queryKey: ['gainers'], queryFn: getGainers, staleTime: 60000 });

  const trending = trendingData?.coins || [];
  const gainers = gainersData?.gainers || [];
  const losers = gainersData?.losers || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Flame size={22} style={{ color: '#f97316' }} />
          <h1 style={{ fontSize: 26, fontWeight: 900 }}>Market Movers</h1>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>Live trending coins, top gainers and losers from across the market.</p>
      </div>

      {/* Trending */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Flame size={16} style={{ color: '#f97316' }} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>🔥 Trending on CoinGecko</span>
        </div>
        {tLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {Array(7).fill(0).map((_, i) => <div key={i} className="shimmer" style={{ height: 100, borderRadius: 10 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {trending.map((coin, i) => {
              const pct = parseFloat(coin.data?.price_change_percentage_24h?.usd ?? 0);
              const pos = pct >= 0;
              return (
                <div key={coin.id}
                  style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s', position: 'relative' }}
                  onClick={() => navigate(`/coin/${coin.id}`)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}>
                  <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, color: '#555' }}>#{i + 1}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <img src={coin.thumb || coin.large} alt={coin.name}
                      style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a1a1a' }}
                      onError={e => e.target.style.display = 'none'} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{coin.symbol?.toUpperCase()}</div>
                      <div style={{ fontSize: 10, color: '#555' }}>#{coin.market_cap_rank || '—'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
                    {coin.data?.price ? formatPrice(parseFloat(coin.data.price)) : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: pos ? '#22c55e' : '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {pos ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    {Math.abs(pct).toFixed(2)}%
                  </div>
                  {coin.data?.market_cap && (
                    <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>{coin.data.market_cap}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Gainers & Losers side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {gLoading ? (
          <>
            <div className="shimmer" style={{ height: 400, borderRadius: 12 }} />
            <div className="shimmer" style={{ height: 400, borderRadius: 12 }} />
          </>
        ) : (
          <>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <TrendingUp size={16} style={{ color: '#22c55e' }} />
                <span style={{ fontSize: 15, fontWeight: 700 }}>Top Gainers (24H)</span>
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {gainers.slice(0, 10).map((coin, i) => (
                  <div key={coin.id} className="token-row"
                    style={{ gridTemplateColumns: '28px 2fr 1fr 1fr', gap: 8 }}
                    onClick={() => navigate(`/coin/${coin.id}`)}>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>{i + 1}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={coin.image} alt={coin.name} style={{ width: 26, height: 26, borderRadius: '50%' }} onError={e => e.target.style.display = 'none'} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{coin.symbol?.toUpperCase()}</div>
                        <div style={{ fontSize: 10, color: '#555' }}>{coin.name}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{formatPrice(coin.current_price)}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ChevronUp size={10} />+{(coin.price_change_percentage_24h || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <ChevronDown size={16} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: 15, fontWeight: 700 }}>Top Losers (24H)</span>
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {losers.slice(0, 10).map((coin, i) => (
                  <div key={coin.id} className="token-row"
                    style={{ gridTemplateColumns: '28px 2fr 1fr 1fr', gap: 8 }}
                    onClick={() => navigate(`/coin/${coin.id}`)}>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>{i + 1}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={coin.image} alt={coin.name} style={{ width: 26, height: 26, borderRadius: '50%' }} onError={e => e.target.style.display = 'none'} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{coin.symbol?.toUpperCase()}</div>
                        <div style={{ fontSize: 10, color: '#555' }}>{coin.name}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{formatPrice(coin.current_price)}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ChevronDown size={10} />{(coin.price_change_percentage_24h || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
