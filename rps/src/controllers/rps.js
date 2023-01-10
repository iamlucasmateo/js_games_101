import { useState } from 'react';

import { PlayerMoveSection, ResultsDetails } from '../components/rps';
import { GeneralButton } from '../components/general';
import { Game } from '../logic/rps';

export const RPS = () => {
  const [playerScore, setPlayerScore] = useState(0);
  const [machineScore, setMachineScore] = useState(0);
  const [playerSelection, setPlayerSelection] = useState(null);
  const [machineSelection, setMachineSelection] = useState(null);
  const [whoWon, setWhoWon] = useState(null);
  const [game, setGame] = useState(new Game());

  const onPlayerGoPress = (playerStrategy) => {
    game.update(playerStrategy);
    setPlayerSelection(playerStrategy);
    setMachineSelection(game.machineStrategy);
    setPlayerScore(game.playerScore);
    setMachineScore(game.machineScore);
    setWhoWon(game.whoWon);
  }

  const onNewGamePress = () => {
    setGame(new Game());
    setPlayerSelection(null);
    setMachineSelection(null);
    setPlayerScore(0);
    setMachineScore(0);
    setWhoWon(null);
  }


  return (
    <div className="RPS">
        <h3>Rock, Paper, Scissors</h3>
        <GeneralButton text="New Game" onClick={onNewGamePress}/>
        <PlayerMoveSection onPlayerGoPress={onPlayerGoPress} margin="20"/>
        <ResultsDetails
          playerSelection={playerSelection}
          machineSelection={machineSelection}
          playerScore={playerScore}
          machineScore={machineScore}
          whoWon={whoWon}
        />
    </div>
  );
}