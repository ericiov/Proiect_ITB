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

function SuiBurnButton() {
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
  const [burnAmount, setBurnAmount] = useState(''); 
  const currentAccount = useCurrentAccount();

  const handleBurn = async () => {
    try {
      if (!currentAccount) {
        alert('No Sui wallet connected!');
        return;
      }

      const IBT_TYPE = "0x2::coin::Coin<0xb05fe02db7af74d59bb11bff2362e6f00d1f388c5e36a12ee5de86a9f5128a94::IBT::IBT>";
      const { data: ibtObjects } = await client.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: IBT_TYPE },
        options: { showType: true, showContent: true, showOwner: true },
      });

      let selectedObject = null;

      const amountInSmallestUnit = BigInt(parseFloat(burnAmount) * 1_000_000_000);

      for (const obj of ibtObjects) {
        const { content } = obj.data;
        if (content && content.dataType === 'moveObject') {
          const balance = BigInt(content.fields.balance);
          if (balance >= amountInSmallestUnit) {
            selectedObject = obj;
            break;
          }
        }
      }

      if (!selectedObject) {
        alert('Not enough balance to burn the specified amount.');
        return;
      }

      const tx = new Transaction();
      const [burnCoin, remainingCoin] = tx.splitCoins(
        selectedObject.data.objectId,
        [tx.pure.u64(amountInSmallestUnit)]
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
     
    } catch (error) {
      console.error("Error burning IBT:", error);
      alert('Error burning IBT: ' + error.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {currentAccount && (
        <>
          <div>
            <input
              type="number"
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
            />
            <button onClick={handleBurn}>Burn (SUI)</button>
          </div>
        </>
      )}
    </div>
  );
}

export default SuiBurnButton;
