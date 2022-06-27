import * as anchor from "@project-serum/anchor";
import { IdlTypeDefTyEnum } from "@project-serum/anchor/dist/cjs/idl";
// ** Comment this to use solpg imported IDL **
import { EmojiExchange } from "../target/types/emoji_exchange";



describe("emoji-exchange", async () => {

  // Constants

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  // ** Un-comment this to use solpg imported IDL **
  // const program = new anchor.Program(
  //   require("../solpg/idl.json"), 
  //   new anchor.web3.PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"),
  // );
  // ** Comment this to use solpg imported IDL **
  const program = anchor.workspace.EmojiExchange as anchor.Program<EmojiExchange>;

  const emojisList = [
    "emoji_1", "emoji_2", "emoji_3", "emoji_4",
    "emoji_5", "emoji_6", "emoji_7", "emoji_8"
  ];
  const masterAccountSeed = "_master_";
  const userAccountSeed = "_user_";
  const masterStartingBalance = 40;

  enum OrderType { BUY, SELL };

  // Sleep function
  function sleep(seconds: number) {
    return new Promise( resolve => setTimeout(resolve, seconds * 1000) );
  }
  // Rand emoji function
  function getRandomEmojiIndex() {
    return Math.floor(Math.random() * (emojisList.length + 1));
  }

  // Gives us a new keypair each run
  async function primeNewAccount() {
    let keypair = anchor.web3.Keypair.generate();
    await anchor.AnchorProvider.env().connection.requestAirdrop(
        keypair.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
    )
    await sleep(3);
    return keypair;
  }

  // Function to create a PDA with our program
  async function createEmojiAccount(
    signer: anchor.web3.Keypair,
    accountTypeSeed: string,
    emojiSeed: string,
    starting_balance: number,
  ) {
    console.log(
      `Creating ${accountTypeSeed} PDA for ${signer.publicKey} for ${emojiSeed}`
    );
    let [emojiAccountAddress, _emojiAccountBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        signer.publicKey.toBuffer(),
        Buffer.from(accountTypeSeed),
        Buffer.from(emojiSeed),
      ],
      program.programId
    );
    await program.methods.createEmojiAccount(
      accountTypeSeed,
      emojiSeed,
      starting_balance
    )
    .accounts({
      emojiAccount: emojiAccountAddress,
      wallet: signer.publicKey,
    })
    .signers([signer])
    .rpc()
    console.log(`Success. PDA is ${emojiAccountAddress}`);
    return emojiAccountAddress;
  }

  // Function to place an order with our program
  async function placeOrder(
    orderType: OrderType,
    emoji: string,
    amount: number,
    masterWallet: anchor.web3.Keypair,
    testWallet: anchor.web3.Keypair,
  ) {
    let orderTypeString: string;
    let orderTypePayload: Object;
    if (orderType == OrderType.BUY) {
      orderTypeString = "buy";
      orderTypePayload = { buy: {}};
    } else {
      orderTypeString = "sell";
      orderTypePayload = { sell: {}};
    }
    console.log(`Request to ${orderTypeString} ${amount} emojis of type: ${emoji}`);
    let [masterEmojiPda, _masterBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        masterWallet.publicKey.toBuffer(),
        Buffer.from(masterAccountSeed), 
        Buffer.from(emoji),
      ],
      program.programId
    );
    let [userEmojiPda, _userBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        testWallet.publicKey.toBuffer(),
        Buffer.from(userAccountSeed), 
        Buffer.from(emoji),
      ],
      program.programId
    )
    await program.methods.placeOrder(
      orderTypePayload, amount
    )
    .accounts({
      masterEmoji: masterEmojiPda,
      userEmoji: userEmojiPda,
    })
    .rpc();
    console.log("Success.");
  }

  // Tests.

  it("Testing out a few sales", async () => {

    const master = await primeNewAccount();
    console.log(`Master wallet will be : ${master.publicKey}`)

    let emojiOrderbook = [];
    let testWallet: anchor.web3.Keypair;
    let testEmojiPda: anchor.web3.PublicKey;
    let emojiIndex: number;
    let emoji: string;

    for (var emojiSeed of emojisList) {
      emojiOrderbook.push(await createEmojiAccount(
        master, masterAccountSeed, emojiSeed, masterStartingBalance
      ));
    }

    const simp1 = await primeNewAccount();
    console.log(`Simp #1 wallet will be : ${simp1.publicKey}`);
    testWallet = simp1;
    emojiIndex = getRandomEmojiIndex();
    emoji = emojisList[emojiIndex];
    // TODO: For now we are initializing the user accounts manually
    testEmojiPda = await createEmojiAccount(testWallet, userAccountSeed, emoji, 0);
    await placeOrder(OrderType.BUY, emoji, 3, master, testWallet);
    await placeOrder(OrderType.SELL, emoji, 2, master, testWallet);
    await placeOrder(OrderType.BUY, emoji, 1, master, testWallet);
    
    const simp2 = await primeNewAccount();
    console.log(`Simp #2 wallet will be : ${simp2.publicKey}`);
    testWallet = simp2;
    emojiIndex = getRandomEmojiIndex();
    emoji = emojisList[emojiIndex];
    // TODO: For now we are initializing the user accounts manually
    testEmojiPda = await createEmojiAccount(testWallet, userAccountSeed, emoji, 0);
    await placeOrder(OrderType.BUY, emoji, 1, master, testWallet);
    await placeOrder(OrderType.SELL, emoji, 1, master, testWallet);
    emojiIndex = getRandomEmojiIndex();
    emoji = emojisList[emojiIndex];
    // TODO: For now we are initializing the user accounts manually
    testEmojiPda = await createEmojiAccount(testWallet, userAccountSeed, emoji, 0);
    await placeOrder(OrderType.BUY, emoji, 1, master, testWallet);
    
    const simp3 = await primeNewAccount();
    console.log(`Simp #3 wallet will be : ${simp3.publicKey}`);
    testWallet = simp3;
    emojiIndex = getRandomEmojiIndex();
    emoji = emojisList[emojiIndex];
    // TODO: For now we are initializing the user accounts manually
    testEmojiPda = await createEmojiAccount(testWallet, userAccountSeed, emoji, 0);
    await placeOrder(OrderType.BUY, emoji, 2, master, testWallet);
    await placeOrder(OrderType.SELL, emoji, 3, master, testWallet);
    await placeOrder(OrderType.BUY, emoji, 1, master, testWallet);
    
  });
});
