
class Item {
    type; //0=nothing? 1=food speck, 2=fish
    x;
    y;
    direction;
    color;
    spritedata;
    width;
    height;
}





export class VirtualCanvas{
    
    boatdata = {
        "name":"boat",
        "color":"00,00,00",
        "width":20,
        "height":20,
        "bitmap":
        [
        "00000000111000000000",
        "00000001111100000000",
        "00000011111110000000",
        "01100111111111001100",
        "11111111111111111110",
        "11111111111111111110",
        "01100111111111001100",
        "00000011111110000000",
        "00000001111100000000",
        "00000000111000000000",
        "00000001010100000000",
        "00000011101110000000",
        "00000001000100000000",
        "00000000000000000000",
        "00000000000000000000",
        "00000000000000000000",
        "00000000000000000000",
        "00000000000000000000",
        "00000000000000000000",
        "00000000000000000000"
        ]
        }

    virtualCanvas = null;
    virtualCtx = null;
    img;
    overlayItems = new Array();
    bc = null;
    bctx = null;

    NumberOfCorals = 0;
    NumberOfFood = 0;

    foodCounterElement;


    init(){
        this.virtualCanvas = document.createElement('canvas'); // Virtual canvas for storing full image
        this.virtualCtx = this.virtualCanvas.getContext('2d');

        this.virtualCanvas.width = 500;
        this.virtualCanvas.height = 500;

        this.virtualCtx.fillStyle = '#a5d8ff';
        this.virtualCtx.fillRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
        
        this.bc = document.createElement('canvas');
        this.bctx = this.bc.getContext('2d');

        this.bc.width = 500;
        this.bc.height = 500;

        this.foodCounterElement = document.getElementById('status');
    }

    onImageLoad(){
        
        // Clear virtual canvas
        this.virtualCtx.clearRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
        this.virtualCtx.fillStyle = '#a5d8ff';
        this.virtualCtx.fillRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
        
        // Calculate scaling
        const scale = Math.min(
            this.virtualCanvas.width / this.img.width,
            this.virtualCanvas.height / this.img.height
        );
        
        const x = (this.virtualCanvas.width - this.img.width * scale) / 2;
        const y = (this.virtualCanvas.height - this.img.height * scale) / 2;
        
        // Draw on virtual canvas
        //this.virtualCtx.drawImage(this.img, x, y, this.img.width * scale, this.img.height * scale);
        this.virtualCtx.drawImage(this.img, 0, 0);//, this.img.width * scale, this.img.height * scale);
        
    }
    
    LoadImageFromAWS(filename){
        
        if (!filename) {
            alert('Please enter a location');
            return;
        }
    
        // Create a new image object
        this.img = new Image();
        
        // Set cross-origin to anonymous to avoid CORS issues with public S3 buckets
        this.img.crossOrigin = "anonymous";
        
        // When the image loads, draw it on the canvas
        //Have to use arrow funciton so "this" is this, not image!
        this.img.onload = () => {
            this.onImageLoad();
        };
        
        // Handle any errors
        this.img.onerror = function() {
            alert('Error loading image. Please check the image key and try again.');
        };
    
        // Construct the S3 URL and load the image
        this.img.src = `https://myvirtualcoral.s3.us-east-2.amazonaws.com/locations/${filename}.jpg`;
        
    }
    



    // ============================================================================================================
    //                                 ENVIRONMENT EFFECTS
    // ============================================================================================================

    

    static rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
      
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, v = max;
      
        const d = max - min;
      
        s = max === 0 ? 0 : d / max;
      
        if (max === min) {
          h = 0; // achromatic
        } else {
          switch (max) {
            case r:
              h = (g - b) / d + (g < b ? 6 : 0);
              break;
            case g:
              h = (b - r) / d + 2;
              break;
            case b:
              h = (r - g) / d + 4;
              break;
          }
          h /= 6;
        }
      
        return [h * 360, s * 100, v * 100];
      }

    static getRGB(data, x, y, width){
        const i = (y*width*4) + x;
        return [data[i], data[i+1], data[i+2]];
    }

    static isWater(data, x, y, width){ //Is more blue?
        let c = VirtualCanvas.getRGB(data,x,y,width);
        let d = VirtualCanvas.rgbToHsv(c[0], c[1], c[2]);
        //See hue color wheel
        //return d[0] > 160 && d[0] < 275;
        //if (!(d[0] > 130 && d[0] < 275)) console.log(c[0] +","+ c[1]+"," + c[2]+"," + d[0]);
        return d[0] > 130 && d[0] < 275;
    }

    static isCoral(data, x, y, width){
        let h = VirtualCanvas.getHue(data, x, y, width);
        if (h < 160 || h > 275) return true;
        else return false;
    }

    static isIsolated(data, x, y,width){ //Are all neighbors empty?
        return this.isWater(data, x-1, y,width) && this.isWater(data, x+1, y,width) && this.isWater(data, x, y-1,width) && this.isWater(data, x, y+1,width);
    }

    static getHue(data, x, y, width){

        const index = (y * width + x) * 4;
        
        // Get RGB values
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        let d = VirtualCanvas.rgbToHsv(r, g, b);
        return d[0];
    }

    static CheckAndFill(data, x, y, width, dx, dy, virtualCtx){
        if (!VirtualCanvas.isCoral(data, x+dx, y+dy, width)) {
            let c = VirtualCanvas.getRGB(data, x+dx, y+dy, width);
            virtualCtx.fillStyle = `rgb({c[0]},{c[1]},{c[2]})`;
            virtualCtx.fillRect(x, y, 1, 1);
            return true;
        }
        return false;
    }


    doOverlay(){
        //Generate new items
        if (Math.random() < 0.05){
            let item = new Item();
            item.type = 1; // loose coral
            item.color = [Math.floor(Math.random()*256), Math.floor(Math.random()*256), Math.floor(Math.random()*256)];
            this.overlayItems.push(item);
            item.x = Math.floor(Math.random()*this.virtualCanvas.width);
            item.y = Math.floor(Math.random()*this.virtualCanvas.width);
            this.NumberOfCoral += 1;
        }

        if (Math.random() < 0.5){
            let item = new Item();
            item.type = 2; // food speck
            item.color = [100, 100+Math.floor(Math.random()*156), 100];
            this.overlayItems.push(item);
            item.x = Math.floor(Math.random()*this.virtualCanvas.width);
            item.y = Math.floor(Math.random()*this.virtualCanvas.width);
            this.NumberOfFood += 1;
        }

    }

    //Draw data canvas and overlay items onto backer canvas
    update(canvasOffsetX, canvasOffsetY, canvasRotation){
        this.bctx.drawImage(this.virtualCanvas, 0, 0, 500, 500, 0, 0, 500, 500);

        for (let i = this.overlayItems.length-1; i > 0; i--) {
            const item = this.overlayItems[i];

            if (item.type == 1){
                this.bctx.fillStyle = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`;
                this.bctx.fillRect(item.x, item.y, 1, 1);
                if (Math.random() < 0.5) item.x += 1;
                if (Math.random() < 0.5) item.y += 1;
            }
            if (item.type == 2){
                this.bctx.fillStyle = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`;
                this.bctx.fillRect(item.x, item.y, 1, 1);
                if (Math.random() < 0.5) item.x += 1;
                if (Math.random() < 0.5) item.y += 1;
            }
            
            
            if (item.type == 0) {
                this.overlayItems.splice(i, 1);
            }
        }

        if (this.foodCounterElement) {
            this.foodCounterElement.innerHTML = ``;
            this.foodCounterElement.innerHTML += `Coral: ${this.NumberOfCorals}<br/>`;
            this.foodCounterElement.innerHTML += `Food: ${this.NumberOfFood}<br/>`;
            //this.foodCounterElement.innerHTML += `len: ${this.overlayItems.length}<br/>`;
        }

        let bc = document.createElement('canvas');
        let bbctx = bc.getContext("2d");
        bbctx.save();
        bbctx.translate(this.boatdata.width/2, this.boatdata.height/2);
        bbctx.rotate(-canvasRotation);
        bbctx.translate(-this.boatdata.width/2, -this.boatdata.height/2);
        bbctx.width = this.boatdata.width;
        bbctx.height = this.boatdata.height;
        
        for (let y=0; y<this.boatdata.bitmap.length; ++y){
            for (let x=0; x<this.boatdata.bitmap[y].length; ++x){
                if (this.boatdata.bitmap[y][x] > 0) {
                    bbctx.fillStyle = `rgb(${this.boatdata.color})`;
                    bbctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        this.bctx.drawImage(bc, canvasOffsetX-10, canvasOffsetY-10);
        bbctx.restore();
        
        //Check to see if it hit a reef
        let c = this.virtualCtx.getImageData(canvasOffsetX, canvasOffsetY,1,1).data;
        if (VirtualCanvas.isCoral(c,0,0,0)){
            if (Math.random() < 0.1){
                this.virtualCtx.fillStyle = `rgb(0, 33, 125)`;
                this.virtualCtx.fillRect(canvasOffsetX-10+Math.random()*20, canvasOffsetY-10+Math.random()*20, 1, 1);
            }
            return false;
        }
        return true;

    }

    analyzePixels() {
        // Get the image data from virtual canvas
        const imageData = this.virtualCtx.getImageData(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
        const data = imageData.data;
        
        let scanOffsetX = Math.floor(Math.random() * 10);
        let scanOffsetY = Math.floor(Math.random() * 10);
        let scanOffsetD1 = 10+Math.floor(Math.random() * 10);
        let scanOffsetD2 = 10+Math.floor(Math.random() * 10);

        // Check every 10th pixel
        for (let y = scanOffsetY; y < this.virtualCanvas.height; y += scanOffsetD1) {
            for (let x = scanOffsetX; x < this.virtualCanvas.width; x += scanOffsetD2) {
                const index = (y * this.virtualCanvas.width + x) * 4;
                
                // Get RGB values
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                //Apply rules

                //If an isolated piece, drift.
                
                //Ocean acidification causes erosion of coral
                //If coral is next to water, erode.
                if (VirtualCanvas.isCoral(data, x, y, this.virtualCanvas.width)) {
                    if (Math.random() < 0.01) {
                        VirtualCanvas.CheckAndFill(data, x, y, this.virtualCanvas.width, -1, 0, this.virtualCtx);
                        VirtualCanvas.CheckAndFill(data, x, y, this.virtualCanvas.width, 1, 0, this.virtualCtx);
                        VirtualCanvas.CheckAndFill(data, x, y, this.virtualCanvas.width, 0, 1, this.virtualCtx);
                        VirtualCanvas.CheckAndFill(data, x, y, this.virtualCanvas.width, 0, -1, this.virtualCtx);                        
                    }

                }

            }
        }
        
        //Check for overlay interactions
        for (let i = 0; i < this.overlayItems.length; i++) {
            const item = this.overlayItems[i];
    
            //loose coral
            if (item.type == 1){
                const index = (item.y * this.virtualCanvas.width + item.x) * 4;
                if (item.x > this.virtualCanvas.width || item.x < 0 || item.y > this.virtualCanvas.height || item.y < 0) {
                    item.type = 0;
                    this.NumberOfCorals -= 1;
                }

                // Get RGB values
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                //See hue color wheel
                if (VirtualCanvas.isCoral(data, item.x, item.y, this.virtualCanvas.width)) {
                    if (Math.random() < 0.25){
                        const nr = (2*r+item.color[0])/3;
                        const ng = (2*g+item.color[1])/3;
                        const nb = (2*b+item.color[2])/3;

                        //Then grow the coral!
                        this.virtualCtx.fillStyle = `rgb(${r},${g},${b})`;
                        this.virtualCtx.fillRect(item.x, item.y, 1, 1);
                        
                        item.type = 0;
                        
                    }
                }
            }

            //Food
            if (item.type == 2){
                const index = (item.y * this.virtualCanvas.width + item.x) * 4;
                if (item.x > this.virtualCanvas.width || item.x < 0 || item.y > this.virtualCanvas.height || item.y < 0) {
                    item.type = 0;
                    this.NumberOfFood -= 1;
                }

                // Get RGB values
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                //See hue color wheel
                if (VirtualCanvas.isCoral(data, item.x, item.y, this.virtualCanvas.width)) {
                    if (Math.random() < 0.25){
                        const nr = (2*r+item.color[0])/3;
                        const ng = (2*g+item.color[1])/3;
                        const nb = (2*b+item.color[2])/3;

                        //Then grow the coral!
                        this.virtualCtx.fillStyle = `rgb(${r},${g},${b})`;
                        this.virtualCtx.fillRect(item.x, item.y, 1, 1);
                        
                        item.type = 0;
                        this.NumberOfCorals += 1;
                        this.NumberOfFood -= 1;
                    }
                }
            }


            

        }
    }

    async Save(filename){
        // Use virtual canvas for saving
        // Convert canvas to blob

        //const blob = await new Promise(resolve => {
        //    this.virtualCanvas.toBlob(resolve, 'image/jpeg');
        //});

        this.virtualCanvas.toBlob( async (blob) => {

        const url = `https://myvirtualcoral.s3.us-east-2.amazonaws.com/locations/${filename}.jpg`;
        
        // Upload to S3
        const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: blob,
            headers: {
                'Content-Type': 'image/jpeg'
            }
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Upload failed');
        }

        // Show success message
        alert('Saved successfully!');
    });
    }


}
