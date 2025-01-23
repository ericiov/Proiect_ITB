import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';


async function getEthSigner() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  return provider.getSigner();
}

export default function BridgeForm() {
  const [amount, setAmount] = useState('');


  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const currentAccount = useCurrentAccount();


  async function burnOnEthereum(amt) {
    console.log('[Burn] Starting burn on Ethereum:', amt);
    try {
  
      const signer = await getEthSigner();
      const ethAddress = await signer.getAddress();
      console.log('[Burn] MetaMask ETH address:', ethAddress);


      const IBT_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
   
      const IBT_ABI = [
        {
          "type": "function",
          "name": "burn",
          "inputs": [
            { "name": "from", "type": "address" },
            { "name": "amount", "type": "uint256" }
          ],
          "outputs": [],
          "stateMutability": "nonpayable",
        },
      ];

      const contract = new ethers.Contract(IBT_TOKEN_ADDRESS, IBT_ABI, signer);

      console.log('[Burn] Sending burn transaction...');
      const tx = await contract.burn(
        ethAddress,                     
        ethers.parseEther(String(amt))   
      );
      console.log('[Burn] Transaction hash:', tx.hash);

      const receipt = await tx.wait();
      console.log('[Burn] Transaction mined! Receipt:', receipt);
      console.log(`[Burn] Successfully burned ${amt} IBT on Ethereum.`);

    } catch (err) {
      console.error('[Burn] Burn on Ethereum failed:', err);
      alert('Burn on Ethereum reverted. Check console for details.');
    }
  }


  async function mintOnSui(amt) {
    console.log('[Mint] Starting mint on Sui:', amt);
   
    const PKG_ID = '0xb05fe02db7af74d59bb11bff2362e6f00d1f388c5e36a12ee5de86a9f5128a94';
    const ADMIN_CAP_ID = '0x42b96249e3f185a8f7733542afcce7868d1f223aa1bd90385bcb00821564159c';


    const RECIPIENT = currentAccount?.address;
    console.log('[Mint] Sui recipient address:', RECIPIENT);
    if (!RECIPIENT) {
      alert('No Sui wallet connected. Please connect your Sui wallet first.');
      return;
    }

    try {
      console.log('[Mint] Sending Move call to mint...');
      const result = await signAndExecuteTransaction(
        {
          packageObjectId: PKG_ID,
          module: 'IBT',
          function: 'mint',
          typeArguments: [],
          arguments: [ADMIN_CAP_ID, amt, RECIPIENT],
          gasBudget: 20_000_000,
        },
        'moveCall'
      );

      console.log('[Mint] Full result from signAndExecuteTransaction:', JSON.stringify(result, null, 2));

     
      console.log(
        '[Mint] Potential transaction digest:',
        result?.effectsCert?.effects?.transactionDigest ||
          result?.certificate?.transactionDigest ||
          'Not found in result structure.'
      );


    } catch (err) {
      console.error('[Mint] Mint on Sui failed:', err);
      alert('Mint on Sui reverted. Check console for details.');
    }
  }

  async function handleBridge() {
    if (!amount) {
      alert('Enter an amount first!');
      return;
    }

    console.log('[Bridge] Starting bridging flow for amount:', amount);


    await burnOnEthereum(amount);


    await mintOnSui(amount);

    alert('[Bridge] Done!');
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <h2>My IBT Bridge DApp</h2>

      <p>Connected Sui: {currentAccount?.address ?? '(No Sui wallet connected)'} </p>

      <h3>Bridge from Ethereum to Sui</h3>
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleBridge} style={{ marginLeft: '1rem' }}>
        Bridge
      </button>
    </div>
  );
}