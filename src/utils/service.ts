import * as anchor from "@project-serum/anchor";
import * as constants from './const';
import fs from 'mz/fs';
import { EmojiExchange } from "../../target/types/emoji_exchange";


function anchorConfigs() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    return provider;
}

export const provider = anchorConfigs();
export const program = anchor.workspace.EmojiExchange as anchor.Program<EmojiExchange>;

export async function loadMasterWallet() {
    return anchor.web3.Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(
            await fs.readFile("./wallet/master.json", 
                {encoding: 'utf8'}
            )
        ))
    );
    // return anchor.web3.Keypair.generate();
}

function convertOrderTypeToAnchorPayload(variant: constants.OrderType) {
    if (variant == constants.OrderType.BUY) {
        return { buy: {} };
    }
    return { sell: {} };
};

async function derivePda(
    walletPubkey: anchor.web3.PublicKey,
    accountTypeSeed: string,
    seed: string,
) {
    let pdaSeeds: Buffer[];
    if (seed === "") { 
        pdaSeeds = [
            walletPubkey.toBuffer(),
            Buffer.from(accountTypeSeed), 
        ];
    } else {
        pdaSeeds = [
            walletPubkey.toBuffer(),
            Buffer.from(accountTypeSeed), 
            Buffer.from(seed),
        ];
    };
    let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
        pdaSeeds,
        program.programId
    );
    return pda;
};

async function userPdaExists(pda: anchor.web3.PublicKey) {
    try {
        await program.account.userEmoji.fetch(pda);
        return true;
    } catch (e) {
        return false;
    }
}

export async function createMasterEmojiAccount(
    masterWallet: anchor.web3.Keypair,
    emoji: string,
) {
    let pda = await derivePda(masterWallet.publicKey, constants.MASTER_ACCOUNT_SEED, emoji);
    let pricePda = await derivePda(masterWallet.publicKey, constants.PRICE_ACCOUNT_SEED, emoji);
    await program.methods.createMasterEmojiAccount(
        emoji, 
        constants.MASTER_DEFAULT_STARTING_BALANCE
    )
    .accounts({
        emojiAccount: pda,
        emojiPriceAccount: pricePda,
        wallet: masterWallet.publicKey,
    })
    .signers([masterWallet])
    .rpc();
}

export async function getMasterEmojiAccount(
    masterWalletPubkey: anchor.web3.PublicKey,
    emoji: string,
) {
    let pda = await derivePda(masterWalletPubkey, constants.MASTER_ACCOUNT_SEED, emoji);
    try {
        return await program.account.masterEmoji.fetch(pda);
    } catch (e) {
        throw Error("Master emoji account does not exist!");
    }
}

export async function getEmojiPriceAccount(
    masterWalletPubkey: anchor.web3.PublicKey,
    emoji: string,
) {
    let pricePda = await derivePda(masterWalletPubkey, constants.PRICE_ACCOUNT_SEED, emoji);
    try {
        return await program.account.emojiPrice.fetch(pricePda);
    } catch (e) {
        throw Error("Emoji price account does not exist!");
    }
}

export async function createUserMetadataAccount(
    userPubkey: anchor.web3.PublicKey, 
    username: string, 
    masterWallet: anchor.web3.Keypair,
) {
    let pda = await derivePda(userPubkey, constants.METADATA_ACCOUNT_SEED, "");
    await program.methods.createUserMetadataAccount(
        userPubkey, username
    )
    .accounts({
        metadataAccount: pda,
        wallet: masterWallet.publicKey,
    })
    .signers([masterWallet])
    .rpc();
}

export async function getUserMetadataAccount(
    userPubkey: anchor.web3.PublicKey, 
) {
    let pda = await derivePda(userPubkey, constants.METADATA_ACCOUNT_SEED, "");
    try {
        return await program.account.userMetadata.fetch(pda);
    } catch (e) {
        throw Error("Metadata account does not exist!");
    }
}

export async function createUserEmojiAccount(
    userPubkey: anchor.web3.PublicKey, 
    emoji: string, 
    masterWallet: anchor.web3.Keypair,
) {
    let pda = await derivePda(userPubkey, constants.USER_ACCOUNT_SEED, emoji);
    await program.methods.createUserEmojiAccount(
        userPubkey, emoji, 
    )
    .accounts({
        emojiAccount: pda,
        wallet: masterWallet.publicKey,
    })
    .signers([masterWallet])
    .rpc();
}

export async function getUserEmojiAccount(
    userPubkey: anchor.web3.PublicKey,
    emoji: string,
) {
    let pda = await derivePda(userPubkey, constants.USER_ACCOUNT_SEED, emoji);
    try {
        return await program.account.userEmoji.fetch(pda);
    } catch (e) {
        throw Error("User emoji account does not exist!");
    }
}

export async function placeOrder(
    masterWallet: anchor.web3.Keypair,
    userWallet: anchor.web3.Keypair,
    emoji: string,
    orderType: constants.OrderType,
    quantity: number,
) {
    let masterPda = await derivePda(masterWallet.publicKey, constants.MASTER_ACCOUNT_SEED, emoji);
    let pricePda = await derivePda(masterWallet.publicKey, constants.PRICE_ACCOUNT_SEED, emoji);
    let userPda = await derivePda(userWallet.publicKey, constants.USER_ACCOUNT_SEED, emoji);
    if (!(await userPdaExists(userPda))) { 
        await createUserEmojiAccount(userWallet.publicKey, emoji, masterWallet);
    };
    await program.methods.placeOrder(
        convertOrderTypeToAnchorPayload(orderType),
        quantity,
    )
    .accounts({
        masterEmoji: masterPda,
        emojiPriceAccount: pricePda,
        userEmoji: userPda,
        masterWallet: masterWallet.publicKey,
        userWallet: userWallet.publicKey
    })
    .signers([masterWallet, userWallet])
    .rpc();
}


export class MasterEmojiBalance {
    emoji: string;
    balance: number;
    price: number;

    constructor(
        emoji: string,
        balance: number,
        price: number,
    ) {
        this.emoji = emoji;
        this.balance = balance;
        this.price = price;
    };
}

export class UserEmojiBalance {
    username: string;
    emoji: string;
    balance: number;

    constructor(
        username: string,
        emoji: string,
        balance: number,
    ) {
        this.username = username;
        this.emoji = emoji;
        this.balance = balance;
    };
}

export async function initializeStore(
    masterWallet: anchor.web3.Keypair,
) {
    for (var emoji of constants.EMOJIS_LIST) { 
        try {
            await getMasterEmojiAccount(masterWallet.publicKey, emoji.emoji);
        } catch (e) {
            await createMasterEmojiAccount(masterWallet, emoji.emoji);
        }
    };
}

export async function getStoreBalances(
    masterWalletPubkey: anchor.web3.PublicKey,
) {
    let store: MasterEmojiBalance[] = [];
    for (var emoji of constants.EMOJIS_LIST) { 
        let data = await getMasterEmojiAccount(masterWalletPubkey, emoji.emoji);
        let priceData = await getEmojiPriceAccount(masterWalletPubkey, emoji.emoji);
        store.push(
            new MasterEmojiBalance(
                data.name,
                data.balance,
                priceData.price.toNumber(),
            )
        );
    };
    return store;
}

export async function getStoreBalanceForEmoji(
    masterWalletPubkey: anchor.web3.PublicKey,
    emoji: string,
) {
    return (await getMasterEmojiAccount(masterWalletPubkey, emoji)).balance;
}

export async function getEmojiPrice(
    masterWalletPubkey: anchor.web3.PublicKey,
    emoji: string,
) {
    return (await getEmojiPriceAccount(masterWalletPubkey, emoji)).price;
}

export async function getUserBalances(
    userWalletPubkey: anchor.web3.PublicKey,
) {
    let userStore = [];
    let metadata = await getUserMetadataAccount(userWalletPubkey);
    for (var emoji of constants.EMOJIS_LIST) { 
        try {
            let data = await getUserEmojiAccount(userWalletPubkey, emoji.emoji);
            userStore.push(
                new UserEmojiBalance(
                    metadata.username,
                    data.name,
                    data.balance
                )
            );
        } catch (e) {
            continue;
        }
    };
    return userStore;
}

export async function getUserBalanceForEmoji(
    userWalletPubkey: anchor.web3.PublicKey,
    emoji: string,
) {
    return (await getUserEmojiAccount(userWalletPubkey, emoji)).balance;
}

export async function getEcosystemBalances(walletPubkeysList: anchor.web3.PublicKey[]) {
    let ecosystem = [];
    for (var pubkey of walletPubkeysList) {
        let userBalances = await getUserBalances(pubkey);
        for (var bal of userBalances) {
            ecosystem.push(bal);
        };
    };
    return ecosystem;
};

export async function getAllUsernames(walletPubkeysList: anchor.web3.PublicKey[]) {
    let usernamesList = [];
    for (var pubkey of walletPubkeysList) {
        let metadata = await getUserMetadataAccount(pubkey);
        usernamesList.push(metadata.username);
    };
    return usernamesList;
};
