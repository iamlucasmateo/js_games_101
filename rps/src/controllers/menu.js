import React from 'react';

export const Menu = ({onMenuChange}) => {
    return (
        <select onChange={onMenuChange} style={{"width": "200px", "marginBottom": "50px"}}>
            <option value="Menu">Choose game</option>
            <option value="RPS">RPS</option>
        </select>
    )
}