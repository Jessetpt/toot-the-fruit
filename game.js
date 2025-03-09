// Game constants
const GRID_SIZE = 8; // 8x8 grid
const TILE_SIZE = 75; // 75x75 pixel tiles
const BOARD_WIDTH = GRID_SIZE * TILE_SIZE;
const BOARD_HEIGHT = GRID_SIZE * TILE_SIZE;
const ANIMATION_SPEED = 5; // Speed of falling tiles
const FRUIT_TYPES = 3; // 3 types of fruits
const VEG_TYPES = 3; // 3 types of vegetables
const MATCH_MIN = 3; // Minimum 3 in a row to match

// Game variables
let canvas, ctx;
let board = [];
let score = 0;
let gameRunning = false;
let fallingTiles = false;
let selectedTile = null;
let isMobileDevice = false; // Flag to detect mobile device

// Image objects for sprites
let images = {};

// Tile types
const EMPTY = 0;
const FRUIT_1 = 1;
const FRUIT_2 = 2;
const FRUIT_3 = 3;
const VEG_1 = 4;
const VEG_2 = 5;
const VEG_3 = 6;

// Image paths for each tile type
const tileImages = {
    [EMPTY]: null,
    [FRUIT_1]: 'images/apple.png',
    [FRUIT_2]: 'images/orange.png',
    [FRUIT_3]: 'images/banana.png',
    [VEG_1]: 'images/broccoli.png',
    [VEG_2]: 'images/eggplant.png',
    [VEG_3]: 'images/radish.png' // Ensure this path is correct
};

// Fallback colors if images fail to load
const tileColors = {
    [EMPTY]: '#000000',
    [FRUIT_1]: '#FF0000', // Red (Apple)
    [FRUIT_2]: '#FFA500', // Orange
    [FRUIT_3]: '#FFFF00', // Yellow (Banana)
    [VEG_1]: '#00FF00', // Green (Broccoli)
    [VEG_2]: '#800080', // Purple (Eggplant)
    [VEG_3]: '#FFC0CB', // Pink (Radish)
};

// Tile names for future reference
const tileNames = {
    [EMPTY]: 'Empty',
    [FRUIT_1]: 'Apple',
    [FRUIT_2]: 'Orange',
    [FRUIT_3]: 'Banana',
    [VEG_1]: 'Broccoli',
    [VEG_2]: 'Eggplant',
    [VEG_3]: 'Radish',
};

// Variables for touch events
let touchStartX = null;
let touchStartY = null;

// Initialize the game
window.onload = function() {
    init();
};

// Initialize the game board
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Check if the device is mobile
    isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Set canvas dimensions - keep fixed size for consistency
    canvas.width = BOARD_WIDTH;
    canvas.height = BOARD_HEIGHT;
    
    // Add event listeners
    canvas.addEventListener('click', handleClick);
    
    // Add touch event listeners for mobile
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);
    
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', startGame);
    document.getElementById('playAgainButton').addEventListener('click', closeModal);
    document.getElementById('highScoreForm').addEventListener('submit', submitHighScore);
    
    // Load images and initialize board
    loadImages().then(() => {
        console.log('All images loaded successfully');
        initializeBoard();
        drawBoard();
        document.getElementById('score').textContent = `Score: ${score}`;
    }).catch(error => {
        console.error('Error loading images:', error);
    });
}

// Load all the sprite images
async function loadImages() {
    const imagePromises = [];
    
    console.log('Starting to load images...');
    
    // Create a promise for each image to load
    for (let tileType in tileImages) {
        if (tileImages[tileType]) {
            console.log(`Attempting to load: ${tileImages[tileType]} for tile type ${tileType}`);
            
            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                
                img.onload = () => {
                    console.log(`Successfully loaded: ${tileImages[tileType]}`);
                    resolve();
                };
                
                img.onerror = () => {
                    console.error(`Failed to load image: ${tileImages[tileType]}`);
                    // Create a colored fallback
                    const canvas = document.createElement('canvas');
                    canvas.width = TILE_SIZE;
                    canvas.height = TILE_SIZE;
                    const ctx = canvas.getContext('2d');
                    
                    // Draw a colored circle as fallback
                    ctx.fillStyle = tileColors[tileType];
                    ctx.beginPath();
                    ctx.arc(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2 - 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Add text indicator
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(tileNames[tileType].charAt(0), TILE_SIZE/2, TILE_SIZE/2);
                    
                    // Use this canvas as the image
                    img.src = canvas.toDataURL();
                    resolve();
                };
                
                // Add cache-busting parameter to prevent browser caching
                img.src = tileImages[tileType] + '?t=' + new Date().getTime();
                images[tileType] = img;
            });
            
            imagePromises.push(promise);
        }
    }
    
    // Wait for all images to load
    return Promise.all(imagePromises);
}

// Initialize the game board
function initializeBoard() {
    board = [];
    
    for (let row = 0; row < GRID_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < GRID_SIZE; col++) {
            // Randomly decide if this will be a fruit or vegetable
            const isFruit = Math.random() < 0.6; // 60% chance of fruit
            
            if (isFruit) {
                // Random fruit (1-3)
                board[row][col] = Math.floor(Math.random() * FRUIT_TYPES) + 1;
            } else {
                // Random vegetable (4-6)
                board[row][col] = Math.floor(Math.random() * VEG_TYPES) + FRUIT_TYPES + 1;
            }
        }
    }
    
    // Make sure there are no matches at the start
    while (findMatches().length > 0) {
        initializeBoard();
    }
}

// Start the game
function startGame() {
    console.log("Starting game...");
    
    // Reset score
    score = 0;
    document.getElementById('score').textContent = `Score: ${score}`;
    
    // Update button visibility
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('restartButton').style.display = 'inline-block';
    
    // Make sure the canvas is visible - be extra explicit for mobile
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    
    console.log("Canvas dimensions:", canvas.width, canvas.height);
    console.log("Canvas style:", canvas.style.display);
    
    // Initialize the game
    initializeBoard();
    gameRunning = true;
    
    // Force a redraw immediately
    drawBoard();
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
}

// Main game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Check if the board is stable (no falling tiles)
    if (!fallingTiles) {
        const matches = findMatches();
        
        if (matches.length > 0) {
            // Process matches and update score
            processMatches(matches);
            updateScore(matches.length);
            
            // Check if game over after processing matches
            if (isGameOver()) {
                endGame();
                return;
            }
        }
    }
    
    // Handle falling tiles
    handleFallingTiles();
    
    // Draw the board
    drawBoard();
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Draw the game board
function drawBoard() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    ctx.fillStyle = '#add8e6'; // Light blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw each tile
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const tileType = board[row][col];
            
            // Draw tile background - highlight if selected
            if (selectedTile && selectedTile.row === row && selectedTile.col === col) {
                // Draw a highlight for the selected tile
                ctx.fillStyle = '#ffff00'; // Yellow highlight
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                // Draw a border for the selected tile
                ctx.strokeStyle = '#ff0000'; // Red border
                ctx.lineWidth = 3;
                ctx.strokeRect(col * TILE_SIZE + 2, row * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }
            
            if (tileType !== EMPTY) {
                try {
                    // Draw the tile image if loaded
                    if (images[tileType] && images[tileType].complete) {
                        ctx.drawImage(images[tileType], col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    } else {
                        // Fallback if image not loaded
                        ctx.fillStyle = tileColors[tileType];
                        ctx.beginPath();
                        ctx.arc(col * TILE_SIZE + TILE_SIZE/2, row * TILE_SIZE + TILE_SIZE/2, TILE_SIZE/2 - 5, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Draw tile type indicator as fallback
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '16px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(tileNames[tileType].charAt(0), col * TILE_SIZE + TILE_SIZE/2, row * TILE_SIZE + TILE_SIZE/2);
                    }
                } catch (e) {
                    console.error('Error drawing tile at', row, col, ':', e);
                }
            }
        }
    }
}

// Handle touch start event
function handleTouchStart(event) {
    if (!gameRunning || fallingTiles) return;
    
    // Prevent default behavior (scrolling, zooming)
    event.preventDefault();
    
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the scaling factor for the canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Apply scaling to get the correct coordinates within the canvas
    touchStartX = (touch.clientX - rect.left) * scaleX;
    touchStartY = (touch.clientY - rect.top) * scaleY;
    
    console.log("Touch start at:", touchStartX, touchStartY);
    console.log("Canvas size:", canvas.width, canvas.height);
    console.log("Display size:", rect.width, rect.height);
    console.log("Scale factors:", scaleX, scaleY);
    
    const col = Math.floor(touchStartX / TILE_SIZE);
    const row = Math.floor(touchStartY / TILE_SIZE);
    
    console.log("Calculated position:", row, col);
    
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        selectedTile = { row, col };
        // Draw a highlight around the selected tile
        drawBoard();
    }
}

// Handle touch end event
function handleTouchEnd(event) {
    if (!gameRunning || fallingTiles) return;
    
    // Prevent default behavior
    event.preventDefault();
    
    if (event.changedTouches.length > 0) {
        const touch = event.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        
        // Calculate the scaling factor for the canvas
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // Apply scaling to get the correct coordinates within the canvas
        const touchEndX = (touch.clientX - rect.left) * scaleX;
        const touchEndY = (touch.clientY - rect.top) * scaleY;
        
        // Calculate the grid position of the touch end
        const endCol = Math.floor(touchEndX / TILE_SIZE);
        const endRow = Math.floor(touchEndY / TILE_SIZE);
        
        // Calculate the direction of the swipe
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Minimum swipe distance to distinguish between a swipe and a tap
        const minSwipeDistance = TILE_SIZE / 4;
        const isSwipe = Math.abs(deltaX) >= minSwipeDistance || Math.abs(deltaY) >= minSwipeDistance;
        
        if (selectedTile) {
            const { row: selectedRow, col: selectedCol } = selectedTile;
            
            // Handle both swipe and tap-then-tap
            if (isSwipe) {
                // This is a swipe - use the existing swipe logic
                let newRow = selectedRow;
                let newCol = selectedCol;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    newCol = selectedCol + (deltaX > 0 ? 1 : -1);
                } else {
                    // Vertical swipe
                    newRow = selectedRow + (deltaY > 0 ? 1 : -1);
                }
                
                console.log("Swipe attempt:", selectedRow, selectedCol, "to", newRow, newCol);
                
                // Check if the new position is valid and perform the swap
                if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE &&
                    (newRow !== selectedRow || newCol !== selectedCol)) {
                    swapTiles(selectedRow, selectedCol, newRow, newCol);
                }
            } 
            else {
                // This is a tap - check if it's an adjacent tile
                console.log("Tap attempt from", selectedRow, selectedCol, "to", endRow, endCol);
                
                // Check if the tapped position is valid
                if (endRow >= 0 && endRow < GRID_SIZE && endCol >= 0 && endCol < GRID_SIZE) {
                    // Check if the tapped tile is adjacent to the selected tile
                    if ((Math.abs(endRow - selectedRow) === 1 && endCol === selectedCol) ||
                        (Math.abs(endCol - selectedCol) === 1 && endRow === selectedRow)) {
                        // Valid adjacent tile - perform the swap
                        swapTiles(selectedRow, selectedCol, endRow, endCol);
                    } else {
                        // Not adjacent - select the new tile instead
                        selectedTile = { row: endRow, col: endCol };
                        drawBoard();
                        
                        // Exit early without resetting selectedTile
                        return;
                    }
                }
            }
        } else {
            // No tile was previously selected, select this one if valid
            if (endRow >= 0 && endRow < GRID_SIZE && endCol >= 0 && endCol < GRID_SIZE) {
                selectedTile = { row: endRow, col: endCol };
                drawBoard();
                
                // Exit early without resetting selectedTile
                return;
            }
        }
        
        // Reset selection
        selectedTile = null;
        touchStartX = null;
        touchStartY = null;
    }
}

// Handle tile click
function handleClick(event) {
    if (!gameRunning || fallingTiles) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        if (selectedTile) {
            // If a tile is already selected, try to swap
            const { row: selectedRow, col: selectedCol } = selectedTile;
            
            // Check if the clicked tile is adjacent to the selected tile
            if ((Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
                (Math.abs(col - selectedCol) === 1 && row === selectedRow)) {
                // Swap tiles
                swapTiles(selectedRow, selectedCol, row, col);
                selectedTile = null;
            } else {
                // Select the new tile instead
                selectedTile = { row, col };
            }
        } else {
            // Select the tile
            selectedTile = { row, col };
        }
    }
}

// Swap two tiles
function swapTiles(row1, col1, row2, col2) {
    // Swap tiles in the board array
    const temp = board[row1][col1];
    board[row1][col1] = board[row2][col2];
    board[row2][col2] = temp;
    
    // Check if the swap created any matches
    const matches = findMatches();
    
    if (matches.length > 0) {
        // Valid move, process matches
        processMatches(matches);
        updateScore(matches.length);
    } else {
        // Invalid move, swap back
        const temp = board[row1][col1];
        board[row1][col1] = board[row2][col2];
        board[row2][col2] = temp;
    }
}

// Find all matches on the board
function findMatches() {
    const matches = [];
    
    // Check for horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE - 2; col++) {
            const tileType = board[row][col];
            
            // Only check for fruit matches (1-3)
            if (tileType >= FRUIT_1 && tileType <= FRUIT_3) {
                if (board[row][col + 1] === tileType && board[row][col + 2] === tileType) {
                    // Found a horizontal match of 3 or more
                    let matchLength = 3;
                    while (col + matchLength < GRID_SIZE && board[row][col + matchLength] === tileType) {
                        matchLength++;
                    }
                    
                    // Add match to the list
                    matches.push({
                        type: 'horizontal',
                        row,
                        col,
                        length: matchLength,
                        tileType
                    });
                    
                    // Skip ahead to avoid duplicate matches
                    col += matchLength - 1;
                }
            }
        }
    }
    
    // Check for vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row < GRID_SIZE - 2; row++) {
            const tileType = board[row][col];
            
            // Only check for fruit matches (1-3)
            if (tileType >= FRUIT_1 && tileType <= FRUIT_3) {
                if (board[row + 1][col] === tileType && board[row + 2][col] === tileType) {
                    // Found a vertical match of 3 or more
                    let matchLength = 3;
                    while (row + matchLength < GRID_SIZE && board[row + matchLength][col] === tileType) {
                        matchLength++;
                    }
                    
                    // Add match to the list
                    matches.push({
                        type: 'vertical',
                        row,
                        col,
                        length: matchLength,
                        tileType
                    });
                    
                    // Skip ahead to avoid duplicate matches
                    row += matchLength - 1;
                }
            }
        }
    }
    
    return matches;
}

// Process matches and remove matched tiles
function processMatches(matches) {
    // Keep track of tiles to remove
    const tilesToRemove = new Set();
    
    // Process each match
    matches.forEach(match => {
        if (match.type === 'horizontal') {
            // Remove horizontal match
            for (let i = 0; i < match.length; i++) {
                tilesToRemove.add(`${match.row},${match.col + i}`);
                
                // Check for adjacent vegetables
                checkAdjacentVegetables(match.row, match.col + i, tilesToRemove);
            }
        } else if (match.type === 'vertical') {
            // Remove vertical match
            for (let i = 0; i < match.length; i++) {
                tilesToRemove.add(`${match.row + i},${match.col}`);
                
                // Check for adjacent vegetables
                checkAdjacentVegetables(match.row + i, match.col, tilesToRemove);
            }
        }
    });
    
    // Remove all marked tiles
    tilesToRemove.forEach(key => {
        const [row, col] = key.split(',').map(Number);
        board[row][col] = EMPTY;
    });
    
    // Set flag to handle falling tiles
    fallingTiles = true;
}

// Check for adjacent vegetables to remove
function checkAdjacentVegetables(row, col, tilesToRemove) {
    // Check all adjacent tiles (up, down, left, right)
    const directions = [
        { row: -1, col: 0 }, // Up
        { row: 1, col: 0 },  // Down
        { row: 0, col: -1 }, // Left
        { row: 0, col: 1 }   // Right
    ];
    
    directions.forEach(dir => {
        const newRow = row + dir.row;
        const newCol = col + dir.col;
        
        // Check if the adjacent tile is within bounds
        if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
            const tileType = board[newRow][newCol];
            
            // Check if it's a vegetable (4-6)
            if (tileType >= VEG_1 && tileType <= VEG_3) {
                tilesToRemove.add(`${newRow},${newCol}`);
            }
        }
    });
}

// Handle falling tiles after matches are removed
function handleFallingTiles() {
    let tilesFell = false;
    
    // Move tiles down to fill empty spaces
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = GRID_SIZE - 1; row > 0; row--) {
            if (board[row][col] === EMPTY) {
                // Look for a tile above to fall down
                for (let above = row - 1; above >= 0; above--) {
                    if (board[above][col] !== EMPTY) {
                        // Move the tile down
                        board[row][col] = board[above][col];
                        board[above][col] = EMPTY;
                        tilesFell = true;
                        break;
                    }
                }
            }
        }
    }
    
    // Fill in empty spaces at the top with new tiles
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row < GRID_SIZE; row++) {
            if (board[row][col] === EMPTY) {
                // Randomly decide if this will be a fruit or vegetable
                const isFruit = Math.random() < 0.6; // 60% chance of fruit
                
                if (isFruit) {
                    // Random fruit (1-3)
                    board[row][col] = Math.floor(Math.random() * FRUIT_TYPES) + 1;
                } else {
                    // Random vegetable (4-6)
                    board[row][col] = Math.floor(Math.random() * VEG_TYPES) + FRUIT_TYPES + 1;
                }
                
                tilesFell = true;
            }
        }
    }
    
    // Update the falling tiles flag
    fallingTiles = tilesFell;
}

// Update the score
function updateScore(matchCount) {
    // Each match is worth 10 points multiplied by the number of matches
    const points = matchCount * 10;
    score += points;
    document.getElementById('score').textContent = `Score: ${score}`;
}

// Check if the game is over
function isGameOver() {
    // For this simple version, the game is never over
    // In a real game, you might check for a time limit or other conditions
    return false;
}

// End the game
function endGame() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverModal').style.display = 'block';
}

// Close the game over modal
function closeModal() {
    document.getElementById('gameOverModal').style.display = 'none';
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('restartButton').style.display = 'inline-block';
    startGame();
}

// Submit high score
function submitHighScore(event) {
    event.preventDefault();
    
    const playerName = document.getElementById('playerName').value;
    const playerEmail = document.getElementById('playerEmail').value;
    
    // In a real game, you would send this data to a server
    console.log(`High Score Submitted - Name: ${playerName}, Email: ${playerEmail}, Score: ${score}`);
    
    // For now, just show a message and close the modal
    alert(`Thanks ${playerName}! Your score of ${score} has been submitted.`);
    closeModal();
}

// Add a function to manually end the game for testing
function testEndGame() {
    endGame();
}
