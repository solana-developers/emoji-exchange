import * as anchor from "@project-serum/anchor";
import * as service from '../src/utils/service';


async function main() {

    const masterWallet = await service.loadMasterWallet();
    await service.provider.connection.requestAirdrop(
        masterWallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise( resolve => setTimeout(resolve, 3 * 1000) ); // Sleep 3s

    await service.initializeStore(masterWallet);
    console.log("Store initialized.");
}


main().then(
    () => process.exit(),
    err => {
        console.error(err);
        process.exit(-1);
    },
);