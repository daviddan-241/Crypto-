import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Rocket, Target, Zap, ShieldCheck } from 'lucide-react';
import { getServices } from '../utils/api';

export default function Services() {
  const navigate = useNavigate();
  // We'll mock services if API fails or doesn't have it structured perfectly yet for visual demo
  const { data: apiServices, isLoading } = useQuery({ queryKey: ['services'], queryFn: getServices });

  const services = apiServices || [
    {
      id: 'trending',
      name: 'Trending Placement',
      description: 'Get your token on the top 10 trending bar across the entire platform. Maximum visibility for active traders.',
      icon: <Target className="w-8 h-8 text-[#7c3aed]" />,
      tiers: [
        { name: 'Entry', duration: '24 Hours', price: 299 },
        { name: 'Core', duration: '3 Days', price: 799 },
        { name: 'Growth', duration: '7 Days', price: 1499 },
        { name: 'Premium', duration: '14 Days', price: 2499 },
      ]
    },
    {
      id: 'promoted-search',
      name: 'Promoted Search',
      description: 'Appear at the top of all search results and filter queries. Intercept high-intent users looking for new plays.',
      icon: <Zap className="w-8 h-8 text-[#10b981]" />,
      tiers: [
        { name: 'Entry', duration: '24 Hours', price: 199 },
        { name: 'Core', duration: '3 Days', price: 499 },
        { name: 'Growth', duration: '7 Days', price: 999 },
        { name: 'Premium', duration: '14 Days', price: 1799 },
      ]
    },
    {
      id: 'banner',
      name: 'Hero Banner',
      description: 'Massive full-width banner above the fold on the homepage. Impossible to miss.',
      icon: <Rocket className="w-8 h-8 text-[#ef4444]" />,
      tiers: [
        { name: 'Entry', duration: '24 Hours', price: 499 },
        { name: 'Core', duration: '3 Days', price: 1299 },
        { name: 'Growth', duration: '7 Days', price: 2499 },
        { name: 'Premium', duration: '14 Days', price: 4499 },
      ]
    }
  ];

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading services...</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-12 py-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Amplify Your Reach</h1>
        <p className="text-gray-400 text-lg">Get your project in front of thousands of active crypto traders. Choose a marketing package to accelerate your growth.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <div key={service.id} className="bg-[#1a1d2e] border border-[#2d3748] rounded-2xl overflow-hidden flex flex-col hover:border-[#7c3aed] transition-colors duration-300">
            <div className="p-6 border-b border-[#2d3748] bg-[#111827]">
              <div className="bg-[#0d0e14] w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-[#2d3748]">
                {service.icon || <ShieldCheck className="w-8 h-8 text-[#7c3aed]" />}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{service.name}</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{service.description}</p>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Pricing Tiers</h3>
              <div className="flex flex-col gap-3 mb-8 flex-1">
                {service.tiers.map((tier) => (
                  <div key={tier.name} className="flex items-center justify-between p-3 rounded-lg bg-[#0d0e14] border border-[#2d3748]">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{tier.name}</span>
                      <span className="text-xs text-gray-500">{tier.duration}</span>
                    </div>
                    <span className="font-mono font-medium text-[#10b981]">${tier.price}</span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => navigate(`/promote?service=${service.id}`)}
                className="w-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-[#7c3aed]/20"
              >
                Order Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
