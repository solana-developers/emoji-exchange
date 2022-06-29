import * as anchor from "@project-serum/anchor";
import { assert } from "chai";
import * as constants from '../app/src/utils/const';
import * as service from '../app/src/utils/service';


const defaultAirdropLamports = 2 * anchor.web3.LAMPORTS_PER_SOL;

function printStoreBalances(store: service.MasterEmojiBalance[]) {
    console.log("-------------------------------------------------------------------------------");
    console.log("Store:");
    for (var item of store) {
        console.log(`   Emoji: ${item.emoji}    Balance: ${item.balance}    Price: ${item.price / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    };
}

function printUserBalances(userStore: service.UserEmojiBalance[]) {
    console.log("-------------------------------------------------------------------------------");
    console.log("User Balances:");
    for (var item of userStore) {
        console.log(`   User: ${item.username}   Emoji: ${item.emoji}    Balance: ${item.balance}`);
    };
}

function printUsernames(usernamesList: string[]) {
    console.log("-------------------------------------------------------------------------------");
    console.log("Usernames:");
    for (var user of usernamesList) {
        console.log(`   ${user}`);
    };
}

async function primeNewWallet(keypair: anchor.web3.Keypair) {
    if (await service.provider.connection.getBalance(keypair.publicKey) < defaultAirdropLamports) {
        await service.provider.connection.requestAirdrop(
            keypair.publicKey, defaultAirdropLamports
        )
        await new Promise( resolve => setTimeout(resolve, 3 * 1000) ); // Sleep 3s
    };
    assert(await service.provider.connection.getBalance(keypair.publicKey) >= defaultAirdropLamports);
}


describe("Emoji Exchange Tests", async () => {


    const testMasterWallet = anchor.web3.Keypair.generate();
    const testWallet1 = anchor.web3.Keypair.generate();
    const testWallet2 = anchor.web3.Keypair.generate();


    it("Test initialization of master PDAs", async () => {

        await primeNewWallet(testMasterWallet);
        await service.initializeStore(testMasterWallet);
        printStoreBalances((await service.getStoreBalances(testMasterWallet.publicKey)));
    });


    it("Test a user buying & selling one emoji", async () => {

        let testWallet = testWallet1;
        await primeNewWallet(testWallet);
        await service.createUserMetadataAccount(testWallet, "user_xyz");
        let testEmoji = constants.EMOJIS_LIST[0];

        await service.placeOrder(
            testMasterWallet,
            testWallet,
            testEmoji,
            constants.OrderType.BUY,
            3
        );
        assert((
            await service.getStoreBalanceForEmoji(testMasterWallet.publicKey, testEmoji)
        ) == constants.MASTER_DEFAULT_STARTING_BALANCE - 3);
        assert((
            await service.getUserBalanceForEmoji(testWallet.publicKey, testEmoji)
        ) == 3);
        printUserBalances((await service.getUserBalances(testWallet.publicKey)));

        await service.placeOrder(
            testMasterWallet,
            testWallet,
            testEmoji,
            constants.OrderType.SELL,
            2
        );
        assert((
            await service.getStoreBalanceForEmoji(testMasterWallet.publicKey, testEmoji)
        ) == constants.MASTER_DEFAULT_STARTING_BALANCE - 1);
        assert((
            await service.getUserBalanceForEmoji(testWallet.publicKey, testEmoji)
        ) == 1);
        printUserBalances((await service.getUserBalances(testWallet.publicKey)));

        await service.placeOrder(
            testMasterWallet,
            testWallet,
            testEmoji,
            constants.OrderType.BUY,
            1
        );
        assert((
            await service.getStoreBalanceForEmoji(testMasterWallet.publicKey, testEmoji)
        ) == constants.MASTER_DEFAULT_STARTING_BALANCE - 2);
        assert((
            await service.getUserBalanceForEmoji(testWallet.publicKey, testEmoji)
        ) == 2);
        printUserBalances((await service.getUserBalances(testWallet.publicKey)));
    });

    it("Test a user buying & selling multiple emojis", async () => {

        let testWallet = testWallet1;
        let testEmoji = constants.EMOJIS_LIST[1];

        await service.placeOrder(
            testMasterWallet,
            testWallet,
            testEmoji,
            constants.OrderType.BUY,
            3
        );
        assert((
            await service.getStoreBalanceForEmoji(testMasterWallet.publicKey, testEmoji)
        ) == constants.MASTER_DEFAULT_STARTING_BALANCE - 3);
        assert((
            await service.getUserBalanceForEmoji(testWallet.publicKey, testEmoji)
        ) == 3);
        printUserBalances((await service.getUserBalances(testWallet.publicKey)));
        
        await service.placeOrder(
            testMasterWallet,
            testWallet,
            testEmoji,
            constants.OrderType.SELL,
            2
        );
        assert((
            await service.getStoreBalanceForEmoji(testMasterWallet.publicKey, testEmoji)
        ) == constants.MASTER_DEFAULT_STARTING_BALANCE - 1);
        assert((
            await service.getUserBalanceForEmoji(testWallet.publicKey, testEmoji)
        ) == 1);
        printUserBalances((await service.getUserBalances(testWallet.publicKey)));

        testEmoji = constants.EMOJIS_LIST[2];

        await service.placeOrder(
            testMasterWallet,
            testWallet,
            testEmoji,
            constants.OrderType.BUY,
            5
        );
        assert((
            await service.getStoreBalanceForEmoji(testMasterWallet.publicKey, testEmoji)
        ) == constants.MASTER_DEFAULT_STARTING_BALANCE - 5);
        assert((
            await service.getUserBalanceForEmoji(testWallet.publicKey, testEmoji)
        ) == 5);
        printUserBalances((await service.getUserBalances(testWallet.publicKey)));

        await service.placeOrder(
            testMasterWallet,
            testWallet,
            testEmoji,
            constants.OrderType.SELL,
            1
        );
        assert((
            await service.getStoreBalanceForEmoji(testMasterWallet.publicKey, testEmoji)
        ) == constants.MASTER_DEFAULT_STARTING_BALANCE - 4);
        assert((
            await service.getUserBalanceForEmoji(testWallet.publicKey, testEmoji)
        ) == 4);
        printUserBalances((await service.getUserBalances(testWallet.publicKey)));
    });

    it("Test the price action by buying lots of emojis", async () => {

        let testWallet = testWallet2;
        await primeNewWallet(testWallet);
        await service.createUserMetadataAccount(testWallet, "emoji_monster");
        let testEmoji = constants.EMOJIS_LIST[3];

        await service.placeOrder(
            testMasterWallet,
            testWallet,
            testEmoji,
            constants.OrderType.BUY,
            12
        );
        assert((
            await service.getStoreBalanceForEmoji(testMasterWallet.publicKey, testEmoji)
        ) == constants.MASTER_DEFAULT_STARTING_BALANCE - 12);
        assert((
            await service.getUserBalanceForEmoji(testWallet.publicKey, testEmoji)
        ) == 12);
        printUserBalances((await service.getUserBalances(testWallet.publicKey)));

        await service.placeOrder(
            testMasterWallet,
            testWallet,
            testEmoji,
            constants.OrderType.BUY,
            1
        );
        assert((
            await service.getStoreBalanceForEmoji(testMasterWallet.publicKey, testEmoji)
        ) == constants.MASTER_DEFAULT_STARTING_BALANCE - 13);
        assert((
            await service.getUserBalanceForEmoji(testWallet.publicKey, testEmoji)
        ) == 13);
        printUserBalances((await service.getUserBalances(testWallet.publicKey)));
        printStoreBalances((await service.getStoreBalances(testMasterWallet.publicKey)));
    });

    it("Test insufficient store emoji balance", async () => {
        
        let testWallet = testWallet2;
        let testEmoji = constants.EMOJIS_LIST[3];
        let threwInsufficientStoreBalanceError = false;
        try {
            await service.placeOrder(
                testMasterWallet,
                testWallet,
                testEmoji,
                constants.OrderType.BUY,
                35
            );
        } catch (error) {
            threwInsufficientStoreBalanceError = true;
        };
        assert(threwInsufficientStoreBalanceError);
        console.log("Transaction was not process because of insufficient store balance - as expected.");
    });

    it("Test insufficient user emoji balance", async () => {

        let testWallet = testWallet2;
        let testEmoji = constants.EMOJIS_LIST[3];
        let threwInsufficientUserBalanceError = false;
        try {
            await service.placeOrder(
                testMasterWallet,
                testWallet,
                testEmoji,
                constants.OrderType.BUY,
                5
            );
        } catch (error) {
            threwInsufficientUserBalanceError = true;
        };
        assert(threwInsufficientUserBalanceError);
        console.log("Transaction was not process because of insufficient user balance - as expected.");
    });

    it("Test resulting usernames generated in previous tests", async () => {

        printStoreBalances((await service.getStoreBalances(testMasterWallet.publicKey)));
        printUsernames((await service.getAllUsernames([testWallet1.publicKey, testWallet2.publicKey])));
        printUserBalances((await service.getEcosystemBalances([testWallet1.publicKey, testWallet2.publicKey])));
    });
});