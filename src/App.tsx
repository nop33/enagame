import { AlephiumConnectButton, AlephiumWalletProvider } from "@alephium/web3-react";
import "./App.css";
import Game from "./components/Game";
import Instructions from "./features/instructions/Instructions";

function App() {
  return (
    <AlephiumWalletProvider network="devnet">
      <div className="app">
        <div className="connect-button-wrapper">
          <AlephiumConnectButton />
        </div>
        <Instructions />
        <Game />
      </div>
    </AlephiumWalletProvider>
  );
}

export default App;
