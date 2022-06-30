import { FC, useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Order } from './Order';
import * as anchor from "@project-serum/anchor";
import * as service from '../utils/service';
import * as constants from '../utils/const';

export const EmojiExchange: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [amount, setAmount] = useState('')
  const [user, setUser] = useState('')
  const [init, setInit] = useState(false)

  const [store, setStore] = useState([])
  const [masterWallet, setMasterWallet] = useState(new anchor.web3.Keypair())

  const loadStore = async () => {
    setMasterWallet(await service.loadMasterWallet());
    let s = [];
    for (var e of constants.EMOJIS_LIST) {
      let price = await service.getEmojiPrice(
        masterWallet.publicKey, e.emoji
      );
      let balance = await service.getStoreBalanceForEmoji(
        masterWallet.publicKey, e.emoji
      );
      s.push({
        emoji: e.emoji,
        display: e.display,
        price: price,
        balance: balance,
      });
    };
    setStore(s);
  }

  useEffect(() => {
    loadStore();
  }, []);

  const onClickOrder = useCallback(async (form) => {
    console.log(form.amount);
    console.log(form.type);
  }, [publicKey, connection, sendTransaction]);

  const onClickInit = useCallback(async (form) => {
    console.log(form.user);
    await service.createUserMetadataAccount(publicKey, form.user, masterWallet);
    setInit(true);
  }, [publicKey, connection, sendTransaction]);

  return (
    <div className="my-6">
      {init ? 
        <div>
          <Order emoji={store[0].emoji} display={store[0].display} price={store[0].price} balance={store[0].balance} />
          <Order emoji={store[1].emoji} display={store[1].display} price={store[1].price} balance={store[1].balance} />
          <Order emoji={store[2].emoji} display={store[2].display} price={store[2].price} balance={store[2].balance} />
          <Order emoji={store[3].emoji} display={store[3].display} price={store[3].price} balance={store[3].balance} />
          <Order emoji={store[4].emoji} display={store[4].display} price={store[4].price} balance={store[4].balance} />
          <Order emoji={store[5].emoji} display={store[5].display} price={store[5].price} balance={store[5].balance} />
          <Order emoji={store[6].emoji} display={store[6].display} price={store[6].price} balance={store[6].balance} />
          <Order emoji={store[7].emoji} display={store[7].display} price={store[7].price} balance={store[7].balance} />
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