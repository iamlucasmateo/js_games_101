import React, { useState } from 'react';

export const GeneralButton = ({text, onClick}) => {
    const onPressButton = () => {
        onClick();
    }

    return (
        <button onClick={onPressButton}>{text}</button>
    )
}

export const RPSDropdown = ({margin}) => {
    return (
        <select name="options" id="options" style={{"margin": `${margin}px`}}>
            <option value="rock">Rock</option>
            <option value="paper">Paper</option>
            <option value="scissors">Scissors</option>
        </select>
    )
}

export const PlayerMoveSection = ({margin, onPlayerGoPress}) => {
    const [strategy, setSelectedStrategy] = useState("rock");
    
    const onStrategyChange = (dropdownPressEvent) => {
        const clickedStrategy = dropdownPressEvent.target.value;
        setSelectedStrategy(clickedStrategy);
    }
    return (
        <div style={{"margin": `${margin}px`, "width": "200px", "display": "flex", "flexDirection": "row", "justifyContent": "space-between"}}>
            <select name="options" id="options" onChange={onStrategyChange}>
                <option value="rock">Rock</option>
                <option value="paper">Paper</option>
                <option value="scissors">Scissors</option>
            </select>
            <button onClick={() => onPlayerGoPress(strategy)}>Go!</button>
        </div>
    )
}

export const ResultsDetails = ({playerSelection, machineSelection, whoWon, playerScore, machineScore}) => {
    return (
        <>
            <p>You selected: {playerSelection}</p>
            <p>Machine selected: {machineSelection}</p>
            <p>Who won: {whoWon}</p>
            <p>Score: you {playerScore} - machine {machineScore}</p>
        </>
    )
}