import React, { useState } from 'react';
import {
  ConnectButton,
  useSuiClient,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

const PKG_ID = "0xb05fe02db7af74d59bb11bff2362e6f00d1f388c5e36a12ee5de86a9f5128a94";
const TREASURY_CAP_ID = "0x42b96249e3f185a8f7733542afcce7868d1f223aa1bd90385bcb00821564159c";
const ADDRESS = "0x6d3bbafa9df8e408c01f44f620cb73bf7acd95f62627f57be548748d2f396479";

function SuiMintButton() {
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
  const [amount, setAmount] = useState(''); 
  const currentAccount = useCurrentAccount();

  const handleMint = async () => {
    try {
      const tx = new Transaction();
      
      const amountInSmallestUnit = BigInt(parseFloat(amount) * 1_000_000_000);

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
      setDigest(result.digest);
    } catch (error) {
      console.error("Error minting IBT:", error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {currentAccount && (
        <>
          <div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={handleMint}>Mint (SUI)</button>
          </div>
        </>
      )}
    </div>
  );
}

export default SuiMintButton;
