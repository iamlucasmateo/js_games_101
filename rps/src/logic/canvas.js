export class CanvasUpdater {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
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

    normalizeCanvasAspectRatio = () => {
        const ratio = this.#getPixelRatio();
        const width = getComputedStyle(this.canvas).getPropertyValue("width").slice(0, -2);
        const height = getComputedStyle(this.canvas).getPropertyValue("height").slice(0, -2);
        
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    createCircle = (cosineArg) => {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.context.beginPath();
        this.context.arc(
            this.canvas.width / 2,
            this.canvas.height / 2,
            (this.canvas.width / 2) * Math.abs(Math.cos(cosineArg)),
            0,
            2 * Math.PI
        );
        this.context.fill();
    }
}