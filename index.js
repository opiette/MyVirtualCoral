


function createImageGrid() {
    const grid = document.getElementById('imageGrid');
    const baseUrl = "https://myvirtualcoral.s3.us-east-2.amazonaws.com/locations/";
    
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 9; col++) {
            // Create anchor element
            const link = document.createElement('a');
            link.href = `submarine.html?location=${col}${row}`; // or whatever URL pattern you need
            
            // Create image element
            const img = document.createElement('img');
            const imageNumber = col.toString() + row.toString();
            img.src = baseUrl + imageNumber + ".jpg";
            img.alt = `Location ${imageNumber}`;
            img.loading = 'lazy';
            
            // Set image styles
            const viewportWidth = window.innerWidth;
            const imageWidth = (viewportWidth - 9*1 - (9 - 1)) / 9;
            img.style.width = `${imageWidth}px`;
            img.style.height = `${imageWidth}px`;
            img.style.objectFit = 'cover';
            
            // Add image to anchor
            link.appendChild(img);
            
            // Add anchor to grid
            grid.appendChild(link);
        }
    }
}


// Call the function to generate the grid
document.addEventListener('DOMContentLoaded', createImageGrid);
