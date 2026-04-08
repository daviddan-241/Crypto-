import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronUp, ChevronDown, Globe, ArrowRight } from 'lucide-react';
import { getListed, formatPrice, formatVolume, formatMarketCap, chainLabel, chainClass } from '../utils/api';

const PctBadge = ({ val }) => {
  if (val == null) return <span style={{ color: '#555', fontSize: 12 }}>—</span>;
  const pos = val >= 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: pos ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
      {pos ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      {Math.abs(parseFloat(val)).toFixed(2)}%
    </span>
  );
};

export default function Listed() {
  const navigate = useNavigate();
  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['listed'], queryFn: getListed, staleTime: 30000, refetchInterval: 60000
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Zap size={20} style={{ color: '#f97316' }} />
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f0f0f0' }}>Listed Tokens</h1>
          </div>
          <p style={{ fontSize: 13, color: '#666', maxWidth: 480 }}>
            Premium-listed tokens on Nomics. Get your token seen by thousands of traders every day.
          </p>
        </div>
        <button className="btn btn-orange btn-md" onClick={() => navigate('/submit')}>
          <Zap size={14} /> Get Listed
        </button>
      </div>

      {isLoading ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #1e1e1e' }}>
              <div className="shimmer" style={{ width: 44, height: 44, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="shimmer" style={{ width: 120, height: 13, marginBottom: 6 }} />
                <div className="shimmer" style={{ width: 80, height: 11 }} />
              </div>
            </div>
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <Zap size={40} style={{ color: '#f97316', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No tokens listed yet</div>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Be the first to list your token on Nomics!</p>
          <button className="btn btn-orange btn-md" onClick={() => navigate('/submit')}>Get Listed Now</button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 100px 80px 80px 80px 110px 110px 100px', padding: '10px 20px', borderBottom: '1px solid #1e1e1e', gap: 8 }}>
            {['TOKEN', 'PRICE', '5M', '1H', '24H', 'VOLUME', 'MKT CAP', 'BOOST'].map((h, i) => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: i === 0 ? 'left' : 'right' }}>{h}</div>
            ))}
          </div>

          {tokens.map(token => (
            <div key={token.id} className="token-row"
              style={{ gridTemplateColumns: '2.5fr 100px 80px 80px 80px 110px 110px 100px', gap: 8 }}
              onClick={() => navigate(`/token/${token.address}`)}>
              {/* Token info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {token.image ? (
                  <img src={token.image} alt={token.symbol}
                    style={{ width: 40, height: 40, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0 }}
                    onError={e => e.target.style.display = 'none'} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#f97316', flexShrink: 0 }}>
                    {(token.symbol || '?').charAt(0)}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', whiteSpace: 'nowrap' }}>{token.name || token.symbol}</span>
                    <span className="badge badge-premium">PREMIUM</span>
                    {token.boost > 0 && (
                      <span className="badge badge-boost"><Zap size={8} />{token.boost}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', fontWeight: 600 }}>{token.symbol}</span>
                    <span className={`chain-pill ${chainClass(token.chain)}`}>{chainLabel(token.chain)}</span>
                    {token.websites?.[0] && (
                      <a href={token.websites[0]} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                        <Globe size={11} style={{ color: '#444' }} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{formatPrice(token.price_usd)}</div>
              <div style={{ textAlign: 'right' }}><PctBadge val={token.price_change?.m5} /></div>
              <div style={{ textAlign: 'right' }}><PctBadge val={token.price_change?.h1} /></div>
              <div style={{ textAlign: 'right' }}><PctBadge val={token.price_change?.h24} /></div>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#aaa', fontFamily: 'JetBrains Mono, monospace' }}>{formatVolume(token.volume_24h)}</div>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#aaa', fontFamily: 'JetBrains Mono, monospace' }}>{formatMarketCap(token.market_cap)}</div>
              <div style={{ textAlign: 'right' }}>
                <button className="btn btn-sm btn-outline-orange" onClick={e => { e.stopPropagation(); navigate('/submit') }}>
                  <Zap size={11} /> Boost
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,.08), rgba(249,115,22,.03))', border: '1px solid rgba(249,115,22,.2)', borderRadius: 16, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Ready to list your token?</div>
          <p style={{ color: '#888', fontSize: 14 }}>Premium listing includes instant visibility, 150 boost points, and 24h promoted highlight.</p>
        </div>
        <button className="btn btn-orange btn-lg" onClick={() => navigate('/submit')}>
          Get Listed Now <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
