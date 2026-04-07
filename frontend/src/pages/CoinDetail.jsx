import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, MessageCircle } from 'lucide-react';
import { getCoinDetail, formatPrice, formatMarketCap, formatPercent } from '../utils/api';

export default function CoinDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: coin, isLoading, isError } = useQuery({ queryKey: ['coin', id], queryFn: () => getCoinDetail(id) });

  if (isLoading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading {id}...</div>;
  if (isError || !coin) return <div className="p-8 text-center text-red-400">Error loading coin details.</div>;

  const isPositive24h = coin.market_data?.price_change_24h_pct >= 0;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <button onClick={() => navigate(-1)} className="self-start flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
        <ArrowLeft size={16} /> Back to Markets
      </button>

      <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
        <div className="flex gap-6 items-center w-full md:w-auto">
          <img src={coin.image?.large || coin.image} alt={coin.name} className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#0d0e14] p-1 border border-[#2d3748]" />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">{coin.name}</h1>
              <span className="bg-[#2d3748] text-gray-300 text-xs px-2 py-1 rounded font-mono uppercase">{coin.symbol}</span>
            </div>
            <div className="flex gap-4 mt-4">
              {coin.links?.homepage?.[0] && <a href={coin.links.homepage[0]} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#7c3aed] transition-colors"><ExternalLink size={20} /></a>}
              {coin.links?.twitter_screen_name && <a href={`https://twitter.com/${coin.links.twitter_screen_name}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#7c3aed] transition-colors"><ExternalLink size={20} /></a>}
              {coin.links?.telegram_channel_identifier && <a href={`https://t.me/${coin.links.telegram_channel_identifier}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#7c3aed] transition-colors"><MessageCircle size={20} /></a>}
            </div>
          </div>
        </div>

        <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-6 md:border-l border-[#2d3748] md:pl-8">
          <div className="flex flex-col">
            <span className="text-sm text-gray-400 mb-1">Price</span>
            <span className="text-2xl font-mono font-semibold text-white">{formatPrice(coin.market_data?.current_price?.usd || coin.market_data?.current_price)}</span>
            <span className={`text-sm font-mono mt-1 ${isPositive24h ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{formatPercent(coin.market_data?.price_change_24h_pct)} (24h)</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-400 mb-1">Market Cap</span>
            <span className="text-lg font-mono text-white">{formatMarketCap(coin.market_data?.market_cap?.usd || coin.market_data?.market_cap)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-400 mb-1">Volume (24h)</span>
            <span className="text-lg font-mono text-white">{formatMarketCap(coin.market_data?.total_volume?.usd || coin.market_data?.total_volume)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-400 mb-1">ATH</span>
            <span className="text-lg font-mono text-white">{formatPrice(coin.market_data?.ath?.usd || coin.market_data?.ath)}</span>
          </div>
        </div>
      </div>

      {coin.description?.en && (
        <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">About {coin.name}</h2>
          <div className="text-gray-400 text-sm leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: coin.description.en }} />
        </div>
      )}
    </div>
  );
}
