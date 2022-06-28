import * as anchor from "@project-serum/anchor";
import { assert } from "chai";
import { EmojiExchange } from "../target/types/emoji_exchange";


describe("Emoji Exchange Tests", async () => {

    // Store PDAs created

    let userPdasList = [];
    let masterPdasList = [];

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

    function convertEnumToString(variant: OrderType) {
        if (variant == OrderType.BUY) {
            return "BUY";
        }
        return "SELL";
    };

    function convertEnumToAnchorPayload(variant: OrderType) {
        if (variant == OrderType.BUY) {
            return { buy: {} };
        }
        return { sell: {} };
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
    ) {
        let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
            [
            walletPubkey.toBuffer(),
            Buffer.from(accountTypeSeed), 
            Buffer.from(emojiSeed),
            ],
            program.programId
        );
        return pda;
    };

    async function printStoreBalances() {
        console.log("-------------------------------------------------------------------------------");
        console.log("Store:");
        for (var pda of masterPdasList) {
            let data = await program.account.masterEmoji.fetch(pda);
            console.log(`   ${data.authority.toString().substring(0, 5)} : ${data.name} : ${data.balance} : ${data.price / anchor.web3.LAMPORTS_PER_SOL} SOL`);
        };
        console.log("-------------------------------------------------------------------------------");
    }

    async function printCustomerBalances() {
        console.log("-------------------------------------------------------------------------------");
        console.log("Customers:");
        for (var pda of userPdasList) {
            let data = await program.account.userEmoji.fetch(pda);
            console.log(`   ${data.authority.toString().substring(0, 5)} : ${data.name} : ${data.balance}`);
        };
        console.log("-------------------------------------------------------------------------------");
    }

    // Transactions

    async function createEmojiAccount(
        pda: anchor.web3.PublicKey,
        accountTypeSeed: string,
        emojiSeed: string,
        wallet: anchor.web3.Keypair,
    ) {
        console.log("Creating PDA...");
        console.log(`   Wallet: ${wallet.publicKey}`);
        console.log(`   Type: ${accountTypeSeed}`);
        console.log(`   Emoji: ${emojiSeed}`);
        console.log(`   PDA: ${pda}`);
        if (accountTypeSeed == "_master_") {
            await program.methods.createMasterEmojiAccount(
                emojiSeed,
                masterStartingBalance,
                wallet.publicKey
            )
            .accounts({
                emojiAccount: pda,
                wallet: wallet.publicKey,
            })
            .signers([wallet])
            .rpc();
            masterPdasList.push(pda);
        } else {
            await program.methods.createUserEmojiAccount(
                emojiSeed,
                wallet.publicKey
            )
            .accounts({
                emojiAccount: pda,
                wallet: wallet.publicKey,
            })
            .signers([wallet])
            .rpc();
            userPdasList.push(pda);
        }
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
        );
        let testWalletPda = await derivePda(
            wallet.publicKey,
            userAccountSeed,
            emoji,
        );
        console.log("Placing order...");
        console.log(`   Wallet: ${wallet.publicKey}`);
        console.log(`   Type: ${convertEnumToString(orderType)}`);
        console.log(`   Amount: ${amount}`);
        console.log(`   Emoji: ${emoji}`);
        console.log(`   User PDA: ${testWalletPda}`);
        console.log(`   Master PDA: ${masterWalletPda}`);
        try{
            await program.account.userEmoji.fetch(testWalletPda) === null
         } catch (error) {
            await createEmojiAccount(
                testWalletPda,
                userAccountSeed,
                emoji,
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
        let masterWallet = await primeNewAccount();
        for (var emoji of emojisList) {
            let pda = await derivePda(
                masterWallet.publicKey,
                masterAccountSeed,
                emoji,
            );
            await createEmojiAccount(
                pda,
                masterAccountSeed,
                emoji,
                masterWallet,
            );
        };
        for (var masterPda of masterPdasList) {
            assert(
                await program.account.masterEmoji.fetch(masterPda) != null
            );
        };
        await printStoreBalances()
        await printCustomerBalances()
        
        console.log("====   Test a user buying & selling one emoji         ===");
        let testWallet = await primeNewAccount();
        let testEmoji = emojisList[0];
        await placeOrder(OrderType.BUY, testEmoji, 3, testWallet, masterWallet);
        await placeOrder(OrderType.SELL, testEmoji, 2, testWallet, masterWallet);
        await placeOrder(OrderType.BUY, testEmoji, 1, testWallet, masterWallet);
        let masterWalletPda = await derivePda(
            masterWallet.publicKey,
            masterAccountSeed,
            testEmoji,
        );
        let testWalletPda = await derivePda(
            testWallet.publicKey,
            userAccountSeed,
            testEmoji,
        );
        assert((await program.account.masterEmoji.fetch(masterWalletPda)).balance == masterStartingBalance - 2);
        assert((await program.account.userEmoji.fetch(testWalletPda)).balance == 2);
        await printStoreBalances()
        await printCustomerBalances()
        
        console.log("====   Test a user buying & selling multiple emojis   ===");
        testWallet = await primeNewAccount();
        testEmoji = emojisList[6];
        await placeOrder(OrderType.BUY, testEmoji, 3, testWallet, masterWallet);
        await placeOrder(OrderType.SELL, testEmoji, 2, testWallet, masterWallet);
        masterWalletPda = await derivePda(
            masterWallet.publicKey,
            masterAccountSeed,
            testEmoji,
        );
        testWalletPda = await derivePda(
            testWallet.publicKey,
            userAccountSeed,
            testEmoji,
        );
        assert((await program.account.masterEmoji.fetch(masterWalletPda)).balance == masterStartingBalance - 1);
        assert((await program.account.userEmoji.fetch(testWalletPda)).balance == 1);
        await printStoreBalances()
        await printCustomerBalances()
        testEmoji = emojisList[3];
        await placeOrder(OrderType.BUY, testEmoji, 5, testWallet, masterWallet);
        await placeOrder(OrderType.SELL, testEmoji, 1, testWallet, masterWallet);
        masterWalletPda = await derivePda(
            masterWallet.publicKey,
            masterAccountSeed,
            testEmoji,
        );
        testWalletPda = await derivePda(
            testWallet.publicKey,
            userAccountSeed,
            testEmoji,
        );
        assert((await program.account.masterEmoji.fetch(masterWalletPda)).balance == masterStartingBalance - 4);
        assert((await program.account.userEmoji.fetch(testWalletPda)).balance == 4);
        await printStoreBalances()
        await printCustomerBalances()
    });
});