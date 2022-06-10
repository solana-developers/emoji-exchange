import { FC, useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Order } from './Order';

export const EmojiExchange: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [amount, setAmount] = useState('')
  const [user, setUser] = useState('')
  const [init, setInit] = useState(false)

  const onClickOrder = useCallback(async (form) => {
    console.log(form.amount);
    console.log(form.type);
  }, [publicKey, connection, sendTransaction]);

  const onClickInit = useCallback(async (form) => {
    console.log(form.user);
    setInit(true);
  }, [publicKey, connection, sendTransaction]);

  return (
    <div className="my-6">
      {init ? 
        <div>
          <Order emoji="😀"/>
          <Order emoji="👻"/>
          <Order emoji="🤡"/> 
          <Order emoji="🤠"/>
          <Order emoji="💸"/>
          <Order emoji="💪"/>
          <Order emoji="👀"/>
          <Order emoji="👑"/>
        </div> :
        <div>
          <input 
            type="text" 
            className="input input-bordered max-w-xs m-2" 
            placeholder="Username"
            onChange={(e) => setUser(e.target.value)}
          />
          
          <button
            className="px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
            onClick={() => onClickInit({user: user})}>
              <span>Initialize User</span>
          </button>
        </div>
        }
    </div>
  )
}