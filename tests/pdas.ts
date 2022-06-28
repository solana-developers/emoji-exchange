import * as anchor from "@project-serum/anchor";
import { EmojiExchange } from "../target/types/emoji_exchange";
import fs from 'mz/fs';
import { assert } from "chai";



describe("Emoji Exchange Tests", async () => {

    // Store PDAs created

    let usernamesList = [];
    let userMetadataPdasList = [];
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
    const priceAccountSeed = "_price_";
    const userAccountSeed = "_user_";
    const metadataAccountSeed = "_usermetadata_";
    const masterStartingBalance = 40;

    // Utils

    enum OrderType { 
        BUY, 
        SELL 
    };

    enum MasterWalletInit {
        GENERATE,
        LOAD,
    }

    // Helpers

    function convertOrderTypeToString(variant: OrderType) {
        if (variant == OrderType.BUY) {
            return "BUY";
        }
        return "SELL";
    };

    function convertOrderTypeToAnchorPayload(variant: OrderType) {
        if (variant == OrderType.BUY) {
            return { buy: {} };
        }
        return { sell: {} };
    };

    function convertStringToMasterWalletInit(arg: string) {
        if (arg.toUpperCase() == "GENERATE") {
            console.log("We'll generate new wallets for this test.");
            return MasterWalletInit.GENERATE;
        } else if (arg.toUpperCase() == "LOAD") {
            console.log("We'll load existing wallets for this test.");
            return MasterWalletInit.LOAD;
        } else {
            let msg = "Not a valid wallet init flag: " + arg;
            throw Error(msg);
        }
    }

    async function loadMasterWallet(init: MasterWalletInit, filename: string) {
        const path = "./tests/wallets/" + filename + ".json";
        if (init == MasterWalletInit.GENERATE) {
            return await primeNewWallet();
        } else if (init == MasterWalletInit.LOAD) {
            return anchor.web3.Keypair.fromSecretKey(
                Uint8Array.from(JSON.parse(
                    await fs.readFile(path, {encoding: 'utf8'})
                ))
            );
        }
    }

    async function primeNewWallet() {
        let keypair = anchor.web3.Keypair.generate();
        await provider.connection.requestAirdrop(
            keypair.publicKey,
            2 * anchor.web3.LAMPORTS_PER_SOL
        );
        await new Promise( resolve => setTimeout(resolve, 3 * 1000) ); // Sleep 3s
        return keypair;
    };

    async function derivePda(
        walletPubkey: anchor.web3.PublicKey,
        accountTypeSeed: string,
        diffSeed: string,
    ) {
        let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
            [
            walletPubkey.toBuffer(),
            Buffer.from(accountTypeSeed), 
            Buffer.from(diffSeed),
            ],
            program.programId
        );
        return pda;
    };

    async function printStoreBalances(masterWalletPubkey: anchor.web3.PublicKey) {
        console.log("-------------------------------------------------------------------------------");
        console.log("Store:");
        for (var emoji of emojisList) {
            let masterPda = await derivePda(masterWalletPubkey, masterAccountSeed, emoji);
            let masterData = await program.account.masterEmoji.fetch(masterPda);
            let pricePda = await derivePda(masterWalletPubkey, priceAccountSeed, emoji);
            let priceData = await program.account.emojiPrice.fetch(pricePda);
            console.log(`   ${masterData.authority.toString().substring(0, 5)} : ${masterData.name} : ${masterData.balance} : ${priceData.price / anchor.web3.LAMPORTS_PER_SOL} SOL`);
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

    async function printWalletBalance(walletPubkey: anchor.web3.PublicKey, title: string) {
        console.log(
            `${title} balance: ${walletPubkey.toString().substring(0, 5)} : ${
                (await provider.connection.getBalance(walletPubkey)) / anchor.web3.LAMPORTS_PER_SOL
            } SOL`
        );
    }

    // Transactions

    async function createMetadataAccount(
        pda: anchor.web3.PublicKey,
        username: string,
        wallet: anchor.web3.Keypair,
    ) {
        await program.methods.createUserMetadataAccount(
            username, wallet.publicKey
        )
        .accounts({
            metadataAccount: pda,
            wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc();
        usernamesList.push(username);
        userMetadataPdasList.push(pda);
    }

    async function createEmojiAccount(
        pda: anchor.web3.PublicKey,
        accountTypeSeed: string,
        emojiSeed: string,
        wallet: anchor.web3.Keypair,
    ) {
        if (accountTypeSeed == "_master_") {
            console.log("Creating master PDA...");
            console.log(`   Wallet: ${wallet.publicKey}`);
            console.log(`   Emoji: ${emojiSeed}`);
            console.log(`   PDA: ${pda}`);
            let pricePda = await derivePda(wallet.publicKey, priceAccountSeed, emojiSeed);
            console.log("Also creating price PDA...");
            console.log(`   Wallet: ${wallet.publicKey}`);
            console.log(`   Emoji: ${emojiSeed}`);
            console.log(`   PDA: ${pricePda}`);
            await program.methods.createMasterEmojiAccount(
                emojiSeed,
                masterStartingBalance,
                wallet.publicKey
            )
            .accounts({
                emojiAccount: pda,
                emojiPriceAccount: pricePda,
                wallet: wallet.publicKey,
            })
            .signers([wallet])
            .rpc();
            masterPdasList.push(pda);
        } else {
            console.log("Creating user PDA...");
            console.log(`   Wallet: ${wallet.publicKey}`);
            console.log(`   Emoji: ${emojiSeed}`);
            console.log(`   PDA: ${pda}`);
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
        console.log(`   Type: ${convertOrderTypeToString(orderType)}`);
        console.log(`   Amount: ${amount}`);
        console.log(`   Emoji: ${emoji}`);
        console.log(`   User PDA: ${testWalletPda}`);
        console.log(`   Master PDA: ${masterWalletPda}`);
        try {
            await program.account.userEmoji.fetch(testWalletPda);
            console.log(`** User emoji account exists with PDA: ${testWalletPda.toString().substring(0, 9)}...`);
         } catch (error) {
            await createEmojiAccount(
                testWalletPda,
                userAccountSeed,
                emoji,
                wallet,
            );
        };
        let pricePda = await derivePda(master.publicKey, priceAccountSeed, emoji);
        await program.methods.placeOrder(
            convertOrderTypeToAnchorPayload(orderType),
            amount
        )
        .accounts({
            masterEmoji: masterWalletPda,
            emojiPriceAccount: pricePda,
            userEmoji: testWalletPda,
            masterWallet: master.publicKey,
            userWallet: wallet.publicKey
        })
        .signers([master, wallet])
        .rpc();
        console.log("Success.");
    };

    // Tests

    const MASTER_WALLET_INIT = convertStringToMasterWalletInit(process.env.MASTER_WALLET_INIT);
    let masterWallet: anchor.web3.Keypair;

    it("Test initialization of master PDAs", async () => {
        masterWallet = await loadMasterWallet(MASTER_WALLET_INIT, "master")
        for (var emoji of emojisList) {
            let pda = await derivePda(
                masterWallet.publicKey,
                masterAccountSeed,
                emoji,
            );
            try {
                await program.account.masterEmoji.fetch(pda);
                console.log(`** Master emoji account exists with PDA: ${pda.toString().substring(0, 9)}...`);
             } catch (error) {
                await createEmojiAccount(
                    pda,
                    masterAccountSeed,
                    emoji,
                    masterWallet,
                );
             };
        };
        for (var masterPda of masterPdasList) {
            assert(
                await program.account.masterEmoji.fetch(masterPda) != null
            );
        };
        await printStoreBalances(masterWallet.publicKey);
        await printCustomerBalances();
        await printWalletBalance(masterWallet.publicKey, "Master");
    });

    it("Test a user buying & selling one emoji", async () => {
        let testWallet = await primeNewWallet();
        let testUsername = "user_xyz";
        await createMetadataAccount(
            await derivePda(testWallet.publicKey, metadataAccountSeed, testUsername),
            testUsername,
            testWallet
        );
        let testEmoji = emojisList[0];
        await placeOrder(OrderType.BUY, testEmoji, 3, testWallet, masterWallet);
        await placeOrder(OrderType.SELL, testEmoji, 2, testWallet, masterWallet);
        await placeOrder(OrderType.BUY, testEmoji, 1, testWallet, masterWallet);
        let testWalletPda = await derivePda(
            testWallet.publicKey,
            userAccountSeed,
            testEmoji,
        );
        assert((await program.account.userEmoji.fetch(testWalletPda)).balance == 2);
        await printStoreBalances(masterWallet.publicKey);
        await printCustomerBalances();
        await printWalletBalance(masterWallet.publicKey, "Master");
        await printWalletBalance(testWallet.publicKey, "Customer");
    });

    it("Test a user buying & selling multiple emojis", async () => {
        let testWallet = await primeNewWallet();
        let testUsername = "emoji_monster";
        await createMetadataAccount(
            await derivePda(testWallet.publicKey, metadataAccountSeed, testUsername),
            testUsername,
            testWallet
        );
        let testEmoji = emojisList[6];
        await placeOrder(OrderType.BUY, testEmoji, 3, testWallet, masterWallet);
        await placeOrder(OrderType.SELL, testEmoji, 2, testWallet, masterWallet);
        let testWalletPda = await derivePda(
            testWallet.publicKey,
            userAccountSeed,
            testEmoji,
        );
        assert((await program.account.userEmoji.fetch(testWalletPda)).balance == 1);
        await printStoreBalances(masterWallet.publicKey);
        await printCustomerBalances();
        await printWalletBalance(masterWallet.publicKey, "Master");
        await printWalletBalance(testWallet.publicKey, "Customer");
        testEmoji = emojisList[3];
        await placeOrder(OrderType.BUY, testEmoji, 5, testWallet, masterWallet);
        await placeOrder(OrderType.SELL, testEmoji, 1, testWallet, masterWallet);
        testWalletPda = await derivePda(
            testWallet.publicKey,
            userAccountSeed,
            testEmoji,
        );
        assert((await program.account.userEmoji.fetch(testWalletPda)).balance == 4);
        await printStoreBalances(masterWallet.publicKey);
        await printCustomerBalances();
        await printWalletBalance(masterWallet.publicKey, "Master");
        await printWalletBalance(testWallet.publicKey, "Customer");
    });

    it("Test the price action by buying lots of emojis", async () => {
        let testWallet = await primeNewWallet();
        let testUsername = "joe";
        await createMetadataAccount(
            await derivePda(testWallet.publicKey, metadataAccountSeed, testUsername),
            testUsername,
            testWallet
        );
        let testEmoji = emojisList[2];
        await placeOrder(OrderType.BUY, testEmoji, 12, testWallet, masterWallet);
        await printStoreBalances(masterWallet.publicKey);
        await printCustomerBalances();
        await printWalletBalance(masterWallet.publicKey, "Master");
        await printWalletBalance(testWallet.publicKey, "Customer");
        await placeOrder(OrderType.BUY, testEmoji, 1, testWallet, masterWallet);
        await printStoreBalances(masterWallet.publicKey);
        await printCustomerBalances();
        await printWalletBalance(masterWallet.publicKey, "Master");
        await printWalletBalance(testWallet.publicKey, "Customer");
        let testWalletPda = await derivePda(
            testWallet.publicKey,
            userAccountSeed,
            testEmoji,
        );
        assert((await program.account.userEmoji.fetch(testWalletPda)).balance == 13);
    });

    it("Test insufficient store emoji balance", async () => {
        let testWallet = await primeNewWallet();
        let testUsername = "smileyguy";
        await createMetadataAccount(
            await derivePda(testWallet.publicKey, metadataAccountSeed, testUsername),
            testUsername,
            testWallet
        );
        let testEmoji = emojisList[2];
        let masterWalletPda = await derivePda(
            masterWallet.publicKey,
            masterAccountSeed,
            testEmoji,
        );
        let threwInsufficientStoreBalanceError = false;
        try {
            await placeOrder(OrderType.BUY, testEmoji, masterStartingBalance - 12, testWallet, masterWallet);
        } catch (error) {
            threwInsufficientStoreBalanceError = true;
        };
        assert(threwInsufficientStoreBalanceError);
        assert((await program.account.masterEmoji.fetch(masterWalletPda)).balance < masterStartingBalance - 12);
    });

    it("Test insufficient user emoji balance", async () => {
        let testWallet = await primeNewWallet();
        let testUsername = "frownyclowny";
        await createMetadataAccount(
            await derivePda(testWallet.publicKey, metadataAccountSeed, testUsername),
            testUsername,
            testWallet
        );
        let testEmoji = emojisList[2];
        let testWalletPda = await derivePda(
            testWallet.publicKey,
            userAccountSeed,
            testEmoji,
        );
        let threwInsufficientUserBalanceError = false;
        try {
            await placeOrder(OrderType.BUY, testEmoji, 20, testWallet, masterWallet);
        } catch (error) {
            threwInsufficientUserBalanceError = true;
        };
        assert(threwInsufficientUserBalanceError);
        assert((await program.account.userEmoji.fetch(testWalletPda)).balance < 20);
    });

    it("Test resulting usernames generated in previous tests", async () => {
        console.log("User Metadata:")
        let checkedUsernames = [];
        for (var pda of userMetadataPdasList) {
            let metadata = await program.account.userMetadata.fetch(pda);
            checkedUsernames.push(metadata.username);
            console.log(`   ${metadata.authority.toString().substring(0, 5)} : ${metadata.username}`);
        };
        assert((
            checkedUsernames.filter(a => usernamesList.indexOf(a) < 0)
        ).length == 0);
    })
});