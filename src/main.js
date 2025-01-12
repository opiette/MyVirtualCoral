//MyVirtualCoral.js Copyright Owen Piette 2025

import {VirtualCanvas} from './VirtualCanvas.js';


const canvas = document.getElementById("canvas");
canvas.width=500;
canvas.height=500;
const ctx = canvas.getContext("2d")
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const imageLoader = document.getElementById('imageLoader');

var updateInterval;

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
let zoomLevel = 1;  // Level

let vc = null;

function update(){
    //vc.drawRandomPixel();
    vc.analyzePixels();
    vc.doOverlay();
    moveCanvas();
    updateMainCanvas();
}


// Add this function to define what happens on load
function onPageLoad() {
    vc = new VirtualCanvas();
    vc.init();
    // Create a URLSearchParams object
    // Or get individual parameters
    const filename = new URLSearchParams(window.location.search).get('location');
    vc.LoadImageFromAWS(filename);

    canvasOffsetX = 250;
    canvasOffsetY = 250;
    setZoom(1);

    // Reset position and rotation
    canvasOffsetX = canvas.width/2;
    canvasOffsetY = canvas.height/2;
    canvasRotation = 0;
    zoomLevel = 4;

    updateInterval = setInterval(update, 100);
}

// Wait for all resources (images, etc.) to load
window.addEventListener('load', onPageLoad);



// Draw the virtual canvas's backer canvas onto the main canvas
function updateMainCanvas() {
    vc.update();

    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    //Remember, we're transforming the target canvas's drawing coordinates, 
    // not the pixels themselves.
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);     //Move 0,0 to the center
    ctx.rotate(canvasRotation);                         //Rotate around 0,0
    ctx.scale(zoomLevel, zoomLevel); //Zoom
    ctx.translate(-canvas.width/2, -canvas.height/2);     
    ctx.drawImage(vc.bc, canvasOffsetX-canvas.width/2, canvasOffsetY-canvas.width/2, 500, 500, 0,0,500,500);
    
    //ctx.clearRect(-canvasOffsetX, -canvasOffsetY, 10, 10);
    
    ctx.restore();
}

function setZoom(newZoom) {
    zoomLevel = newZoom;
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

    // Reverse rotation
    let rotatedX = canvasX * Math.cos(-canvasRotation) - canvasY * Math.sin(-canvasRotation);
    let rotatedY = canvasX * Math.sin(-canvasRotation) + canvasY * Math.cos(-canvasRotation);
    let prevRotatedX = prevCanvasX * Math.cos(-canvasRotation) - prevCanvasY * Math.sin(-canvasRotation);
    let prevRotatedY = prevCanvasX * Math.sin(-canvasRotation) + prevCanvasY * Math.cos(-canvasRotation);
    
    // Add pan offset
    rotatedX += canvasOffsetX;
    rotatedY += canvasOffsetY;
    prevRotatedX += canvasOffsetX;
    prevRotatedY += canvasOffsetY;

    // Draw on virtual canvas
    vc.virtualCtx.beginPath();
    vc.virtualCtx.lineWidth = 5;
    vc.virtualCtx.lineCap = ctx.lineCap;
    vc.virtualCtx.moveTo(prevRotatedX, prevRotatedY);
    vc.virtualCtx.lineTo(rotatedX, rotatedY);
    vc.virtualCtx.stroke();

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
    const edge = 250/zoomLevel;
    const maxOffsetX = vc.virtualCanvas.width - edge;
    const maxOffsetY = vc.virtualCanvas.height - edge;
    
    // Constrain the offsets
    canvasOffsetX = Math.max(edge, Math.min(maxOffsetX, canvasOffsetX));
    canvasOffsetY = Math.max(edge, Math.min(maxOffsetY, canvasOffsetY));
    
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
//                                 SAVING
// ============================================================================================================



// Modified save functionality

saveBtn.addEventListener('click', async () => {
    const filename = new URLSearchParams(window.location.search).get('location');
    vc.Save(filename);
   
});













