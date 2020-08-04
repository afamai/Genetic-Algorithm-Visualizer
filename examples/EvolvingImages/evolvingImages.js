var canvas = null;
var context = null;

class Polygon {
    constructor(width, height) {
        this.vertices = [];
        this.width = width;
        this.height = height;
        let r = Math.round(Math.random() * 255);
        let g = Math.round(Math.random() * 255);
        let b = Math.round(Math.random() * 255);
        let a = Math.random();
        this.rgba = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
        this.randomize();
    }

    randomize() {
        for(let i = 0; i < 10; i++) {
            let x = (Math.random() * (this.width + 40)) - 20;
            let y = (Math.random() * (this.height + 40)) - 20;
            this.vertices.push({x: x, y: y});
        }
    }
}

class PolygonImage {
    constructor(width, height) {
        // create canvas
        this.canvas = new OffscreenCanvas(width, height);
        this.ctx = this.canvas.getContext("2d");
        
        // generate list of polygons
        this.polygons = [];
        let size = 100;
        for(let i= 0; i < size; i++) {
            this.polygons.push(new Polygon(width, height));
        }

        // draw the polygons onto the offscreen canvas
        for(let i = 0; i < size; i++) {
            let vertices = this.polygons[i].vertices;
            this.ctx.fillStyle = this.polygons[i].rgba;
            this.ctx.beginPath();
            this.ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let j = 1; j < vertices.length; j++) {
                this.ctx.lineTo(vertices[j].x, vertices[j].y);
            }
            this.ctx.lineTo(vertices[0].x, vertices[0].y);
            this.ctx.fill();
        }

        console.log(this.ctx.getImageData(0,0, width, height));
    }
}

function compare(img1, img2) {
    
}

$(document).ready(function() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext("bitmaprenderer");
    let img = document.getElementById("image");

    canvas.width = img.width;
    canvas.height = img.height;

    let a = new PolygonImage(img.width, img.height);

    let m = new OffscreenCanvas(img.width, img.height);
    let c = m.getContext('2d');
    c.drawImage(img, 0,0);
    console.log(c.getImageData(0,0,img.width, img.height));
    context.transferFromImageBitmap(a.canvas.transferToImageBitmap());
});