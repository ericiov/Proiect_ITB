// src/components/EthConnect.jsx
import React from 'react';
import { BrowserProvider } from 'ethers';

function EthConnect({ onProviderChange, onAccountChange }) {
  const [connected, setConnected] = React.useState(false);

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not detected. Please install or enable it!');
      return;
    }

    console.log('window.ethereum found:', window.ethereum);

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log('Connected address:', address);

      onProviderChange(provider);
      onAccountChange(address);

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