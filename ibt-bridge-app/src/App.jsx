import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Contract, parseEther } from 'ethers'
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useSuiClient,
} from '@mysten/dapp-kit'
import EthConnect from './components/EthConnect'
import SuiConnect from './components/SuiConnect'
import BridgeForm from './components/BridgeForm'
import SuiMintButton from './components/SuiMintButton'
import SuiBurnButton from './components/SuiBurnButton'
const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const ibtAbi = [
  'function mint(address to, uint256 amount) external',
  'function burn(address from, uint256 amount) external',
  'function balanceOf(address owner) view returns (uint256)',
]

function App() {
  const [ethProvider, setEthProvider] = useState(null)
  const [ethAccount, setEthAccount] = useState('')
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS)
  const [amount, setAmount] = useState('')
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const currentSuiAccount = useCurrentAccount()
  const suiClient = useSuiClient()

  async function handleMintEth() {
    try {
      if (!ethProvider) {
        alert('Nu ai provider Ethereum! Conectează-te cu MetaMask mai întâi.')
        return
      }
      const signer = await ethProvider.getSigner()
      const contract = new Contract(contractAddress, ibtAbi, signer)
      const tx = await contract.mint(ethAccount, parseEther(amount))
      await tx.wait()
      alert(`Mint ETH reușit: ${amount} IBT către ${ethAccount}.`)
    } catch (err) {
      console.error('[Mint ETH] Eroare:', err)
      alert(`[Mint ETH] Eroare: ${err.message}`)
    }
  }

  async function handleBurnEth() {
    try {
      if (!ethProvider) {
        alert('Nu ai provider Ethereum! Conectează-te cu MetaMask mai întâi.')
        return
      }
      const signer = await ethProvider.getSigner()
      const contract = new Contract(contractAddress, ibtAbi, signer)
      const tx = await contract.burn(ethAccount, parseEther(amount))
      await tx.wait()
      alert(`Burn ETH reușit: ${amount} IBT din contul ${ethAccount}.`)
    } catch (err) {
      console.error('[Burn ETH] Eroare:', err)
      alert(`[Burn ETH] Eroare: ${err.message}`)
    }
  }

  async function handleCheckIbtObjects() {
    try {
      if (!currentSuiAccount) {
        alert('No Sui wallet connected!')
        return
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
      })
      const ibtObjectsInfo = result.data.map((obj) => {
        const { objectId, type, content } = obj.data
        if (!content || content.dataType !== 'moveObject') {
          return { objectId, type, balance: 'Not a move object', owner: obj.data.owner }
        }
        const balance = content.fields.balance
        return {
          objectId,
          type,
          balance,
          owner: obj.data.owner,
        }
      })
      alert(`Found ${ibtObjectsInfo.length} IBT objects. See console for details.`)
      console.log("Formatted IBT Objects:", ibtObjectsInfo)
    } catch (err) {
      console.error('Error checking IBT objects:', err)
      alert('Error checking IBT objects: ' + err.message)
    }
  }

  async function handleCheckSuiBalances() {
    try {
      if (!currentSuiAccount) {
        alert('Nu există un wallet Sui conectat!')
        return
      }
      const balances = await suiClient.getAllBalances({
        owner: currentSuiAccount.address,
      })
      console.log('Balanțe Sui:', balances)
      alert('Balanțe:\n' + JSON.stringify(balances, null, 2))
    } catch (err) {
      console.error('Eroare la getAllBalances:', err)
      alert('Nu am putut obține balanțele. Vezi consola.')
    }
  }

  return (
    <div className="container bg-dark text-light p-4" style={{ minHeight: '100vh' }}>
      <h1 className="text-center mb-4">IBT Bridge APP</h1>
      <h2 className="mb-3">Connect to Wallets</h2>
      <EthConnect onProviderChange={setEthProvider} onAccountChange={setEthAccount} />
      <SuiConnect />
      <div className="mb-3">
        <label className="form-label">Contract address (ETH):</label>
        <input
          className="form-control bg-secondary text-light"
          style={{ width: 400 }}
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
        />
      </div>
      <hr className="my-4" />
      <h2 className="mb-3">ETH IBT Coin</h2>
      <div className="mb-3">
        <label className="form-label">Amount:</label>
        <input
          className="form-control bg-secondary text-light"
          style={{ width: 100 }}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <button className="btn btn-primary me-2" onClick={handleMintEth}>Mint (ETH)</button>
        <button className="btn btn-danger me-2" onClick={handleBurnEth}>Burn (ETH)</button>
        <hr className="my-4" />
        <h2 className="mb-3">SUI IBT Coin</h2>
        <SuiMintButton />
        <SuiBurnButton />
        <button className="btn btn-warning me-2" onClick={handleCheckSuiBalances}>Check Sui Balances</button>
        <button className="btn btn-info" onClick={handleCheckIbtObjects}>Check Sui IBT Object</button>
      </div>
      <hr className="my-4" />
      <BridgeForm ethProvider={ethProvider} ethAccount={ethAccount} />
    </div>
  )
}

export default App
