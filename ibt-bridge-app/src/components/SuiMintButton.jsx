import React, { useState } from 'react'
import { useWalletKit } from '@mysten/dapp-kit'          // pentru conectarea la Sui
import { TransactionBlock } from '@mysten/sui.js/transactions'

function SuiMintButton() {
  const [amount, setAmount] = useState('100000000000')

  
  const [txResult, setTxResult] = useState(null)

  const { signAndExecuteTransactionBlock, currentAccount } = useWalletKit()

  const packageId = '0xb05fe02db7af74d59bb11bff2362e6f00d1f388c5e36a12ee5de86a9f5128a94'
  const treasuryCap = '0x42b96249e3f185a8f7733542afcce7868d1f223aa1bd90385bcb00821564159c'
  const recipient = '0x6d3bbafa9df8e408c01f44f620cb73bf7acd95f62627f57be548748d2f396479'

  async function handleSuiMint() {
    try {
      const tx = new TransactionBlock()

      tx.moveCall({
        target: `${packageId}::IBT::mint`,
        typeArguments: [],
        arguments: [
          tx.object(treasuryCap), 
          tx.pure(Number(amount)),
          tx.pure(recipient),      
        ],
      })

      tx.setGasBudget(20_000_000)

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,    
          showBalanceChanges: true,
        },
      })

      console.log('Mint IBT result:', result)
      setTxResult(result)
      alert('Mint reușit pe Sui!')
    } catch (err) {
      console.error('Eroare la mint pe Sui:', err)
      alert(`Eroare la mint pe Sui: ${err}`)
    }
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Mint IBT pe Sui</h3>
      <div>
        <label>Amount de mint: </label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ marginRight: '1rem' }}
        />
        <button onClick={handleSuiMint}>Mint on Sui</button>
      </div>

      {txResult && (
        <div style={{ marginTop: '1rem' }}>
          <pre>{JSON.stringify(txResult, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default SuiMintButton
