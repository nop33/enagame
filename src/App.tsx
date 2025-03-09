import { AlephiumConnectButton, AlephiumWalletProvider } from "@alephium/web3-react";
import "./App.css";
import Game from "./components/Game";
import Instructions from "./features/instructions/Instructions";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import useTotalMints from "./features/mint/useTotalMints";
import { MAX_SUPPLY } from "./constants";
function App() {
  const { totalSupply, allNFTsMinted } = useTotalMints();

  const [showCongrats, setShowCongrats] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AlephiumWalletProvider network="devnet">
      <div className="app">
        {allNFTsMinted && showCongrats && (
          <>
            <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />
            <div className="congratulations-message">
              <button
                onClick={() => setShowCongrats(false)}
                className="close-button"
                aria-label="Close congratulations message"
              >
                ×
              </button>
              🎉 Congratulations! All gifts have been found!
              <br />
              <br />
              You can continue fighting your nemesises if you like.
            </div>
          </>
        )}
        <div className="connect-button-wrapper">
          <AlephiumConnectButton />

          <div className="total-supply">
            Gifts found: {totalSupply || 0} / {MAX_SUPPLY}{" "}
            {allNFTsMinted && <span className="total-supply-complete">🎉</span>}
          </div>
        </div>
        <Instructions />
        <Game />
      </div>
    </AlephiumWalletProvider>
  );
}

export default App;
