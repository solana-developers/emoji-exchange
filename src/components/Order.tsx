import { FC, useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { OrderType } from '../utils/const';
import * as service from '../utils/service';

interface emojiProps {
  emoji: string,
  display: string,
  price: string,
  balance: number,
}

export const Order: FC<emojiProps> = (emojiProps: emojiProps) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [amount, setAmount] = useState('')

  const onClickOrder = useCallback(async (form) => {
    console.log(form.emoji);
    console.log(form.type);
    console.log(form.amount);
    // await service.placeOrder(
    //   await service.loadMasterWallet(),
    //   useWallet(),
    //   form.emoji,
    //   form.type,
    //   form.amount,
    // );
  }, [publicKey, connection, sendTransaction]);

  return (
    <div>
      <span style={{fontSize: "32px"}}>{emojiProps.display}</span>

      <span style={{fontSize: "20px", marginLeft: "1.25em", marginRight: "0.75em"}}>{emojiProps.price}</span>

      <span style={{fontSize: "20px", marginLeft: "1.25em", marginRight: "0.75em"}}>{emojiProps.balance}</span>

      <input 
        type="number" 
        className="input input-bordered max-w-xs m-2" 
        placeholder="Amount"
        onChange={(e) => setAmount(e.target.value)}
      />
      
      <button
        className="px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
        onClick={() => onClickOrder({emoji: emojiProps.display, type: OrderType.BUY, amount: Number(amount)})}>
          <span>Buy</span>
      </button>
      <button
        className="px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
        onClick={() => onClickOrder({emoji: emojiProps.display, type: OrderType.SELL, amount: Number(amount)})}>
          <span>Sell</span>
      </button>
    </div>
  )
}