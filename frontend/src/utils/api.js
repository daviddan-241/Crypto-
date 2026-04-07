import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

export const getGlobalMarket = () => api.get('/market/global').then(r => r.data)
export const getCoins = (params = {}) => api.get('/coins', { params }).then(r => r.data)
export const getTrending = () => api.get('/coins/trending').then(r => r.data)
export const getCoinDetail = (id) => api.get(`/coins/${id}`).then(r => r.data)
export const getServices = () => api.get('/services').then(r => r.data)
export const getQuote = (data) => api.post('/quote', data).then(r => r.data)
export const submitPromote = (data) => api.post('/promote', data).then(r => r.data)
export const sendSupport = (data) => api.post('/support', data).then(r => r.data)

export const formatMarketCap = (num) => {
  if (!num) return '$0'
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

export const formatPrice = (num) => {
  if (!num) return '$0'
  if (num >= 1000) return `$${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  if (num >= 1) return `$${num.toFixed(4)}`
  if (num >= 0.0001) return `$${num.toFixed(6)}`
  return `$${num.toFixed(8)}`
}

export const formatPercent = (num) => {
  if (num === null || num === undefined) return '0.00%'
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

export default api
