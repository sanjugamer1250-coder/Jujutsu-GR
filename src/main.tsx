import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from '@/lib/store';
import './index.css';

// 1. Import the Web3 Providers
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 2. Set up the basic Wagmi engine
const config = createConfig({
  chains: [mainnet, bsc],
  transports: { 
    [mainnet.id]: http(),
    [bsc.id]: http()
  },
});

// 3. Set up the data fetcher
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Web3 Engine goes on the outside */}
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        
        {/* Your Game Engine goes on the inside */}
        <AppProvider>
          <App />
        </AppProvider>
        
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
