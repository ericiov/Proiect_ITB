import React from 'react'
import { BrowserProvider } from 'ethers'

function EthConnect({ onProviderChange, onAccountChange }) {
  const [connected, setConnected] = React.useState(false)

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not detected. Please install or enable it!')
      return
    }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      onProviderChange(provider)
      onAccountChange(address)
      setConnected(true)
    } catch (err) {
    }
  }

  return (
    <div className="mb-3">
      {connected ? (
        <p>Connected Ethereum</p>
      ) : (
        <button className="btn btn-primary" onClick={connectMetaMask}>
          Connect MetaMask
        </button>
      )}
    </div>
  )
}

export default EthConnect
