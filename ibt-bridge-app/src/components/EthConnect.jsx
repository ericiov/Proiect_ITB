// src/components/EthConnect.jsx
import React from 'react';
import { BrowserProvider } from 'ethers';

function EthConnect({ onProviderChange, onAccountChange }) {
  const [connected, setConnected] = React.useState(false);

  const connectMetaMask = async () => {
    // 1) Check if MetaMask injection exists
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not detected. Please install or enable it!');
      return;
    }

    console.log('window.ethereum found:', window.ethereum);

    try {
      // 2) Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // 3) Create an ethers v6 BrowserProvider
      const provider = new BrowserProvider(window.ethereum);

      // 4) getSigner() is asynchronous in v6, so we await it
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log('Connected address:', address);

      // 5) Pass provider & address up to the parent
      onProviderChange(provider);
      onAccountChange(address);

      // 6) Update local state
      setConnected(true);

    } catch (err) {
      console.error('Failed to connect MetaMask:', err);
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      {connected ? (
        <p>Connected Ethereum</p>
      ) : (
        <button onClick={connectMetaMask}>Connect MetaMask</button>
      )}
    </div>
  );
}

export default EthConnect;