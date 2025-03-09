import { useWallet } from "@alephium/web3-react";
import { NFT, NFTOpenCollection } from "../../../enanfts/artifacts/ts";
import { stringToHex, web3 } from "@alephium/web3";
import { NODE_URL } from "../../constants";

const DeployButton = () => {
  const { signer } = useWallet();

  const deploy = async () => {
    if (!signer) return;

    web3.setCurrentNodeProvider(NODE_URL, undefined, fetch);
    const account = await signer.getSelectedAccount();

    // I should probably deploy the 2 contracts by myself
    const { contractInstance: awesomeNFTTemplate } = await NFT.deploy(signer, {
      initialFields: { collectionId: "", nftIndex: 0n, tokenUri: "" },
    });

    const { contractInstance: nftCollection } = await NFTOpenCollection.deploy(signer, {
      initialFields: {
        collectionOwner: account.address,
        nftTemplateId: awesomeNFTTemplate.contractId,
        collectionUri: stringToHex("https://arweave.net/MvagCPuLeFwSGaJvS22beU5lQepQ1gP5PE8cbms2sSY"),
        totalSupply: 0n,
      },
    });

    console.log(`NFT Collection address: ${nftCollection.address}`);
    console.log(`NFT Collection contractId: ${nftCollection.contractId}`);
  };

  return <button onClick={deploy}>Deploy contract</button>;
};

export default DeployButton;
