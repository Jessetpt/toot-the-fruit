// Game constants
const GRID_SIZE = 8; // 8x8 grid
const TILE_SIZE = 75; // 75x75 pixel tiles
const BOARD_WIDTH = GRID_SIZE * TILE_SIZE;
const BOARD_HEIGHT = GRID_SIZE * TILE_SIZE;
const ANIMATION_SPEED = 5; // Speed of falling tiles
const FRUIT_TYPES = 3; // 3 types of fruits
const VEG_TYPES = 3; // 3 types of vegetables
const MATCH_MIN = 3; // Minimum 3 in a row to match

// Color scheme constants
const COLOR_BLUE = '#209CBD'; // Blue/Teal
const COLOR_ORANGE = '#F68318'; // Orange
const COLOR_BLACK = '#000000'; // Black
const COLOR_WHITE = '#FFFFFF'; // White
const COLOR_LIGHT_BLUE = '#a3d6ec'; // More saturated and noticeable blue for tile backgrounds

// Sound effect paths
const SOUND_SELECT = 'sounds/clickbuttonsound.wav';
const SOUND_SWAP = 'sounds/swoosh.wav';
const SOUND_MATCH = 'sounds/correct.wav';
const SOUND_INVALID = 'sounds/fail.wav';
const SOUND_FALL = 'sounds/fall.wav';
const SOUND_GAME_OVER = 'sounds/game over.wav';

// Pre-loaded audio elements
const audioElements = {};

// Super simple sound control
let soundEnabled = true;
let lastPlayedSound = '';
let lastSoundTime = 0;
// Mobile-specific sound tracking
let lastFallSoundTime = 0;
let lastMatchSoundTime = 0;

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

// Global variables for animation
let animationRunning = false;
let lastFrameTime = 0;

// Add this global variable near the top with other game variables
let gameStartOverlay = null;
let showingStartPrompt = false;

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

// Tile names for fallback display
const tileNames = {
    [EMPTY]: '',
    [FRUIT_1]: 'Apple',
    [FRUIT_2]: 'Orange',
    [FRUIT_3]: 'Banana',
    [VEG_1]: 'Broccoli',
    [VEG_2]: 'Eggplant',
    [VEG_3]: 'Radish',
};

// Fallback colors if images fail to load
const tileColors = {
    [EMPTY]: COLOR_BLACK, // Black
    [FRUIT_1]: COLOR_ORANGE, // Orange (Apple)
    [FRUIT_2]: COLOR_ORANGE, // Orange (Orange)
    [FRUIT_3]: COLOR_ORANGE, // Orange (Banana)
    [VEG_1]: COLOR_BLUE, // Blue (Broccoli)
    [VEG_2]: COLOR_BLUE, // Blue (Eggplant)
    [VEG_3]: COLOR_BLUE, // Blue (Radish)
};

// Variables for touch events
let touchStartX = null;
let touchStartY = null;

// Initialize the game
window.onload = function() {
    init();
    
    // Create the start game overlay immediately
    createGameStartOverlay();
    
    // Start animation loop immediately for UI responsiveness
    startAnimationLoop();
    
    // Initialize audio system (mute button)
    initAudio();
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
    
    // Set canvas styling but let the border be drawn by our drawing code
    canvas.style.backgroundColor = 'transparent'; // Make transparent so our drawing handles all visuals
    canvas.style.borderRadius = '15px';
    canvas.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    canvas.style.border = 'none'; // Remove default border
    
    // Remove any previous dynamic styles
    let oldStyleEl = document.getElementById('game-dynamic-styles');
    if (oldStyleEl) {
        oldStyleEl.parentNode.removeChild(oldStyleEl);
    }
    
    // Add event listeners
    canvas.addEventListener('click', handleClick);
    
    // Add touch event listeners for mobile
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);
    
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', startGame);
    document.getElementById('playAgainButton').addEventListener('click', closeModal);
    document.getElementById('highScoreForm').addEventListener('submit', submitHighScore);
    
    loadImages().then(() => {
        console.log('All images loaded successfully');
        
        // Initialize and draw the board
        initializeBoard();
        drawBoard();
        
        // Update score display
        document.getElementById('score').textContent = `Score: ${score}`;
    }).catch(error => {
        console.error('Error loading images:', error);
    });
};

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
    } else {
        // Only handle falling tiles if they need to fall
        handleFallingTiles();
    }
    
    // Game logic updates are handled here, but we don't need to call drawBoard()
    // since the animation loop will handle rendering
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Draw the game board
function drawBoard() {
    // Check if we should render at all
    if (!canvas || !ctx) return;
    
    // Clear the canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create border using two rounded rectangles
    const borderWidth = 4; // Slightly thicker for better visibility
    const radius = 15;
    
    // Function to draw rounded rectangle
    function drawRoundedRect(x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    // Draw outer rectangle with horizontal gradient (blue to orange)
    const outerGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    outerGradient.addColorStop(0, COLOR_BLUE);
    outerGradient.addColorStop(0.5, COLOR_ORANGE);
    outerGradient.addColorStop(1, COLOR_BLUE);
    
    ctx.fillStyle = outerGradient;
    drawRoundedRect(0, 0, canvas.width, canvas.height, radius);
    ctx.fill();
    
    // Draw inner rectangle with game background
    drawRoundedRect(borderWidth, borderWidth, 
                   canvas.width - (borderWidth * 2), 
                   canvas.height - (borderWidth * 2), 
                   radius - borderWidth);
    ctx.fillStyle = COLOR_LIGHT_BLUE;
    ctx.fill();
    
    // Set clipping region for game content
    ctx.save();
    drawRoundedRect(borderWidth, borderWidth, 
                   canvas.width - (borderWidth * 2), 
                   canvas.height - (borderWidth * 2), 
                   radius - borderWidth);
    ctx.clip();
    
    // Draw grid lines using orange for better visibility
    ctx.strokeStyle = `rgba(246, 131, 24, 0.5)`; // Orange grid lines with 50% opacity
    ctx.lineWidth = 1;
    
    // Draw vertical grid lines
    for (let col = 1; col < GRID_SIZE; col++) {
        ctx.beginPath();
        ctx.moveTo(col * TILE_SIZE, 0);
        ctx.lineTo(col * TILE_SIZE, canvas.height);
        ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let row = 1; row < GRID_SIZE; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * TILE_SIZE);
        ctx.lineTo(canvas.width, row * TILE_SIZE);
        ctx.stroke();
    }
    
    // Draw each tile
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const tileType = board[row][col];
            
            // Draw tile background - highlight if selected
            if (selectedTile && selectedTile.row === row && selectedTile.col === col) {
                // Calculate a pulsating color effect for the background
                const pulseAmount = (Math.sin(Date.now() / 200) + 1) / 2; // Value between 0 and 1
                
                // Create a pulsing background color (blue to orange)
                // Interpolate between COLOR_ORANGE and COLOR_BLUE
                const orangeRGB = hexToRgb(COLOR_ORANGE);
                const blueRGB = hexToRgb(COLOR_BLUE);
                
                const r = Math.floor(orangeRGB.r - pulseAmount * (orangeRGB.r - blueRGB.r));
                const g = Math.floor(orangeRGB.g - pulseAmount * (orangeRGB.g - blueRGB.g));
                const b = Math.floor(orangeRGB.b - pulseAmount * (orangeRGB.b - blueRGB.b));
                
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                
                // Fill the background
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                // Calculate glowing border size
                const glowSize = 3 + pulseAmount * 4; // Pulsing between 3 and 7 pixels
                
                // Draw a glowing border for the selected tile
                ctx.strokeStyle = COLOR_BLACK; // Black border
                ctx.lineWidth = 4;
                ctx.strokeRect(col * TILE_SIZE + glowSize, row * TILE_SIZE + glowSize, 
                              TILE_SIZE - glowSize * 2, TILE_SIZE - glowSize * 2);
                
                // Add a secondary inner glow for emphasis
                ctx.strokeStyle = COLOR_WHITE; // White inner border
                ctx.lineWidth = 2;
                ctx.strokeRect(col * TILE_SIZE + glowSize/2, row * TILE_SIZE + glowSize/2, 
                              TILE_SIZE - glowSize, TILE_SIZE - glowSize);
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
                        ctx.fillStyle = COLOR_WHITE; // White text
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
    
    // Restore context after drawing game elements
    ctx.restore();
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
}

// Create and show the game start overlay
function createGameStartOverlay() {
    console.log("Creating game start overlay");
    
    // Create the overlay
    gameStartOverlay = document.createElement('div');
    gameStartOverlay.style.position = 'fixed';
    gameStartOverlay.style.top = '0';
    gameStartOverlay.style.left = '0';
    gameStartOverlay.style.width = '100%';
    gameStartOverlay.style.height = '100%';
    gameStartOverlay.style.backgroundColor = `rgba(${hexToRgb(COLOR_BLACK).r}, ${hexToRgb(COLOR_BLACK).g}, ${hexToRgb(COLOR_BLACK).b}, 0.8)`; // Black with transparency
    gameStartOverlay.style.display = 'flex';
    gameStartOverlay.style.flexDirection = 'column';
    gameStartOverlay.style.justifyContent = 'center';
    gameStartOverlay.style.alignItems = 'center';
    gameStartOverlay.style.zIndex = '1000';
    gameStartOverlay.style.cursor = 'pointer';
    gameStartOverlay.style.backdropFilter = 'blur(5px)';
    gameStartOverlay.style.animation = 'fadeIn 0.8s';
    gameStartOverlay.style.overflowY = 'auto';
    
    // Check if we're on a mobile device - we'll use the same styling for desktop, but track for logging
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log("Is mobile device:", isMobile);
    
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
            /* Make styles consistent across all devices */
            .start-button {
                background-color: ${COLOR_ORANGE} !important;
                color: ${COLOR_WHITE} !important;
                padding: 15px 40px !important;
                border-radius: 50px !important;
                font-size: 22px !important;
                font-weight: bold !important;
                box-shadow: 0 0 30px rgba(246, 131, 24, 0.8) !important;
                margin: 20px auto 30px auto !important;
                cursor: pointer !important;
                animation: pulse 1.5s infinite !important;
                text-align: center !important;
                user-select: none !important;
                display: block !important;
                width: fit-content !important;
            }
            .game-title {
                color: ${COLOR_BLUE} !important;
                font-size: 36px !important;
                text-shadow: 0 0 10px rgba(32, 156, 189, 0.5) !important;
                text-align: center !important;
                width: 100% !important;
            }
            .game-instructions {
                color: ${COLOR_WHITE} !important;
                font-size: 20px !important;
                text-align: center !important;
                margin: 0 auto !important;
                max-width: 80% !important;
                line-height: 1.6 !important;
            }
            @media (max-width: 768px) {
                .start-button {
                    padding: 12px 30px !important;
                    font-size: 18px !important;
                    margin: 15px auto 25px auto !important;
                }
                .game-title {
                    font-size: 30px !important;
                }
                .game-instructions {
                    font-size: 18px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create a prominent start button - using classes for consistent styling
    const startButton = document.createElement('div');
    startButton.className = 'start-button';
    startButton.textContent = 'START GAME';
    
    // Create a heading for the overlay - using classes for consistent styling
    const heading = document.createElement('h2');
    heading.className = 'game-title';
    heading.textContent = 'Toot Your Own Horn';
    heading.style.margin = '0 0 20px 0'; // Add bottom margin for spacing
    heading.style.width = '100%'; // Ensure full width for proper centering
    
    // Add a logo below the title
    const logo = document.createElement('img');
    logo.src = 'images/logodark.png?v=4'; // Cache-busting query param
    logo.alt = 'Company Logo';
    logo.style.width = '100px'; // Larger logo (was 40px)
    logo.style.height = 'auto';
    logo.style.margin = '0 auto 30px auto'; // Center horizontally with margin
    logo.style.display = 'block'; // Block display for proper centering
    logo.style.opacity = '1';
    
    // Also add responsive styling for the logo based on device
    if (isMobile) {
        logo.style.width = '80px'; // Slightly smaller on mobile but still larger than original
    } else {
        logo.style.width = '100px'; // Keep desktop size
    }
    
    // Create instructions - using classes for consistent styling
    const instructions = document.createElement('p');
    instructions.className = 'game-instructions';
    instructions.innerHTML = 'Match fruits with fruits and destroy the vegetables.<br><br>Make groups of three or more to score points!';
    instructions.style.lineHeight = '1.6';
    instructions.style.padding = '0 20px';
    
    // Add elements to the overlay in the correct order
    gameStartOverlay.appendChild(heading);
    gameStartOverlay.appendChild(logo);
    gameStartOverlay.appendChild(startButton);
    gameStartOverlay.appendChild(instructions);
    
    // Add click event to start the game
    startButton.addEventListener('click', function(e) {
        e.stopPropagation();
        startGameFromOverlay();
    });
    
    // Also add touch event for mobile
    startButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Touch detected on start button");
        startGameFromOverlay();
    });
    
    // Allow clicking anywhere on the overlay to start
    gameStartOverlay.addEventListener('click', startGameFromOverlay);
    
    // Add touch event for mobile
    gameStartOverlay.addEventListener('touchend', function(e) {
        console.log("Touch detected on overlay");
        startGameFromOverlay();
    });
    
    // Add to the game container
    const gameContainer = document.querySelector('.game-container');
    gameContainer.appendChild(gameStartOverlay);
    
    // Hide the start button since we're using the overlay instead
    document.getElementById('startButton').style.display = 'none';
    
    // Make sure the restart button is ready to be shown later
    document.getElementById('restartButton').style.display = 'none';
    
    console.log("Overlay created and added to DOM");
}

// Function to start the game from the overlay
function startGameFromOverlay() {
    if (!gameStartOverlay) return;
    
    console.log("Starting game from overlay");
    
    // Prevent multiple clicks
    gameStartOverlay.style.pointerEvents = 'none';
    
    // Animate the overlay disappearing
    gameStartOverlay.style.animation = 'fadeOut 0.5s';
    
    // After animation, remove overlay and start the game
    setTimeout(() => {
        const gameContainer = document.querySelector('.game-container');
        if (gameStartOverlay && gameStartOverlay.parentNode === gameContainer) {
            try {
                gameContainer.removeChild(gameStartOverlay);
                console.log("Overlay removed from DOM");
            } catch (e) {
                console.error("Error removing overlay:", e);
            }
        }
        gameStartOverlay = null;
        
        // Show the restart button
        document.getElementById('restartButton').style.display = 'inline-block';
        
        // Start the game
        startGame();
    }, 500);
}

// Handle touch start event - make it as simple as possible
function handleTouchStart(event) {
    if (!gameRunning) return;
    if (fallingTiles) return;
    
    // Prevent default behavior
    event.preventDefault();
    
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    
    // Calculate position in canvas coordinates
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    // Convert to grid position
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    
    // Store as touch start position
    touchStartX = x;
    touchStartY = y;
    
    // Handle the selection just like a mouse click
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        // Play sound
        playSound(SOUND_SELECT, 0.5);
        
        if (!selectedTile) {
            // Select this tile
            selectedTile = { row, col };
            drawBoard();
        } else {
            // If same tile, deselect it
            if (selectedTile.row === row && selectedTile.col === col) {
                selectedTile = null;
                drawBoard();
            } else {
                // Check if adjacent
                const rowDiff = Math.abs(selectedTile.row - row);
                const colDiff = Math.abs(selectedTile.col - col);
                
                if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
                    // Adjacent - swap tiles
                    playSound(SOUND_SWAP, 0.7);
                    swapTiles(selectedTile.row, selectedTile.col, row, col);
                } else {
                    // Not adjacent - select new tile
                    selectedTile = { row, col };
                    drawBoard();
                }
            }
        }
    }
}

// Handle touch end event - simplest possible implementation
function handleTouchEnd(event) {
    // Reset touch tracking
    touchStartX = null;
    touchStartY = null;
}

// Handle mouse clicks on the game board - simplified
function handleClick(event) {
    // Exit if the game is not running
    if (!gameRunning) return;
    
    // Get click coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to grid coordinates
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    
    // Process the click if it's within the grid
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        // Play sound
        playSound(SOUND_SELECT, 0.5);
        
        if (!selectedTile) {
            // First selection
            selectedTile = { row, col };
            drawBoard();
        } else {
            // Second selection
            if (selectedTile.row === row && selectedTile.col === col) {
                // Clicked same tile - deselect
                selectedTile = null;
                drawBoard();
            } else {
                // Check if adjacent
                const rowDiff = Math.abs(selectedTile.row - row);
                const colDiff = Math.abs(selectedTile.col - col);
                
                if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
                    // Adjacent - swap tiles
                    playSound(SOUND_SWAP, 0.7);
                    swapTiles(selectedTile.row, selectedTile.col, row, col);
                } else {
                    // Not adjacent - select new tile
                    selectedTile = { row, col };
                    drawBoard();
                }
            }
        }
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
        
        // Play match sound with delay to avoid overlap with swap sound
        setTimeout(() => playSound(SOUND_MATCH, 0.8), 100);
        
        // Clear selection after a successful swap
        selectedTile = null;
    } else {
        // Invalid move, play invalid sound and swap back
        // Use setTimeout to ensure it plays even on mobile
        setTimeout(() => playSound(SOUND_INVALID, 0.8), 50);
        
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
    // Play match sound with volume based on match count
    const volume = Math.min(0.5 + (matches.length * 0.1), 1.0);
    // Using setTimeout to ensure it plays
    setTimeout(() => playSound(SOUND_MATCH, volume), 0);
    
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
    
    // Remove matched tiles
    tilesToRemove.forEach(key => {
        const [row, col] = key.split(',').map(Number);
        board[row][col] = EMPTY;
    });
    
    // Handle falling tiles and new tiles
    handleFallingTiles();
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

// Handle falling tiles
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
    
    // Only play the fall sound if tiles actually fell and we haven't played it recently
    if (tilesFell) {
        playSound(SOUND_FALL, 0.5);
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
    playSound(SOUND_GAME_OVER, 0.8);
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalScoreInput').value = score;
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

// Load all audio files up front
function preloadAudio() {
    // List of all sounds to preload
    const sounds = [
        SOUND_SELECT,
        SOUND_SWAP,
        SOUND_MATCH,
        SOUND_INVALID,
        SOUND_FALL,
        SOUND_GAME_OVER
    ];
    
    // Create audio elements for each sound
    sounds.forEach(sound => {
        const audio = new Audio(sound);
        audio.preload = 'auto';
        audioElements[sound] = audio;
        // Attempt to load the audio
        audio.load();
    });
}

// Simple sound system - absolutely minimal
function playSound(url, volume = 1.0) {
    if (!soundEnabled) return;
    
    const now = Date.now();
    
    // MOBILE-SPECIFIC HANDLING - much stricter throttling for mobile devices
    if (isMobileDevice) {
        // Special handling for fall sound on mobile
        if (url === SOUND_FALL) {
            // For mobile: Only play fall sound once every 3 seconds
            if (now - lastFallSoundTime < 3000) {
                return; // Skip this fall sound on mobile
            }
            // Update mobile-specific fall sound tracking
            lastFallSoundTime = now;
            // Make fall sounds MUCH quieter on mobile
            volume = Math.min(volume, 0.2);
        } 
        // For match sounds on mobile - stricter throttling
        else if (url === SOUND_MATCH) {
            if (now - lastMatchSoundTime < 1000) {
                return; // Only play match sound once per second on mobile
            }
            lastMatchSoundTime = now;
        }
        // For all other repeated sounds - stricter throttling
        else if (url === lastPlayedSound && now - lastSoundTime < 750) {
            return; // Longer delay for repeated sounds on mobile
        }
    }
    // DESKTOP HANDLING - no changes to existing desktop behavior
    else {
        // Original desktop throttling logic
        if (url === SOUND_FALL && now - lastSoundTime < 500) {
            return; // Original fall sound throttling for desktop
        } else if (url === lastPlayedSound && now - lastSoundTime < 350) {
            return; // Original throttling for other sounds on desktop
        }
        
        // Original volume adjustment for desktop
        if (url === SOUND_FALL) {
            volume = Math.min(volume, 0.4); // Original desktop volume adjustment
        }
    }
    
    // Track what we played for all devices
    lastPlayedSound = url;
    lastSoundTime = now;
    
    // Create exactly one Audio element
    const audio = new Audio(url);
    audio.volume = volume;
    
    // Try to play with catch for browsers that block
    try {
        const promise = audio.play();
        if (promise !== undefined) {
            promise.catch(e => {
                console.error("Audio error:", e);
            });
        }
    } catch (e) {
        console.error("Sound play error:", e);
    }
}

// Initialize audio - absolute minimal mute button
function initAudio() {
    // Create mute button
    const muteButton = document.createElement('button');
    muteButton.id = 'muteButton';
    muteButton.innerHTML = 'Sound On';
    muteButton.style.position = 'absolute';
    muteButton.style.top = '10px';
    muteButton.style.right = '10px';
    muteButton.style.zIndex = '1000';
    muteButton.style.background = 'none';
    muteButton.style.border = 'none';
    muteButton.style.fontSize = '14px';
    muteButton.style.cursor = 'pointer';
    muteButton.style.color = COLOR_WHITE;
    muteButton.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
    muteButton.style.padding = '5px';
    
    muteButton.addEventListener('click', toggleSound);
    document.body.appendChild(muteButton);
    
    // Unlock audio for mobile
    unlockAudio();
}

// Unlock audio on mobile devices - more reliable method
function unlockAudio() {
    // Flag to track if audio has been unlocked
    let audioUnlocked = false;
    
    // Function to actually unlock audio
    const unlock = () => {
        if (audioUnlocked) return; // Only need to do this once
        audioUnlocked = true;
        
        // Create and play a silent sound
        const silentSound = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjEyLjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7f////////////////////////////////8AAAAATGF2YzU4LjE5AAAAAAAAAAAAAAAAJAAAAAAAAAAAECAjzEoAAAAAAAAAAAAAAAAAAAAAAP/7kGQAD/DHAEB0cIABSzAJjtCGIAJdSWZxocAFRMCjS3QhiA+AAAAA9eW0l7ElQDnM6DdvTlOA4mjRLZwGTcV0JBJInf0WMRSODGb0IoBmYwJOCTTi6E4oJzCgk4QQns4FhhmcsnCgk4VSHB30EZzwP8XH4uCDggfd/8QD4XBB//5jgg4IP1//yMBAQDwMicEGAgBX1MULfP8YN5EBD/+YWfdjmcaDeLjQz//MxgRIAAQAHALQHwfB+JwfiIYc+D8P////h+H4iGAnBAQDAYDAYDAYDAAAAABLK0MdKUsrQyf/4AACBFK0MdKYAICB+Kg2f0pTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==");
        silentSound.volume = 0;
        
        // Use both play() methods to handle different browser behaviors
        try {
            // Modern promise-based approach
            const promise = silentSound.play();
            if (promise !== undefined) {
                promise.catch(error => {
                    console.log('Audio unlock failed initial attempt:', error);
                    // Try another method for iOS
                    silentSound.currentTime = 0;
                    document.body.addEventListener('click', () => {
                        silentSound.play().catch(e => console.log('Secondary unlock failed:', e));
                    }, {once: true});
                });
            }
        } catch (e) {
            console.log('Audio system exception:', e);
        }
    };
    
    // Listen for user interaction events to unlock audio
    const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
    unlockEvents.forEach(event => {
        document.addEventListener(event, unlock, {once: true});
    });
    
    // Also try to unlock on window focus, which can help on some devices
    window.addEventListener('focus', unlock, {once: true});
    
    // Special handling for Safari's audio issues
    // Force unlock after 2 seconds on iOS Safari if not already unlocked
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setTimeout(() => {
            if (!audioUnlocked) {
                console.log('Forced audio unlock for iOS');
                unlock();
            }
        }, 2000);
    }
}

// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
        muteButton.innerHTML = soundEnabled ? 'Sound On' : 'Sound Off';
    }
}
