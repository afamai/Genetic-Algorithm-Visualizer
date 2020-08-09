var canvas = null;
var context = null;
var imageData = null;

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
        this.width = width;
        this.height = height;
        
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

    getImageData() {
        return this.ctx.getImageData(0,0, this.width, this.height);
    }
}

// Calculate the normalized sum square difference between 2 images
function SSD(imageData1, imageData2) {
    // loop through each pixel in both images
    let data1 = imageData1.data;
    let data2 = imageData2.data;
    let ssq = 0;
    let sumImg1 = 0;
    let sumImg2 = 0;
    for (let i = 0; i < data1.length; i++) {
        ssq += (data1[i] - data2[i])**2
        sumImg1 += data1[i]**2
        sumImg2 += data2[i]**2
    }

    return ssq / Math.sqrt(sumImg1 * sumImg2);
}

function evaluate(population) {
    population.forEach(function(image) {
        image.fitness = SSD(imageData, image.getImageData());
    });
}


$(document).ready(function() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext("bitmaprenderer");

    document.getElementById('file-selector').onchange = function (evt) {
        var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

        // FileReader support
        if (FileReader && files && files.length) {
            var fr = new FileReader();
            fr.onload = function () {
                let img = document.getElementById("image");
                
                img.onload = function () {
                    let img = document.getElementById("image");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    console.log(img.width)
                    let a = new PolygonImage(img.width, img.height);

                    let m = new OffscreenCanvas(img.width, img.height);
                    let c = m.getContext('2d');
                    c.drawImage(img, 0,0);

                    imageData = c.getImageData(0,0,img.width, img.height)

                    console.log(c.getImageData(0,0,img.width, img.height));

                    console.log(compare(a.getImageData(), c.getImageData(0,0,img.width, img.height)));
                    context.transferFromImageBitmap(a.canvas.transferToImageBitmap());

                    evaluate(null);
                }

                img.src = fr.result;

                
            }
            fr.readAsDataURL(files[0]);
        }

        
    }
});


