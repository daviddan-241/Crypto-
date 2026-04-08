import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Globe, ExternalLink,  MessageCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { getCoinDetail, formatPrice, formatMarketCap, formatVolume, formatPercent } from '../utils/api';

const StatRow = ({ label, value, valueClass }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
    <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: valueClass === 'green' ? '#22c55e' : valueClass === 'red' ? '#ef4444' : '#e0e0e0' }}>{value}</span>
  </div>
);

const PctBadge = ({ val, label }) => {
  if (val == null) return null;
  const pos = val >= 0;
  return (
    <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: pos ? '#22c55e' : '#ef4444', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {pos ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {Math.abs(val).toFixed(2)}%
      </div>
    </div>
  );
};

export default function CoinDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const { data: coin, isLoading, isError } = useQuery({
    queryKey: ['coin', id], queryFn: () => getCoinDetail(id), staleTime: 60000
  });

  if (isLoading) return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="shimmer" style={{ width: 100, height: 36, borderRadius: 8 }} />
      <div className="shimmer" style={{ height: 120, borderRadius: 12 }} />
      <div className="shimmer" style={{ height: 300, borderRadius: 12 }} />
    </div>
  );

  if (isError || !coin) return (
    <div style={{ textAlign: 'center', padding: 60, maxWidth: 500, margin: '0 auto' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Coin not found</div>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Unable to load data for "{id}"</p>
      <button className="btn btn-ghost btn-md" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Go Back</button>
    </div>
  );

  const md = coin.market_data || {};
  const links = coin.links || {};
  const chg24 = md.price_change_24h_pct;
  const chg1h = md.price_change_1h_pct;
  const chg7d = md.price_change_7d_pct;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {coin.image && <img src={coin.image} alt={coin.name} style={{ width: 56, height: 56, borderRadius: '50%' }} onError={e => e.target.style.display = 'none'} />}
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{coin.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>{coin.symbol}</span>
                {links.homepage && (
                  <a href={links.homepage} target="_blank" rel="noopener noreferrer">
                    <Globe size={13} style={{ color: '#555' }} />
                  </a>
                )}
                {links.twitter && (
                  <a href={`https://twitter.com/${links.twitter}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={13} style={{ color: "#555" }} />
                  </a>
                )}
                {links.telegram && (
                  <a href={`https://t.me/${links.telegram}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={13} style={{ color: '#555' }} />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 30, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace' }}>
              {formatPrice(md.current_price)}
            </div>
            <div style={{ color: chg24 >= 0 ? '#22c55e' : '#ef4444', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end', marginTop: 4 }}>
              {chg24 >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {Math.abs(chg24 || 0).toFixed(2)}% (24h)
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 20 }}>
          <PctBadge val={chg1h} label="1H" />
          <PctBadge val={chg24} label="24H" />
          <PctBadge val={chg7d} label="7D" />
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="tabs" style={{ padding: '0 8px' }}>
          {[['overview', '📊 Overview'], ['info', 'ℹ️ Info']].map(([t, l]) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {tab === 'overview' && (
            <div>
              <StatRow label="Market Cap" value={formatMarketCap(md.market_cap)} />
              <StatRow label="24H Volume" value={formatVolume(md.total_volume)} />
              <StatRow label="Circulating Supply" value={md.circulating_supply ? `${md.circulating_supply?.toLocaleString()} ${coin.symbol?.toUpperCase()}` : '—'} />
              <StatRow label="Total Supply" value={md.total_supply ? `${md.total_supply?.toLocaleString()} ${coin.symbol?.toUpperCase()}` : '—'} />
              <StatRow label="All Time High" value={formatPrice(md.ath)} />
              <StatRow label="Fully Diluted Val." value={formatMarketCap(md.fully_diluted_valuation)} />
            </div>
          )}

          {tab === 'info' && coin.description && (
            <div>
              <div style={{ fontSize: 14, color: '#999', lineHeight: 1.7, maxHeight: 300, overflow: 'auto' }}
                dangerouslySetInnerHTML={{ __html: coin.description.replace(/<a /g, '<a style="color:#f97316" ') }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
