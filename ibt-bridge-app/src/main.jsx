import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import '@mysten/dapp-kit/dist/index.css'

// dApp Kit imports
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'

// React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },   // or devnet, testnet, mainnet
  // add more networks if desired
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={{localnet: { url: 'http://127.0.0.1:9000' } }}>
        <WalletProvider>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)