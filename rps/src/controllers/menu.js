import React from 'react';

export const Menu = ({onMenuChange}) => {
    const dropDownStyle = {
        "width": "300px",
        "marginBottom": "50px",
        "fontSize": "30px"
    }
    return (
        <select onChange={onMenuChange} style={dropDownStyle}>
            <option value="Menu">Choose game</option>
            <option value="RPS">RPS</option>
            <option value="TTT">TicTacToe</option>
            <option value="Breakout">Breakout</option>
            <option value="Canvas">Canvas</option>
        </select>
    )
}