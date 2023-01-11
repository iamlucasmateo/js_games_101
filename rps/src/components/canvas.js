export class TileMapCanvas {
    constructor(imageMap, canvas, numberOfRows, numberOfColumns) {
        this.imageMap = imageMap;
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");
        this.numberOfColumns = numberOfColumns;
        this.numberOfRows = numberOfRows;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.#normalizeCanvasAspectRatio();
    }

    updateCanvas(matrix) {
        for (let col = 0; col < this.numberOfColumns; col++) {
            for (let row = 0; row < this.numberOfRows; row++) {
                this.#drawTile(matrix, row, col);
            }
        }
    }

    showTextCanvas(text) {
        this.context.font = "30px Arial";
        this.context.fillStyle = "red";
        this.context.textAlign = "center";
        this.context.fillText(text, this.canvasWidth/2, this.canvasWidth/2);
    }

    #drawTile(matrix, col, row) {
        const tileKey = matrix[row][col];
        const tileFill = this.imageMap[tileKey];
        const tileWidth = this.canvasWidth / this.numberOfColumns;
        const tileHeight = this.canvasHeight / this.numberOfRows;
        const xCoord = col * tileWidth;
        const yCoord = row * tileHeight;
        if (typeof tileFill === Image) {
            this.context.drawImage(tileFill, xCoord, yCoord, tileWidth, tileHeight);
        } else if (typeof tileFill === "string") {
            this.context.fillStyle = tileFill;
            this.context.fillRect(xCoord, yCoord, tileWidth, tileHeight);
        }
    }

    #getPixelRatio = () => {
        const backingStore =
            this.context.backingStorePixelRatio ||
            this.context.webkitBackingStorePixelRatio ||
            this.context.mozBackingStorePixelRatio ||
            this.context.msBackingStorePixelRatio ||
            this.context.oBackingStorePixelRatio ||
            this.context.backingStorePixelRatio ||
            1;
        
        return (window.devicePixelRatio || 1) / backingStore;
    };

    #normalizeCanvasAspectRatio = () => {
        const ratio = this.#getPixelRatio();
        const width = getComputedStyle(this.canvas).getPropertyValue("width").slice(0, -2);
        const height = getComputedStyle(this.canvas).getPropertyValue("height").slice(0, -2);
        
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }
}