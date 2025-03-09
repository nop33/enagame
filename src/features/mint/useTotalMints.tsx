import { web3 } from "@alephium/web3";
import { useEffect, useState } from "react";
import { MAX_SUPPLY, NFT_COLLECTION_CONTRACT_ID, NODE_URL } from "../../constants";

const useTotalMints = () => {
  const [totalSupply, setTotalSupply] = useState<number | null>(null);

  useEffect(() => {
    web3.setCurrentNodeProvider(NODE_URL, undefined, fetch);

    const fetchTotalSupply = async () => {
      try {
        const metadata = await web3.getCurrentNodeProvider().fetchNFTCollectionMetaData(NFT_COLLECTION_CONTRACT_ID);
        setTotalSupply(Number(metadata.totalSupply));
      } catch (error) {
        console.error("Error fetching NFT total supply:", error);
      }
    };

    // Fetch immediately on mount
    fetchTotalSupply();

    // Set up periodic checking every 5 seconds
    const interval = setInterval(fetchTotalSupply, 5 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return { totalSupply, allNFTsMinted: totalSupply === MAX_SUPPLY };
};

export default useTotalMints;
