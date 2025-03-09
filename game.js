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

// Global variables for animation
let animationRunning = false;
let lastFrameTime = 0;

// Add this global variable near the top with other game variables
let showingStartPrompt = false;
let gameStartOverlay = null;

// Initialize the game
window.onload = function() {
    init();
    
    // Create the start game overlay immediately
    createGameStartOverlay();
    
    // Start animation loop immediately for UI responsiveness (selections, etc.)
    startAnimationLoop();
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
    // Reset score
    score = 0;
    document.getElementById('score').textContent = `Score: ${score}`;
    
    // If restarting, hide any leftover overlay
    if (gameStartOverlay) {
        const gameContainer = document.querySelector('.game-container');
        if (gameStartOverlay.parentNode === gameContainer) {
            gameContainer.removeChild(gameStartOverlay);
        }
        gameStartOverlay = null;
    }
    
    // Update button visibility
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('restartButton').style.display = 'inline-block';
    
    // Make sure the canvas is visible
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
    
    // Game logic updates are handled here, but we don't need to call drawBoard()
    // since the animation loop will handle rendering
    
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
                // Draw a more prominent highlight for the selected tile
                // Calculate a pulsating color effect for the background
                const pulseAmount = (Math.sin(Date.now() / 200) + 1) / 2; // Value between 0 and 1
                
                // Create a pulsing background color (yellow to orange)
                const r = Math.floor(255);
                const g = Math.floor(255 - pulseAmount * 100); // Pulsing from yellow to more orange
                const b = Math.floor(pulseAmount * 100);
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                
                // Fill the background
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                // Calculate glowing border size
                const glowSize = 3 + pulseAmount * 4; // Pulsing between 3 and 7 pixels
                
                // Draw a glowing border for the selected tile
                ctx.strokeStyle = '#ff0000'; // Red border
                ctx.lineWidth = 4;
                ctx.strokeRect(col * TILE_SIZE + glowSize, row * TILE_SIZE + glowSize, 
                              TILE_SIZE - glowSize * 2, TILE_SIZE - glowSize * 2);
                
                // Add a secondary inner glow for emphasis
                ctx.strokeStyle = '#ffff00'; // Yellow inner border
                ctx.lineWidth = 2;
                ctx.strokeRect(col * TILE_SIZE + glowSize/2, row * TILE_SIZE + glowSize/2, 
                              TILE_SIZE - glowSize, TILE_SIZE - glowSize);
                
                // Log the selection state to help debugging
                console.log("Drawing selected tile at:", row, col, "with pulse:", pulseAmount);
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

// Create and show the game start overlay
function createGameStartOverlay() {
    // Create the overlay
    gameStartOverlay = document.createElement('div');
    gameStartOverlay.style.position = 'absolute';
    gameStartOverlay.style.top = '0';
    gameStartOverlay.style.left = '0';
    gameStartOverlay.style.width = '100%';
    gameStartOverlay.style.height = '100%';
    gameStartOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    gameStartOverlay.style.display = 'flex';
    gameStartOverlay.style.flexDirection = 'column';
    gameStartOverlay.style.justifyContent = 'center';
    gameStartOverlay.style.alignItems = 'center';
    gameStartOverlay.style.zIndex = '1000';
    gameStartOverlay.style.cursor = 'pointer';
    gameStartOverlay.style.backdropFilter = 'blur(5px)';
    gameStartOverlay.style.animation = 'fadeIn 0.8s';
    
    // Add animation styles if not already present
    if (!document.getElementById('game-animations')) {
        const style = document.createElement('style');
        style.id = 'game-animations';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create a prominent start button
    const startButton = document.createElement('div');
    startButton.style.backgroundColor = '#4a89dc';
    startButton.style.color = 'white';
    startButton.style.padding = '20px 40px';
    startButton.style.borderRadius = '50px';
    startButton.style.fontSize = '24px';
    startButton.style.fontWeight = 'bold';
    startButton.style.boxShadow = '0 0 30px rgba(74, 137, 220, 0.8)';
    startButton.style.margin = '20px';
    startButton.style.cursor = 'pointer';
    startButton.style.animation = 'pulse 1.5s infinite';
    startButton.textContent = 'START GAME';
    
    // Create a heading for the overlay
    const heading = document.createElement('h2');
    heading.style.color = 'white';
    heading.style.fontSize = '36px';
    heading.style.marginBottom = '20px';
    heading.style.textShadow = '0 0 10px rgba(255,255,255,0.5)';
    heading.textContent = 'Toot Your Own Horn';
    
    // Create instructions
    const instructions = document.createElement('p');
    instructions.style.color = 'white';
    instructions.style.fontSize = '18px';
    instructions.style.maxWidth = '80%';
    instructions.style.textAlign = 'center';
    instructions.style.marginTop = '20px';
    instructions.innerHTML = 'Match fruits with fruits and vegetables with vegetables.<br>Make groups of 3 or more to score points!';
    
    // Add elements to the overlay
    gameStartOverlay.appendChild(heading);
    gameStartOverlay.appendChild(startButton);
    gameStartOverlay.appendChild(instructions);
    
    // Add click event to start the game
    startButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent the overlay's click from firing too
        startGameFromOverlay();
    });
    
    // Also allow clicking anywhere on the overlay to start
    gameStartOverlay.addEventListener('click', startGameFromOverlay);
    
    // Add to the game container
    const gameContainer = document.querySelector('.game-container');
    gameContainer.appendChild(gameStartOverlay);
    
    // Hide the start button since we're using the overlay instead
    document.getElementById('startButton').style.display = 'none';
    
    // Make sure the restart button is ready to be shown later
    document.getElementById('restartButton').style.display = 'none';
}

// Function to start the game from the overlay
function startGameFromOverlay() {
    if (!gameStartOverlay) return;
    
    // Animate the overlay disappearing
    gameStartOverlay.style.animation = 'fadeOut 0.5s';
    
    // After animation, remove overlay and start the game
    setTimeout(() => {
        const gameContainer = document.querySelector('.game-container');
        if (gameStartOverlay && gameStartOverlay.parentNode === gameContainer) {
            gameContainer.removeChild(gameStartOverlay);
        }
        gameStartOverlay = null;
        
        // Show the restart button
        document.getElementById('restartButton').style.display = 'inline-block';
        
        // Start the game
        startGame();
    }, 500);
}

// Handle touch start event
function handleTouchStart(event) {
    if (!gameRunning) {
        // Game hasn't started, but no need to show popup now
        // as we have the overlay
        return;
    }
    
    if (fallingTiles) return;
    
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
    
    console.log("Calculated touch position:", row, col);
    
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        selectedTile = { row, col };
        // Draw a highlight around the selected tile
        drawBoard();
    }
}

// Handle touch end event
function handleTouchEnd(event) {
    if (!gameRunning) {
        return;
    }
    
    if (fallingTiles) return;
    
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
        
        console.log("Touch end at position:", endRow, endCol);
        
        // Calculate the direction of the swipe
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Minimum swipe distance to distinguish between a swipe and a tap
        const minSwipeDistance = TILE_SIZE / 4;
        const isSwipe = Math.abs(deltaX) >= minSwipeDistance || Math.abs(deltaY) >= minSwipeDistance;
        
        console.log("Is swipe:", isSwipe, "Delta:", deltaX, deltaY);
        
        if (selectedTile) {
            const { row: selectedRow, col: selectedCol } = selectedTile;
            
            console.log("Selected tile:", selectedRow, selectedCol);
            
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
                
                console.log("Swipe attempt from", selectedRow, selectedCol, "to", newRow, newCol);
                
                // Check if the new position is valid and perform the swap
                if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE &&
                    (newRow !== selectedRow || newCol !== selectedCol)) {
                    swapTiles(selectedRow, selectedCol, newRow, newCol);
                    // Note: swapTiles now handles clearing or maintaining selection
                } else {
                    // Invalid swipe target - maintain selection
                    drawBoard(); // Ensure selection is still visible
                }
            } 
            else {
                // This is a tap - check if it's an adjacent tile
                console.log("Tap-then-tap attempt from", selectedRow, selectedCol, "to", endRow, endCol);
                
                // Check if the tapped position is valid
                if (endRow >= 0 && endRow < GRID_SIZE && endCol >= 0 && endCol < GRID_SIZE) {
                    // Check if the tapped tile is adjacent to the selected tile
                    const isHorizontalAdjacent = Math.abs(endCol - selectedCol) === 1 && endRow === selectedRow;
                    const isVerticalAdjacent = Math.abs(endRow - selectedRow) === 1 && endCol === selectedCol;
                    
                    console.log("Adjacency check:", 
                               "Horizontal:", isHorizontalAdjacent, 
                               "Vertical:", isVerticalAdjacent);
                               
                    if (isHorizontalAdjacent || isVerticalAdjacent) {
                        // Valid adjacent tile - perform the swap
                        console.log("Valid tap-then-tap - swapping tiles");
                        swapTiles(selectedRow, selectedCol, endRow, endCol);
                        // Note: swapTiles now handles the selection state
                    } else if (endRow === selectedRow && endCol === selectedCol) {
                        // Tapped the same tile - keep it selected
                        console.log("Tapped same tile - keeping selected");
                        drawBoard();
                    } else {
                        // Not adjacent - select the new tile instead
                        console.log("Not adjacent - selecting new tile");
                        selectedTile = { row: endRow, col: endCol };
                        drawBoard();
                    }
                } else {
                    // Tapped outside the grid - maintain current selection
                    console.log("Tapped outside grid - maintaining selection");
                    drawBoard(); // Ensure selection is still visible
                }
            }
        } else {
            // No tile was previously selected, select this one if valid
            if (endRow >= 0 && endRow < GRID_SIZE && endCol >= 0 && endCol < GRID_SIZE) {
                console.log("No previous selection - selecting new tile");
                selectedTile = { row: endRow, col: endCol };
                drawBoard();
            }
        }
        
        // If we reach here and still have a selectedTile, make sure to redraw
        // to keep it visible
        if (selectedTile) {
            drawBoard();
        }
        
        // Only clear touchStart coordinates but maintain selectedTile for tap-then-tap
        touchStartX = null;
        touchStartY = null;
    }
}

// Handle tile click
function handleClick(event) {
    if (!gameRunning) {
        return;
    }
    
    if (fallingTiles) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Apply the same scaling logic we use for mobile to ensure consistency
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;
    
    const col = Math.floor(scaledX / TILE_SIZE);
    const row = Math.floor(scaledY / TILE_SIZE);
    
    console.log("Desktop click at position:", row, col);
    
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        const oldSelectedTile = selectedTile ? {...selectedTile} : null;
        
        if (selectedTile) {
            // If a tile is already selected, try to swap
            const { row: selectedRow, col: selectedCol } = selectedTile;
            
            // Check if the clicked tile is adjacent to the selected tile
            const isHorizontalAdjacent = Math.abs(col - selectedCol) === 1 && row === selectedRow;
            const isVerticalAdjacent = Math.abs(row - selectedRow) === 1 && col === selectedCol;
            
            console.log("Adjacency check:", 
                       "Horizontal:", isHorizontalAdjacent, 
                       "Vertical:", isVerticalAdjacent);
                       
            if (isHorizontalAdjacent || isVerticalAdjacent) {
                // Swap tiles - this is a valid move
                console.log("Valid move - swapping tiles");
                swapTiles(selectedRow, selectedCol, row, col);
                // selectedTile is handled by swapTiles
            } else {
                // Select the new tile instead - always select on first click
                console.log("Not adjacent - selecting new tile");
                selectedTile = { row, col };
                // Force a redraw to show the selection
                drawBoard();
            }
        } else {
            // Select the tile
            console.log("No previous selection - selecting tile");
            selectedTile = { row, col };
            // Force a redraw to show the selection
            drawBoard();
        }
        
        console.log("Old selected:", oldSelectedTile, "New selected:", selectedTile);
    }
}

// Swap two tiles
function swapTiles(row1, col1, row2, col2) {
    console.log("Swapping tiles:", row1, col1, "with", row2, col2);
    
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
        
        // Clear selection after a successful swap
        selectedTile = null;
    } else {
        // Invalid move, swap back
        const temp = board[row1][col1];
        board[row1][col1] = board[row2][col2];
        board[row2][col2] = temp;
        
        // Keep the original tile selected after an invalid swap
        selectedTile = { row: row1, col: col1 };
        
        // Force a redraw to show the selection is maintained
        drawBoard();
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

// Start a continuous animation loop separate from the game loop
function startAnimationLoop() {
    if (!animationRunning) {
        animationRunning = true;
        requestAnimationFrame(animationFrame);
    }
}

// Animation frame function for smooth UI elements
function animationFrame(timestamp) {
    // Always redraw the board to ensure animations work
    // This solves the desktop animation issues
    if (!lastFrameTime || timestamp - lastFrameTime >= 16) {
        lastFrameTime = timestamp;
        
        // If a tile is selected or game is running, we need to redraw
        // But we'll always redraw to ensure animations are visible
        if (selectedTile || gameRunning) {
            drawBoard();
        }
        
        // Add debug output to help troubleshoot desktop animation
        if (selectedTile) {
            console.log("Animation frame with selected tile:", selectedTile.row, selectedTile.col, "Time:", Math.floor(timestamp));
        }
    }
    
    // Continue the animation loop
    requestAnimationFrame(animationFrame);
}
