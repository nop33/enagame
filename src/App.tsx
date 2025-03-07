import { AlephiumConnectButton, AlephiumWalletProvider, useWallet } from "@alephium/web3-react";
import "./App.css";
import Game from "./components/Game";
import Instructions from "./features/instructions/Instructions";
import { NFTOpenCollection } from "../enanfts/artifacts/ts";
import { DUST_AMOUNT, ONE_ALPH, stringToHex } from "@alephium/web3";

function App() {
  return (
    <AlephiumWalletProvider network="devnet">
      <div className="app">
        <Instructions />
        <Game />
        <AlephiumConnectButton />
        <MintBtn />
      </div>
    </AlephiumWalletProvider>
  );
}

export default App;

const MintBtn = () => {
  const { signer } = useWallet();

  if (!signer) return null;

  const handleMint = async () => {
    console.log("Minting NFT...");
    const nftCollection = NFTOpenCollection.at("23yHMf3fAxiBfArV5WaW9SNFAPqmpngSV9jzAJRjBYzST");

    await nftCollection.transact.mint({
      signer,
      args: { nftUri: stringToHex("http://arweave.net/nAIPHzkmW8QTASoRCuRYbzi3MX82CEhZwLPNo68E9fQ/1") },
      attoAlphAmount: ONE_ALPH / 10n + DUST_AMOUNT,
    });
  };

  return <button onClick={handleMint}>Mint</button>;
};
