import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

async function getEthSigner() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  return provider.getSigner();
}

export default function BridgeForm() {
  const [amount, setAmount] = useState('');
  const client = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showObjectChanges: true,
        },
      }),
  });
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
    const TREASURY_CAP_ID = '0x42b96249e3f185a8f7733542afcce7868d1f223aa1bd90385bcb00821564159c';
    const ADDRESS = '0x6d3bbafa9df8e408c01f44f620cb73bf7acd95f62627f57be548748d2f396479';

    const RECIPIENT = currentAccount?.address;
    console.log('[Mint] Sui recipient address:', RECIPIENT);
    if (!RECIPIENT) {
      alert('No Sui wallet connected. Please connect your Sui wallet first.');
      return;
    }

    try {
      const tx = new Transaction();
      const amountInSmallestUnit = BigInt(parseFloat(amt) * 1_000_000_000);

      tx.moveCall({
        arguments: [
          tx.object(TREASURY_CAP_ID),
          tx.pure.u64(amountInSmallestUnit),
          tx.object(ADDRESS)
        ],
        target: `${PKG_ID}::IBT::mint`,
      });

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

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

    await alert('[Bridge] Done!');
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <h2>Bridge</h2>

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
