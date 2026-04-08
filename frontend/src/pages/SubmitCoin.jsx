import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, Zap, ChevronRight, Copy, Check, ArrowLeft, Globe,  MessageCircle, AlertCircle, Loader } from 'lucide-react';
import { lookupToken, getWallets, submitListing, formatPrice, formatVolume, formatMarketCap, chainLabel, chainClass } from '../utils/api';
import { useQuery } from '@tanstack/react-query';

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className={`copy-btn ${copied ? 'copied' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

const STEPS = ['Contract', 'Project Info', 'Listing'];

export default function SubmitCoin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [tokenData, setTokenData] = useState(null);
  const [listingType, setListingType] = useState('premium');
  const [currency, setCurrency] = useState('SOL');
  const [telegram, setTelegram] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [twitterLink, setTwitterLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const { data: wallets } = useQuery({ queryKey: ['wallets'], queryFn: getWallets, staleTime: Infinity });

  const handleLookup = async () => {
    if (!address.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    try {
      const data = await lookupToken(address.trim());
      if (data.found) {
        setTokenData(data);
        setStep(1);
      } else {
        setLookupError(data.error || 'Token not found on any supported DEX. Please verify the contract address.');
      }
    } catch (e) {
      setLookupError('Network error. Please try again.');
    }
    setLookupLoading(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await submitListing({
        listing_type: listingType,
        currency,
        token: {
          ...tokenData,
          description,
          websites: website ? [website] : tokenData?.websites || [],
        },
        contact: { telegram, twitter: twitterLink }
      });
      setSubmitted(result);
      setStep(3);
    } catch (e) {
      setLookupError('Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  const premiumPrices = { BNB: '0.05 BNB', ETH: '0.02 ETH', SOL: '0.2 SOL' };
  const walletAddr = wallets?.[currency] || '—';

  if (step === 3 && submitted) {
    return (
      <div style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>{submitted.listing_type === 'premium' ? '🚀' : '⏳'}</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>
          {submitted.listing_type === 'premium' ? 'Token Listed!' : 'Submitted for Review'}
        </h2>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>{submitted.message}</p>

        {submitted.payment && (
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Complete payment to activate listing:</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#f97316', marginBottom: 12 }}>{submitted.payment.amount} {submitted.payment.currency}</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Send to:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d0d', borderRadius: 8, padding: '10px 14px', border: '1px solid #1e1e1e' }}>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', flex: 1, wordBreak: 'break-all', color: '#ccc' }}>{submitted.payment.address}</span>
              <CopyBtn text={submitted.payment.address} />
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 10 }}>
              ⚠️ Your listing is live but will be featured once payment is confirmed (usually within 1 hour).
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-ghost btn-md" onClick={() => navigate('/listed')}>View Listed Tokens</button>
          <button className="btn btn-orange btn-md" onClick={() => { setStep(0); setTokenData(null); setAddress(''); setSubmitted(null); }}>List Another Token</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Zap size={20} style={{ color: '#f97316' }} />
          <h1 style={{ fontSize: 24, fontWeight: 900 }}>List Your Token</h1>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>Get your token in front of thousands of traders on Nomics.</p>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div className={`step-circle ${i < step ? 'step-done' : i === step ? 'step-active' : 'step-idle'}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: i <= step ? '#f0f0f0' : '#555', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < step ? '#f97316' : '#1e1e1e', transition: 'background .3s' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Contract Address */}
      {step === 0 && (
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Enter Contract Address</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
            We'll automatically fetch your token's information from DexScreener, Birdeye, and other data sources.
          </p>

          <label>Contract Address</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <input
              value={address}
              onChange={e => { setAddress(e.target.value); setLookupError(''); }}
              placeholder="0x... or Sol address"
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-orange btn-md" onClick={handleLookup} disabled={lookupLoading || !address.trim()} style={{ flexShrink: 0, opacity: (!address.trim() || lookupLoading) ? 0.6 : 1 }}>
              {lookupLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
              {lookupLoading ? 'Fetching…' : 'Fetch Info'}
            </button>
          </div>

          {lookupError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8 }}>
              <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#ef4444' }}>{lookupError}</span>
            </div>
          )}

          <div style={{ marginTop: 20, padding: '14px 16px', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: '#555', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>Supported Networks</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['ETH', 'BSC', 'SOL', 'BASE', 'ARB', 'AVAX', 'POLYGON', 'FTM'].map(c => (
                <span key={c} className={`chain-pill chain-${c === 'BSC' ? 'bsc' : c === 'ETH' ? 'eth' : c === 'SOL' ? 'sol' : c === 'BASE' ? 'base' : c === 'ARB' ? 'arb' : c === 'AVAX' ? 'avax' : c === 'POLYGON' ? 'polygon' : 'default'}`}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Project Info */}
      {step === 1 && tokenData && (
        <div>
          {/* Token preview */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {tokenData.image_url ? (
                <img src={tokenData.image_url} alt={tokenData.symbol} style={{ width: 48, height: 48, borderRadius: '50%', background: '#1a1a1a' }} onError={e => e.target.style.display = 'none'} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#f97316' }}>
                  {(tokenData.symbol || '?').charAt(0)}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 17, fontWeight: 800 }}>{tokenData.name}</span>
                  <span className={`chain-pill ${chainClass(tokenData.chain)}`}>{chainLabel(tokenData.chain)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#f0f0f0' }}>{formatPrice(tokenData.price_usd)}</span>
                  <span style={{ fontSize: 12, color: '#666' }}>Liq: {formatVolume(tokenData.liquidity_usd)}</span>
                  <span style={{ fontSize: 12, color: '#666' }}>MCap: {formatMarketCap(tokenData.market_cap)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: 12 }}>
                <CheckCircle size={14} />
                <span style={{ fontWeight: 700 }}>Verified</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Project Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Briefly describe your token and project…" rows={3} />
              </div>
              <div>
                <label>Website URL</label>
                <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourtoken.com" />
              </div>
              <div>
                <label>Telegram Contact</label>
                <input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@yourtelegram or https://t.me/group" />
              </div>
              <div>
                <label>Twitter / X (optional)</label>
                <input value={twitterLink} onChange={e => setTwitterLink(e.target.value)} placeholder="https://twitter.com/yourtoken" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn btn-ghost btn-md" onClick={() => setStep(0)}><ArrowLeft size={14} /> Back</button>
              <button className="btn btn-orange btn-md" style={{ flex: 1 }} onClick={() => setStep(2)}>
                Next: Choose Listing <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Listing Type */}
      {step === 2 && (
        <div>
          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Choose Listing Type</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Select how you want your token listed on Nomics.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {/* Free - disabled */}
              <div className="list-type-card disabled" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Normal Listing</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#888' }}>Free</div>
                  </div>
                  <span className="badge badge-free">REVIEW</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { ok: true, text: 'Token listed after review (7-14 days)' },
                    { ok: false, text: 'Signal on Nomics channel' },
                    { ok: false, text: '24h Promoted Highlight' },
                    { ok: false, text: '⚡ 150 Boost' },
                  ].map(item => (
                    <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: item.ok ? '#aaa' : '#444' }}>
                      <span style={{ fontSize: 14 }}>{item.ok ? '✅' : '❌'}</span>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium */}
              <div className={`list-type-card ${listingType === 'premium' ? 'selected' : ''}`} onClick={() => setListingType('premium')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Premium Listing</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#f97316' }}>{premiumPrices[currency]}</div>
                  </div>
                  <span className="badge badge-premium">INSTANT</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'Token listed instantly!',
                    'Signal on Nomics Telegram channel',
                    '24h Promoted Highlight',
                    '⚡ 150 Boost to trending score',
                    'Eligible for "Token of The Day"',
                  ].map(text => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#bbb' }}>
                      <span>✅</span>{text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Currency select */}
            <div style={{ marginBottom: 24 }}>
              <label>Choose Payment Currency</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {['BNB', 'ETH', 'SOL'].map(c => (
                  <button key={c} onClick={() => setCurrency(c)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 10, border: `2px solid ${currency === c ? '#f97316' : '#272727'}`,
                      background: currency === c ? 'rgba(249,115,22,.1)' : '#141414',
                      color: currency === c ? '#f97316' : '#888', fontWeight: 800, cursor: 'pointer', fontSize: 15, transition: 'all .15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                    }}>
                    <span>{c === 'BNB' ? '🟡' : c === 'ETH' ? '🔵' : '🟣'}</span>
                    <span>{c}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>{premiumPrices[c]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment address preview */}
            {listingType === 'premium' && wallets && (
              <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Payment will be sent to:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#aaa', flex: 1, wordBreak: 'break-all' }}>
                    {wallets[currency]}
                  </span>
                  <CopyBtn text={wallets[currency]} />
                </div>
              </div>
            )}

            {/* Summary */}
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Summary</div>
              {[
                ['Token', `${tokenData?.name} ($${tokenData?.symbol})`],
                ['Service', listingType === 'premium' ? 'Premium Listing' : 'Normal Listing'],
                ['Price', listingType === 'premium' ? premiumPrices[currency] : 'Free'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <span style={{ fontSize: 13, color: '#666' }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-md" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button>
              <button className="btn btn-orange btn-lg" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting} style={{ flex: 1, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <><Zap size={14} /> {listingType === 'premium' ? 'Submit & Pay' : 'Submit for Review'}</>}
              </button>
            </div>

            {lookupError && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, fontSize: 13, color: '#ef4444' }}>
                {lookupError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
