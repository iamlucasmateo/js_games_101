import { useState } from 'react';
import './App.css';

import { RPS } from './controllers/rps';
import { TicTacToe } from './controllers/ttt';
import { Breakout } from './controllers/breakout';
import { CanvasExample } from './controllers/canvasExample';
import { Menu } from './controllers/menu';

function App() {
  const [screen, setScreen] = useState("menu");
  const onMenuChange = (dropdownChanged) => {
    setScreen(dropdownChanged.target.value);
  }
  const selectionToScreen = {
    RPS: <RPS/>,
    TTT: <TicTacToe/>,
    Breakout: <Breakout/>,
    Canvas: <CanvasExample/>
  }

  return (
    <div className="App">
      <header className="App-header">
        <Menu onMenuChange={onMenuChange}/>
        {selectionToScreen[screen]}
      </header>
    </div>
  );
}

export default App;
