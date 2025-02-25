import "./App.css";
import Game from "./components/Game";
import Instructions from "./components/Instructions";

function App() {
  return (
    <div className="app">
      <Instructions />
      <Game />
    </div>
  );
}

export default App;
