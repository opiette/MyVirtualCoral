//MyVirtualCoral.js Copyright Owen Piette 2025

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d")
const virtualCanvas = document.createElement('canvas'); // Virtual canvas for storing full image
const virtualCtx = virtualCanvas.getContext('2d');
const xBox = document.getElementById("x");
const yBox = document.getElementById("y");
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const imageLoader = document.getElementById('imageLoader');
var pixelInterval;
var greenRemovalInterval;
var moveInterval;

const repeatDelay = 100; // How often the movement repeats in milliseconds
const moveAmount = 10;
const rotateAmount = Math.PI / 36; // 5 degrees in radians

let prevX = null
let prevY = null
let draw = false
let navIntervals = {
    N: null,
    S: null,
    E: null,
    W: null
};
let canvasOffsetX = 250;
let canvasOffsetY = 250;
let canvasRotation = 0; // In radians
let canvasState; // Store the complete canvas state
let zoomLevel = 1;  // Level



// Initialize canvas state
function initializeCanvasState() {
    virtualCanvas.width = 500;
    virtualCanvas.height = 500;

    virtualCtx.fillStyle = '#a5d8ff';
    virtualCtx.fillRect(0, 0, virtualCanvas.width, virtualCanvas.height);
    canvasState = virtualCtx.getImageData(0, 0, virtualCanvas.width, virtualCanvas.height);

    canvasOffsetX = 250;
    canvasOffsetY = 250;
}

// Add this function to define what happens on load
function onPageLoad() {
    //canvas.height = canvas.getBoundingClientRect.height;
    //canvas.width = canvas.getBoundingClientRect.width;
    canvas.width=500;
    canvas.height=500;
    ctx.lineWidth = 5

    initializeCanvasState();
    setZoom(1);
    updateMainCanvas();

    LoadFromAWS();

    // Start the intervals
    pixelInterval = setInterval(drawRandomPixel, 100);
    greenRemovalInterval = setInterval(removeGreenPixels, 100);
    moveInterval = setInterval(moveCanvas, 100);
}

// Add this event listener to run when the DOM is fully loaded
//document.addEventListener('DOMContentLoaded', onPageLoad);
// Alternatively, if you need to wait for all resources (images, etc.) to load
window.addEventListener('load', onPageLoad);

function LoadFromAWS(){

    // Create a URLSearchParams object
    const urlParams = new URLSearchParams(window.location.search);

    // Get all parameters
    //const params = Object.fromEntries(urlParams.entries());

    // Or get individual parameters
    const filename = urlParams.get('location');

    

    if (!filename) {
        alert('Please enter a location');
        return;
    }

    // Get the canvas and context
    const canvas = document.getElementById('canvas'); // Make sure this matches your canvas ID
    const ctx = canvas.getContext('2d');

    // Create a new image object
    const img = new Image();
    
    // Set cross-origin to anonymous to avoid CORS issues with public S3 buckets
    img.crossOrigin = "anonymous";
    
    // When the image loads, draw it on the canvas
    img.onload = function() {
        // Reset position and rotation
        canvasOffsetX = canvas.width/2;
        canvasOffsetY = canvas.height/2;
        canvasRotation = 0;
        zoomLevel = 4;
        
        // Clear virtual canvas
        virtualCtx.clearRect(0, 0, virtualCanvas.width, virtualCanvas.height);
        virtualCtx.fillStyle = '#a5d8ff';
        virtualCtx.fillRect(0, 0, virtualCanvas.width, virtualCanvas.height);
        
        // Calculate scaling
        const scale = Math.min(
            virtualCanvas.width / img.width,
            virtualCanvas.height / img.height
        );
        
        const x = (virtualCanvas.width - img.width * scale) / 2;
        const y = (virtualCanvas.height - img.height * scale) / 2;
        
        // Draw on virtual canvas
        virtualCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        // Update canvas state
        canvasState = virtualCtx.getImageData(0, 0, virtualCanvas.width, virtualCanvas.height);
        
        // Update display
        updateMainCanvas();
    };

    // Handle any errors
    img.onerror = function() {
        alert('Error loading image. Please check the image key and try again.');
    };

    // Construct the S3 URL and load the image
    // Replace 'your-bucket-name' and 'region' with your actual bucket name and region
    img.src = `https://myvirtualcoral.s3.us-east-2.amazonaws.com/locations/${filename}.jpg`;
}


// Draw the virtual canvas onto the main canvas
function updateMainCanvas() {
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //ctx.fillStyle = '#a5d8ff';
    //ctx.fillRect(0, 0, canvas.width, canvas.height);

    //Remember, we're transforming the target canvas's drawing coordinates, 
    // not the pixels themselves.
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(canvasRotation);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-canvas.width/2, -canvas.height/2);
    
    ctx.drawImage(virtualCanvas, canvasOffsetX-canvas.width/2, canvasOffsetY-canvas.width/2, 500, 500, 0,0,500,500);
    
    ctx.restore();
    
    
    //ctx.fillStyle = '#ffd8ff';
    //const rect = canvas.getBoundingClientRect();
    //ctx.fillRect(prevX-rect.left, prevY-rect.top, 10,10)

    
}

function setZoom(newZoom) {
    zoomLevel = newZoom;
    updateMainCanvas();
}



// ============================================================================================================
//                                 DRAWING WITH THE MOUSE
// ============================================================================================================


// Set draw to true when mouse is pressed
window.addEventListener("mousedown", (e) => draw = true)
// Set draw to false when mouse is released
window.addEventListener("mouseup", (e) => draw = false)



// Modified drawing function
window.addEventListener("mousemove", (e) => {
    if(prevX == null || prevY == null || !draw){
        prevX = e.clientX;
        prevY = e.clientY;
        return;
    }

    let currentX = e.clientX;
    let currentY = e.clientY;
    
    // Get canvas position
    const rect = canvas.getBoundingClientRect();

    // Convert mouse coordinates to canvas coordinates
    let canvasX = currentX - rect.left - 35;
    let canvasY = currentY - rect.top - 35;
    let prevCanvasX = prevX - rect.left - 35;
    let prevCanvasY = prevY - rect.top - 35;
    
    // Adjust for canvas center (rotation pivot point)
    canvasX -= canvas.width/2;
    canvasY -= canvas.height/2;
    prevCanvasX -= canvas.width/2;
    prevCanvasY -= canvas.height/2;

    // Reverse Level
    canvasX /= zoomLevel;
    canvasY /= zoomLevel;
    prevCanvasX /= zoomLevel;
    prevCanvasY /= zoomLevel;

    //xBox.value = Math.round(canvasX).toString() + "," + Math.round(canvasY);
    
    // Reverse rotation
    let rotatedX = canvasX * Math.cos(-canvasRotation) - canvasY * Math.sin(-canvasRotation);
    let rotatedY = canvasX * Math.sin(-canvasRotation) + canvasY * Math.cos(-canvasRotation);
    let prevRotatedX = prevCanvasX * Math.cos(-canvasRotation) - prevCanvasY * Math.sin(-canvasRotation);
    let prevRotatedY = prevCanvasX * Math.sin(-canvasRotation) + prevCanvasY * Math.cos(-canvasRotation);

    // Add back canvas center offset
    //rotatedX += canvas.width/2;
    //rotatedY += canvas.height/2;
    //prevRotatedX += canvas.width/2;
    //prevRotatedY += canvas.height/2;

    // Add pan offset
    rotatedX += canvasOffsetX;
    rotatedY += canvasOffsetY;
    prevRotatedX += canvasOffsetX;
    prevRotatedY += canvasOffsetY;

    // Draw on virtual canvas
    virtualCtx.beginPath();
    virtualCtx.strokeStyle = ctx.strokeStyle;
    virtualCtx.lineWidth = ctx.lineWidth;
    virtualCtx.lineCap = ctx.lineCap;
    virtualCtx.moveTo(prevRotatedX, prevRotatedY);
    virtualCtx.lineTo(rotatedX, rotatedY);
    virtualCtx.stroke();

    // Update canvas state
    canvasState = virtualCtx.getImageData(0, 0, virtualCanvas.width, virtualCanvas.height);
    
    // Update display
    updateMainCanvas();

    prevX = currentX;
    prevY = currentY;
});



let xinertia = 0;
let rinertia = 0;
let xiamount = 500/50;
let riamount = 2*Math.PI/50;

function moveCanvas() {
    // Store the previous offset values in case we need to revert
    const prevOffsetX = canvasOffsetX;
    const prevOffsetY = canvasOffsetY;

    // Calculate the adjusted move amount based on Level
    const adjustedMoveAmount = xinertia / zoomLevel;
    
    if (xinertia > 0) {
        xinertia -= xiamount/10;
        canvasOffsetX -= adjustedMoveAmount * Math.sin(canvasRotation);
        canvasOffsetY -= adjustedMoveAmount * Math.cos(canvasRotation);
    }
    if (xinertia < 0){
        xinertia += xiamount/10;
        canvasOffsetX -= adjustedMoveAmount * Math.sin(canvasRotation);
        canvasOffsetY -= adjustedMoveAmount * Math.cos(canvasRotation);
    }

    if (rinertia > 0){
        rinertia -= riamount/10;
        canvasRotation -= rinertia;
    }
    if (rinertia < 0){
        rinertia += riamount/10;
        canvasRotation -= rinertia;
    }
    
    if (Math.abs(xinertia) < 1) xinertia = 0;
    if (Math.abs(rinertia) < 0.01) rinertia = 0;

    if (Math.abs(xinertia) > xiamount*3) xinertia -= xinertia/3;
    if (Math.abs(rinertia) > riamount*2) rinertia /= 2;


    // Calculate boundaries based on Level level
    const maxOffsetX = virtualCanvas.width
    const maxOffsetY = virtualCanvas.height

    // Constrain the offsets
    canvasOffsetX = Math.max(0, Math.min(maxOffsetX, canvasOffsetX));
    canvasOffsetY = Math.max(0, Math.min(maxOffsetY, canvasOffsetY));
    
}





// ============================================================================================================
//                                 CONTROLS
// ============================================================================================================


// Add touch/mouse event listeners to nav buttons
document.querySelectorAll('.dir div').forEach(button => {
    // Start movement on mousedown/touchstart
    const startMove = (e) => {
        e.preventDefault(); // Prevent default to avoid selection
        const direction = button.className;
        switch (direction){
            case 'N':
                xinertia += xiamount;
                break;
            case 'S':
                xinertia -= xiamount;
                break;
            case 'E':
                rinertia += riamount;
                break;
            case 'W':
                rinertia -= riamount;
                break;

        }

        //moveCanvas(direction, moveAmount);
        // Start repeating movement after a short delay
        navIntervals[direction] = setInterval(() => {
            //moveCanvas(direction, moveAmount);
        }, repeatDelay);
    };

    // Stop movement on mouseup/touchend
    const stopMove = (e) => {
        e.preventDefault();
        const direction = button.className;
        if (navIntervals[direction]) {
            clearInterval(navIntervals[direction]);
            navIntervals[direction] = null;
        }
    };

    // Add event listeners
    button.addEventListener('mousedown', startMove);
    button.addEventListener('mouseup', stopMove);
    button.addEventListener('mouseleave', stopMove);
    button.addEventListener('touchstart', startMove);
    button.addEventListener('touchend', stopMove);
});

// Add keyboard controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'w':
            xinertia += xiamount;
            break;
        case 's':
            xinertia -= xiamount;
            break;
        case 'd':
            rinertia += riamount;
            break;
        case 'a':
            rinertia -= riamount;
            break;
            
        case '+':
        case '=':
            setZoom(zoomLevel * 1.1); // Zoom in by 10%
            break;
        case '-':
            setZoom(zoomLevel / 1.1); // Zoom out by 10%
            break;
        
            
    }
});

document.getElementById('exitButton').addEventListener('click', function() {
    window.location.href = 'index.html';
});

document.querySelectorAll('.zoom-button').forEach(button => {
    button.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const isZoomIn = button.classList.contains('plus');
        
        if (isZoomIn) {
            setZoom(zoomLevel * 1.1); // Zoom in by 10%
        } else {
            setZoom(zoomLevel / 1.1); // Zoom out by 10%
        }
    });

    // Prevent text selection on mobile
    button.addEventListener('touchstart', (e) => {
        e.preventDefault();
    });
});

// Add keyboard shortcuts for zoom
document.addEventListener('keydown', (e) => {
    if (e.key === '=' || e.key === '+') {
        setZoom(zoomLevel * 1.1);
    } else if (e.key === '-') {
        setZoom(zoomLevel / 1.1);
    }
});

// ============================================================================================================
//                                 LOADING
// ============================================================================================================



// Modified save functionality
/*
saveBtn.addEventListener('click', () => {
    // Use virtual canvas for saving
    const link = document.createElement('a');
    link.download = 'my-drawing.png';
    link.href = virtualCanvas.toDataURL('image/png');
    link.click();
});
*/



// ============================================================================================================
//                                 ENVIRONMENT EFFECTS
// ============================================================================================================

function drawRandomPixel() {
    // Generate random coordinates within canvas bounds
    const x = Math.floor(Math.random() * virtualCanvas.width);
    const y = Math.floor(Math.random() * virtualCanvas.height);
    
    // Generate random RGB colors
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    // Save the current virtual context state
    virtualCtx.save();
    
    // Set fill style to random color
    virtualCtx.fillStyle = `rgb(${r},${g},${b})`;
    
    // Draw 1px rectangle (pixel)
    virtualCtx.fillRect(x, y, 1, 1);
    
    // Restore the context state
    virtualCtx.restore();
    
    // Update canvas state
    canvasState = virtualCtx.getImageData(0, 0, virtualCanvas.width, virtualCanvas.height);
    
    // Update main canvas display
    updateMainCanvas();
}




function removeGreenPixels() {
    // Get the image data from virtual canvas
    const imageData = virtualCtx.getImageData(0, 0, virtualCanvas.width, virtualCanvas.height);
    const data = imageData.data;
    
    let scanOffsetX = Math.floor(Math.random() * 10);
    let scanOffsetY = Math.floor(Math.random() * 10);
    let scanOffsetD1 = 10+Math.floor(Math.random() * 10);
    let scanOffsetD2 = 10+Math.floor(Math.random() * 10);

    // Check every 10th pixel
    for (let y = scanOffsetY; y < virtualCanvas.height; y += scanOffsetD1) {
        for (let x = scanOffsetX; x < virtualCanvas.width; x += scanOffsetD2) {
            const index = (y * virtualCanvas.width + x) * 4;
            
            // Get RGB values
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            
            // Check if green is more than 50% of total color
            const total = r + g + b;
            if (total < 256 && g > b && g > r){
                // If green dominant, make pixel transparent
                virtualCtx.fillStyle = `rgb(${r},${g},${b})`;
                if (Math.random() >  0.5) virtualCtx.fillRect(x, y+1, 1, 1);
                if (Math.random() >  0.5) virtualCtx.fillRect(x+1, y+1, 1, 1);
                if (Math.random() >  0.5) virtualCtx.fillRect(x+1, y, 1, 1);
                if (Math.random() >  0.5) virtualCtx.fillRect(x+1, y+1, 1, 1);
                if (Math.random() >  0.5) virtualCtx.fillRect(x, y-1, 1, 1);
                if (Math.random() >  0.5) virtualCtx.fillRect(x-1, y-1, 1, 1);
                if (Math.random() >  0.5) virtualCtx.fillRect(x-1, y, 1, 1);
                if (Math.random() >  0.5) virtualCtx.fillRect(x-1, y+1, 1, 1);
            }
        }
    }
    
    // Update canvas state
    canvasState = virtualCtx.getImageData(0, 0, virtualCanvas.width, virtualCanvas.height);
    
    // Update display
    updateMainCanvas();
}




