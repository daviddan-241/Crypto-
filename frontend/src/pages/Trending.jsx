import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Flame, TrendingUp, Zap, Star, ChevronUp, ChevronDown, ArrowUpRight, Rocket } from 'lucide-react';
import { getTrending, getCoins, formatMarketCap, formatPrice, formatPercent } from '../utils/api';

const pctColor = (v) => v == null ? 'text-gray-500' : v >= 0 ? 'text-emerald-400' : 'text-red-400';

export default function Trending() {
  const navigate = useNavigate();

  const { data: trendingData, isLoading: tLoading } = useQuery({
    queryKey: ['trending'], queryFn: getTrending, staleTime: 120000,
  });
  const { data: coins = [], isLoading: cLoading } = useQuery({
    queryKey: ['coins'], queryFn: () => getCoins({ per_page: 250 }), staleTime: 60000,
  });

  const trendingCoins = trendingData?.coins || [];
  const trendingNFTs = trendingData?.nfts || [];
  const trendingCategories = trendingData?.categories || [];
  const safeCoins = Array.isArray(coins) ? coins : [];

  const enriched = trendingCoins.map(item => {
    const tc = item.item || item;
    const coin = safeCoins.find(c => c.id === tc.id) || {};
    return { ...tc, live: coin };
  });

  const hotCoins = [...safeCoins].sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0)).slice(0, 10);
  const gainers = [...safeCoins].filter(c => c.price_change_percentage_24h > 0)
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 10);
  const losers = [...safeCoins].filter(c => c.price_change_percentage_24h < 0)
    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 10);
  const newListings = [...safeCoins].filter(c => c.market_cap_rank > 200)
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 10);

  const CoinRow = ({ coin, rank }) => {
    const p24h = coin.price_change_percentage_24h;
    return (
      <tr onClick={() => navigate(`/coin/${coin.id}`)} className="hover:bg-[#1a1d2e]/60 cursor-pointer transition-colors">
        <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{rank}</td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full flex-shrink-0" />
            <span className="text-white text-xs font-semibold">{coin.name}</span>
            <span className="text-gray-500 text-[10px] uppercase">{coin.symbol}</span>
          </div>
        </td>
        <td className="px-4 py-2.5 text-right font-mono text-white text-xs">{formatPrice(coin.current_price)}</td>
        <td className={`px-4 py-2.5 text-right font-mono text-xs ${pctColor(p24h)}`}>
          {p24h != null ? <span className="flex items-center justify-end gap-0.5">
            {p24h >= 0 ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {Math.abs(p24h).toFixed(2)}%
          </span> : '–'}
        </td>
        <td className="px-4 py-2.5 text-right font-mono text-gray-300 text-xs">{formatMarketCap(coin.market_cap)}</td>
      </tr>
    );
  };

  const SectionTable = ({ title, icon, coins: list, emptyMsg }) => (
    <div className="bg-[#111827] border border-[#2d3748] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2d3748] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <Link to="/" className="text-xs text-[#7c3aed] hover:text-[#a78bfa] flex items-center gap-0.5 transition-colors">
          View All <ArrowUpRight size={11} />
        </Link>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] uppercase text-gray-500 tracking-wider bg-[#0d0e14]/60">
            <th className="px-4 py-2 font-medium w-10">#</th>
            <th className="px-4 py-2 font-medium">Token</th>
            <th className="px-4 py-2 text-right font-medium">Price</th>
            <th className="px-4 py-2 text-right font-medium">24h</th>
            <th className="px-4 py-2 text-right font-medium">Market Cap</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1a1d2e]">
          {cLoading ? (
            Array(6).fill(0).map((_, i) => (
              <tr key={i} className="h-[42px] animate-pulse">
                {Array(5).fill(0).map((_, j) => <td key={j} className="px-4 py-2"><div className="h-3 bg-[#2d3748] rounded"></div></td>)}
              </tr>
            ))
          ) : list.length === 0 ? (
            <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500 text-xs">{emptyMsg}</td></tr>
          ) : list.map((coin, i) => <CoinRow key={coin.id} coin={coin} rank={i + 1} />)}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flame className="text-orange-400" size={22} />
            Trending & Market Movers
          </h1>
          <p className="text-gray-500 text-sm mt-1">Real-time trending tokens, top gainers, losers, and new listings</p>
        </div>
        <Link to="/promote"
          className="flex items-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-[#7c3aed]/20">
          <Rocket size={14} />
          Boost Your Token
        </Link>
      </div>

      {/* Trending Coins Feature Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame size={14} className="text-orange-400" />
          <span className="text-sm font-semibold text-white">🔥 Trending on CoinGecko</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {tLoading ? (
            Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-[96px] bg-[#111827] border border-[#2d3748] rounded-xl animate-pulse" />
            ))
          ) : enriched.slice(0, 10).map((tc, idx) => {
            const chg = tc.live?.price_change_percentage_24h ?? tc.data?.price_change_percentage_24h?.usd;
            const price = tc.live?.current_price ?? tc.data?.price;
            const isPos = chg >= 0;
            return (
              <div key={tc.id} onClick={() => navigate(`/coin/${tc.id}`)}
                className="bg-[#111827] border border-[#2d3748] hover:border-[#7c3aed]/40 rounded-xl p-3 cursor-pointer transition-all group hover:shadow-lg hover:shadow-[#7c3aed]/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img src={tc.thumb || tc.live?.image} alt={tc.name} className="w-7 h-7 rounded-full" onError={e => e.target.style.display = 'none'} />
                    <div>
                      <div className="text-white text-xs font-semibold leading-tight">{tc.symbol?.toUpperCase()}</div>
                      <div className="text-gray-500 text-[9px]">#{tc.market_cap_rank || '?'}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 bg-[#1a1d2e] rounded px-1.5 py-0.5 font-mono">#{idx + 1}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-mono text-[11px] text-gray-200">{price ? formatPrice(price) : '–'}</span>
                  <span className={`font-mono text-[10px] font-medium flex items-center gap-0.5 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPos ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                    {chg != null ? `${Math.abs(chg).toFixed(2)}%` : '–'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4-Grid of Market Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionTable title="🔥 Hot by Volume" icon={<Zap size={14} className="text-yellow-400" />} coins={hotCoins} emptyMsg="Loading..." />
        <SectionTable title="📈 Top Gainers (24h)" icon={<TrendingUp size={14} className="text-emerald-400" />} coins={gainers} emptyMsg="No gainers right now" />
        <SectionTable title="📉 Top Losers (24h)" icon={<TrendingUp size={14} className="text-red-400 rotate-180" />} coins={losers} emptyMsg="No losers data" />
        <SectionTable title="⭐ New Listings" icon={<Star size={14} className="text-blue-400" />} coins={newListings} emptyMsg="No new listings" />
      </div>

      {/* Trending NFTs if available */}
      {trendingNFTs.length > 0 && (
        <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-purple-400" />
            <span className="text-sm font-semibold text-white">Trending NFTs</span>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {trendingNFTs.slice(0, 8).map(nft => (
              <div key={nft.id} className="flex-shrink-0 w-[140px] bg-[#0d0e14] border border-[#2d3748] rounded-lg p-2.5">
                <img src={nft.thumb} alt={nft.name} className="w-8 h-8 rounded mb-1.5" onError={e => e.target.style.display = 'none'} />
                <div className="text-white text-[11px] font-semibold truncate">{nft.name}</div>
                <div className="text-gray-500 text-[10px]">{nft.symbol}</div>
                {nft.data?.floor_price && <div className="text-gray-300 font-mono text-[10px] mt-0.5">{nft.data.floor_price}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Categories */}
      {trendingCategories.length > 0 && (
        <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={14} className="text-orange-400" />
            <span className="text-sm font-semibold text-white">Trending Categories</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingCategories.slice(0, 12).map(cat => {
              const chg = cat.data?.market_cap_change_percentage_24h?.usd;
              const isPos = chg >= 0;
              return (
                <div key={cat.id} className="flex items-center gap-2 bg-[#0d0e14] border border-[#2d3748] rounded-lg px-3 py-2">
                  <span className="text-white text-xs font-medium">{cat.name}</span>
                  {chg != null && (
                    <span className={`font-mono text-[10px] ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPos ? '+' : ''}{chg.toFixed(2)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#7c3aed]/20 to-[#6d28d9]/10 border border-[#7c3aed]/30 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-bold text-lg">Want your token on this page?</h3>
          <p className="text-gray-400 text-sm mt-1">Boost your project's visibility with our Web3 marketing services</p>
        </div>
        <Link to="/promote"
          className="flex-shrink-0 flex items-center gap-2 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-semibold px-6 py-3 rounded-lg transition-colors">
          <Rocket size={15} />
          Promote Your Token
        </Link>
      </div>
    </div>
  );
}
