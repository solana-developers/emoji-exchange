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

    // TODO: Need to figure out how to do bump

    // Create master PDAs
    for (var x of emojisList) {
      await program.methods.createMasterEmojiAccount(
        new anchor.BN(40) // TODO: Beginning balance
      )
      .accounts({
        masterEmoji: await anchor.web3.PublicKey
          .createWithSeed(
            wallet.publicKey,
            "master_emoji",
            EMOJI_EXCHANGE_PROGRAM_ID
          ),
        wallet: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .rpc()
    }

    // Create user account
    const userKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    await program.methods.createUserAccount(
      "joe" // TODO: Replace with user's entered name
    )
    .accounts({
      user: userKeypair.publicKey,
      wallet: wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .rpc();

    // Create user PDAs
    for (var x of emojisList) {
      await program.methods.createUserEmojiAccount(
        userKeypair.publicKey, new anchor.BN(40) // TODO: Beginning balance
      )
      .accounts({
        userEmoji: await anchor.web3.PublicKey
          .createWithSeed(
            userKeypair.publicKey,
            "user_emoji",
            EMOJI_EXCHANGE_PROGRAM_ID
          ),
        wallet: userKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .rpc();
    }

    // Place orders
    const masterEmoji1 = await anchor.web3.PublicKey
      .createWithSeed(
        wallet.publicKey,
        "master_emoji", // TODO: Bump #1
        EMOJI_EXCHANGE_PROGRAM_ID
      );
    const userEmoji1 = await anchor.web3.PublicKey
    .createWithSeed(
      wallet.publicKey,
      "user_emoji", // TODO: Bump #1
      EMOJI_EXCHANGE_PROGRAM_ID
    )

    // Buy Emoji #1
    await program.methods.placeOrder(
      orderType.BUY, new anchor.BN(1)
    )
    .accounts({
      masterEmoji: masterEmoji1,
      userEmoji: userEmoji1,
      authority: userEmoji1,
    })
    .rpc();

    // Sell Emoji #1
    await program.methods.placeOrder(
      orderType.SELL, new anchor.BN(1)
    )
    .accounts({
      masterEmoji: masterEmoji1,
      userEmoji: userEmoji1,
      authority: userEmoji1,
    })
    .rpc();
  });
});
