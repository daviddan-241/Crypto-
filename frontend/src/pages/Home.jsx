import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { getGlobalMarket, getTrending, getCoins, formatMarketCap, formatPrice, formatPercent } from '../utils/api';

const MiniSparkline = ({ data, isPositive }) => {
  if (!data || !data.price || data.price.length === 0) return <div className="w-[60px] h-[24px]"></div>;
  const chartData = data.price.map((p, i) => ({ val: p, idx: i }));
  return (
    <div className="w-[60px] h-[24px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line type="monotone" dataKey="val" stroke={isPositive ? '#10b981' : '#ef4444'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const { data: globalMarket, isLoading: isLoadingGlobal } = useQuery({ queryKey: ['globalMarket'], queryFn: getGlobalMarket });
  const { data: trending, isLoading: isLoadingTrending } = useQuery({ queryKey: ['trending'], queryFn: getTrending });
  const { data: coins, isLoading: isLoadingCoins } = useQuery({ queryKey: ['coins'], queryFn: () => getCoins({ per_page: 100 }) });

  const filteredCoins = coins ? coins.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-[#1a1d2e] p-4 rounded-lg border border-[#2d3748]">
        {isLoadingGlobal ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-10 bg-[#2d3748] rounded animate-pulse"></div>)
        ) : globalMarket ? (
          <>
            <div className="flex flex-col"><span className="text-xs text-gray-400 uppercase tracking-wider">Market Cap</span><span className="font-mono font-medium text-sm text-white">{formatMarketCap(globalMarket.total_market_cap_usd)}</span></div>
            <div className="flex flex-col"><span className="text-xs text-gray-400 uppercase tracking-wider">24h Vol</span><span className="font-mono font-medium text-sm text-white">{formatMarketCap(globalMarket.total_volume_usd)}</span></div>
            <div className="flex flex-col"><span className="text-xs text-gray-400 uppercase tracking-wider">Dominance</span><span className="font-mono font-medium text-sm text-white">BTC {globalMarket.btc_dominance?.toFixed(1)}%</span></div>
            <div className="flex flex-col"><span className="text-xs text-gray-400 uppercase tracking-wider">ETH Dom</span><span className="font-mono font-medium text-sm text-white">ETH {globalMarket.eth_dominance?.toFixed(1)}%</span></div>
            <div className="flex flex-col"><span className="text-xs text-gray-400 uppercase tracking-wider">Active Cryptos</span><span className="font-mono font-medium text-sm text-white">{globalMarket.active_cryptocurrencies?.toLocaleString()}</span></div>
          </>
        ) : <div className="col-span-5 text-gray-500 text-sm">Failed to load global market data</div>}
      </div>

      {/* Trending Tokens */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="text-[#7c3aed]" size={18} /> Trending Now</h2>
        <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
          {isLoadingTrending ? (
            Array(5).fill(0).map((_, i) => <div key={i} className="min-w-[200px] h-[72px] bg-[#1a1d2e] rounded-lg border border-[#2d3748] animate-pulse shrink-0"></div>)
          ) : trending?.coins?.length > 0 ? (
            trending.coins.slice(0, 10).map((item) => {
              const coin = item.item || item;
              const isPositive = coin.data?.price_change_percentage_24h?.usd >= 0;
              return (
                <div key={coin.id} onClick={() => navigate(`/coin/${coin.id}`)} className="cursor-pointer min-w-[200px] bg-[#1a1d2e] hover:bg-[#2d3748] border border-[#2d3748] p-3 rounded-lg flex items-center gap-3 transition-colors shrink-0">
                  <img src={coin.thumb || coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white truncate max-w-[80px]">{coin.symbol?.toUpperCase()}</span>
                      <span className="text-xs text-gray-400">#{coin.market_cap_rank}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-xs text-white">{coin.data?.price ? formatPrice(coin.data.price) : '-'}</span>
                      <span className={`font-mono text-xs ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                        {formatPercent(coin.data?.price_change_percentage_24h?.usd)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : <div className="text-gray-500 text-sm">No trending data available</div>}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#111827] border border-[#2d3748] rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#2d3748] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setActiveTab('All')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'All' ? 'bg-[#7c3aed] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1a1d2e]'}`}>All Coins</button>
            <button onClick={() => setActiveTab('Trending')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'Trending' ? 'bg-[#7c3aed] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1a1d2e]'}`}>Trending</button>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search coins..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1d2e] border border-[#2d3748] rounded-md py-1.5 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1a1d2e] text-xs uppercase text-gray-400 font-medium tracking-wider">
              <tr>
                <th className="px-4 py-3 w-16">#</th>
                <th className="px-4 py-3">Coin</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">1h %</th>
                <th className="px-4 py-3 text-right">24h %</th>
                <th className="px-4 py-3 text-right">7d %</th>
                <th className="px-4 py-3 text-right">Market Cap</th>
                <th className="px-4 py-3 text-right">Volume (24h)</th>
                <th className="px-4 py-3">Last 7 Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d3748]">
              {isLoadingCoins ? (
                Array(15).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse h-[44px]">
                    <td className="px-4 py-2"><div className="w-4 h-4 bg-[#2d3748] rounded"></div></td>
                    <td className="px-4 py-2 flex items-center gap-2"><div className="w-6 h-6 bg-[#2d3748] rounded-full"></div><div className="w-20 h-4 bg-[#2d3748] rounded"></div></td>
                    <td className="px-4 py-2 text-right"><div className="w-16 h-4 bg-[#2d3748] rounded ml-auto"></div></td>
                    <td className="px-4 py-2 text-right"><div className="w-10 h-4 bg-[#2d3748] rounded ml-auto"></div></td>
                    <td className="px-4 py-2 text-right"><div className="w-10 h-4 bg-[#2d3748] rounded ml-auto"></div></td>
                    <td className="px-4 py-2 text-right"><div className="w-10 h-4 bg-[#2d3748] rounded ml-auto"></div></td>
                    <td className="px-4 py-2 text-right"><div className="w-20 h-4 bg-[#2d3748] rounded ml-auto"></div></td>
                    <td className="px-4 py-2 text-right"><div className="w-20 h-4 bg-[#2d3748] rounded ml-auto"></div></td>
                    <td className="px-4 py-2"><div className="w-[60px] h-[24px] bg-[#2d3748] rounded"></div></td>
                  </tr>
                ))
              ) : filteredCoins.length > 0 ? (
                filteredCoins.map((coin) => {
                  const p1h = coin.price_change_percentage_1h_in_currency;
                  const p24h = coin.price_change_percentage_24h;
                  const p7d = coin.price_change_percentage_7d_in_currency;
                  return (
                    <tr key={coin.id} onClick={() => navigate(`/coin/${coin.id}`)} className="h-[44px] hover:bg-[#1a1d2e] transition-colors cursor-pointer group">
                      <td className="px-4 text-gray-500 font-mono text-xs">{coin.market_cap_rank}</td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                          <span className="font-semibold text-white">{coin.name}</span>
                          <span className="text-gray-500 text-xs uppercase">{coin.symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 text-right font-mono text-white font-medium">{formatPrice(coin.current_price)}</td>
                      <td className={`px-4 text-right font-mono text-xs ${p1h >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{formatPercent(p1h)}</td>
                      <td className={`px-4 text-right font-mono text-xs ${p24h >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{formatPercent(p24h)}</td>
                      <td className={`px-4 text-right font-mono text-xs ${p7d >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{formatPercent(p7d)}</td>
                      <td className="px-4 text-right font-mono text-xs text-gray-300">{formatMarketCap(coin.market_cap)}</td>
                      <td className="px-4 text-right font-mono text-xs text-gray-300">{formatMarketCap(coin.total_volume)}</td>
                      <td className="px-4">
                        <MiniSparkline data={coin.sparkline_in_7d} isPositive={p7d >= 0} />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">No coins found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
