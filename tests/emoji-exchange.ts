import * as anchor from "@project-serum/anchor";
import { Program, Wallet } from "@project-serum/anchor";
import { EmojiExchange } from "../target/types/emoji_exchange";

describe("emoji-exchange", () => {
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.EmojiExchange as Program<EmojiExchange>;
  const wallet = provider.wallet as Wallet;

  const EMOJI_EXCHANGE_PROGRAM_ID = new anchor.web3.PublicKey(
    "9WxF3Zm9G1CeTzdYxevQvH5eBYWUVjmn9mUynju5urYK"
  );

  enum orderType {BUY, SELL};

  const emojisList = [
    "emoji_1", "emoji_2", "emoji_3", "emoji_4",
    "emoji_5", "emoji_6", "emoji_7", "emoji_8"
  ];

  it("Is initialized!", async () => {

    let emojiOrderbooks = [];
    let userEmojiAccounts = [];

    // TODO: Need to figure out how to do bump

    // Create master PDAs
    for (var emojiSeed of emojisList) {
      const [pda, _] = await anchor.web3.PublicKey
        .findProgramAddress(
          [Buffer.from(emojiSeed + "_" + "master_emoji")],
          EMOJI_EXCHANGE_PROGRAM_ID
        );
      await program.methods.createMasterEmojiAccount(
        emojiSeed,
        new anchor.BN(40)
      )
      .accounts({
        masterEmoji: pda,
        wallet: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .rpc()
      emojiOrderbooks.push(pda);
    }

    // Create user account
    const [userPda, _] = await anchor.web3.PublicKey
        .findProgramAddress(
          [wallet.publicKey.toBuffer()],
          EMOJI_EXCHANGE_PROGRAM_ID
        );
    await program.methods.createUserAccount(
      "joe"
    )
    .accounts({
      user: userPda,
      wallet: wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .rpc();

    // Create user PDAs
    for (var emojiSeed of emojisList) {
      const [pda, _] = await anchor.web3.PublicKey
        .findProgramAddress(
          [Buffer.from(wallet.publicKey + "_" + emojiSeed)],
          EMOJI_EXCHANGE_PROGRAM_ID
        );
      await program.methods.createUserEmojiAccount(
        emojiSeed,
        new anchor.BN(40)
      )
      .accounts({
        userEmoji: pda,
        user: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .rpc();
      userEmojiAccounts.push(pda);
    }

    // Buy Emoji #1
    await program.methods.placeOrder(
      orderType.BUY, new anchor.BN(1)
    )
    .accounts({
      masterEmoji: emojiOrderbooks[0],
      userEmoji: userEmojiAccounts[0],
      authority: wallet.publicKey,
    })
    .rpc();

    // Sell Emoji #1
    await program.methods.placeOrder(
      orderType.SELL, new anchor.BN(1)
    )
    .accounts({
      masterEmoji: emojiOrderbooks[0],
      userEmoji: userEmojiAccounts[0],
      authority: wallet.publicKey,
    })
    .rpc();
  });
});
