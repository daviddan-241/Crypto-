import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import Home from './pages/Home'
import Listed from './pages/Listed'
import Trending from './pages/Trending'
import Hot from './pages/Hot'
import CoinDetail from './pages/CoinDetail'
import TokenDetail from './pages/TokenDetail'
import SubmitCoin from './pages/SubmitCoin'
import Support from './pages/Support'
import ServicesPage from './pages/Services'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60000, retry: 2, refetchOnWindowFocus: false }
  }
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/listed" element={<Listed />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/hot" element={<Hot />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/coin/:id" element={<CoinDetail />} />
            <Route path="/token/:address" element={<TokenDetail />} />
            <Route path="/submit" element={<SubmitCoin />} />
            <Route path="/support" element={<Support />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
