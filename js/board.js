// Board Module for Critocracy - Coordinate-Based System
// Handles drawing, animation, and coordinate lookups.

// ===== Imports =====
import { getPlayers, PLAYER_ROLES, getPlayerById } from './players.js'; 
import { 
    // Import the raw path data using Age names directly
    AgeOfExpansion, 
    AgeOfResistance, 
    AgeOfReckoning, 
    AgeOfLegacy, 
    START_SPACE, FINISH_SPACE,
    ORIGINAL_WIDTH, ORIGINAL_HEIGHT,
    PATH_COLORS
} from './board-data.js'; 

// Define deckRegions as an empty array until properly populated
const deckRegions = [];

// ===== Board Constants =====
const TOKEN_DIR = 'assets/tokens'; 
const TOKEN_SIZE = 24; // Base size in original board pixels

// ===== Board State =====
let boardState = {
    canvas: null,
    ctx: null, 
    scale: 1,
    container: null, // Add container reference
    playerTokenImages: {}, 
    boardImage: null,
    players: [],
    isInitialized: false // Track initialization state
};

// ===== Animation State =====
const animationState = {
    durationPerStep: 300 // ms per space move
};

// ===== Internal Helper Functions (Defined Before Usage) =====

/**
 * Helper function: Ray-casting algorithm
 */
const isPointInPolygon = (point, polygon) => {
    const x = point.x, y = point.y;
    let isInside = false;
    if (!Array.isArray(polygon) || polygon.length < 3) return false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
};

/**
 * Loads player token images.
 */
const loadTokenImages = async () => {
    console.log("Starting to load token images from:", TOKEN_DIR);
    const roles = Object.keys(PLAYER_ROLES);
    
    const promises = roles.map(role => new Promise((resolve) => {
        const img = new Image();
        const token = PLAYER_ROLES[role]?.token;
        
        img.onload = () => {
            console.log(`Successfully loaded token image for ${role}: ${token}`);
            boardState.playerTokenImages[role] = img;
            resolve();
        };
        
        img.onerror = () => {
            console.warn(`Failed to load token image for ${role}: ${TOKEN_DIR}/${token}`);
            
            // Load any other token as a fallback - we know at least one token exists
            // since we've already tried to load all of them
            const fallbackImg = new Image();
            
            fallbackImg.onload = () => {
                console.log(`Using fallback token image for ${role}`);
                boardState.playerTokenImages[role] = fallbackImg;
                resolve();
            };
            
            fallbackImg.onerror = () => {
                console.error(`Could not load any token image for ${role}, creating a placeholder`);
                // Create a basic colored circle as an absolute fallback
                const canvas = document.createElement('canvas');
                canvas.width = 40;
                canvas.height = 40;
                const ctx = canvas.getContext('2d');
                
                // Draw a simple circle with the role letter
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(20, 20, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(role.charAt(0), 20, 20);
                
                boardState.playerTokenImages[role] = canvas;
                resolve();
            };
            
            // Try another token that we know exists
            const existingTokens = Object.keys(boardState.playerTokenImages);
            if (existingTokens.length > 0) {
                const existingRole = existingTokens[0];
                if (boardState.playerTokenImages[existingRole] && 
                    boardState.playerTokenImages[existingRole].complete) {
                    // Simply use an already loaded token
                    console.log(`Using existing token from ${existingRole} as fallback for ${role}`);
                    boardState.playerTokenImages[role] = boardState.playerTokenImages[existingRole];
                    return resolve();
                }
            }
            
            // If no tokens loaded yet, try a different role's token
            const alternateRoles = ['HISTORIAN', 'REVOLUTIONARY', 'COLONIALIST', 'ENTREPRENEUR', 'POLITICIAN', 'ARTIST'];
            for (const altRole of alternateRoles) {
                if (altRole !== role) {
                    fallbackImg.src = `${TOKEN_DIR}/${PLAYER_ROLES[altRole]?.token}?nocache=${Date.now()}`;
                    return; // Let onload/onerror handle resolution
                }
            }
            
            // If all else fails, trigger the error handler to create a canvas fallback
            fallbackImg.onerror();
        };
        
        // Ensure path is correct and add cache-busting
        img.src = `${TOKEN_DIR}/${token}?nocache=${Date.now()}`;
    }));
    
    try {
        await Promise.all(promises);
        console.log("All token images loaded or fallbacks created.");
    } catch (error) {
        console.error("Unexpected error during token loading:", error);
    }
};

/**
 * Creates/updates a player token DOM element instead of drawing it on canvas
 */
export const drawPlayerToken = (player) => {
    if (!player || !player.currentCoords) return;
    
    const boardContainer = document.getElementById('board-container');
    if (!boardContainer) return;
    
    // Make sure the token container exists
    let tokenContainer = document.getElementById('player-tokens-container');
    if (!tokenContainer) {
        tokenContainer = document.createElement('div');
        tokenContainer.id = 'player-tokens-container';
        tokenContainer.style.position = 'absolute';
        tokenContainer.style.top = '0';
        tokenContainer.style.left = '0';
        tokenContainer.style.width = '100%';
        tokenContainer.style.height = '100%';
        tokenContainer.style.pointerEvents = 'none';
        boardContainer.appendChild(tokenContainer);
    }
    
    // Check if this player's token element already exists
    let tokenElement = document.getElementById(`player-token-${player.id}`);
    
    // If it doesn't exist, create it
    if (!tokenElement) {
        tokenElement = document.createElement('div');
        tokenElement.id = `player-token-${player.id}`;
        tokenElement.className = 'player-token';
        tokenElement.style.position = 'absolute';
        tokenElement.style.width = `${TOKEN_SIZE}px`;
        tokenElement.style.height = `${TOKEN_SIZE}px`;
        tokenElement.style.pointerEvents = 'none';
        
        // Create the image element that references the token image
        const tokenImg = document.createElement('img');
        if (player.role && PLAYER_ROLES[player.role] && PLAYER_ROLES[player.role].token) {
            tokenImg.src = `${TOKEN_DIR}/${PLAYER_ROLES[player.role].token}`;
        } else {
            console.warn(`Could not find token for player ${player.id} with role ${player.role}`);
            tokenImg.src = `${TOKEN_DIR}/default.png`;
        }
        tokenImg.alt = player.name || player.role || 'Player Token';
        tokenImg.style.width = '100%';
        tokenImg.style.height = '100%';
        tokenElement.appendChild(tokenImg);
        
        // Add to the container
        tokenContainer.appendChild(tokenElement);
    }
    
    // Position the token based on the player's coordinates
    if (player.currentCoords) {
        const [scaledX, scaledY] = scaleCoordinates(player.currentCoords.x, player.currentCoords.y);
        const radius = (TOKEN_SIZE * boardState.scale) / 2;
        tokenElement.style.left = `${scaledX - radius}px`;
        tokenElement.style.top = `${scaledY - radius}px`;
        tokenElement.style.transform = `scale(${boardState.scale})`;
        tokenElement.style.transformOrigin = 'center';
    }
};

/**
 * Updates all player tokens based on current coordinates using DOM elements
 */
export const drawAllPlayerTokens = () => {
    // Get players from the players module
    const players = getPlayers();
    
    if (!players || players.length === 0) {
        console.warn("No players available to update tokens");
        return;
    }
    
    // Draw a token for each player
    players.forEach(player => {
        if (player && player.currentCoords) {
            drawPlayerToken(player);
        }
    });
    
    console.log(`Updated DOM token elements for ${players.length} players`);
};

/**
 * Draws connections between spaces defined in the path arrays (Scaled).
 */
export const drawPathConnections = () => {
    // Connections are not needed - skip drawing
    return;
};

/**
 * Draws spaces defined in the path arrays (Scaled).
 */
export const drawPathSpaces = () => {
    if (!boardState.ctx || !boardState.scale || boardState.scale <= 0) return;
    const ctx = boardState.ctx;
    const scale = boardState.scale;
    const allPaths = [AgeOfExpansion, AgeOfResistance, AgeOfReckoning, AgeOfLegacy];
    const drawnCoords = new Set(); 

    const drawScaledPoint = (x, y, color, radius = 3) => {
        const [scaledX, scaledY] = scaleCoordinates(x, y);
        const scaledRadius = Math.max(1, radius * scale); 
        const coordKey = `${scaledX.toFixed(1)},${scaledY.toFixed(1)}`; 
        if (!drawnCoords.has(coordKey)) {
            // Make everything completely transparent - only used for tracking
            ctx.fillStyle = 'rgba(0, 0, 0, 0)';
            ctx.beginPath();
            ctx.arc(scaledX, scaledY, scaledRadius, 0, Math.PI * 2); 
            ctx.fill();
            drawnCoords.add(coordKey);
        }
    };
    
    const drawScaledPolygon = (polygonCoords, fillColor = 'rgba(0, 0, 0, 0)', strokeColor = 'rgba(0, 0, 0, 0)') => {
         if (!Array.isArray(polygonCoords) || polygonCoords.length < 3) return;
         // Make polygons transparent - only used for tracking
         ctx.fillStyle = fillColor;
         ctx.strokeStyle = strokeColor;
         ctx.lineWidth = 1;
         ctx.beginPath();
         const [startX, startY] = scaleCoordinates(polygonCoords[0][0], polygonCoords[0][1]);
         ctx.moveTo(startX, startY);
         for (let i = 1; i < polygonCoords.length; i++) {
             const [lineX, lineY] = scaleCoordinates(polygonCoords[i][0], polygonCoords[i][1]);
             ctx.lineTo(lineX, lineY);
         }
         ctx.closePath();
         ctx.fill();
    };

    // Draw spaces for tracking purposes (invisible)
    if (START_SPACE?.coordinates) {
        drawScaledPoint(START_SPACE.coordinates[0], START_SPACE.coordinates[1], 'rgba(0, 0, 0, 0)', 5);
    }
    if (FINISH_SPACE?.coordinates) {
        drawScaledPoint(FINISH_SPACE.coordinates[0], FINISH_SPACE.coordinates[1], 'rgba(0, 0, 0, 0)', 5);
    }

    // Draw spaces for tracking purposes (invisible)
    for (const path of allPaths) {
        if (!path || !path.segments) continue;
        
        // Draw each segment in the path (invisible)
        for (const space of path.segments) {
            if (!space || !space.coordinates) continue;
            
            if ((space.Type === 'choicepoint' || space.Type === 'junction') && 
                Array.isArray(space.coordinates) && space.coordinates.length >= 3) {
                drawScaledPolygon(space.coordinates, 'rgba(0, 0, 0, 0)'); 
            } else if (Array.isArray(space.coordinates) && space.coordinates[0]) {
                drawScaledPoint(space.coordinates[0][0], space.coordinates[0][1], 'rgba(0, 0, 0, 0)', 4); 
            }
        }
    }
};

/**
 * Resizes the canvas based on container size and updates scaling.
 */
export const resizeCanvas = () => {
    const { canvas, container, boardImage } = boardState;
    if (!canvas || !container || !boardImage || !boardImage.complete || boardImage.naturalWidth === 0) return;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scaleWidth = containerWidth / ORIGINAL_WIDTH;
    const scaleHeight = containerHeight / ORIGINAL_HEIGHT;
    const scale = Math.max(0.1, Math.min(scaleWidth, scaleHeight)); // Ensure scale is >= 0.1
    boardState.scale = scale;
    canvas.width = ORIGINAL_WIDTH * scale;
    canvas.height = ORIGINAL_HEIGHT * scale;
};

/**
 * Set up click listener for the board canvas.
 */
const setupBoardClickListener = (canvas) => {
    if (!canvas) {
        console.error("setupBoardClickListener: Canvas element not provided.");
        return;
    }
    console.log("setupBoardClickListener function exists and is setting up listener..."); // Confirm definition
    
    canvas.addEventListener('click', (event) => {
        if (!boardState.isInitialized || !boardState.scale || boardState.scale <= 0) {
            console.warn("Board not ready for clicks yet.");
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        
        // Get unscaled coordinates to compare against the original board image
        const [x, y] = unscaleCoordinates(canvasX, canvasY);
        
        // Check for clicks on End of Turn card boxes
        // End of turn card rectangle 1 coordinates (from gameoutline2.txt)
        const endOfTurnBox1 = {
            x: 299, y: 441,
            width: 392 - 299,
            height: 585 - 441
        };
        
        // End of turn card rectangle 2 coordinates (from gameoutline2.txt)
        const endOfTurnBox2 = {
            x: 1124, y: 454,
            width: 1217 - 1124,
            height: 600 - 454
        };
        
        // Check if click is on End of Turn card boxes
        if (window.gameState && window.gameState.turnState === 'AWAITING_END_OF_TURN_CARD') {
            // Check box 1
            if (x >= endOfTurnBox1.x && x <= endOfTurnBox1.x + endOfTurnBox1.width && 
                y >= endOfTurnBox1.y && y <= endOfTurnBox1.y + endOfTurnBox1.height) {
                console.log("Clicked on End of Turn Card Box 1");
                if (window.gameHandlers && typeof window.gameHandlers.handleEndOfTurnCardDraw === 'function') {
                    window.gameHandlers.handleEndOfTurnCardDraw(1);
                    return;
                }
            }
            
            // Check box 2
            if (x >= endOfTurnBox2.x && x <= endOfTurnBox2.x + endOfTurnBox2.width && 
                y >= endOfTurnBox2.y && y <= endOfTurnBox2.y + endOfTurnBox2.height) {
                console.log("Clicked on End of Turn Card Box 2");
                if (window.gameHandlers && typeof window.gameHandlers.handleEndOfTurnCardDraw === 'function') {
                    window.gameHandlers.handleEndOfTurnCardDraw(2);
                    return;
                }
            }
        }
        
        // Check for clicks on deck areas (path decks)
        const deckAreas = [
            { name: 'purple', x: 116, y: 443, width: 70, height: 100 }, // Purple deck
            { name: 'blue', x: 836, y: 178, width: 70, height: 100 },   // Blue deck
            { name: 'cyan', x: 836, y: 720, width: 70, height: 100 },   // Cyan deck
            { name: 'pink', x: 1398, y: 453, width: 70, height: 100 }   // Pink deck
        ];
        
        // Check if the click is on a deck
        for (const area of deckAreas) {
            if (x >= area.x && x <= area.x + area.width && 
                y >= area.y && y <= area.y + area.height) {
                console.log(`Clicked on ${area.name} Deck`);
                
                // Debug: Check if game module is available
                console.log("Game module available:", Boolean(window.game));
                console.log("handleDeckClick available:", Boolean(window.game?.handleDeckClick));
                console.log("Game state:", window.game?.getGameState ? window.game.getGameState() : "Not available");
                
                // Use the proper game module function for handling deck clicks
                if (window.game && typeof window.game.handleDeckClick === 'function') {
                    try {
                        window.game.handleDeckClick(area.name);
                    } catch (err) {
                        console.error("Error calling handleDeckClick:", err);
                    }
                } else {
                    console.error("Cannot handle deck click: window.game.handleDeckClick not found");
                }
                return;
            }
        }
        
        if (deckRegions && Array.isArray(deckRegions)) {
            for (const region of deckRegions) {
                if (x >= region.x && x <= region.x + region.width && y >= region.y && y <= region.y + region.height) {
                    console.log(`Clicked on deck region: ${region.name}`);
                    if (window.game && typeof window.game.handleDeckClick === 'function') {
                        window.game.handleDeckClick(region.name);
                    }
                    return; 
                }
            }
        } else {
            console.warn("deckRegions data not available for click detection.");
        }
        
        let gameState = null;
        try {
            if (window.game && typeof window.game.getGameState === 'function') {
                 gameState = window.game.getGameState();
            }
        } catch (e) { 
            console.error("Error getting game state:", e);
        }

        if (gameState && gameState.phase === 'PLAYER_MOVE') {
            const currentPlayer = gameState.currentPlayer;
            if (currentPlayer && currentPlayer.currentCoords) {
                const validMoves = getNextStepOptions(currentPlayer.currentCoords); 
                const CLICK_TOLERANCE = 20; 
                let moveTargetCoords = null;

                if (validMoves.type === 'Regular' || validMoves.type === 'Finish') {
                    const nextCoordsArray = validMoves.nextCoords;
                    if (Array.isArray(nextCoordsArray) && nextCoordsArray.length >= 2) {
                        const nextX = nextCoordsArray[0];
                        const nextY = nextCoordsArray[1];
                        const distance = Math.sqrt(Math.pow(x - nextX, 2) + Math.pow(y - nextY, 2));
                        if (distance < CLICK_TOLERANCE) {
                            moveTargetCoords = { x: nextX, y: nextY };
                        }
                    }
                } else if (validMoves.type === 'Choicepoint' && validMoves.options && validMoves.options.length > 0) {
                    for (const option of validMoves.options) {
                        const coords = option.coordinates; 
                        if (Array.isArray(coords) && coords.length >= 2) {
                            const optX = coords[0];
                            const optY = coords[1];
                            const distance = Math.sqrt(Math.pow(x - optX, 2) + Math.pow(y - optY, 2));
                            if (distance < CLICK_TOLERANCE) { 
                                moveTargetCoords = { x: optX, y: optY };
                                break; 
                            }
                        }
                    }
                }

                if (moveTargetCoords) {
                    console.log(`Handling move click to:`, moveTargetCoords);
                    if (window.game && typeof window.game.handleMoveClick === 'function') {
                        window.game.handleMoveClick(moveTargetCoords); 
                    } else {
                         console.warn("game.handleMoveClick function not found.");
                    }
                    return; 
                }
            }
        }
    });
    console.log("Board click listener setup complete.");
};

// ===== Scaling Functions =====

/**
 * Scales coordinates from original board dimensions to current canvas dimensions.
 * @param {number} x - The original x coordinate.
 * @param {number} y - The original y coordinate.
 * @returns {Array<number>} - The scaled [x, y] coordinates.
 */
export const scaleCoordinates = (x, y) => {
    if (!boardState.scale || boardState.scale <= 0) {
        console.warn("Scaling operation attempted before scale was set");
        return [x, y]; // Return originals if scale not set
    }
    return [x * boardState.scale, y * boardState.scale];
};

/**
 * Converts coordinates from current canvas dimensions back to original board dimensions.
 * @param {number} canvasX - The x coordinate on the current canvas.
 * @param {number} canvasY - The y coordinate on the current canvas.
 * @returns {Array<number>} - The unscaled [x, y] coordinates in original dimensions.
 */
export const unscaleCoordinates = (canvasX, canvasY) => {
    if (!boardState.scale || boardState.scale <= 0) {
        console.warn("Unscaling operation attempted before scale was set");
        return [canvasX, canvasY]; // Return originals if scale not set
    }
    return [canvasX / boardState.scale, canvasY / boardState.scale];
};

// ===== Exported Functions =====

/**
 * Finds details about a space at the given coordinates
 * @param {Object} targetCoords - Coordinates to search for {x, y}
 * @param {number} tolerance - Pixel distance tolerance for matching
 * @returns {Object|null} - Space details if found, null otherwise
 */
export const findSpaceDetailsByCoords = (targetCoords, tolerance = 5) => {
    if (!targetCoords) return null;
    
    const allPaths = [AgeOfExpansion, AgeOfResistance, AgeOfReckoning, AgeOfLegacy];
    
    // Check START_SPACE
    if (START_SPACE && START_SPACE.coordinates) {
        const distance = Math.sqrt(
            Math.pow(targetCoords.x - START_SPACE.coordinates[0], 2) + 
            Math.pow(targetCoords.y - START_SPACE.coordinates[1], 2)
        );
        
        if (distance <= tolerance) {
            return {
                type: 'start',
                coords: { x: START_SPACE.coordinates[0], y: START_SPACE.coordinates[1] },
                details: START_SPACE
            };
        }
    }
    
    // Check FINISH_SPACE
    if (FINISH_SPACE && FINISH_SPACE.coordinates) {
        const distance = Math.sqrt(
            Math.pow(targetCoords.x - FINISH_SPACE.coordinates[0], 2) + 
            Math.pow(targetCoords.y - FINISH_SPACE.coordinates[1], 2)
        );
        
        if (distance <= tolerance) {
            return {
                type: 'finish',
                coords: { x: FINISH_SPACE.coordinates[0], y: FINISH_SPACE.coordinates[1] },
                details: FINISH_SPACE
            };
        }
    }
    
    // Check path spaces
    for (const path of allPaths) {
        if (!path || !path.segments) continue;
        
        const color = path.color || 'unknown';
        
        for (const segment of path.segments) {
            if (!segment || !segment.coordinates || !segment.coordinates[0]) continue;
            
            const coord = segment.coordinates[0];
            const distance = Math.sqrt(
                Math.pow(targetCoords.x - coord[0], 2) + 
                Math.pow(targetCoords.y - coord[1], 2)
            );
            
            if (distance <= tolerance) {
                let type = 'regular';
                if (segment.type === 'draw') {
                    type = 'draw';
                } else if (segment.Next && segment.Next.length > 1) {
                    type = 'junction';
                }
                
                return {
                    type,
                    coords: { x: coord[0], y: coord[1] },
                    details: segment,
                    pathColor: color
                };
            }
        }
    }
    
    return null;
};

/**
 * Gets possible next step options from the current coordinates
 * @param {Object} currentCoords - Current coordinates {x, y}
 * @returns {Array} - Array of possible next coordinates
 */
export const getNextStepOptions = (currentCoords) => {
    if (!currentCoords) return [];
    
    // First, find the space details from the coordinates
    const spaceDetails = findSpaceDetailsByCoords(currentCoords);
    if (!spaceDetails) return [];
    
    // Check if this is the start space
    if (spaceDetails.type === 'start') {
        // Return initial path options
        const initialOptions = [];
        
        // Add first space from each path
        if (AgeOfExpansion && AgeOfExpansion.segments && AgeOfExpansion.segments[0]) {
            initialOptions.push({
                x: AgeOfExpansion.segments[0].coordinates[0][0],
                y: AgeOfExpansion.segments[0].coordinates[0][1],
                pathColor: 'purple'
            });
        }
        
        if (AgeOfResistance && AgeOfResistance.segments && AgeOfResistance.segments[0]) {
            initialOptions.push({
                x: AgeOfResistance.segments[0].coordinates[0][0],
                y: AgeOfResistance.segments[0].coordinates[0][1],
                pathColor: 'blue'
            });
        }
        
        if (AgeOfReckoning && AgeOfReckoning.segments && AgeOfReckoning.segments[0]) {
            initialOptions.push({
                x: AgeOfReckoning.segments[0].coordinates[0][0],
                y: AgeOfReckoning.segments[0].coordinates[0][1],
                pathColor: 'cyan'
            });
        }
        
        if (AgeOfLegacy && AgeOfLegacy.segments && AgeOfLegacy.segments[0]) {
            initialOptions.push({
                x: AgeOfLegacy.segments[0].coordinates[0][0],
                y: AgeOfLegacy.segments[0].coordinates[0][1],
                pathColor: 'pink'
            });
        }
        
        return initialOptions;
    }
    
    // Check if this is the finish space
    if (spaceDetails.type === 'finish') {
        // No moves possible from finish
        return [];
    }
    
    // For regular spaces or junctions, check the Next property
    const nextCoordinates = [];
    
    if (spaceDetails.details && spaceDetails.details.Next) {
        for (const nextCoord of spaceDetails.details.Next) {
            if (Array.isArray(nextCoord) && nextCoord.length >= 2) {
                nextCoordinates.push({
                    x: nextCoord[0],
                    y: nextCoord[1],
                    pathColor: spaceDetails.pathColor
                });
            }
        }
    }
    
    return nextCoordinates;
};

/**
 * Gets the path color at the specified coordinates
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 * @returns {string|null} - The color name ('purple', 'blue', 'cyan', 'pink') or null if not found
 */
export const getPathColorFromCoords = (x, y) => {
    if (x === undefined || y === undefined) return null;
    
    // Convert to coordinates object if numbers were provided
    const coordinates = typeof x === 'object' ? x : { x, y };
    
    // Find the space details at these coordinates
    const spaceDetails = findSpaceDetailsByCoords(coordinates);
    
    // If found, return the path color
    if (spaceDetails && spaceDetails.pathColor) {
        return spaceDetails.pathColor;
    }
    
    // If not found on any path, check if it's on a special space
    
    // Check if it's the start space
    if (START_SPACE && START_SPACE.coordinates) {
        const distance = Math.sqrt(
            Math.pow(coordinates.x - START_SPACE.coordinates[0], 2) + 
            Math.pow(coordinates.y - START_SPACE.coordinates[1], 2)
        );
        
        if (distance <= 5) {
            return 'start'; // Special color for start
        }
    }
    
    // Check if it's the finish space
    if (FINISH_SPACE && FINISH_SPACE.coordinates) {
        const distance = Math.sqrt(
            Math.pow(coordinates.x - FINISH_SPACE.coordinates[0], 2) + 
            Math.pow(coordinates.y - FINISH_SPACE.coordinates[1], 2)
        );
        
        if (distance <= 5) {
            return 'finish'; // Special color for finish
        }
    }
    
    return null; // Not found on any path
};

/**
 * Draws a highlight around a coordinate to show it's a valid choice
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} coords - [x, y] coordinates to highlight
 * @param {string} [color='#FFFF00'] - Highlight color (default: yellow)
 * @param {number} [radius=20] - Radius of highlight circle
 */
function drawPathHighlight(ctx, coords, color = '#FFFF00', radius = 20) {
    if (!ctx || !coords || coords.length < 2) return;
    
    const boardScale = window.boardState?.scale || 1;
    const scaledRadius = radius * boardScale;
    const [x, y] = scaleCoordinates(coords[0], coords[1]);
    
    // Draw glow effect (larger circle with less opacity)
    ctx.beginPath();
    ctx.arc(x, y, scaledRadius + 10, 0, Math.PI * 2);
    ctx.fillStyle = `${color}33`; // 20% opacity
    ctx.fill();
    
    // Draw highlight circle
    ctx.beginPath();
    ctx.arc(x, y, scaledRadius, 0, Math.PI * 2);
    ctx.fillStyle = `${color}66`; // 40% opacity
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Add pulsating animation
    const now = Date.now();
    const pulseSize = Math.sin(now / 200) * 5; // Pulsing effect
    
    ctx.beginPath();
    ctx.arc(x, y, scaledRadius - 5 + pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = `${color}99`; // 60% opacity
    ctx.fill();
    
    // Request next animation frame for pulsing effect
    requestAnimationFrame(() => drawBoard());
}

/**
 * Highlights all choice points on the board
 * This is used to show valid paths at junctions and at the start of the game
 */
function highlightChoicePoints() {
    const ctx = boardState.ctx;
    if (!ctx) return;
    
    // Get game state and current choices if available
    const gameState = window.gameState;
    if (!gameState) return;
    
    const currentChoices = gameState.currentChoices || [];
    const turnState = gameState.turnState;
    
    // Different types of choices get different highlight colors
    if (turnState === 'AWAITING_START_CHOICE' && currentChoices.length > 0) {
        // Initial path choices
        currentChoices.forEach(choice => {
            if (!choice.coordinates) return;
            
            // Use different colors for different paths
            let highlightColor;
            switch (choice.pathColor) {
                case 'purple': highlightColor = '#9C54DE'; break;
                case 'blue': highlightColor = '#1B3DE5'; break;
                case 'cyan': highlightColor = '#00FFFF'; break;
                case 'pink': highlightColor = '#FF66FF'; break;
                default: highlightColor = '#FFFF00';
            }
            
            // Draw highlight with larger radius for start choices
            drawPathHighlight(ctx, choice.coordinates, highlightColor, 25);
            
            // Draw path name label
            const [x, y] = scaleCoordinates(choice.coordinates[0], choice.coordinates[1]);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            // Add path name below the highlight
            let pathName = '';
            switch (choice.pathColor) {
                case 'purple': pathName = 'Age of Expansion'; break;
                case 'blue': pathName = 'Age of Resistance'; break;
                case 'cyan': pathName = 'Age of Reckoning'; break;
                case 'pink': pathName = 'Age of Legacy'; break;
            }
            
            // Draw path name with background for readability
            const textWidth = ctx.measureText(pathName).width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x - textWidth/2 - 5, y + 15, textWidth + 10, 20);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(pathName, x, y + 30);
        });
    } else if (turnState === 'AWAITING_JUNCTION_CHOICE' && currentChoices.length > 0) {
        // Junction path choices
        currentChoices.forEach(choice => {
            if (!choice.coordinates) return;
            
            // Use a bright highlight color for junctions
            const highlightColor = '#FFFF00'; // Yellow
            drawPathHighlight(ctx, choice.coordinates, highlightColor, 20);
        });
    } else if (turnState === 'AWAITING_END_OF_TURN_CARD') {
        // Highlight end of turn card boxes when it's time to draw
        // These are the exact coordinates from the game outline
        const endOfTurnBox1 = {
            x: 299, y: 441,
            width: 392 - 299,
            height: 585 - 441
        };
        
        const endOfTurnBox2 = {
            x: 1124, y: 454,
            width: 1217 - 1124,
            height: 600 - 454
        };
        
        // Draw highlights on both end of turn card boxes
        for (const box of [endOfTurnBox1, endOfTurnBox2]) {
            const [x1, y1] = scaleCoordinates(box.x, box.y);
            const [x2, y2] = scaleCoordinates(box.x + box.width, box.y + box.height);
            
            // Pulse effect
            const now = Date.now();
            const pulseOpacity = 0.3 + Math.sin(now / 200) * 0.2; // Pulsing opacity between 0.1 and 0.5
            
            ctx.fillStyle = `rgba(255, 215, 0, ${pulseOpacity})`;
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            
            // Draw "Draw Card" text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Draw Card', (x1 + x2) / 2, (y1 + y2) / 2);
        }
        
        // Request animation frame for pulsing
        requestAnimationFrame(() => drawBoard());
    }
    
    // Handle special event card highlighting for draw spaces
    if (turnState === 'AWAITING_SPECIAL_EVENT_CARD') {
        const currentPlayer = window.getPlayerById?.(gameState.currentPlayerId);
        
        if (currentPlayer && currentPlayer.currentSpace && currentPlayer.currentSpace.pathColor) {
            const pathColor = currentPlayer.currentSpace.pathColor;
            
            // Highlight the appropriate deck based on path color
            const deckAreas = {
                purple: { x: 116, y: 443, width: 70, height: 100 },
                blue: { x: 836, y: 178, width: 70, height: 100 },
                cyan: { x: 836, y: 720, width: 70, height: 100 },
                pink: { x: 1398, y: 453, width: 70, height: 100 }
            };
            const deckArea = deckAreas[pathColor];
            if (deckArea) {
                const [x1, y1] = scaleCoordinates(deckArea.x, deckArea.y);
                const [x2, y2] = scaleCoordinates(deckArea.x + deckArea.width, deckArea.y + deckArea.height);
                
                // Pulse effect
                const now = Date.now();
                const pulseOpacity = 0.3 + Math.sin(now / 200) * 0.2;
                
                let highlightColor;
                switch (pathColor) {
                    case 'purple': highlightColor = '#9C54DE'; break;
                    case 'blue': highlightColor = '#1B3DE5'; break;
                    case 'cyan': highlightColor = '#00FFFF'; break;
                    case 'pink': highlightColor = '#FF66FF'; break;
                    default: highlightColor = '#FFFF00';
                }
                
                ctx.fillStyle = `rgba(${hexToRgb(highlightColor)}, ${pulseOpacity})`;
                ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
                ctx.strokeStyle = highlightColor;
                ctx.lineWidth = 3;
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
                
                // Draw "Draw Card" text
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Draw Card', (x1 + x2) / 2, (y1 + y2) / 2);
                
                // Request animation frame for pulsing
                requestAnimationFrame(() => drawBoard());
            }
        }
    }
}

// Helper function to convert hex color to RGB values
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle shorthand hex
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // Parse values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

/**
 * Draws the board spaces for hit testing
 */
export const drawBoard = () => {
    if (!boardState.ctx || !boardState.scale || boardState.scale <= 0) return;
    
    const ctx = boardState.ctx;
    
    // Clear the canvas
    ctx.clearRect(0, 0, boardState.canvas.width, boardState.canvas.height);
    
    // Draw the board image if it exists and is loaded
    if (boardState.boardImage && boardState.boardImage.complete && boardState.boardImage.naturalWidth > 0) {
        ctx.drawImage(boardState.boardImage, 0, 0, boardState.canvas.width, boardState.canvas.height);
    } else {
        // Draw a background color if no image
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, boardState.canvas.width, boardState.canvas.height);
    }
    
    // Draw path connections (no-op but keeps linter happy)
    drawPathConnections();
    
    // Draw the paths and spaces (invisible for hit detection)
    drawInvisibleSpaces();
    
    // Highlight any active choice points
    highlightChoicePoints();
};

/**
 * Sets up the canvas and loads board/token images.
 */
export const setupBoard = async () => {
    console.log("Setting up board...");
    const container = document.getElementById('board-container');
    if (!container) {
        console.error("Board container element (#board-container) not found!");
        return { ctx: null, canvas: null };
    }
    boardState.container = container;
    
    let canvas = document.getElementById('board-canvas');
    if (!canvas) {
        console.log("Canvas not found, creating...");
        canvas = document.createElement('canvas');
        canvas.id = 'board-canvas';
        container.appendChild(canvas);
    } else {
        console.log("Canvas found.");
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
         console.error("Failed to get 2D context for canvas!");
        return { ctx: null, canvas: null };
    }
    boardState.canvas = canvas;
    boardState.ctx = ctx;
    
    // Load board image first
    try {
        // Only create a new Image if we don't already have one
        if (!boardState.boardImage || !boardState.boardImage.complete) {
            console.log("Loading board image...");
            boardState.boardImage = new Image();
            
            // Create a promise to wait for the board image to load
            await new Promise((resolve) => {
                boardState.boardImage.onload = () => {
                    console.log("Board image loaded successfully");
                    resolve();
                };
                
                boardState.boardImage.onerror = (err) => {
                    console.error("Failed to load board image:", err);
                    // Continue anyway but note the error
                    resolve();
                };
                
                boardState.boardImage.src = "assets/board.png";
            });
        }
    } catch (err) {
        console.error("Error loading board image:", err);
    }
    
    // Load token images (this is used for animating token movements)
    await loadTokenImages();
    
    // Set as initialized
    boardState.isInitialized = true;
    
    // Set player list
    boardState.players = getPlayers();
    
    // Resize the canvas
    resizeCanvas(); 
    
    // Draw the board with the merged function
    drawBoard();
        
    setupBoardClickListener(canvas);
    
    window.addEventListener('resize', () => {
        if (boardState.isInitialized) {
            boardState.players = getPlayers();
            resizeCanvas(); 
            drawBoard();
        }
    });
    
    // Expose board functions globally for animations.js to use
    window.board = {
        animateTokenToPosition,
        drawBoard,
        getPlayers,
        drawPlayerToken,
        drawAllPlayerTokens
    };
    
    console.log("Board setup complete.")
    return { ctx, canvas };
};


// ===== Animation Functions =====

/**
 * Animates a player token smoothly between two points using DOM elements
 */
export function animateTokenToPosition(player, startCoords, targetCoords, duration = 300, callback) {
    if (!player || !startCoords || !targetCoords) {
        console.error("animateTokenToPosition: Invalid args or state.");
        if (callback) callback();
        return;
    }
    
    // Find the token DOM element for this player
    const tokenElement = document.getElementById(`player-token-${player.id}`);
    if (!tokenElement) {
        console.error(`Token element not found for player ${player.id}`);
        // Create it if it doesn't exist
        drawPlayerToken(player);
        if (callback) callback();
        return;
    }
    
    // Convert coordinates to screen position
    const [startX, startY] = scaleCoordinates(startCoords.x, startCoords.y);
    const [targetX, targetY] = scaleCoordinates(targetCoords.x, targetCoords.y);
    const radius = (TOKEN_SIZE * boardState.scale) / 2;
    
    // Set the starting position
    tokenElement.style.left = `${startX - radius}px`;
    tokenElement.style.top = `${startY - radius}px`;
    
    // Set up animation
    const startTime = performance.now();
    
    function step(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Use easing for smoother animation
        const easedProgress = progress < 0.5 ? 
            2 * progress * progress : 
            1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        // Calculate current position
        const currentX = startX + (targetX - startX) * easedProgress;
        const currentY = startY + (targetY - startY) * easedProgress;
        
        // Update element position
        tokenElement.style.left = `${currentX - radius}px`;
        tokenElement.style.top = `${currentY - radius}px`;
        
        // Continue animation if not complete
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            // Ensure we're at the final position
            tokenElement.style.left = `${targetX - radius}px`;
            tokenElement.style.top = `${targetY - radius}px`;
            
            // Call the completion callback
            if (callback) callback();
        }
    }
    
    // Start animation
    requestAnimationFrame(step);
}

/**
 * Handles movement animation step-by-step using coordinates.
 */
export function startMoveAnimation(player, steps, onComplete) {
    if (!player || !player.currentCoords) {
        console.error("startMoveAnimation: Invalid player/coords.");
        if (onComplete) onComplete({ reason: 'error_invalid_player', stepsTaken: 0 });
        return;
    }
    let currentStep = 0;
    let logicalCoords = { ...player.currentCoords }; 
    const INTERRUPTING_TYPES = ['draw', 'choicepoint', 'junction', 'finish', 'special_event']; 
    const totalStepsRequested = steps;
    console.log(`ANIMATE: Start move ${player.id} from (${logicalCoords.x},${logicalCoords.y}) for ${totalStepsRequested} steps.`);
    
    function completeAnimation(reason, finalCoords) {
        console.log(`ANIMATE: Complete at (${finalCoords.x},${finalCoords.y}). Reason: ${reason}, Steps: ${currentStep}/${totalStepsRequested}`);
        if (onComplete) {
            onComplete({ reason, stepsTaken: currentStep, finalCoords });
        }
    }
    
    function moveNextVisualStep() {
        if (currentStep >= totalStepsRequested) {
            completeAnimation('steps_complete', logicalCoords);
            return;
        }
        const nextOptions = getNextStepOptions(logicalCoords);

        if (!nextOptions || nextOptions.type === 'Error' || nextOptions.type === 'End') {
            console.warn(`ANIMATE: Cannot move from (${logicalCoords.x},${logicalCoords.y}). Options:`, nextOptions);
            completeAnimation(nextOptions.type === 'End' ? 'end_of_path' : 'error_blocked', logicalCoords);
            return;
        }
        if (nextOptions.type === 'LandedOnFinish') {
             console.log("ANIMATE: Already on Finish.");
             completeAnimation('interrupt_finish', logicalCoords);
             return;
        }

        let nextLogicalCoordsArray = null;
        let reasonForStopping = null;

        if (nextOptions.type === 'Choicepoint') {
            console.log("ANIMATE: Choicepoint reached. Stopping for choice.");
            completeAnimation('interrupt_choicepoint', logicalCoords);
            return;
        } else if (nextOptions.type === 'Regular') {
            nextLogicalCoordsArray = nextOptions.nextCoords;
        } else if (nextOptions.type === 'Finish') {
             nextLogicalCoordsArray = nextOptions.nextCoords;
             reasonForStopping = 'interrupt_finish'; 
        } else {
             console.error(`ANIMATE: Unexpected nextOptions type: ${nextOptions.type}.`);
             completeAnimation('error_unexpected_option', logicalCoords);
             return;
        }

        if (!Array.isArray(nextLogicalCoordsArray) || nextLogicalCoordsArray.length < 2) {
            console.error("ANIMATE: Invalid next coords array.");
            completeAnimation('error_invalid_coords', logicalCoords);
            return;
        }

        const targetLogicalPos = { x: nextLogicalCoordsArray[0], y: nextLogicalCoordsArray[1] };
        const startLogicalPos = { ...logicalCoords }; 
        const targetSpaceDetails = findSpaceDetailsByCoords(targetLogicalPos);
        const targetTypeLower = targetSpaceDetails ? (targetSpaceDetails.Type || '').toLowerCase() : 'unknown';
        const isInterruptingType = INTERRUPTING_TYPES.includes(targetTypeLower) && !['finish', 'choicepoint', 'junction'].includes(targetTypeLower);

        // Check if the movement path passes through any junction polygons
        // Get all junction spaces
        const allPaths = [AgeOfExpansion, AgeOfResistance, AgeOfReckoning, AgeOfLegacy];
        for (const path of allPaths) {
            if (!path || !path.segments) continue;
            
            for (const space of path.segments) {
                if (!space || !space.coordinates) continue;
                
                const type = (space.Type || '').toLowerCase();
                
                // Check if this is a junction/choicepoint with polygon coordinates
                if ((type === 'choicepoint' || type === 'junction') && 
                    Array.isArray(space.coordinates) && 
                    space.coordinates.length >= 3) {
                    
                    // Check if the line segment between current position and next position
                    // passes through this junction polygon
                    const pointA = startLogicalPos;
                    const pointB = targetLogicalPos;
                    
                    // Use existing function to check if either point is inside polygon
                    if (isPointInPolygon(pointA, space.coordinates) || 
                        isPointInPolygon(pointB, space.coordinates)) {
                        console.log(`ANIMATE: Movement passes through junction polygon`);
                        reasonForStopping = 'interrupt_junction';
                        break;
                    }
                }
            }
            if (reasonForStopping) break; // Exit outer loop if junction found
        }

        if (isInterruptingType) {
            reasonForStopping = `interrupt_${targetTypeLower}`;
        }
        
        console.log(`ANIMATE: Step ${currentStep+1}: ${startLogicalPos.x},${startLogicalPos.y} -> ${targetLogicalPos.x},${targetLogicalPos.y} (Stop: ${!!reasonForStopping})`);
        animateTokenToPosition(player, startLogicalPos, targetLogicalPos, animationState.durationPerStep, () => {
            logicalCoords = { ...targetLogicalPos };
            currentStep++; 
            if (reasonForStopping) {
                completeAnimation(reasonForStopping, logicalCoords);
            } else if (currentStep >= totalStepsRequested) {
                completeAnimation('steps_complete', logicalCoords);
            } else {
                 moveNextVisualStep(); 
            }
        });
    }
    moveNextVisualStep(); 
}

/**
 * Shows a preview of the movement path based on dice roll
 * @param {Object} player - The player object
 * @param {number} steps - Number of steps to preview (from dice roll)
 * @returns {Array} Array of coordinates that would be visited
 */
export function showMovementPathPreview(player, steps) {
    if (!player || !player.coords || steps <= 0) return [];
    
    const pathCoordinates = [];
    let currentCoords = { ...player.coords };
    pathCoordinates.push([currentCoords.x, currentCoords.y]);
    
    // Calculate path without actually moving the player
    for (let i = 0; i < steps; i++) {
        const nextCoords = getNextStepCoordinates(currentCoords);
        if (!nextCoords) break;
        
        pathCoordinates.push([nextCoords.x, nextCoords.y]);
        currentCoords = nextCoords;
        
        // Check if it's a junction point that would stop movement
        const spaceDetails = findSpaceDetailsByCoords(currentCoords);
        if (spaceDetails && 
            (spaceDetails.type === 'junction' || 
             spaceDetails.type === 'choicepoint')) {
            break; // Movement would stop here for player choice
        }
    }
    
    // Draw the preview path on the board
    drawMovementPreview(pathCoordinates);
    
    return pathCoordinates;
}

/**
 * Draws the movement preview path on the board canvas
 * @param {Array} coordinates - Array of coordinate pairs to highlight
 */
function drawMovementPreview(coordinates) {
    const canvas = document.getElementById('board-canvas');
    if (!canvas || !coordinates || coordinates.length <= 1) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Save context state
    ctx.save();
    
    // Set up the path style
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)'; // Semi-transparent yellow
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([10, 5]); // Dashed line pattern
    
    // Start drawing the path
    ctx.beginPath();
    
    // Move to the starting point
    const startCoord = scaleCoordinates(coordinates[0][0], coordinates[0][1]);
    ctx.moveTo(startCoord[0], startCoord[1]);
    
    // Draw lines to each subsequent point
    for (let i = 1; i < coordinates.length; i++) {
        const coord = scaleCoordinates(coordinates[i][0], coordinates[i][1]);
        ctx.lineTo(coord[0], coord[1]);
    }
    
    // Stroke the path
    ctx.stroke();
    
    // Draw dots at each point on the path
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; // Gold color
    for (let i = 0; i < coordinates.length; i++) {
        const coord = scaleCoordinates(coordinates[i][0], coordinates[i][1]);
        
        // Draw numbered circles at each step
        ctx.beginPath();
        ctx.arc(coord[0], coord[1], 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Add step numbers inside circles
        if (i > 0) { // Don't number the starting point
            ctx.fillStyle = 'black';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), coord[0], coord[1]);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        }
    }
    
    // Add animation for the path
    animatePathPreview(coordinates);
    
    // Restore context state
    ctx.restore();
}

/**
 * Adds an animation effect to the path preview
 * @param {Array} coordinates - The coordinates in the path
 */
function animatePathPreview(coordinates) {
    if (!coordinates || coordinates.length <= 1) return;
    
    const canvas = document.getElementById('board-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create animated particles moving along the path
    const particleCount = 3;
    const particles = [];
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            progress: i * (1 / particleCount), // Spaced evenly along the path
            size: 8,
            speed: 0.005 + (Math.random() * 0.003)
        });
    }
    
    // Save a reference to the interval for cleanup
    if (window.pathPreviewAnimation) {
        clearInterval(window.pathPreviewAnimation);
    }
    
    // Animate particles moving along the path
    window.pathPreviewAnimation = setInterval(() => {
        // Clear the previous frame's particles
        drawBoard(); // This redraws the board and all current elements
        
        // Redraw the basic path
        drawMovementPreview(coordinates);
        
        // Draw each particle
        ctx.save();
        particles.forEach(particle => {
            // Update particle position
            particle.progress += particle.speed;
            if (particle.progress > 1) {
                particle.progress = 0;
            }
            
            // Calculate position along the path
            const index = Math.floor(particle.progress * (coordinates.length - 1));
            const nextIndex = Math.min(index + 1, coordinates.length - 1);
            const subProgress = particle.progress * (coordinates.length - 1) - index;
            
            // Get the coordinates
            const current = scaleCoordinates(coordinates[index][0], coordinates[index][1]);
            const next = scaleCoordinates(coordinates[nextIndex][0], coordinates[nextIndex][1]);
            
            // Interpolate between points
            const x = current[0] + (next[0] - current[0]) * subProgress;
            const y = current[1] + (next[1] - current[1]) * subProgress;
            
            // Draw the particle
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow effect
            ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(x, y, particle.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Reset shadow
            ctx.shadowBlur = 0;
        });
        ctx.restore();
    }, 50);
    
    // Set a timeout to clear the animation after a reasonable time
    setTimeout(() => {
        if (window.pathPreviewAnimation) {
            clearInterval(window.pathPreviewAnimation);
            window.pathPreviewAnimation = null;
            drawBoard(); // Redraw the board to clear the preview
        }
    }, 8000); // Animation will run for 8 seconds max
}

/**
 * Clears any active movement preview
 */
export function clearMovementPreview() {
    if (window.pathPreviewAnimation) {
        clearInterval(window.pathPreviewAnimation);
        window.pathPreviewAnimation = null;
    }
    
    // Redraw the board to clear the preview
    drawBoard();
}

// Since we import getPlayerById but it's not used directly, we'll use it in a helper function
// This makes sure it's being used at least indirectly
export function getPlayerDetails(playerId) {
    const player = getPlayerById(playerId);
    return player ? {
        id: player.id,
        name: player.name,
        role: player.role,
        resources: { ...player.resources },
        coords: player.coords
    } : null;
}

/**
 * Highlights the End of Turn card boxes when it's time for a player to draw
 * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
 */
export function highlightEndOfTurnCardBoxes(ctx) {
    if (!ctx || !boardState.scale) return;
    
    // These are the exact coordinates from the game outline
    const endOfTurnBox1 = {
        x: 299, y: 441,
        width: 392 - 299,
        height: 585 - 441
    };
    
    const endOfTurnBox2 = {
        x: 1124, y: 454,
        width: 1217 - 1124,
        height: 600 - 454
    };
    
    // Draw highlights on both end of turn card boxes
    for (const box of [endOfTurnBox1, endOfTurnBox2]) {
        const [x1, y1] = scaleCoordinates(box.x, box.y);
        const [x2, y2] = scaleCoordinates(box.x + box.width, box.y + box.height);
        
        // Pulse effect
        const now = Date.now();
        const pulseOpacity = 0.3 + Math.sin(now / 200) * 0.2; // Pulsing opacity between 0.1 and 0.5
        
        ctx.fillStyle = `rgba(255, 215, 0, ${pulseOpacity})`;
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        
        // Draw "Draw Card" text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Draw Card', (x1 + x2) / 2, (y1 + y2) / 2);
    }
    
    // Request animation frame for pulsing
    requestAnimationFrame(() => drawBoard());
}

/**
 * Highlights the appropriate deck based on path color
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 * @param {string} pathColor - The color of the path
 * @export Used by the highlightPlayerChoices function and in game logic
 */
export function highlightDeck(ctx, pathColor) {
    const deckAreas = {
        purple: { x: 116, y: 443, width: 70, height: 100 },
        blue: { x: 836, y: 178, width: 70, height: 100 },
        cyan: { x: 836, y: 720, width: 70, height: 100 },
        pink: { x: 1398, y: 453, width: 70, height: 100 }
    };
    const deckArea = deckAreas[pathColor];
    if (!deckArea) return;
    
    const [x1, y1] = scaleCoordinates(deckArea.x, deckArea.y);
    const [x2, y2] = scaleCoordinates(deckArea.x + deckArea.width, deckArea.y + deckArea.height);
    
    // Pulse effect
    const now = Date.now();
    const pulseOpacity = 0.3 + Math.sin(now / 200) * 0.2;
    
    // Use PATH_COLORS from board-data.js if available
    let highlightColor;
    if (PATH_COLORS && PATH_COLORS[pathColor]) {
        highlightColor = PATH_COLORS[pathColor];
    } else {
        // Fallback colors
        switch (pathColor) {
            case 'purple': highlightColor = '#9C54DE'; break;
            case 'blue': highlightColor = '#1B3DE5'; break;
            case 'cyan': highlightColor = '#00FFFF'; break;
            case 'pink': highlightColor = '#FF66FF'; break;
            default: highlightColor = '#FFFF00';
        }
    }
    
    ctx.fillStyle = `rgba(${hexToRgb(highlightColor)}, ${pulseOpacity})`;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    
    // Draw "Draw Card" text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Draw Card', (x1 + x2) / 2, (y1 + y2) / 2);
    
    // Request animation frame for pulsing
    requestAnimationFrame(() => drawBoard());
}

/**
 * Calculates the coordinates of the next step based on current coordinates
 * @param {Object} currentCoords - Current coordinates {x, y}
 * @returns {Object|null} - The next step coordinates or null if no valid next step
 */
function getNextStepCoordinates(currentCoords) {
    if (!currentCoords) return null;
    
    // Get the next step options using our existing function
    const nextOptions = getNextStepOptions(currentCoords);
    
    // If there are no valid options or we're at the end, return null
    if (!nextOptions || nextOptions.type === 'Error' || nextOptions.type === 'End') {
        return null;
    }
    
    // For choice points, use the first option (this is just a preview)
    if (nextOptions.type === 'Choicepoint' && Array.isArray(nextOptions.choices) && nextOptions.choices.length > 0) {
        const firstChoice = nextOptions.choices[0];
        if (Array.isArray(firstChoice) && firstChoice.length >= 2) {
            return { x: firstChoice[0], y: firstChoice[1] };
        }
    }
    
    // For regular steps and finish
    if ((nextOptions.type === 'Regular' || nextOptions.type === 'Finish') && 
        Array.isArray(nextOptions.nextCoords) && nextOptions.nextCoords.length >= 2) {
        return { x: nextOptions.nextCoords[0], y: nextOptions.nextCoords[1] };
    }
    
    return null;
}

// For highlightChoicePoints, we'll update it to make it used

/**
 * Public function that wraps our internal highlightChoicePoints
 * This is called from the game module to show choices
 */
export function highlightPlayerChoices(choices) {
    if (!Array.isArray(choices) || choices.length === 0) return;
    
    // We'll call our internal function
    highlightChoicePoints();
    
    // Also, we'll draw specific highlights for the provided choices
    const ctx = boardState.ctx;
    if (!ctx) return;
    
    choices.forEach(choice => {
        if (!choice.coordinates) return;
        
        let highlightColor = '#FFFF00'; // Default yellow
        
        // Use different colors for different paths
        if (choice.pathColor) {
            switch (choice.pathColor) {
                case 'purple': highlightColor = '#9C54DE'; break;
                case 'blue': highlightColor = '#1B3DE5'; break;
                case 'cyan': highlightColor = '#00FFFF'; break;
                case 'pink': highlightColor = '#FF66FF'; break;
            }
        }
        
        // Draw the highlight
        drawPathHighlight(ctx, choice.coordinates, highlightColor, 20);
    });
}

// Export a function to update the players in boardState
export function updateBoardPlayers(players) {
    if (Array.isArray(players)) {
        boardState.players = players;
    }
}

/**
 * Draws invisible spaces on the canvas for hit testing
 */
const drawInvisibleSpaces = () => {
    // Simply call the existing function for drawing spaces
    drawPathSpaces();
};