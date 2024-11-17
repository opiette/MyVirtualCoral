

const canvas = document.getElementById("canvas")
canvas.height = window.innerHeight
canvas.width = window.innerWidth
const ctx = canvas.getContext("2d")
let prevX = null
let prevY = null
ctx.lineWidth = 5
let draw = false
let navIntervals = {
    N: null,
    S: null,
    E: null,
    W: null
};
const repeatDelay = 100; // How often the movement repeats in milliseconds

let canvasOffsetX = 0;
let canvasOffsetY = 0;
let canvasRotation = 0; // In radians
const moveAmount = 10;
const rotateAmount = Math.PI / 36; // 5 degrees in radians
let canvasState; // Store the complete canvas state
const virtualCanvas = document.createElement('canvas'); // Virtual canvas for storing full image
// Initialize the virtual canvas with same dimensions
virtualCanvas.width = canvas.width;
virtualCanvas.height = canvas.height;
const virtualCtx = virtualCanvas.getContext('2d');

// Initialize canvas state
function initializeCanvasState() {
    virtualCtx.fillStyle = '#a5d8ff';
    virtualCtx.fillRect(0, 0, virtualCanvas.width, virtualCanvas.height);
    canvasState = virtualCtx.getImageData(0, 0, virtualCanvas.width, virtualCanvas.height);
}

// Add these variables at the top with your other state variables
let zoomLevel = 1;  // zoom
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;

// Modify your updateMainCanvas function to include zoom
function updateMainCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#a5d8ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save the context state
    ctx.save();
    /*
    // Move to center of screen
    ctx.translate(centerX/2, centerY/2);
    
    // Apply zoom
    ctx.scale(zoomLevel, zoomLevel);
    
    // Move back by half canvas size (adjusted for zoom)
    ctx.translate(-centerX, -centerY);

    // Apply rotation around center
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(canvasRotation);
    ctx.translate(-canvas.width/2, -canvas.height/2);

    // Apply pan offsets
    ctx.translate(-canvasOffsetX, -canvasOffsetY);
    */
    // Draw the virtual canvas
    ctx.drawImage(virtualCanvas, 0, 0);
    ctx.fillRect(prevX, prevY, 10,10)

    // Restore the context state
    ctx.restore();
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


const xBox = document.getElementById("x");
const yBox = document.getElementById("y");

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
    let canvasX = currentX - rect.left;
    let canvasY = currentY - rect.top;
    let prevCanvasX = prevX - rect.left;
    let prevCanvasY = prevY - rect.top;

    xBox.value = Math.round(canvasX).toString() + "," + Math.round(canvasY);

    virtualCtx.fillRect(canvasX, canvasY, 10,10)

    // Adjust for canvas center (rotation pivot point)
    //canvasX -= canvas.width/2;
    //canvasY -= canvas.height/2;
    //prevCanvasX -= canvas.width/2;
    //prevCanvasY -= canvas.height/2;

    
    // Reverse zoom
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

    yBox.value = Math.round(rotatedX).toString() + "," + Math.round(rotatedY);


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




function moveCanvas(direction) {
    // Store the previous offset values in case we need to revert
    const prevOffsetX = canvasOffsetX;
    const prevOffsetY = canvasOffsetY;

    // Calculate the adjusted move amount based on zoom
    const adjustedMoveAmount = moveAmount / zoomLevel;

    switch(direction) {
        case 'N':
            canvasOffsetX -= adjustedMoveAmount * Math.sin(canvasRotation);
            canvasOffsetY -= adjustedMoveAmount * Math.cos(canvasRotation);
            break;
        case 'S':
            canvasOffsetX += adjustedMoveAmount * Math.sin(canvasRotation);
            canvasOffsetY += adjustedMoveAmount * Math.cos(canvasRotation);
            break;
        case 'E':
            canvasRotation -= rotateAmount;
            break;
        case 'W':
            canvasRotation += rotateAmount;
            break;
    }

    // Calculate boundaries based on zoom level
    const maxOffsetX = (virtualCanvas.width * zoomLevel - canvas.width) / (2 * zoomLevel);
    const maxOffsetY = (virtualCanvas.height * zoomLevel - canvas.height) / (2 * zoomLevel);

    // Constrain the offsets
    canvasOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, canvasOffsetX));
    canvasOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, canvasOffsetY));

    updateMainCanvas();
}



// Initialize the canvas
initializeCanvasState();



// ============================================================================================================
//                                 CONTROLS
// ============================================================================================================


// Add touch/mouse event listeners to nav buttons
document.querySelectorAll('.dir div').forEach(button => {
    // Start movement on mousedown/touchstart
    const startMove = (e) => {
        e.preventDefault(); // Prevent default to avoid selection
        const direction = button.className;
        moveCanvas(direction);
        // Start repeating movement after a short delay
        navIntervals[direction] = setInterval(() => {
            moveCanvas(direction);
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

    // Add event listenersAmazon Cognito identity pools to allow unauthenticated guest access
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
            moveCanvas('N');
            break;
        case 's':
            moveCanvas('S');
            break;
        case 'd':
            moveCanvas('E');
            break;
        case 'a':
            moveCanvas('W');
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



// ============================================================================================================
//                                 LOADING
// ============================================================================================================

// Get button elements
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const imageLoader = document.getElementById('imageLoader');

// Modified save functionality
saveBtn.addEventListener('click', () => {
    // Use virtual canvas for saving
    const link = document.createElement('a');
    link.download = 'my-drawing.png';
    link.href = virtualCanvas.toDataURL('image/png');
    link.click();
});

// Load button click handler
loadBtn.addEventListener('click', () => {
    imageLoader.click();
});


// Modified image loading function
imageLoader.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
            // Reset position and rotation
            canvasOffsetX = 0;
            canvasOffsetY = 0;
            canvasRotation = 0;
            
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
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
});

document.getElementById('loadS3Btn').addEventListener('click', function() {
    const imageKey = document.getElementById('s3ImageKey').value;
    if (!imageKey) {
        alert('Please enter an image key');
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
        canvasOffsetX = 0;
        canvasOffsetY = 0;
        canvasRotation = 0;
        
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
    img.src = `https://myvirtualcoral.s3.us-east-2.amazonaws.com/${imageKey}`;
});


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

// Start the interval
const pixelInterval = setInterval(drawRandomPixel, 100);

// Optional: To stop it later, you can use:
// clearInterval(pixelInterval);



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
            if (total < 256 && g > total / 3){
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

// Start the interval
const greenRemovalInterval = setInterval(removeGreenPixels, 100);




