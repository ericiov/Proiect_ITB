import React, { useState } from 'react'
import { useWalletKit } from '@mysten/dapp-kit'          // pentru conectarea la Sui
import { TransactionBlock } from '@mysten/sui.js/transactions'

function SuiMintButton() {
  // Amount-ul pe care vrei să îl emiți
  const [amount, setAmount] = useState('100000000000')

  // Rezultatul tranzacției (pentru debug/log)
  const [txResult, setTxResult] = useState(null)

  // Obținem metode de semnare + contul curent
  const { signAndExecuteTransactionBlock, currentAccount } = useWalletKit()

  // Valorile necesare pentru apel
  const packageId = '0xb05fe02db7af74d59bb11bff2362e6f00d1f388c5e36a12ee5de86a9f5128a94'
  const treasuryCap = '0x42b96249e3f185a8f7733542afcce7868d1f223aa1bd90385bcb00821564159c'
  const recipient = '0x6d3bbafa9df8e408c01f44f620cb73bf7acd95f62627f57be548748d2f396479'
  // poți să folosești `currentAccount?.address || recipient`, dacă vrei să mapezi minted IBT la userul conectat

  async function handleSuiMint() {
    try {
      // Creăm un nou TransactionBlock
      const tx = new TransactionBlock()

      // moveCall: indicăm modulul, funcția, argumentele
      tx.moveCall({
        // format: `packageId::ModuleName::function_name`
        target: `${packageId}::IBT::mint`,
        // dacă funcția nu are typeParams, lăsăm array gol
        typeArguments: [],
        // argumentele efective
        arguments: [
          tx.object(treasuryCap), // <&mut TreasuryCap<IBT>>
          tx.pure(Number(amount)), // <u64>
          tx.pure(recipient),      // <address>
        ],
      })

      // setăm un gasBudget (echivalent cu --gas-budget)
      tx.setGasBudget(20_000_000)

      // Semnăm și executăm
      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,     // pentru a vedea efectele
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
