import React, { useState } from 'react';
import { ethers } from 'ethers';
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useSuiClient,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

const PKG_ID = "0xb05fe02db7af74d59bb11bff2362e6f00d1f388c5e36a12ee5de86a9f5128a94";
const TREASURY_CAP_ID = "0x42b96249e3f185a8f7733542afcce7868d1f223aa1bd90385bcb00821564159c";
const IBT_TYPE = "0x2::coin::Coin<0xb05fe02db7af74d59bb11bff2362e6f00d1f388c5e36a12ee5de86a9f5128a94::IBT::IBT>";

async function getEthSigner() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  return provider.getSigner();
}

export default function BridgeForm() {
  const [ethToSuiAmount, setEthToSuiAmount] = useState('');
  const [suiToEthAmount, setSuiToEthAmount] = useState('');
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
          tx.object(RECIPIENT)
        ],
        target: `${PKG_ID}::IBT::mint`,
      });

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log('[Mint] Full result from signAndExecuteTransaction:', JSON.stringify(result, null, 2));

    } catch (err) {
      console.error('[Mint] Mint on Sui failed:', err);
      alert('Mint on Sui reverted. Check console for details.');
    }
  }

  async function burnOnSui(amt) {
    console.log('[Burn] Starting burn on Sui:', amt);
  
    if (!currentAccount) {
      alert('No Sui wallet connected!');
      return;
    }
  
    try {
      const { data: ibtObjects } = await client.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: IBT_TYPE },
        options: { showType: true, showContent: true, showOwner: true },
      });
  
      let totalBalance = 0n;
      const objectsToMerge = [];
      let selectedObjectId;
      const burnAmountInSmallestUnit = BigInt(parseFloat(amt) * 1_000_000_000);
  
      for (const obj of ibtObjects) {
        const { content } = obj.data;
        if (content && content.dataType === 'moveObject') {
          const balance = BigInt(content.fields.balance);
          totalBalance += balance;
          objectsToMerge.push(obj.data.objectId);
          if (balance >= burnAmountInSmallestUnit) {
            selectedObjectId = obj.data.objectId;
            break;
          }
        }
      }
  
      if (totalBalance < burnAmountInSmallestUnit) {
        alert('Not enough balance to burn the specified amount.');
        return;
      }
  
      const tx = new Transaction();
  
      if (objectsToMerge.length > 1) {
        tx.mergeCoins(objectsToMerge[0], objectsToMerge.slice(1));
        selectedObjectId = objectsToMerge[0];
      }
  
      const [burnCoin] = tx.splitCoins(
        selectedObjectId,
        [tx.pure.u64(burnAmountInSmallestUnit)]
      );
  
      tx.moveCall({
        arguments: [
          tx.object(TREASURY_CAP_ID),
          burnCoin,
        ],
        target: `${PKG_ID}::IBT::burn`,
      });
  
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });
  
      console.log('[Burn] Transaction result:', result);
  
    } catch (error) {
      console.error("Error burning IBT:", error);
      alert('Error burning IBT: ' + error.message);
    }
  }
  
  async function mintOnEthereum(amt) {
    console.log('[Mint] Starting mint on Ethereum:', amt);
    try {
      const signer = await getEthSigner();
      const ethAddress = await signer.getAddress();
      console.log('[Mint] MetaMask ETH address:', ethAddress);

      const IBT_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
      const IBT_ABI = [
        {
          "type": "function",
          "name": "mint",
          "inputs": [
            { "name": "to", "type": "address" },
            { "name": "amount", "type": "uint256" }
          ],
          "outputs": [],
          "stateMutability": "nonpayable",
        },
      ];

      const contract = new ethers.Contract(IBT_TOKEN_ADDRESS, IBT_ABI, signer);

      console.log('[Mint] Sending mint transaction...');
      const tx = await contract.mint(
        ethAddress,
        ethers.parseEther(String(amt))
      );
      console.log('[Mint] Transaction hash:', tx.hash);

      const receipt = await tx.wait();
      console.log('[Mint] Transaction mined! Receipt:', receipt);
      console.log(`[Mint] Successfully minted ${amt} IBT on Ethereum.`);

    } catch (err) {
      console.error('[Mint] Mint on Ethereum failed:', err);
      alert('Mint on Ethereum reverted. Check console for details.');
    }
  }

  async function handleEthToSuiBridge() {
    if (!ethToSuiAmount) {
      alert('Enter an amount first!');
      return;
    }

    console.log('[Bridge] Starting bridging flow from Ethereum to SUI for amount:', ethToSuiAmount);

    await burnOnEthereum(ethToSuiAmount);
    await mintOnSui(ethToSuiAmount);

    alert('[Bridge] Done!');
  }

  async function handleSuiToEthBridge() {
    if (!suiToEthAmount) {
      alert('Enter an amount first!');
      return;
    }

    console.log('[Bridge] Starting bridging flow from SUI to Ethereum for amount:', suiToEthAmount);

    await burnOnSui(suiToEthAmount);
    await mintOnEthereum(suiToEthAmount);

    alert('[Bridge] Done!');
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <h2>Bridge</h2>

      <p>Connected Sui: {currentAccount?.address ?? '(No Sui wallet connected)'} </p>

      <h3>Bridge from Ethereum to SUI</h3>
      <input
        type="number"
        placeholder="Amount"
        value={ethToSuiAmount}
        onChange={(e) => setEthToSuiAmount(e.target.value)}
      />
      <button onClick={handleEthToSuiBridge} style={{ marginLeft: '1rem' }}>
        Bridge ETH to SUI
      </button>

      <h3>Bridge from SUI to Ethereum</h3>
      <input
        type="number"
        placeholder="Amount"
        value={suiToEthAmount}
        onChange={(e) => setSuiToEthAmount(e.target.value)}
      />
      <button onClick={handleSuiToEthBridge} style={{ marginLeft: '1rem' }}>
        Bridge SUI to ETH
      </button>
    </div>
  );
}
