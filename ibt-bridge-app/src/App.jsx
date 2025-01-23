import React, { useState } from 'react';
import { Contract, parseEther } from 'ethers';

import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useSuiClient,
} from '@mysten/dapp-kit';

import EthConnect from './components/EthConnect';
import SuiConnect from './components/SuiConnect';
import BridgeForm from './components/BridgeForm';

const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const ibtAbi = [
  'function mint(address to, uint256 amount) external',
  'function burn(address from, uint256 amount) external',
  'function balanceOf(address owner) view returns (uint256)',
];

function App() {
  const [ethProvider, setEthProvider] = useState(null);
  const [ethAccount, setEthAccount] = useState('');
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [amount, setAmount] = useState('');

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const currentSuiAccount = useCurrentAccount();
  const suiClient = useSuiClient();


  async function handleMintEth() {
    try {
      if (!ethProvider) {
        alert('Nu ai provider Ethereum! Conectează-te cu MetaMask mai întâi.');
        return;
      }
      const signer = await ethProvider.getSigner();
      const contract = new Contract(contractAddress, ibtAbi, signer);

      const tx = await contract.mint(ethAccount, parseEther(amount));
      await tx.wait();
      alert(`Mint ETH reușit: ${amount} IBT către ${ethAccount}.`);
    } catch (err) {
      console.error('[Mint ETH] Eroare:', err);
      alert(`[Mint ETH] Eroare: ${err.message}`);
    }
  }

  async function handleBurnEth() {
    try {
      if (!ethProvider) {
        alert('Nu ai provider Ethereum! Conectează-te cu MetaMask mai întâi.');
        return;
      }
      const signer = await ethProvider.getSigner();
      const contract = new Contract(contractAddress, ibtAbi, signer);

      const tx = await contract.burn(ethAccount, parseEther(amount));
      await tx.wait();
      alert(`Burn ETH reușit: ${amount} IBT din contul ${ethAccount}.`);
    } catch (err) {
      console.error('[Burn ETH] Eroare:', err);
      alert(`[Burn ETH] Eroare: ${err.message}`);
    }
  }

  async function handleMintSui() {
    try {
      if (!currentSuiAccount) {
        alert('Nu există un wallet Sui conectat! Conectează-l mai întâi.');
        return;
      }
      if (!amount) {
        alert('Introdu un amount înainte de a da Mint pe Sui!');
        return;
      }

      const PKG_ID = '0xb05fe02db7af74d59bb11bff2362e6f00d1f388c5e36a12ee5de86a9f5128a94';
      const ADMIN_CAP_ID = '0x42b96249e3f185a8f7733542afcce7868d1f223aa1bd90385bcb00821564159c';

      console.log('[Mint Sui] Apel moveCall la IBT::mint...');
      const result = await signAndExecuteTransaction(
        {
          packageObjectId: PKG_ID,
          module: 'IBT',
          function: 'mint',
          typeArguments: [],
          arguments: [ADMIN_CAP_ID, amount, currentSuiAccount.address],
          gasBudget: 20_000_000,
        },
        'moveCall' 
      );

      console.log('[Mint Sui] Rezultat raw:', result);
      alert('[Mint Sui] Finalizat. Verifică wallet-ul și explore-ul.');
      

      const newBalances = await suiClient.getAllBalances({
        owner: currentSuiAccount.address,
      });
      console.log('[Mint Sui] Balanțe după mint:', newBalances);
    } catch (err) {
      console.error('[Mint Sui] Eroare:', err);
      alert('[Mint Sui] Eroare:\n' + JSON.stringify(err));
    }
  }

  async function handleBurnSui() {
    try {
      if (!currentSuiAccount) {
        alert('Nu există un wallet Sui conectat! Conectează-l mai întâi.');
        return;
      }
      if (!amount) {
        alert('Introdu un amount înainte de a da Burn pe Sui!');
        return;
      }


      const coinId = prompt('Introdu ID-ul coin-ului IBT care are >= amount:');
      if (!coinId) {
        alert('Nu ai introdus niciun coin ID, Burn anulat.');
        return;
      }

      const PKG_ID = '0xb05fe02db7af74d59bb11bff2362e6f00d1f388c5e36a12ee5de86a9f5128a94';
      const ADMIN_CAP_ID = '0x42b96249e3f185a8f7733542afcce7868d1f223aa1bd90385bcb00821564159c';

      console.log('[Burn Sui] Apel transaction cu SplitCoin + burn...');
      const result = await signAndExecuteTransaction(
        {
          kind: 'transaction',
          data: {
            transactions: [
              {
                SplitCoin: {
                  coin: coinId,
                  amount: Number(amount),
                },
              },
              {
                MoveCall: {
                  package: PKG_ID,
                  module: 'IBT',
                  function: 'burn',
                  typeArguments: [],
                  arguments: [
                    ADMIN_CAP_ID,
                    { kind: 'Result', index: 0 }, 
                  ],
                },
              },
            ],
            gasBudget: 20_000_000,
          },
        },
        'transaction' 
      );

      console.log('[Burn Sui] Rezultat raw:', result);
      alert('[Burn Sui] Finalizat. Verifică wallet-ul și explore-ul.');

      const newBalances = await suiClient.getAllBalances({
        owner: currentSuiAccount.address,
      });
      console.log('[Burn Sui] Balanțe după burn:', newBalances);
    } catch (err) {
      console.error('[Burn Sui] Eroare:', err);
      alert('[Burn Sui] Eroare:\n' + JSON.stringify(err));
    }
  }

  async function handleCheckIbtObjects() {
    try {
      if (!currentSuiAccount) {
        alert('No Sui wallet connected!');
        return;
      }
  
  
      const result = await suiClient.getOwnedObjects({
        owner: currentSuiAccount.address,
        filter: {
          StructType: "0x2::coin::Coin<0xb05fe02db7af74d59bb11bff2362e6f00d1f388c5e36a12ee5de86a9f5128a94::IBT::IBT>"
        },
        options: {
          showType: true,
          showContent: true,
          showOwner: true,
        },
      });
  
  
      const ibtObjectsInfo = result.data.map((obj) => {
        const { objectId, type, content } = obj.data;
      
     
        if (!content || content.dataType !== 'moveObject') {
          return { objectId, type, balance: 'Not a move object', owner: obj.data.owner };
        }
    
        const balance = content.fields.balance;
      
        return {
          objectId,
          type,
          balance,
          owner: obj.data.owner,
        };
      });
  
  
      alert(`Found ${ibtObjectsInfo.length} IBT objects. See console for details.`);

      console.log("Formatted IBT Objects:", ibtObjectsInfo);
      
    } catch (err) {
      console.error('Error checking IBT objects:', err);
      alert('Error checking IBT objects: ' + err.message);
    }
  }
  

  async function handleCheckSuiBalances() {
    try {
      if (!currentSuiAccount) {
        alert('Nu există un wallet Sui conectat!');
        return;
      }
      const balances = await suiClient.getAllBalances({
        owner: currentSuiAccount.address,
      });
      console.log('Balanțe Sui:', balances);
      alert('Balanțe:\n' + JSON.stringify(balances, null, 2));
    } catch (err) {
      console.error('Eroare la getAllBalances:', err);
      alert('Nu am putut obține balanțele. Vezi consola.');
    }
  }


  return (
    <div style={{ margin: '1rem' }}>
      <h1>IBT Bridge DApp - dAppKit 0.14.47</h1>

      <EthConnect onProviderChange={setEthProvider} onAccountChange={setEthAccount} />
    
      <SuiConnect />

      <div style={{ marginTop: '1rem' }}>
        <label>Contract address (ETH):</label>
        <input
          style={{ width: 400, marginLeft: '0.5rem' }}
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label>Amount:</label>
        <input
          style={{ width: 100, marginLeft: '0.5rem' }}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button onClick={handleMintEth} style={{ marginRight: '1rem' }}>Mint (ETH)</button>
        <button onClick={handleBurnEth} style={{ marginRight: '1rem' }}>Burn (ETH)</button>
        <button onClick={handleMintSui} style={{ marginRight: '1rem' }}>Mint (SUI)</button>
        <button onClick={handleBurnSui} style={{ marginRight: '1rem' }}>Burn (SUI)</button>
        <button onClick={handleCheckSuiBalances} style={{ marginRight: '1rem' }}>Check Sui Balances</button>
        <button onClick={handleCheckIbtObjects}>Check Sui IBT Object</button>
      </div>

      <hr style={{ margin: '2rem 0' }} />
      <BridgeForm ethProvider={ethProvider} ethAccount={ethAccount} />

      <p>Sui Wallet: {currentSuiAccount?.address || '(not connected)'}</p>
    </div>
  );
}

export default App;
