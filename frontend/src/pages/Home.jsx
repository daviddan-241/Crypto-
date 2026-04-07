import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Flame, TrendingUp, Zap, Star, ArrowUpRight, ChevronUp, ChevronDown, Rocket } from 'lucide-react';
import { getGlobalMarket, getTrending, getCoins, formatMarketCap, formatPrice, formatPercent } from '../utils/api';

const SvgSparkline = ({ prices, isPositive }) => {
  if (!prices || prices.length < 2) return <div style={{ width: 64, height: 24 }} />;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 64, H = 24;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * W;
    const y = H - ((p - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  });
  const color = isPositive ? '#10b981' : '#ef4444';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const TABS = [
  { id: 'trending', label: 'Trending', icon: <Flame size={14} /> },
  { id: 'hot', label: 'Hot', icon: <Zap size={14} /> },
  { id: 'gainers', label: 'Gainers', icon: <TrendingUp size={14} /> },
  { id: 'new', label: 'New Listings', icon: <Star size={14} /> },
  { id: 'all', label: 'All Coins', icon: null },
];

const CHAINS = ['All Chains', 'Solana', 'Ethereum', 'BNB Chain', 'Base', 'Arbitrum', 'Polygon'];

const CHAIN_MAP = {
  Solana: ['sol', 'jup', 'ray', 'bonk', 'wif', 'pyth', 'jto', 'wen', 'popcat'],
  Ethereum: ['eth', 'uni', 'link', 'aave', 'crv', 'mkr', 'snx', 'comp', 'ldo', 'steth'],
  'BNB Chain': ['bnb', 'cake', 'xvs', 'bake', 'alpaca'],
  Base: ['base', 'aerodrome-finance', 'brett'],
  Arbitrum: ['arb', 'gmx', 'gns', 'rdnt'],
  Polygon: ['matic', 'pol', 'quick', 'sand', 'mana'],
};

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const [activeChain, setActiveChain] = useState('All Chains');

  const { data: globalMarket, isLoading: gLoading } = useQuery({ queryKey: ['globalMarket'], queryFn: getGlobalMarket, staleTime: 60000 });
  const { data: trendingData } = useQuery({ queryKey: ['trending'], queryFn: getTrending, staleTime: 120000 });
  const { data: coins = [], isLoading: cLoading } = useQuery({ queryKey: ['coins'], queryFn: () => getCoins({ per_page: 250, sparkline: true }), staleTime: 60000 });

  const trendingCoins = trendingData?.coins || [];

  const filteredCoins = useMemo(() => {
    let list = [...coins];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    }

    if (activeChain !== 'All Chains') {
      const ids = CHAIN_MAP[activeChain] || [];
      if (ids.length > 0) {
        list = list.filter(c => ids.includes(c.id) || ids.includes(c.symbol?.toLowerCase()));
      }
    }

    switch (activeTab) {
      case 'trending': {
        const trendIds = trendingCoins.map(t => t.id || t.item?.id);
        const trendMap = Object.fromEntries(trendIds.map((id, i) => [id, i]));
        const inTrend = list.filter(c => trendMap[c.id] !== undefined);
        const notTrend = list.filter(c => trendMap[c.id] === undefined);
        inTrend.sort((a, b) => (trendMap[a.id] ?? 999) - (trendMap[b.id] ?? 999));
        list = [...inTrend, ...notTrend];
        break;
      }
      case 'hot':
        list.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
        break;
      case 'gainers':
        list = list.filter(c => c.price_change_percentage_24h > 0);
        list.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
        break;
      case 'new':
        list = list.filter(c => c.market_cap_rank > 200);
        list.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
        break;
      default:
        break;
    }

    return list;
  }, [coins, searchTerm, activeTab, activeChain, trendingCoins]);

  const pctColor = (v) => v == null ? 'text-gray-500' : v >= 0 ? 'text-emerald-400' : 'text-red-400';
  const pctIcon = (v) => v >= 0 ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />;
  const mcChange = globalMarket?.market_cap_change_percentage_24h;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Global Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[#2d3748] rounded-xl overflow-hidden border border-[#2d3748]">
        {[
          { label: 'Total Market Cap', value: gLoading ? '...' : formatMarketCap(globalMarket?.total_market_cap_usd), sub: gLoading ? null : `${mcChange >= 0 ? '+' : ''}${mcChange?.toFixed(2)}% today`, subColor: pctColor(mcChange) },
          { label: '24h Volume', value: gLoading ? '...' : formatMarketCap(globalMarket?.total_volume_usd) },
          { label: 'BTC Dominance', value: gLoading ? '...' : `${globalMarket?.btc_dominance?.toFixed(1)}%` },
          { label: 'ETH Dominance', value: gLoading ? '...' : `${globalMarket?.eth_dominance?.toFixed(1)}%` },
          { label: 'Active Coins', value: gLoading ? '...' : globalMarket?.active_cryptocurrencies?.toLocaleString() },
          { label: 'Coins Tracked', value: coins.length > 0 ? coins.length.toLocaleString() : '...', sub: 'on Nomics' },
        ].map((s, i) => (
          <div key={i} className="bg-[#0d0e14] px-4 py-3 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">{s.label}</span>
            <span className="font-mono text-sm font-semibold text-white">{s.value}</span>
            {s.sub && <span className={`text-[11px] font-mono ${s.subColor || 'text-gray-500'}`}>{s.sub}</span>}
          </div>
        ))}
      </div>

      {/* ── Promoted / Boosted Tokens ── */}
      <div className="bg-[#111827] border border-[#2d3748] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d3748]">
          <div className="flex items-center gap-2">
            <Rocket size={15} className="text-[#7c3aed]" />
            <span className="text-sm font-semibold text-white">Promoted Tokens</span>
            <span className="bg-[#7c3aed]/20 text-[#a78bfa] text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">Boosted</span>
          </div>
          <Link to="/promote" className="text-xs text-[#7c3aed] hover:text-[#a78bfa] font-medium flex items-center gap-1 transition-colors">
            Get Listed <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[600px]">
            <thead>
              <tr className="text-[10px] uppercase text-gray-500 tracking-wider bg-[#0d0e14]/50">
                <th className="px-4 py-2 font-medium">Token</th>
                <th className="px-4 py-2 text-right font-medium">1h</th>
                <th className="px-4 py-2 text-right font-medium">6h</th>
                <th className="px-4 py-2 text-right font-medium">24h</th>
                <th className="px-4 py-2 text-right font-medium">Market Cap</th>
                <th className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1d2e]">
              {cLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i} className="h-[44px] animate-pulse">
                    {Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-2"><div className="h-4 bg-[#2d3748] rounded w-16 ml-auto"></div></td>)}
                  </tr>
                ))
              ) : trendingCoins.slice(0, 5).map((item) => {
                const tc = item.item || item;
                const coin = coins.find(c => c.id === tc.id) || {};
                const p24h = coin.price_change_percentage_24h;
                const p1h = coin.price_change_percentage_1h_in_currency;
                const mockP6h = p24h != null ? (p24h / 4) : null;
                return (
                  <tr key={tc.id} className="hover:bg-[#1a1d2e]/60 transition-colors cursor-pointer" onClick={() => navigate(`/coin/${tc.id}`)}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#2d3748] flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img src={tc.thumb || tc.image} alt={tc.name} className="w-7 h-7 rounded-full" onError={e => e.target.style.display='none'} />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs">{tc.name}</div>
                          <div className="text-gray-500 text-[10px] uppercase">{tc.symbol}</div>
                        </div>
                        <span className="ml-1 bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-medium">AD</span>
                      </div>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono ${pctColor(p1h)}`}>{p1h != null ? formatPercent(p1h) : '–'}</td>
                    <td className={`px-4 py-2.5 text-right font-mono ${pctColor(mockP6h)}`}>{mockP6h != null ? formatPercent(mockP6h) : '–'}</td>
                    <td className={`px-4 py-2.5 text-right font-mono ${pctColor(p24h)}`}>{p24h != null ? formatPercent(p24h) : '–'}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-gray-300">{coin.market_cap ? formatMarketCap(coin.market_cap) : '–'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link to="/promote" onClick={e => e.stopPropagation()} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[10px] px-2.5 py-1 rounded font-medium transition-colors">
                        Boost
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Trending Carousel ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} className="text-orange-400" />
          <span className="text-sm font-semibold text-white">Trending Right Now</span>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {cLoading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[160px] h-[68px] bg-[#1a1d2e] border border-[#2d3748] rounded-xl animate-pulse" />
            ))
          ) : trendingCoins.slice(0, 10).map((item) => {
            const tc = item.item || item;
            const coin = coins.find(c => c.id === tc.id) || {};
            const chg = coin.price_change_percentage_24h ?? tc.data?.price_change_percentage_24h?.usd;
            const price = coin.current_price ?? tc.data?.price;
            const isPos = chg >= 0;
            return (
              <div key={tc.id} onClick={() => navigate(`/coin/${tc.id}`)}
                className="flex-shrink-0 w-[165px] bg-[#111827] border border-[#2d3748] hover:border-[#7c3aed]/50 rounded-xl p-3 cursor-pointer transition-all hover:shadow-lg hover:shadow-[#7c3aed]/10 group">
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={tc.thumb || coin.image} alt={tc.name} className="w-6 h-6 rounded-full flex-shrink-0" onError={e => e.target.style.display='none'} />
                  <span className="text-white text-xs font-semibold truncate">{tc.symbol?.toUpperCase()}</span>
                  <span className="text-gray-500 text-[10px] ml-auto">#{tc.market_cap_rank}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-mono text-[11px] text-gray-200">{price ? formatPrice(price) : '–'}</span>
                  <span className={`font-mono text-[11px] font-medium flex items-center gap-0.5 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPos ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    {chg != null ? `${Math.abs(chg).toFixed(2)}%` : '–'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Token Table ── */}
      <div className="bg-[#111827] border border-[#2d3748] rounded-xl overflow-hidden">
        {/* Table Header Controls */}
        <div className="border-b border-[#2d3748]">
          {/* Tab Row */}
          <div className="flex items-center gap-1 px-4 pt-3 overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-t transition-colors whitespace-nowrap border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-white border-[#7c3aed] bg-[#7c3aed]/10'
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-[#1a1d2e]'
                }`}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <div className="ml-auto flex-shrink-0 pb-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
                <input type="text" placeholder="Search coins..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-[#0d0e14] border border-[#2d3748] rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3aed] w-48 transition-colors" />
              </div>
            </div>
          </div>

          {/* Chain Filter Row */}
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto hide-scrollbar">
            {CHAINS.map(chain => (
              <button key={chain} onClick={() => setActiveChain(chain)}
                className={`px-3 py-1 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap ${
                  activeChain === chain
                    ? 'bg-[#7c3aed] text-white'
                    : 'text-gray-400 bg-[#1a1d2e] hover:text-white hover:bg-[#2d3748]'
                }`}>
                {chain}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[#0d0e14]/80 text-[10px] uppercase text-gray-500 tracking-wider">
                <th className="px-4 py-2.5 w-10 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Token</th>
                <th className="px-4 py-2.5 text-right font-medium">Price</th>
                <th className="px-4 py-2.5 text-right font-medium">1h %</th>
                <th className="px-4 py-2.5 text-right font-medium">24h %</th>
                <th className="px-4 py-2.5 text-right font-medium">7d %</th>
                <th className="px-4 py-2.5 text-right font-medium">Market Cap</th>
                <th className="px-4 py-2.5 text-right font-medium">Volume</th>
                <th className="px-4 py-2.5 font-medium">7d Chart</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1d2e]">
              {cLoading ? (
                Array(20).fill(0).map((_, i) => (
                  <tr key={i} className="h-[44px] animate-pulse">
                    <td className="px-4 py-2"><div className="w-4 h-3 bg-[#2d3748] rounded"></div></td>
                    <td className="px-4 py-2"><div className="flex items-center gap-2"><div className="w-6 h-6 bg-[#2d3748] rounded-full"></div><div className="w-20 h-3 bg-[#2d3748] rounded"></div></div></td>
                    {Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-2"><div className="w-14 h-3 bg-[#2d3748] rounded ml-auto"></div></td>)}
                    <td className="px-4 py-2"><div className="w-16 h-5 bg-[#2d3748] rounded"></div></td>
                    <td className="px-4 py-2"></td>
                  </tr>
                ))
              ) : filteredCoins.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                    No tokens found{searchTerm ? ` for "${searchTerm}"` : ''}{activeChain !== 'All Chains' ? ` on ${activeChain}` : ''}
                  </td>
                </tr>
              ) : filteredCoins.map((coin, idx) => {
                const p1h = coin.price_change_percentage_1h_in_currency;
                const p24h = coin.price_change_percentage_24h;
                const p7d = coin.price_change_percentage_7d_in_currency;
                const sparkPrices = coin.sparkline_in_7d?.price;
                const isTrending = trendingCoins.some(t => (t.item?.id || t.id) === coin.id);
                return (
                  <tr key={coin.id} onClick={() => navigate(`/coin/${coin.id}`)}
                    className="h-[44px] hover:bg-[#1a1d2e]/70 transition-colors cursor-pointer group">
                    <td className="px-4 text-gray-500 font-mono">{coin.market_cap_rank || idx + 1}</td>
                    <td className="px-4">
                      <div className="flex items-center gap-2.5">
                        <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full flex-shrink-0" />
                        <span className="font-semibold text-white">{coin.name}</span>
                        <span className="text-gray-500 uppercase">{coin.symbol}</span>
                        {isTrending && (
                          <span className="bg-orange-500/10 text-orange-400 text-[9px] px-1.5 py-0.5 rounded font-medium">HOT</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 text-right font-mono text-white font-medium">{formatPrice(coin.current_price)}</td>
                    <td className={`px-4 text-right font-mono ${pctColor(p1h)}`}>
                      {p1h != null ? <span className="flex items-center justify-end gap-0.5">{pctIcon(p1h)}{Math.abs(p1h).toFixed(2)}%</span> : '–'}
                    </td>
                    <td className={`px-4 text-right font-mono ${pctColor(p24h)}`}>
                      {p24h != null ? <span className="flex items-center justify-end gap-0.5">{pctIcon(p24h)}{Math.abs(p24h).toFixed(2)}%</span> : '–'}
                    </td>
                    <td className={`px-4 text-right font-mono ${pctColor(p7d)}`}>
                      {p7d != null ? <span className="flex items-center justify-end gap-0.5">{pctIcon(p7d)}{Math.abs(p7d).toFixed(2)}%</span> : '–'}
                    </td>
                    <td className="px-4 text-right font-mono text-gray-300">{formatMarketCap(coin.market_cap)}</td>
                    <td className="px-4 text-right font-mono text-gray-400">{formatMarketCap(coin.total_volume)}</td>
                    <td className="px-4">
                      <SvgSparkline prices={sparkPrices} isPositive={p7d >= 0} />
                    </td>
                    <td className="px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to="/promote" onClick={e => e.stopPropagation()}
                        className="bg-[#7c3aed]/20 hover:bg-[#7c3aed] text-[#a78bfa] hover:text-white text-[10px] px-2 py-1 rounded font-medium transition-colors whitespace-nowrap">
                        Boost
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!cLoading && filteredCoins.length > 0 && (
          <div className="px-4 py-3 border-t border-[#1a1d2e] flex items-center justify-between text-[11px] text-gray-500">
            <span>Showing {filteredCoins.length} tokens{activeChain !== 'All Chains' ? ` on ${activeChain}` : ''}</span>
            <Link to="/promote" className="text-[#7c3aed] hover:text-[#a78bfa] font-medium flex items-center gap-1 transition-colors">
              Promote your token <ArrowUpRight size={11} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
