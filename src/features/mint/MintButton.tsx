import { DUST_AMOUNT } from "@alephium/web3";
import { stringToHex } from "@alephium/web3";
import { ONE_ALPH } from "@alephium/web3";
import { useWallet } from "@alephium/web3-react";
import { NFTOpenCollection } from "../../../enanfts/artifacts/ts";
import nftUrls from "../../data/nfts.json";
import { NFT_COLLECTION_ADDRESS } from "../../constants";

const MintButton = ({
  onMintClick,
  mintedNfts,
  onNftMinted,
}: {
  onMintClick?: () => void;
  mintedNfts: string[];
  onNftMinted: (nftUrl: string) => void;
}) => {
  const { signer } = useWallet();

  if (!signer) return null;

  const handleMint = async () => {
    console.log("Minting NFT...");
    const nftCollection = NFTOpenCollection.at(NFT_COLLECTION_ADDRESS);

    // Filter out already minted NFTs
    const availableNfts = nftUrls.filter((url) => !mintedNfts.includes(url));

    if (availableNfts.length === 0) {
      alert("All NFTs have been minted!");
      return;
    }

    // Get a random NFT URL from the remaining available ones
    const randomNftUrl = availableNfts[Math.floor(Math.random() * availableNfts.length)];

    try {
      await nftCollection.transact.mint({
        signer,
        args: { nftUri: stringToHex(randomNftUrl) },
        attoAlphAmount: ONE_ALPH / 10n + DUST_AMOUNT,
      });

      // Instead of setting state directly, call the callback
      onNftMinted(randomNftUrl);

      // Call the onMintClick callback if provided
      if (onMintClick) {
        onMintClick();
      }
    } catch (error) {
      console.error("Failed to mint NFT:", error);
    }
  };

  return (
    <button onClick={handleMint} disabled={mintedNfts.length === nftUrls.length}>
      {mintedNfts.length === nftUrls.length ? "All NFTs Minted" : "Mint"}
    </button>
  );
};

export default MintButton;
