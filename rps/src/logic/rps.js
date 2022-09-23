export function Game() {
    this.playerScore = 0;
    this.machineScore = 0;
    this.whoWon = null;
    this.playerStrategy = null;
    this.machineStrategy = null;

    this.getWinner = function(playerStrategy, machineStrategy) {
        if (playerStrategy === machineStrategy) {
            return "draw"
        } else {
            const winningStrategy = this.getWinningStrategy([playerStrategy, machineStrategy]);
            return winningStrategy === playerStrategy ? "player" : "machine";
        }
    };

    this.getWinningStrategy = (strategies) => {
        if (strategies.includes("rock") && strategies.includes("paper")) return "paper"
        else if (strategies.includes("rock") && strategies.includes("scissors")) return "rock"
        else if (strategies.includes("paper") && strategies.includes("scissors")) return "scissors";
    }

    this.update = function(playerStrategy) {
        const machineStrategy = this.getMachineStrategy();
        const winner = this.getWinner(playerStrategy, machineStrategy);
        if (winner === "player") { 
            this.playerScore += 1;
        } else if (winner === "machine") {
            this.machineScore += 1;
        }
        this.whoWon = winner;
        this.machineStrategy = machineStrategy;
        this.playerStrategy = playerStrategy;
    }

    this.getMachineStrategy = () => {
        const randomNumber = Math.random();
        if (randomNumber < 0.333333) {
            return "rock"
        } else if (randomNumber < 0.66666 ) {
            return "paper"
        } else {
            return "scissors"
        }
    }
    
    return this
}



