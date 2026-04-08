import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Globe, ExternalLink, ChevronUp, ChevronDown, Zap, Copy, Check,  MessageCircle } from 'lucide-react';
import { lookupToken, getWallets, boostToken, formatPrice, formatVolume, formatMarketCap, chainLabel, chainClass } from '../utils/api';

const PctBox = ({ label, val }) => {
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

const StatRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
    <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#e0e0e0' }}>{value}</span>
  </div>
);

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className={`copy-btn ${copied ? 'copied' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

const CURRENCY_WALLETS = {
  BNB: { label: '0.05 BNB', wallet: null },
  ETH: { label: '0.02 ETH', wallet: null },
  SOL: { label: '0.2 SOL', wallet: null },
};

export default function TokenDetail() {
  const { address } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [boostCurrency, setBoostCurrency] = useState('SOL');
  const [boostSent, setBoostSent] = useState(false);

  const { data: token, isLoading, isError } = useQuery({
    queryKey: ['token', address],
    queryFn: () => lookupToken(address),
    staleTime: 30000,
    retry: 1,
  });

  const { data: wallets } = useQuery({ queryKey: ['wallets'], queryFn: getWallets, staleTime: Infinity });

  const walletAddr = wallets ? { BNB: wallets.BNB, ETH: wallets.ETH, SOL: wallets.SOL } : CURRENCY_WALLETS;

  const handleBoost = () => {
    if (wallets) setBoostSent(true);
  };

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, margin: '0 auto' }}>
      <div className="shimmer" style={{ width: 120, height: 36, borderRadius: 8 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 12 }} />
      <div className="shimmer" style={{ height: 300, borderRadius: 12 }} />
    </div>
  );

  if (isError || !token?.found) return (
    <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Token Not Found</h2>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
        This contract address was not found on any supported DEX.
        Try searching on DexScreener or paste a different address.
      </p>
      <p style={{ color: '#555', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all', marginBottom: 24 }}>{address}</p>
      <button className="btn btn-ghost btn-md" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Go Back
      </button>
    </div>
  );

  const pc = token.price_change || {};
  const txns = token.txns_24h || {};
  const socials = token.socials || [];
  const twitter = socials.find(s => s.type === 'twitter')?.url;
  const telegram = socials.find(s => s.type === 'telegram')?.url;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      {/* Token Header */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {token.image_url ? (
              <img src={token.image_url} alt={token.symbol} style={{ width: 52, height: 52, borderRadius: '50%', background: '#1a1a1a' }} onError={e => e.target.style.display = 'none'} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#f97316' }}>
                {(token.symbol || '?').charAt(0)}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22, fontWeight: 900 }}>{token.name}</span>
                <span className={`chain-pill ${chainClass(token.chain)}`}>{chainLabel(token.chain)}</span>
                {token.pair_url && (
                  <a href={token.pair_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} style={{ color: '#555' }} />
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 12, color: '#555', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>
                  {address.length > 20 ? `${address.slice(0, 8)}...${address.slice(-6)}` : address}
                </span>
                <CopyButton text={address} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                {token.websites?.[0] && <a href={token.websites[0]} target="_blank" rel="noopener noreferrer"><Globe size={14} style={{ color: '#555' }} /></a>}
                {twitter && <a href={twitter} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} style={{ color: "#555" }} /></a>}
                {telegram && <a href={telegram} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} style={{ color: '#555' }} /></a>}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace' }}>
              {formatPrice(token.price_usd)}
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {parseFloat(token.price_native || 0).toFixed(6)} {token.quote_token}
            </div>
          </div>
        </div>

        {/* Price changes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 20 }}>
          <PctBox label="5M" val={parseFloat(pc.m5 || 0)} />
          <PctBox label="1H" val={parseFloat(pc.h1 || 0)} />
          <PctBox label="6H" val={parseFloat(pc.h6 || 0)} />
          <PctBox label="24H" val={parseFloat(pc.h24 || 0)} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
          {[
            { label: 'TXN', value: (txns.buys || 0) + (txns.sells || 0) || '—' },
            { label: 'Buy', value: txns.buys || '—' },
            { label: 'Sell', value: txns.sells || '—' },
            { label: 'Volume', value: formatVolume(token.volume_24h) },
          ].map(s => (
            <div key={s.label} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#e0e0e0', fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 4 }}>LIQUIDITY</div>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{formatVolume(token.liquidity_usd)}</div>
          </div>
          <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 4 }}>MARKET CAP</div>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{formatMarketCap(token.market_cap || token.fdv)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-outline-orange btn-md" style={{ flex: 1 }} onClick={() => navigate('/submit')}>
          <Zap size={14} /> Boost Token
        </button>
        <button className="btn btn-ghost btn-md" style={{ flex: 1 }} onClick={() => navigate('/submit')}>
          🔥 Promote
        </button>
      </div>

      {/* Info tabs */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="tabs" style={{ padding: '0 8px' }}>
          {['info', 'boost'].map(t => (
            <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'info' ? '📊 Info' : '⚡ Boost'}
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {activeTab === 'info' && (
            <div>
              <StatRow label="Contract Address" value={`${address.slice(0, 12)}...${address.slice(-8)}`} />
              <StatRow label="DEX" value={token.dex?.toUpperCase() || '—'} />
              <StatRow label="Chain" value={chainLabel(token.chain)} />
              {token.pair_address && <StatRow label="Pair Address" value={`${token.pair_address.slice(0, 12)}...`} />}
              <StatRow label="24H Volume" value={formatVolume(token.volume_24h)} />
              <StatRow label="Liquidity" value={formatVolume(token.liquidity_usd)} />
              <StatRow label="Market Cap" value={formatMarketCap(token.market_cap)} />
              <StatRow label="FDV" value={formatMarketCap(token.fdv)} />
              {token.pair_url && (
                <div style={{ marginTop: 16 }}>
                  <a href={token.pair_url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm" style={{ display: 'inline-flex' }}>
                    View on DexScreener <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === 'boost' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Boost This Token ⚡</h3>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
                Boost your token to rank higher in the listings. Each boost adds 150 points to your rank score.
              </p>

              {!boostSent ? (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <label>Select Payment Currency</label>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      {['BNB', 'ETH', 'SOL'].map(c => (
                        <button key={c} onClick={() => setBoostCurrency(c)}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${boostCurrency === c ? '#f97316' : '#272727'}`,
                            background: boostCurrency === c ? 'rgba(249,115,22,.1)' : '#141414',
                            color: boostCurrency === c ? '#f97316' : '#888', fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'all .15s'
                          }}>
                          {c === 'BNB' ? '🟡' : c === 'ETH' ? '🔵' : '🟣'} {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#141414', border: '1px solid #272727', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Boost Price (150 points)</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f97316', marginBottom: 12 }}>
                      {boostCurrency === 'BNB' ? '0.01 BNB' : boostCurrency === 'ETH' ? '0.005 ETH' : '0.05 SOL'}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Send to:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8, padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#aaa', flex: 1, wordBreak: 'break-all' }}>
                        {wallets?.[boostCurrency] || '—'}
                      </span>
                      {wallets && <CopyButton text={wallets[boostCurrency]} />}
                    </div>
                  </div>

                  <button className="btn btn-orange btn-lg" style={{ width: '100%' }} onClick={handleBoost}>
                    <Zap size={16} /> I Sent Payment
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 30 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Payment Confirmed!</div>
                  <p style={{ color: '#666', fontSize: 14 }}>Our team will verify and apply your boost within 1 hour. Thank you!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
