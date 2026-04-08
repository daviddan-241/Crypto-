import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Flame, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { getCoins, formatPrice, formatMarketCap, formatVolume } from '../utils/api';

export default function Hot() {
  const navigate = useNavigate();
  const { data: coins = [], isLoading } = useQuery({
    queryKey: ['coins'], queryFn: () => getCoins({ per_page: 250 }), staleTime: 60000
  });

  const byVolume = [...coins].sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0)).slice(0, 50);
  const byGain = [...coins]
    .filter(c => c.price_change_percentage_24h != null)
    .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
    .slice(0, 25);

  const PctCell = ({ val }) => {
    if (val == null) return <span style={{ color: '#555' }}>—</span>;
    const pos = val >= 0;
    return (
      <span style={{ color: pos ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 2 }}>
        {pos ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        {Math.abs(val).toFixed(2)}%
      </span>
    );
  };

  const Skeleton = () => Array(10).fill(0).map((_, i) => (
    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #1e1e1e' }}>
      <div className="shimmer" style={{ width: 28, height: 28, borderRadius: '50%' }} />
      <div style={{ flex: 1 }}>
        <div className="shimmer" style={{ width: 100, height: 12, marginBottom: 5 }} />
        <div className="shimmer" style={{ width: 60, height: 10 }} />
      </div>
    </div>
  ));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Flame size={22} style={{ color: '#ef4444' }} />
          <h1 style={{ fontSize: 26, fontWeight: 900 }}>Hot & New Pairs</h1>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>Top tokens by 24h trading volume and biggest gainers.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Hot by Volume */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Zap size={16} style={{ color: '#f97316' }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Hot by Volume</span>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '28px 2fr 1fr 1fr 1fr', gap: 8, padding: '8px 16px', borderBottom: '1px solid #1e1e1e' }}>
              {['#', 'TOKEN', 'PRICE', '24H', 'VOLUME'].map((h, i) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: i === 0 || i === 1 ? 'left' : 'right' }}>{h}</div>
              ))}
            </div>
            {isLoading ? <Skeleton /> : byVolume.slice(0, 25).map((coin, i) => (
              <div key={coin.id} className="token-row"
                style={{ gridTemplateColumns: '28px 2fr 1fr 1fr 1fr', gap: 8 }}
                onClick={() => navigate(`/coin/${coin.id}`)}>
                <div style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>{i + 1}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={coin.image} alt={coin.name} style={{ width: 26, height: 26, borderRadius: '50%' }} onError={e => e.target.style.display = 'none'} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{coin.symbol?.toUpperCase()}</div>
                    <div style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{coin.name}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{formatPrice(coin.current_price)}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}><PctCell val={coin.price_change_percentage_24h} /></div>
                <div style={{ textAlign: 'right', fontSize: 11, color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>{formatVolume(coin.total_volume)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Gainers */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={16} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Top Gainers Today</span>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '28px 2fr 1fr 1fr 1fr', gap: 8, padding: '8px 16px', borderBottom: '1px solid #1e1e1e' }}>
              {['#', 'TOKEN', 'PRICE', '24H', 'MKT CAP'].map((h, i) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: i === 0 || i === 1 ? 'left' : 'right' }}>{h}</div>
              ))}
            </div>
            {isLoading ? <Skeleton /> : byGain.map((coin, i) => (
              <div key={coin.id} className="token-row"
                style={{ gridTemplateColumns: '28px 2fr 1fr 1fr 1fr', gap: 8 }}
                onClick={() => navigate(`/coin/${coin.id}`)}>
                <div style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>{i + 1}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={coin.image} alt={coin.name} style={{ width: 26, height: 26, borderRadius: '50%' }} onError={e => e.target.style.display = 'none'} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{coin.symbol?.toUpperCase()}</div>
                    <div style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{coin.name}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{formatPrice(coin.current_price)}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ChevronUp size={10} />+{(coin.price_change_percentage_24h || 0).toFixed(2)}%
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>{formatMarketCap(coin.market_cap)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
