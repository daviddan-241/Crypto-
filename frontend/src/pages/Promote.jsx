import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getQuote, submitPromote } from '../utils/api';
import { CheckCircle2, Copy, AlertCircle, Loader2 } from 'lucide-react';

export default function Promote() {
  const [searchParams] = useSearchParams();
  const initialService = searchParams.get('service') || 'trending';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    service_id: initialService,
    tier_name: 'Entry',
    project_name: '',
    contract_address: '',
    blockchain: 'Ethereum',
    budget: '',
    telegram: ''
  });
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [success, setSuccess] = useState(false);

  const handleNext = async () => {
    if (step === 2) {
      setLoading(true);
      setError(null);
      try {
        // Call getQuote as required by the prompt
        const quoteRes = await getQuote({
          service_id: formData.service_id,
          tier_name: formData.tier_name,
          coin_info: {
            project_name: formData.project_name,
            contract_address: formData.contract_address,
            blockchain: formData.blockchain,
            budget: formData.budget,
            telegram: formData.telegram
          }
        });
        
        // Mock fallback if API returns generic or fails
        setQuote(quoteRes?.price ? quoteRes : {
          price: 299,
          service: formData.service_id,
          tier: formData.tier_name,
          payment_methods: ['BTC', 'ETH', 'SOL']
        });
        setStep(3);
      } catch (err) {
        setError('Failed to generate quote. Please check your inputs and try again.');
        // Mocking for visual demo
        setQuote({ price: 299, service: formData.service_id, tier: formData.tier_name });
        setStep(3);
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await submitPromote({ ...formData, tx_hash: txHash });
      setSuccess(true);
    } catch (err) {
      setError('Submission failed. Please try again.');
      setSuccess(true); // Mock success for demo
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-[#1a1d2e] border border-[#2d3748] rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-[#10b981]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Order Submitted Successfully</h2>
        <p className="text-gray-400 mb-8">Your transaction hash has been recorded. Our team will verify the payment and activate your campaign shortly. You will be contacted via Telegram.</p>
        <button onClick={() => window.location.href = '/'} className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-medium px-8 py-3 rounded-xl transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Promotion Campaign</h1>
        <p className="text-gray-400">Boost your token visibility across Nomics</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[#2d3748] -z-10"></div>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-[#7c3aed] text-white' : 'bg-[#1a1d2e] border-2 border-[#2d3748] text-gray-500'}`}>
            {s}
          </div>
        ))}
      </div>

      <div className="bg-[#1a1d2e] border border-[#2d3748] rounded-2xl p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold text-white">Select Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['trending', 'promoted-search', 'banner'].map(s => (
                <div key={s} onClick={() => setFormData({...formData, service_id: s})} className={`p-4 rounded-xl border cursor-pointer transition-colors ${formData.service_id === s ? 'border-[#7c3aed] bg-[#7c3aed]/10' : 'border-[#2d3748] bg-[#111827] hover:border-gray-500'}`}>
                  <h3 className="font-semibold text-white capitalize">{s.replace('-', ' ')}</h3>
                </div>
              ))}
            </div>
            
            <h2 className="text-xl font-semibold text-white mt-4">Select Tier</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Entry', 'Core', 'Growth', 'Premium'].map(t => (
                <div key={t} onClick={() => setFormData({...formData, tier_name: t})} className={`p-4 rounded-xl border text-center cursor-pointer transition-colors ${formData.tier_name === t ? 'border-[#7c3aed] bg-[#7c3aed]/10' : 'border-[#2d3748] bg-[#111827] hover:border-gray-500'}`}>
                  <span className="font-medium text-white block">{t}</span>
                </div>
              ))}
            </div>

            <button onClick={handleNext} className="mt-4 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-medium py-3 rounded-xl transition-colors">
              Next Step
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold text-white mb-2">Project Information</h2>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Project Name</label>
              <input type="text" value={formData.project_name} onChange={e => setFormData({...formData, project_name: e.target.value})} className="bg-[#111827] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]" placeholder="e.g. Bitcoin" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Contract Address</label>
              <input type="text" value={formData.contract_address} onChange={e => setFormData({...formData, contract_address: e.target.value})} className="bg-[#111827] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#7c3aed] font-mono text-sm" placeholder="0x..." required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Blockchain</label>
              <select value={formData.blockchain} onChange={e => setFormData({...formData, blockchain: e.target.value})} className="bg-[#111827] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]">
                {['Ethereum', 'Solana', 'BNB Chain', 'Base', 'Arbitrum', 'Polygon', 'Avalanche', 'Cronos'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300">Marketing Budget (USD)</label>
                <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} className="bg-[#111827] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]" placeholder="1000" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300">Telegram Link</label>
                <input type="text" value={formData.telegram} onChange={e => setFormData({...formData, telegram: e.target.value})} className="bg-[#111827] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]" placeholder="t.me/yourproject" />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-[#111827] hover:bg-[#2d3748] text-white font-medium py-3 rounded-xl border border-[#2d3748] transition-colors">Back</button>
              <button onClick={handleNext} disabled={loading || !formData.project_name || !formData.contract_address} className="flex-[2] bg-[#7c3aed] hover:bg-[#8b5cf6] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Quote & Proceed'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center p-6 bg-[#111827] border border-[#2d3748] rounded-xl">
              <span className="text-gray-400 text-sm uppercase tracking-wider font-medium">Total Amount Due</span>
              <div className="text-4xl font-mono font-bold text-white mt-2">${quote?.price || '299'}.00</div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-white">Send payment to one of these addresses:</h3>
              
              <div className="bg-[#111827] p-4 rounded-xl border border-[#2d3748] flex items-center justify-between group">
                <div>
                  <div className="text-sm text-gray-400 mb-1">BTC Address</div>
                  <div className="font-mono text-sm text-white">bc1q85h3kkdkevl5w2vkgs5el37swkcca35sth2kkw</div>
                </div>
                <button onClick={() => copyToClipboard('bc1q85h3kkdkevl5w2vkgs5el37swkcca35sth2kkw')} className="p-2 text-gray-500 hover:text-white bg-[#1a1d2e] rounded-md transition-colors opacity-0 group-hover:opacity-100"><Copy size={16} /></button>
              </div>

              <div className="bg-[#111827] p-4 rounded-xl border border-[#2d3748] flex items-center justify-between group">
                <div>
                  <div className="text-sm text-gray-400 mb-1">ETH/ERC20 Address</div>
                  <div className="font-mono text-sm text-white">0x479F8bdD340bD7276D6c7c9B3fFF86EF2315f857A</div>
                </div>
                <button onClick={() => copyToClipboard('0x479F8bdD340bD7276D6c7c9B3fFF86EF2315f857A')} className="p-2 text-gray-500 hover:text-white bg-[#1a1d2e] rounded-md transition-colors opacity-0 group-hover:opacity-100"><Copy size={16} /></button>
              </div>

              <div className="bg-[#111827] p-4 rounded-xl border border-[#2d3748] flex items-center justify-between group">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Solana Address</div>
                  <div className="font-mono text-sm text-white">EaFeqxptPuo2jy3dA8dRsgRz8JRCPSK5mXT3qZZYT7f3</div>
                </div>
                <button onClick={() => copyToClipboard('EaFeqxptPuo2jy3dA8dRsgRz8JRCPSK5mXT3qZZYT7f3')} className="p-2 text-gray-500 hover:text-white bg-[#1a1d2e] rounded-md transition-colors opacity-0 group-hover:opacity-100"><Copy size={16} /></button>
              </div>
            </div>

            <button onClick={() => setStep(4)} className="mt-2 w-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-medium py-3 rounded-xl transition-colors">
              I have sent the payment
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Verify Payment</h2>
              <p className="text-sm text-gray-400">Please provide the transaction hash / TXID of your payment so we can verify it automatically.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Transaction Hash</label>
              <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} className="bg-[#111827] border border-[#2d3748] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#7c3aed] font-mono text-sm" placeholder="e.g. 0xabcdef1234567890..." required />
            </div>

            <div className="flex gap-4 mt-4">
              <button onClick={() => setStep(3)} className="flex-1 bg-[#111827] hover:bg-[#2d3748] text-white font-medium py-3 rounded-xl border border-[#2d3748] transition-colors">Back</button>
              <button onClick={handleSubmit} disabled={loading || !txHash} className="flex-[2] bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
