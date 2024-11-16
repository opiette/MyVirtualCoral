

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
const virtualCtx = virtualCanvas.getContext('2d');

// Initialize the virtual canvas with same dimensions
virtualCanvas.width = canvas.width;
virtualCanvas.height = canvas.height;

// Initialize canvas state
function initializeCanvasState() {
    virtualCtx.fillStyle = '#a5d8ff';
    virtualCtx.fillRect(0, 0, virtualCanvas.width, virtualCanvas.height);
    canvasState = virtualCtx.getImageData(0, 0, virtualCanvas.width, virtualCanvas.height);
}

// Update the main canvas display
function updateMainCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#a5d8ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //ctx.putImageData(canvasState, -canvasOffsetX, -canvasOffsetY);

    // Save the context state
    ctx.save();
        
     
     // Then apply rotation around center
     ctx.translate(canvas.width/2, canvas.height/2);
     ctx.rotate(canvasRotation);
     ctx.translate(-canvas.width/2, -canvas.height/2);
 
     // First apply vertical movement (absolute)
     ctx.translate(-canvasOffsetX, -canvasOffsetY);
    
     // Draw the virtual canvas
     ctx.drawImage(virtualCanvas, 0, 0); // Remove Y offset here since it's applied above
 
    // Restore the context state
    ctx.restore();

}

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

    // Draw on virtual canvas
    virtualCtx.beginPath();
    virtualCtx.strokeStyle = ctx.strokeStyle;
    virtualCtx.lineWidth = ctx.lineWidth;
    virtualCtx.lineCap = ctx.lineCap;
    virtualCtx.moveTo(prevX - canvasOffsetX, prevY - canvasOffsetY);
    virtualCtx.lineTo(currentX - canvasOffsetX, currentY - canvasOffsetY);
    virtualCtx.stroke();

    // Update canvas state
    canvasState = virtualCtx.getImageData(0, 0, virtualCanvas.width, virtualCanvas.height);
    
    // Update display
    updateMainCanvas();

    prevX = currentX;
    prevY = currentY;
});

// Navigation function
function moveCanvas(direction) {
    switch(direction) {
        case 'N':
            //canvasOffsetY -= moveAmount;
            canvasOffsetX -= moveAmount * Math.sin(canvasRotation);
            canvasOffsetY -= moveAmount * Math.cos(canvasRotation);
            break;
        case 'S':
            canvasOffsetX += moveAmount * Math.sin(canvasRotation);
            canvasOffsetY += moveAmount * Math.cos(canvasRotation);
            break;
        case 'E':
            canvasRotation -= rotateAmount;
            break;
        case 'W':
            canvasRotation += rotateAmount;
            break;
    }
    updateMainCanvas();
}


// Initialize the canvas
initializeCanvasState();


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
        case 'ArrowUp':
            moveCanvas('N');
            break;
        case 'ArrowDown':
            moveCanvas('S');
            break;
        case 'ArrowRight':
            moveCanvas('E');
            break;
        case 'ArrowLeft':
            moveCanvas('W');
            break;
    }
});



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
    console.log('Load button clicked'); // Debug line
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






