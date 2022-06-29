import { FC, useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

interface emojiProps {
  emojiId: string,
  emoji: string,
  price: string,
}

export const Order: FC<emojiProps> = (emojiProps: emojiProps) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [amount, setAmount] = useState('')

  const onClickOrder = useCallback(async (form) => {
    console.log(form.amount);
    console.log(form.type);
  }, [publicKey, connection, sendTransaction]);

  return (
    <div>
      <span style={{fontSize: "32px"}}>{emojiProps.emoji}</span>

      <span style={{fontSize: "20px", marginLeft: "1.25em", marginRight: "0.75em"}}>{emojiProps.price}</span>

      <input 
        type="number" 
        className="input input-bordered max-w-xs m-2" 
        placeholder="Amount"
        onChange={(e) => setAmount(e.target.value)}
      />
      
      <button
        className="px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
        onClick={() => onClickOrder({amount: Number(amount), type: "buy"})}>
          <span>Buy</span>
      </button>
      <button
        className="px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
        onClick={() => onClickOrder({amount: Number(amount), type: "sell"})}>
          <span>Sell</span>
      </button>
    </div>
  )
}