import * as anchor from "@project-serum/anchor";
import { assert } from "chai";
import { EmojiExchange } from "../target/types/emoji_exchange";


// Anchor

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.EmojiExchange as anchor.Program<EmojiExchange>;

// App constants (simulated)

const emojisList = [
    "emoji_1", "emoji_2", "emoji_3", "emoji_4",
    "emoji_5", "emoji_6", "emoji_7", "emoji_8"
];
const masterAccountSeed = "_master_";
const userAccountSeed = "_user_";
const masterStartingBalance = 40;

enum OrderType { 
    BUY, 
    SELL 
};

// Helpers

function convertEnumToAnchorPayload(variant: OrderType) {
    if (variant == OrderType.BUY) {
        return { buy: {} };
    }
    return { sell: {} };
};

function getRandomEmoji() {
    return emojisList[Math.floor(Math.random() * (emojisList.length))];
};

async function primeNewAccount() {
    let keypair = anchor.web3.Keypair.generate();
    await provider.connection.requestAirdrop(
        keypair.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise( resolve => setTimeout(resolve, 3 * 1000) ); // Sleep 3 s
    return keypair;
};

async function derivePda(
    walletPubkey: anchor.web3.PublicKey,
    accountTypeSeed: string,
    emojiSeed: string,
    programId: anchor.web3.PublicKey,
) {
    let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
        [
          walletPubkey.toBuffer(),
          Buffer.from(accountTypeSeed), 
          Buffer.from(emojiSeed),
        ],
        programId
    );
    return pda;
};


describe("Emoji Exchange Tests", async () => {

    // Transactions

    async function createEmojiAccount(
        pda: anchor.web3.PublicKey,
        accountTypeSeed: string,
        emojiSeed: string,
        starting_balance: number,
        wallet: anchor.web3.Keypair,
    ) {
        console.log("Creating PDA...");
        console.log(`   Wallet: ${wallet.publicKey}`);
        console.log(`   Type: ${accountTypeSeed}`);
        console.log(`   Emoji: ${emojiSeed}`);
        console.log(`   PDA: ${pda}`);
        await program.methods.createEmojiAccount(
            accountTypeSeed,
            emojiSeed,
            starting_balance
        )
        .accounts({
            emojiAccount: pda,
            wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc();
        console.log("Success.");
    };

    async function placeOrder(
        orderType: OrderType,
        emoji: string,
        amount: number,
        wallet: anchor.web3.Keypair,
        master: anchor.web3.Keypair,
    ) {
        let masterWalletPda = await derivePda(
            master.publicKey,
            masterAccountSeed,
            emoji,
            program.programId,
        );
        let testWalletPda = await derivePda(
            wallet.publicKey,
            userAccountSeed,
            emoji,
            program.programId,
        );
        console.log("Placing order...");
        console.log(`   Wallet: ${wallet.publicKey}`);
        console.log(`   Type: ${orderType}`);
        console.log(`   Emoji: ${emoji}`);
        console.log(`   User PDA: ${testWalletPda}`);
        console.log(`   Master PDA: ${masterWalletPda}`);
        try{
            await program.account.emoji.fetch(testWalletPda) === null
         } catch (error) {
            await createEmojiAccount(
                testWalletPda,
                userAccountSeed,
                emoji,
                0,
                wallet,
            );
        };
        await program.methods.placeOrder(
            convertEnumToAnchorPayload(orderType),
            amount
        )
        .accounts({
            masterEmoji: masterWalletPda,
            userEmoji: testWalletPda,
        })
        .rpc();
        console.log("Success.");
    };

    // Tests

    it("Testing out the PDAs", async () => {

        console.log("====   Testing initializing of master PDAs            ===");

        let masterPdasList = [];
        let masterWallet = await primeNewAccount();
        
        for (var emoji of emojisList) {
            let pda = await derivePda(
                masterWallet.publicKey,
                masterAccountSeed,
                emoji,
                program.programId,
            );
            await createEmojiAccount(
                pda,
                masterAccountSeed,
                emoji,
                masterStartingBalance,
                masterWallet,
            );
            masterPdasList.push(pda);
        };
        for (var masterPda of masterPdasList) {
            assert(
                await program.account.emoji.fetch(masterPda) != null
            );
        };
        
        console.log("====   Test a user buying & selling one emoji         ===");

        const testWallet = await primeNewAccount();
        let testEmoji = getRandomEmoji();
        await placeOrder(OrderType.BUY, testEmoji, 3, testWallet, masterWallet);
        await placeOrder(OrderType.SELL, testEmoji, 2, testWallet, masterWallet);
        await placeOrder(OrderType.BUY, testEmoji, 1, testWallet, masterWallet);
        let masterWalletPda = await derivePda(
            masterWallet.publicKey,
            masterAccountSeed,
            testEmoji,
            program.programId,
        );
        let testWalletPda = await derivePda(
            testWallet.publicKey,
            userAccountSeed,
            testEmoji,
            program.programId,
        );
        assert((await program.account.emoji.fetch(masterWalletPda)).balance == masterStartingBalance - 2);
        assert((await program.account.emoji.fetch(testWalletPda)).balance == 2);
        
        console.log("====   Test a user buying & selling multiple emojis   ===");

        testEmoji = getRandomEmoji();
        await placeOrder(OrderType.BUY, testEmoji, 3, testWallet, masterWallet);
        await placeOrder(OrderType.SELL, testEmoji, 2, testWallet, masterWallet);
        masterWalletPda = await derivePda(
            masterWallet.publicKey,
            masterAccountSeed,
            testEmoji,
            program.programId,
        );
        testWalletPda = await derivePda(
            testWallet.publicKey,
            userAccountSeed,
            testEmoji,
            program.programId,
        );
        assert((await program.account.emoji.fetch(masterWalletPda)).balance == masterStartingBalance - 1);
        assert((await program.account.emoji.fetch(testWalletPda)).balance == 1);
        
        testEmoji = getRandomEmoji();
        await placeOrder(OrderType.BUY, testEmoji, 5, testWallet, masterWallet);
        await placeOrder(OrderType.SELL, testEmoji, 1, testWallet, masterWallet);
        masterWalletPda = await derivePda(
            masterWallet.publicKey,
            masterAccountSeed,
            testEmoji,
            program.programId,
        );
        testWalletPda = await derivePda(
            testWallet.publicKey,
            userAccountSeed,
            testEmoji,
            program.programId,
        );
        assert((await program.account.emoji.fetch(masterWalletPda)).balance == masterStartingBalance - 4);
        assert((await program.account.emoji.fetch(testWalletPda)).balance == 4);
    });
});