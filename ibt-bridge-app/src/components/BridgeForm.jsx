import React, { useState } from 'react';
import { ethers } from 'ethers';
// For dApp Kit v0.14:
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';

/** 
 * Get a signer from MetaMask (ethers.js v6).
 */
async function getEthSigner() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  return provider.getSigner();
}

export default function BridgeForm() {
  const [amount, setAmount] = useState('');

  // For calling a Move function on Sui
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  // Show which Sui address is connected
  const currentAccount = useCurrentAccount();

  // 1) Burn IBT on Ethereum
  async function burnOnEthereum(amt) {
    console.log('[Burn] Starting burn on Ethereum:', amt);
    try {
      // Connect MetaMask
      const signer = await getEthSigner();
      const ethAddress = await signer.getAddress();
      console.log('[Burn] MetaMask ETH address:', ethAddress);

      // Address of your IBT token on Anvil
      const IBT_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
      // Minimal ABI for burn
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
        ethAddress,                      // "from"
        ethers.parseEther(String(amt))   // "amount"
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

  // 2) Mint IBT on Sui
  async function mintOnSui(amt) {
    console.log('[Mint] Starting mint on Sui:', amt);
    // IDs for your published package & AdminCap
    const PKG_ID = '0xb05fe02db7af74d59bb11bff2362e6f00d1f388c5e36a12ee5de86a9f5128a94';
    const ADMIN_CAP_ID = '0x42b96249e3f185a8f7733542afcce7868d1f223aa1bd90385bcb00821564159c';

    // Use your connected Sui address
    const RECIPIENT = currentAccount?.address;
    console.log('[Mint] Sui recipient address:', RECIPIENT);
    if (!RECIPIENT) {
      alert('No Sui wallet connected. Please connect your Sui wallet first.');
      return;
    }

    try {
      console.log('[Mint] Sending Move call to mint...');
      // signAndExecuteTransaction typically returns an object with transaction info
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

      // For older dApp Kit versions, the Sui transaction digest often appears in places like:
      //   result.effectsCert?.effects?.transactionDigest
      // or result.certificate?.transactionDigest
      // Let’s just log them if they exist:
      console.log(
        '[Mint] Potential transaction digest:',
        result?.effectsCert?.effects?.transactionDigest ||
          result?.certificate?.transactionDigest ||
          'Not found in result structure.'
      );

      // If you want, store it in a variable:
      // const txDigest = result?.certificate?.transactionDigest;
      // Then you can run: "sui client tx-block <txDigest>" in the terminal to see the minted object.

    } catch (err) {
      console.error('[Mint] Mint on Sui failed:', err);
      alert('Mint on Sui reverted. Check console for details.');
    }
  }

  // Main bridging flow
  async function handleBridge() {
    if (!amount) {
      alert('Enter an amount first!');
      return;
    }

    console.log('[Bridge] Starting bridging flow for amount:', amount);

    // 1) Burn on Ethereum
    await burnOnEthereum(amount);

    // 2) Mint on Sui
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