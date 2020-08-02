var canvas = null;
var context = null;

class PolygonImage {
    constructor(width, height) {
        // create canvas
        this.canvas = new OffscreenCanvas(width, height);
        this.ctx = this.canvas.getContext("2d");
        
        // draw a triangle
        this.ctx.beginPath();
        this.ctx.moveTo(50, 50);
        this.ctx.lineTo(70, 70);
        this.ctx.lineTo(30, 70);
        this.ctx.lineTo(50, 50);
        this.ctx.stroke();
    }
}

$(document).ready(function() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext("bitmaprenderer");
    let img = document.getElementById("image");

    canvas.width = img.width;
    canvas.height = img.height;

    let a = new PolygonImage(img.width, img.height);

    console.log(context);
    context.transferFromImageBitmap(a.canvas.transferToImageBitmap());
});