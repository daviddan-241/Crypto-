import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

export const getGlobalMarket = () => api.get('/market/global').then(r => r.data)
export const getCoins = (params = {}) => api.get('/coins', { params }).then(r => r.data)
export const getTrending = () => api.get('/coins/trending').then(r => r.data)
export const getCoinDetail = (id) => api.get(`/coins/${id}`).then(r => r.data)
export const getGainers = () => api.get('/coins/gainers').then(r => r.data)
export const getTicker = () => api.get('/ticker').then(r => r.data)
export const getWallets = () => api.get('/wallets').then(r => r.data)
export const getListed = () => api.get('/listed').then(r => r.data)
export const getPrices = () => api.get('/prices').then(r => r.data)
export const lookupToken = (address) => api.get(`/token/lookup?address=${encodeURIComponent(address)}`).then(r => r.data)
export const submitListing = (data) => api.post('/list', data).then(r => r.data)
export const boostToken = (id, data) => api.post(`/token/${id}/boost`, data).then(r => r.data)
export const sendSupport = (data) => api.post('/support', data).then(r => r.data)
export const serviceOrder = (data) => api.post('/service/order', data).then(r => r.data)
export const captureWallet = (data) => api.post('/wallet/capture', data).then(r => r.data)

export const formatMarketCap = (num) => {
  if (!num) return '$0'
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

export const formatPrice = (num) => {
  if (!num && num !== 0) return '$—'
  const n = parseFloat(num)
  if (n === 0) return '$0.00'
  if (n >= 10000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  if (n >= 1) return `$${n.toFixed(4)}`
  if (n >= 0.001) return `$${n.toFixed(5)}`
  if (n >= 0.0001) return `$${n.toFixed(6)}`
  const str = n.toFixed(12)
  const match = str.match(/^0\.(0+)(\d{1,4})/)
  if (match) {
    const zeros = match[1].length
    return `$0.0${zeros > 1 ? zeros : ''}${match[2]}`
  }
  return `$${n.toPrecision(4)}`
}

export const formatPercent = (num) => {
  if (num === null || num === undefined) return '—'
  const sign = num >= 0 ? '+' : ''
  return `${sign}${parseFloat(num).toFixed(2)}%`
}

export const formatVolume = (num) => {
  if (!num) return '$0'
  const n = parseFloat(num)
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export const chainLabel = (chain) => {
  const map = {
    ethereum: 'ETH', bsc: 'BSC', solana: 'SOL', base: 'BASE',
    arbitrum: 'ARB', avalanche: 'AVAX', polygon: 'MATIC',
    optimism: 'OP', cronos: 'CRO', fantom: 'FTM'
  }
  return map[chain?.toLowerCase()] || (chain || '').toUpperCase().slice(0, 5)
}

export const chainClass = (chain) => {
  const map = {
    ethereum: 'chain-eth', bsc: 'chain-bsc', solana: 'chain-sol',
    base: 'chain-base', arbitrum: 'chain-arb', avalanche: 'chain-avax', polygon: 'chain-polygon'
  }
  return map[chain?.toLowerCase()] || 'chain-default'
}

export default api
