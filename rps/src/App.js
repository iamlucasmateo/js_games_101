import { useState } from 'react';
import './App.css';

import { RPS } from './controllers/rps';
import { Menu } from './controllers/menu';

function App() {
  const [screen, setScreen] = useState("menu");
  const onMenuChange = (dropdownChanged) => {
    setScreen(dropdownChanged.target.value);
  }
  const selectionToScreen = {
    RPS: <RPS/>,
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
