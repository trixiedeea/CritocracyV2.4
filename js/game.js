// Game Module for Critocracy
// Handles core game logic, game flow, and state management

// ===== Imports =====
import { 
    drawBoard, 
    startMoveAnimation,
    setupBoard,
    findSpaceDetailsByCoords,
    getNextStepOptions,
    highlightPlayerChoices,
    highlightEndOfTurnCardBoxes
} from './board.js';
import { 
    START_SPACE
} from './board-data.js';
import { 
    setupDecks, 
    drawCard, 
    applyCardEffects,
    applyEndOfTurnCardEffects,
    DECK_TYPES,
    logCardDraw,
} from './cards.js';
import { 
    createPlayer, 
    updatePlayerResources, 
    markPlayerFinished, 
    getPlayerRanking,
    getPlayers, 
    PLAYER_ROLES, 
    resetPlayers,
    grantTemporaryImmunity,
    decrementTradeBlockTurns,
    getPlayerById
} from './players.js';

// Direct UI imports are necessary for prompts and direct feedback
import { 
    showEndGameScreen, 
    updatePlayerInfo, 
    updateGameControls,
    promptForTradeResponse,
    logMessage,
    clearMessages,
    showDiceRollAnimation,
    hideDiceRollAnimation,
    drawPlayers,
    highlightChoices,
    clearHighlights,
    showCardPopup,
    updateGameComponents,
    animatePlayerMovement,
    highlightDeck
} from './ui.js';

// Import logging system
import {
    initLogging,
    logGameEvent,
    logPlayerAction,
    logTurnStart,
    logTurnEnd
} from './logging.js';

// Create a global game handlers object for board interactions
// Add this after initializing gameState
export const gameHandlers = {
    handleEndOfTurnCardDraw,
    handleSpecialEventCardDraw,
    handleMoveClick,
    handleDeckClick
};

// Make the handlers available on the window object
window.gameHandlers = gameHandlers;

// ===== Game State =====
let gameState = {
    gamePhase: 'SETUP',
    turnOrder: [],
    currentPlayerId: null,
    currentRound: 1,
    currentTurn: 0,
    turnState: null,
    currentDiceRoll: null,
    currentChoices: [],
    choicePointRemainingSteps: 0,
    lastDurationPerStep: 800,
    tradePending: false,
    allianceOffers: {},
    alliances: {}
};

// Make gameState accessible from window for cross-module communication
window.gameState = gameState;

// Function to get a copy of the current game state (Deep Copy is Safer)
export function getGameState() {
    return JSON.parse(JSON.stringify(gameState));
}

// ===== Game Initialization =====

/**
 * Processes a player's movement based on dice roll
 * @param {Object} player - The player to move
 * @param {Object} target - Target coordinates (optional)
 * @param {number} steps - Number of steps to move
 * @returns {Promise<boolean>} - True if move was processed successfully
 */
// async function processPlayerMove(player, target = null, steps) {
//     if (!player || steps < 1) {
//         console.error('Cannot move player: Invalid player or steps');
//         return false;
//     }
//
//     let possibleMoves = getPossibleMoves(player, steps);
//
//     if (possibleMoves.length === 1) {
//         // Automatically choose the only possible position
//         const targetPosition = possibleMoves[0];
//         // Use direct animation instead of recursion
//         await animatePlayerMovement(player, player.currentCoords, targetPosition);
//         player.currentCoords = targetPosition;
//         handleEndOfMove(player.id, { spaceDetails: findSpaceDetailsByCoords(targetPosition) });
//     } else if (possibleMoves.length > 1) {
//         // Present choices to the player
//         presentJunctionChoices(player.id, possibleMoves);
//     } else {
//         // No valid moves - end the turn
//         logMessage(`${player.name} has no valid moves`, 'error');
//         gameState.turnState = 'ACTION_COMPLETE';
//     }
//     
//     return true;
// }

export async function initializeGame(playerConfigs) {
    console.log("Initializing game...");
    logMessage("Setting up new game...");

    try {
        // Reset modules
        resetPlayers();
        await setupBoard();
        await setupDecks();

        // Reset internal game state
        gameState = {
            gamePhase: 'SETUP',
            turnOrder: [],
            currentPlayerId: null,
            currentRound: 1,
            currentTurn: 0,
            turnState: null,
            currentDiceRoll: null,
            currentChoices: [],
            choicePointRemainingSteps: 0,
            lastDurationPerStep: 800,
            tradePending: false,
            allianceOffers: {},
            alliances: {}
        };
        
        // --- Player Creation ---
        if (!playerConfigs || playerConfigs.length === 0) {
            throw new Error("No player configurations provided");
        }
        
        // Create the players based on configs
        for (const config of playerConfigs) {
            createPlayer(config.name, config.role, config.isHuman);
        }
        
        // Initialize the logging system with the players
        initLogging(getPlayers());
        
        // Log the game initialization
        logGameEvent('GAME_INITIALIZED', { 
            playerCount: playerConfigs.length,
            playerConfigs: playerConfigs
        });
        
        // --- more existing code ---
        if (!playerConfigs || playerConfigs.length === 0) {
             throw new Error("Player configurations are required to initialize the game.");
        }
        
        const humanPlayers = playerConfigs.filter(p => p.isHuman);
        let humanRole = null;
        if (humanPlayers.length === 1) {
             humanRole = humanPlayers[0].role;
        } else if (humanPlayers.length > 1) {
             console.warn("Multiple human players detected. Specific CPU names based on the *first* human's role.");
             humanRole = humanPlayers[0].role;
        }

        const addedPlayerIds = [];
        const assignedRoles = new Set();

        // Add explicitly defined players (human and potentially pre-defined CPUs)
        for (const config of playerConfigs) {
            if (assignedRoles.has(config.role)) {
                console.warn(`Skipping player config for ${config.name}: Role ${config.role} already assigned.`);
                continue;
            }
            const player = createPlayer(config.name, config.role, config.isHuman);
            if (player) {
                addedPlayerIds.push(player.id);
                assignedRoles.add(player.role);
            } else {
                 console.error(`Failed to add configured player: ${config.name} (${config.role})`);
            }
        }

        // --- Assign Roles/Names to remaining CPU slots if needed ---
        const totalPlayerCount = playerConfigs.length;
        const cpusToAdd = totalPlayerCount - getPlayers().length;

        if (cpusToAdd > 0) {
            console.log(`Assigning roles/names for ${cpusToAdd} additional CPU players...`);
            const availableRoles = Object.keys(PLAYER_ROLES).filter(role => !assignedRoles.has(role));
            
            for (let i = availableRoles.length - 1; i > 0; i--) {
                 const j = Math.floor(Math.random() * (i + 1));
                 [availableRoles[i], availableRoles[j]] = [availableRoles[j], availableRoles[i]];
             }

             for (let i = 0; i < cpusToAdd; i++) {
                  if (availableRoles.length === 0) {
                       console.error("Ran out of available roles while assigning CPUs!");
                       break; 
                  }
                  const cpuRole = availableRoles.pop();
                  
                  let cpuName = `CPU (${cpuRole.substring(0,3)})`;
                  const cpuPlayer = createPlayer(cpuName, cpuRole, false);
                  if (cpuPlayer) {
                       addedPlayerIds.push(cpuPlayer.id);
                       assignedRoles.add(cpuRole);
                  } else {
                      console.error(`Failed to add CPU player ${cpuName} with role ${cpuRole}.`);
                  }
             }
        }

        if (getPlayers().length !== totalPlayerCount) {
            throw new Error(`Failed to initialize correct number of players. Expected ${totalPlayerCount}, got ${getPlayers().length}`);
        }
        console.log("Players initialized:", getPlayers().map(p => `${p.name} (${p.role})`));

        gameState.turnOrder = addedPlayerIds; 
        console.log("Turn order set:", gameState.turnOrder.map(id => getPlayerById(id)?.name));

        gameState.currentPlayerId = gameState.turnOrder[0];
        gameState.gamePhase = 'PLAYING';
        
        console.log(`Game starting. First player: ${getPlayerById(gameState.currentPlayerId)?.name}`);

        clearMessages();
        updatePlayerInfo();
        drawBoard();
        drawPlayers();

        prepareTurnForPlayer(getPlayerById(gameState.currentPlayerId));
        
        logMessage("Game initialization complete.");
        return true;

    } catch (error) {
        console.error('Error initializing game:', error);
        logMessage(`Error initializing game: ${error.message}`);
        gameState.gamePhase = 'SETUP';
        return false;
    }
}

// ===== Turn Management =====

/**
 * Sets the initial state for the beginning of a player's turn.
 * Checks if the player needs to choose a starting path or roll the dice.
 * Triggers AI turn if applicable.
 * @param {object} player - The player whose turn it is.
 */
function prepareTurnForPlayer(player) {
    if (!player) {
        console.error("prepareTurnForPlayer: Invalid player object.");
        return;
    }
    console.log(`--- Preparing turn for ${player.name} ---`);
    logMessage(`It's ${player.name}'s turn.`);
    
    // Increment the game turn counter
    gameState.currentTurn++;
    
    // Log the turn start
    logTurnStart(player.id, gameState.currentTurn);

    gameState.currentDiceRoll = null;
    gameState.currentChoices = [];
    gameState.choicePointRemainingSteps = 0;
    clearHighlights();
    hideDiceRollAnimation();

    if (player.skipTurns > 0) {
        logMessage(`${player.name} must skip this turn (${player.skipTurns} remaining).`);
        
        // Log the skipped turn
        logPlayerAction(player.id, 'TURN_SKIPPED', {
            turnNumber: gameState.currentTurn,
            remainingSkips: player.skipTurns - 1
        });
        
        player.skipTurns--;
        updatePlayerInfo();
        gameState.turnState = 'TURN_ENDED';
        advanceToNextPlayer();
        return;
    }

    const startX = START_SPACE.coordinates[0][0];
    const startY = START_SPACE.coordinates[0][1];
    if (player.coords.x === startX && player.coords.y === startY) {
        console.log(`${player.name} is at Start. Needs to choose a path.`);
        logMessage(`${player.name}, choose your starting path.`);
        gameState.turnState = 'AWAITING_START_CHOICE';
        gameState.currentChoices = Object.entries(START_SPACE.nextCoordOptions).map(([color, coords]) => ({
            type: 'start',
            coordinates: coords,
            pathColor: color 
        }));
        highlightChoices(gameState.currentChoices);
        
        // Log the available choices
        logGameEvent('START_PATH_CHOICE_REQUIRED', {
            playerId: player.id,
            availableChoices: gameState.currentChoices.map(c => c.pathColor),
            turnNumber: gameState.currentTurn
        });
        
        if (!player.isHuman) {
             const choice = gameState.currentChoices[0];
             console.log(`AI ${player.name} chooses first path: ${choice.pathColor}`);
             setTimeout(() => resolvePlayerChoice(player.id, choice), 500);
        }
    } else {
        console.log(`${player.name} can roll the dice.`);
        logMessage(`${player.name}, roll the dice!`);
        gameState.turnState = 'AWAITING_ROLL';

        if (!player.isHuman) {
             console.log(`AI ${player.name} rolling dice...`);
             setTimeout(() => handlePlayerAction(player.id, 'ROLL_DICE'), 500);
        }
    }
    updatePlayerInfo();
    updateGameControls();
}

// Main function to handle player actions
export async function handlePlayerAction(playerId, actionType, actionParams = {}) {
    const player = getPlayerById(playerId);
    if (!player) {
        console.error(`Cannot handle action: Player ${playerId} not found`);
        return false;
    }
    
    // Validate it's this player's turn
    if (playerId !== gameState.currentPlayerId) {
        console.error(`Cannot handle action: Not ${player.name}'s turn`);
        return false;
    }
    
    console.log(`Handling action ${actionType} for ${player.name} with params:`, actionParams);
    
    // Declare variables outside switch to avoid lexical declarations
    let deckColor;
    let pathCard;
    let boxNumber;
    let eotCard;
    let success;
    
    switch (actionType) {
        case 'ROLL_DICE':
            // Handle rolling the dice and movement
            return handleDiceRoll(playerId);
            
        case 'DRAW_PATH_CARD':
            // Handle drawing a card from a path deck (purple, blue, cyan, pink)
            if (gameState.turnState !== 'AWAITING_PATH_CARD') {
                console.error(`Cannot draw path card: Invalid game state ${gameState.turnState}`);
                return false;
            }
            
            deckColor = actionParams.deckColor || player.currentPath;
            if (!deckColor) {
                console.error(`Cannot draw path card: No deck color specified`);
                return false;
            }
            
            // Draw a card from the appropriate deck
            pathCard = drawCard(deckColor);
            if (!pathCard) {
                console.error(`Failed to draw card from ${deckColor} deck`);
                return false;
            }
            
            // Show the card with animation
            await handleCardDisplay(pathCard, deckColor, player);
            
            // Apply card effects
            applyCardEffects(pathCard, player);
            
            // Move to end of turn card phase
            gameState.turnState = 'AWAITING_END_OF_TURN_CARD';
            
            // For human players, prompt to draw end of turn card
            if (player.isHuman) {
                logMessage('Click on an End of Turn card to draw');
            } else {
                // CPU draws end of turn card automatically
                setTimeout(() => {
                    handlePlayerAction(playerId, 'DRAW_END_OF_TURN_CARD');
                }, 1500);
            }
            
            return true;
            
        case 'DRAW_END_OF_TURN_CARD':
            // Handle drawing an end of turn card
            if (gameState.turnState !== 'AWAITING_END_OF_TURN_CARD' && gameState.turnState !== 'ACTION_COMPLETE') {
                console.error(`Cannot draw end of turn card: Invalid game state ${gameState.turnState}`);
                return false;
            }
            
            // For human players, they can select which end of turn box to draw from
            boxNumber = player.isHuman ? (actionParams.cardBoxNumber || 1) : Math.floor(Math.random() * 2) + 1;
            
            // Draw card from end of turn deck
            eotCard = drawCard('end_of_turn', boxNumber);
            if (!eotCard) {
                console.error(`Failed to draw end of turn card from box ${boxNumber}`);
                return false;
            }
            
            // Show the card with animation
            await handleCardDisplay(eotCard, 'end_of_turn', player);
            
            // Apply card effects
            applyCardEffects(eotCard, player);
            
            // End turn
            gameState.turnState = 'ACTION_COMPLETE';
            
            // Mark that player has drawn their end of turn card
            player.hasDrawnEndOfTurnCard = true;
            
            // For human players, enable end turn button
            if (player.isHuman) {
                updateGameControls();
            } else {
                // CPU ends turn automatically
                setTimeout(() => {
                    handlePlayerAction(playerId, 'END_TURN');
                }, 1500);
            }
            
            return true;
            
        case 'END_TURN':
            // Handle ending the current player's turn
            if (gameState.turnState !== 'ACTION_COMPLETE') {
                console.error(`Cannot end turn: Invalid game state ${gameState.turnState}`);
                return false;
            }
            
            // Reset turn-specific flags
            player.hasDrawnEndOfTurnCard = false;
            
            // Move to the next player
            advanceToNextPlayer();
            
            return true;
            
        case 'USE_ABILITY':
            // Handle player using their role-specific ability
            if (gameState.turnState !== 'AWAITING_ROLL' && gameState.turnState !== 'ACTION_COMPLETE') {
                console.error(`Cannot use ability: Invalid game state ${gameState.turnState}`);
                return false;
            }
            
            // Check if ability already used
            if (player.abilityUsed) {
                console.error(`Cannot use ability: Already used this game`);
                return false;
            }
            
            // Handle role-specific abilities
            success = usePlayerAbility(player);
            
            if (success) {
                // Mark ability as used
                player.abilityUsed = true;
                updateGameControls();
            }
            
            return success;
            
        default:
            console.error(`Unknown action type: ${actionType}`);
            return false;
    }
}

/**
 * Handles clicks on the game board, primarily for making choices.
 * Called from UI event listeners.
 * @param {number} clickX - The raw X coordinate of the click.
 * @param {number} clickY - The raw Y coordinate of the click.
 */
export function resolveBoardClick(clickX, clickY) {
    const playerId = gameState.currentPlayerId;
    const player = getPlayerById(playerId);
    if (!player || !player.isHuman) {
        console.warn("resolveBoardClick ignored: Not a human player's turn or no current player.");
        return;
    }

    const currentState = gameState.turnState;
    if (!['AWAITING_START_CHOICE', 'AWAITING_JUNCTION_CHOICE'].includes(currentState)) {
         console.log("resolveBoardClick ignored: Not waiting for board choice.");
         return;
    }

    console.warn("resolveBoardClick needs integration with UI hit detection. Assuming UI calls resolvePlayerChoice.");
}

/**
 * Handles drawing an End of Turn card
 * @param {number} boxNumber - Which End of Turn card box was clicked (1 or 2)
 */
async function handleEndOfTurnCardDraw(boxNumber) {
    console.log(`handleEndOfTurnCardDraw: Box ${boxNumber}`);
    
    if (gameState.turnState !== 'AWAITING_END_OF_TURN_CARD') {
        console.warn("Cannot draw End of Turn card at this time");
        return;
    }
    
    const player = getPlayerById(gameState.currentPlayerId);
    if (!player) {
        console.error("Current player not found");
        return;
    }
    
    logMessage(`${player.name} draws an End of Turn card.`);
    
    // Draw a random card from the End of Turn deck
    const endOfTurnCard = drawCard(DECK_TYPES.END_OF_TURN);
    if (!endOfTurnCard) {
        logMessage("No End of Turn cards available.");
        return;
    }
    
    // Show card to player
    await handleCardDisplay(endOfTurnCard, DECK_TYPES.END_OF_TURN, player);
}

// Function to handle resolving player choice for path selection or junctions
export function resolvePlayerChoice(playerId, choice) {
    const player = getPlayerById(playerId);
    if (!player) {
        console.error(`Cannot resolve choice: Player ${playerId} not found`);
        return false;
    }
    
    const gameState = getGameState();
    
    // Only process choices when in appropriate states
    if (gameState.turnState !== 'AWAITING_START_CHOICE' && 
        gameState.turnState !== 'AWAITING_JUNCTION_CHOICE') {
        console.error(`Cannot resolve choice: Invalid game state ${gameState.turnState}`);
        return false;
    }
    
    console.log(`Resolving choice for player ${player.name}:`, choice);
    
    // Clear any existing highlights
    if (typeof clearHighlights === 'function') {
        clearHighlights();
    }
    
    // If no choice provided or invalid choice, do nothing
    if (!choice || !choice.coordinates) {
        console.error('Invalid choice provided');
        return false;
    }
    
    // Set player position to the chosen coordinates
    const coords = {
        x: choice.coordinates[0],
        y: choice.coordinates[1]
    };
    
    // If player has a previous position, animate movement to new position
    if (player.coords && typeof animatePlayerMovement === 'function') {
        const fromCoords = [player.coords.x, player.coords.y];
        const toCoords = [coords.x, coords.y];
        
        // Animate the player movement
        animatePlayerMovement(player, fromCoords, toCoords).then(() => {
            // After animation completes, continue with next game action
            
            // Update player's position
            player.coords = coords;
            
            // Update game state
            if (gameState.turnState === 'AWAITING_START_CHOICE') {
                // If this was the initial path choice, update player's path
                player.currentPath = choice.pathColor || 'default';
                gameState.turnState = 'ACTION_COMPLETE';
            } else if (gameState.turnState === 'AWAITING_JUNCTION_CHOICE') {
                // If this was a junction choice, update path if changed
                if (choice.pathColor && choice.pathColor !== player.currentPath) {
                    logMessage(`${player.name} changed path to ${getAgeNameFromPathColor(choice.pathColor)}`);
                    player.currentPath = choice.pathColor;
                }
                
                // If the space is a special event space, handle drawing the appropriate card
                if (choice.type === 'draw') {
                    // Draw card from deck matching the path color
                    gameState.turnState = 'AWAITING_PATH_CARD';
                    logMessage(`${player.name} landed on a Draw space`);
                    
                    // If human player, highlight the deck to draw from
                    if (player.isHuman) {
                        // Highlight the appropriate deck
                        const deckColor = choice.pathColor || player.currentPath;
                        if (typeof highlightDeck === 'function') {
                            highlightDeck(deckColor);
                        }
                    } else {
                        // For CPU players, automatically draw the card
                        handlePlayerAction(playerId, 'DRAW_PATH_CARD', { deckColor: choice.pathColor || player.currentPath });
                    }
                } else {
                    // Regular space - just move to end of turn
                    gameState.turnState = 'ACTION_COMPLETE';
                    
                    // If human player, prompt to draw end of turn card
                    if (player.isHuman) {
                        gameState.turnState = 'AWAITING_END_OF_TURN_CARD';
                        logMessage('Click on an End of Turn card to draw');
                    } else {
                        // CPU draws end of turn card automatically
                        handlePlayerAction(playerId, 'DRAW_END_OF_TURN_CARD');
                    }
                }
            }
            
            // Update game UI
            updateGameComponents();
        });
    } else {
        // No animation, just update position immediately
        player.coords = coords;
        
        // Update game state
        if (gameState.turnState === 'AWAITING_START_CHOICE') {
            player.currentPath = choice.pathColor || 'default';
            gameState.turnState = 'ACTION_COMPLETE';
        } else if (gameState.turnState === 'AWAITING_JUNCTION_CHOICE') {
            if (choice.pathColor && choice.pathColor !== player.currentPath) {
                logMessage(`${player.name} changed path to ${getAgeNameFromPathColor(choice.pathColor)}`);
                player.currentPath = choice.pathColor;
            }
            
            // Handle special event spaces
            if (choice.type === 'draw') {
                gameState.turnState = 'AWAITING_PATH_CARD';
                logMessage(`${player.name} landed on a Draw space`);
                
                // If human player, highlight the deck to draw from
                if (player.isHuman) {
                    const deckColor = choice.pathColor || player.currentPath;
                    if (typeof highlightDeck === 'function') {
                        highlightDeck(deckColor);
                    }
                } else {
                    // For CPU players, automatically draw the card
                    handlePlayerAction(playerId, 'DRAW_PATH_CARD', { deckColor: choice.pathColor || player.currentPath });
                }
            } else {
                // Regular space
                gameState.turnState = 'ACTION_COMPLETE';
                
                if (player.isHuman) {
                    gameState.turnState = 'AWAITING_END_OF_TURN_CARD';
                    logMessage('Click on an End of Turn card to draw');
                } else {
                    // CPU draws end of turn card automatically
                    handlePlayerAction(playerId, 'DRAW_END_OF_TURN_CARD');
                }
            }
        }
        
        // Update game UI
        updateGameComponents();
    }
    
    return true;
}

/**
 * Process the result of player movement, handling different space types and interactions.
 * @param {string} playerId - ID of the player
 * @param {Object} moveResult - Result data from the move
 */
function handleEndOfMove(playerId, moveResult) {
    console.log("handleEndOfMove:", playerId, moveResult);
    
    const player = getPlayerById(playerId);
    if (!player) {
        console.error("Player not found in handleEndOfMove");
        return;
    }
    
    hideDiceRollAnimation();
    
    // Log the movement completion
    logPlayerAction(playerId, 'MOVEMENT_COMPLETED', {
        finalCoords: player.coords,
        spaceType: moveResult?.spaceDetails?.type || 'unknown',
        pathColor: moveResult?.spaceDetails?.pathColor,
        diceRoll: gameState.currentDiceRoll
    });
    
    // Process the move result based on the space type
    if (moveResult && moveResult.spaceDetails) {
        const spaceType = moveResult.spaceDetails.type?.toLowerCase();
        
        // If player reached the finish space
        if (spaceType === 'finish') {
            logMessage(`${player.name} has reached the finish!`);
            markPlayerFinished(playerId);
            
            // Log the player finishing
            logGameEvent('PLAYER_REACHED_FINISH', {
                playerId,
                turnNumber: gameState.currentTurn,
                roundNumber: gameState.currentRound,
                resources: { ...player.resources }
            });
            
            gameState.turnState = 'ACTION_COMPLETE';
            updateGameControls();
            return;
        }
        
        // If landed on a draw space, set state to draw a special event card
        if (spaceType === 'draw') {
            const pathColor = moveResult.spaceDetails.pathColor;
            if (pathColor) {
                logMessage(`${player.name} landed on a draw space. Draw a card from the ${getAgeNameFromPathColor(pathColor)} deck.`);
                player.currentPathColor = pathColor;
                gameState.turnState = 'AWAITING_SPECIAL_EVENT_CARD';
                
                // Log landing on a draw space
                logGameEvent('PLAYER_ON_DRAW_SPACE', {
                    playerId,
                    pathColor,
                    coords: player.coords
                });
                
                updateGameControls();
                return;
            }
        }
        
        // If it's a junction, handle path choices
        if (spaceType === 'junction' || spaceType === 'choicepoint') {
            // Log reaching a choice point
            logGameEvent('PLAYER_AT_CHOICE_POINT', {
                playerId,
                choiceType: spaceType,
                coords: player.coords
            });
            
            handleChoicePoint(playerId, moveResult);
            return;
        }
        
        // Handle other space types as needed...
    }
    
    // If not a special space, proceed to end of turn sequence
    logMessage(`${player.name} has completed their move.`);
    gameState.turnState = 'ACTION_COMPLETE';
    updateGameControls();
    
    // If the player is AI, automatically draw an End of Turn card
    if (!player.isHuman) {
        setTimeout(() => {
            if (gameState.turnState === 'ACTION_COMPLETE') {
                logMessage(`${player.name} (AI) must now draw an End of Turn card.`);
                gameState.turnState = 'AWAITING_END_OF_TURN_CARD';
                updateGameControls();
                
                // Randomly choose an End of Turn card box
                const boxNumber = Math.random() < 0.5 ? 1 : 2;
                setTimeout(() => {
                    handleEndOfTurnCardDraw(boxNumber);
                }, 1000);
            }
        }, 1000);
    }
}

/**
 * Ends the current player's turn and advances to the next.
 * Handles round start logic (immunity, alliances).
 */
function advanceToNextPlayer() {
    console.log(`--- advanceToNextPlayer ---`);
    const currentPlayerId = gameState.currentPlayerId;
    if (!currentPlayerId) return;
    
    const currentPlayer = getPlayerById(currentPlayerId);
    
    // First, make sure the player draws an End of Turn card before advancing to the next player
    if (currentPlayer && !currentPlayer.hasDrawnEndOfTurnCard && !currentPlayer.finished) {
        handleEndOfTurnCardDraw(Math.floor(Math.random() * 2) + 1);
        return; // We'll resume advancing to the next player after the card effect is resolved
    }
    
    // Log the end of the turn
    if (currentPlayer) {
        logTurnEnd(currentPlayer.id, gameState.currentTurn);
        
        // Reset the end of turn card flag for the next turn
        currentPlayer.hasDrawnEndOfTurnCard = false;
    }

    const currentPlayerIndex = gameState.turnOrder.indexOf(currentPlayerId);
    
    if (currentPlayerIndex === gameState.turnOrder.length - 1) {
        gameState.currentRound++;
        logMessage(`--- Starting Round ${gameState.currentRound} ---`);
        
        // Log the start of a new round
        logGameEvent('ROUND_START', {
            roundNumber: gameState.currentRound,
            playerCount: gameState.turnOrder.length
        });
        
        decrementImmunityTurns();
        decrementTradeBlockTurns();
        
        // Check for and clean up expired alliances
        checkAndRemoveExpiredAlliances();
    }

    let nextPlayerIndex = (currentPlayerIndex + 1) % gameState.turnOrder.length;
    let nextPlayerId = gameState.turnOrder[nextPlayerIndex];
    let nextPlayer = getPlayerById(nextPlayerId);
    let loopCheck = 0;

    while (nextPlayer && nextPlayer.finished && loopCheck < gameState.turnOrder.length) {
        logMessage(`Player ${nextPlayer.name} has finished, skipping.`);
        
        // Log skipping a finished player
        logGameEvent('PLAYER_SKIPPED', {
            playerId: nextPlayer.id,
            reason: 'PLAYER_FINISHED'
        });
        
        nextPlayerIndex = (nextPlayerIndex + 1) % gameState.turnOrder.length;
        nextPlayerId = gameState.turnOrder[nextPlayerIndex];
        nextPlayer = getPlayerById(nextPlayerId);
        loopCheck++;
    }

    if (loopCheck >= gameState.turnOrder.length || !nextPlayer) {
        console.warn("advanceToNextPlayer: All remaining players seem finished. Triggering game over.");
        
        // Log the game is ending because all players are finished
        logGameEvent('GAME_ENDING', {
            reason: 'ALL_PLAYERS_FINISHED'
        });
        
        triggerGameOver();
        return;
    }
    
    gameState.currentPlayerId = nextPlayerId;
    console.log(`Advancing turn. New player: ${nextPlayer.name}`);

    prepareTurnForPlayer(nextPlayer);
}

/**
 * Checks for and removes any alliances that have expired based on their duration.
 */
function checkAndRemoveExpiredAlliances() {
    const alliancesToRemove = [];
    
    // Identify alliances that have expired
    Object.entries(gameState.alliances).forEach(([allianceId, alliance]) => {
        const roundsActive = gameState.currentRound - alliance.formedInRound;
        if (roundsActive >= alliance.duration) {
            alliancesToRemove.push(allianceId);
            
            // Log the ending of the alliance
            const player1 = getPlayerById(alliance.players[0]);
            const player2 = getPlayerById(alliance.players[1]);
            if (player1 && player2) {
                logMessage(`The alliance between ${player1.name} and ${player2.name} has ended.`);
            }
        }
    });
    
    // Remove expired alliances
    alliancesToRemove.forEach(id => {
        delete gameState.alliances[id];
    });
    
    if (alliancesToRemove.length > 0) {
        console.log(`Removed ${alliancesToRemove.length} expired alliances.`);
    }
}

/**
 * Checks if two players are currently in an alliance with each other.
 * @param {string} player1Id - The ID of the first player.
 * @param {string} player2Id - The ID of the second player.
 * @returns {boolean} - True if the players are in an alliance, false otherwise.
 */
export function isInAlliance(player1Id, player2Id) {
    // Check both possible alliance combinations (player1-player2 or player2-player1)
    const allianceId1 = `${player1Id}-${player2Id}`;
    const allianceId2 = `${player2Id}-${player1Id}`;
    
    return (allianceId1 in gameState.alliances) || (allianceId2 in gameState.alliances);
}

/**
 * Ends the game and displays the results.
 */
function triggerGameOver() {
    console.log("--- triggerGameOver ---");
    if (gameState.gamePhase === 'FINISHED') return;

    gameState.gamePhase = 'FINISHED';
    gameState.turnState = null;
    gameState.currentPlayerId = null;
    console.log("Game Over!");
    logMessage("Game Over!");

    const finalRankings = getPlayerRanking();
    console.log("Final Rankings:", finalRankings);
    
    // Log the game over event with final rankings
    logGameEvent('GAME_OVER', {
        totalRounds: gameState.currentRound,
        totalTurns: gameState.currentTurn,
        rankings: finalRankings.map(player => ({
            playerId: player.id,
            playerName: player.name,
            playerRole: player.role,
            finished: player.finished,
            resources: { ...player.resources }
        }))
    });

    showEndGameScreen(finalRankings);
    updateGameControls();
}

/**
 * Handles the complete turn logic for an AI player.
 * @param {object} aiPlayer - The AI player object.
 */
async function handleAITurn(aiPlayer) {
    console.log(`--- handleAITurn for ${aiPlayer.name} ---`);
    if (gameState.gamePhase !== 'PLAYING' || gameState.currentPlayerId !== aiPlayer.id) {
        console.warn(`handleAITurn called incorrectly for ${aiPlayer.name}.`);
        return;
    }

    const currentState = gameState.turnState;
    console.log(`AI State: ${currentState}`);
    
    // Add a consistent human-like delay before AI actions (800-1200ms)
    const baseDelay = 800 + Math.floor(Math.random() * 400);
    await new Promise(resolve => setTimeout(resolve, baseDelay));

    // Declare variables outside switch to avoid lexical declarations
    let availableChoices;
    let choiceIndex;
    let startChoice;
    let junctionOptions;
    let junctionIndex;
    let junctionChoice;
    let cardBoxNumber;
    let endOfTurnCard;

    try {
        switch (currentState) {
            case 'AWAITING_START_CHOICE':
                 // AI chooses path with slight randomness to avoid predictability
                 availableChoices = [...gameState.currentChoices];
                 // Pick a random option from the available choices (instead of always first)
                 choiceIndex = Math.floor(Math.random() * availableChoices.length);
                 startChoice = availableChoices[choiceIndex];
                 
                 logMessage(`${aiPlayer.name} is choosing a starting path...`);
                 await new Promise(resolve => setTimeout(resolve, 1000)); // Pause to create anticipation
                 
                 console.log(`AI ${aiPlayer.name} chooses path: ${startChoice.pathColor}`);
                 resolvePlayerChoice(aiPlayer.id, startChoice);
                 break;
                 
            case 'AWAITING_ROLL':
                 logMessage(`${aiPlayer.name} is rolling the dice...`);
                 await new Promise(resolve => setTimeout(resolve, 800)); // Pause before rolling
                 handlePlayerAction(aiPlayer.id, 'ROLL_DICE');
                 break;
                 
            case 'AWAITING_JUNCTION_CHOICE':
                 // Similar to start choice, add randomness to AI junction choice
                 junctionOptions = [...gameState.currentChoices];
                 junctionIndex = Math.floor(Math.random() * junctionOptions.length);
                 junctionChoice = junctionOptions[junctionIndex];
                 
                 logMessage(`${aiPlayer.name} is choosing a path at the junction...`);
                 await new Promise(resolve => setTimeout(resolve, 1200)); // Longer pause for "thinking" at junction
                 
                 console.log(`AI ${aiPlayer.name} chooses junction path to:`, junctionChoice.coordinates);
                 resolvePlayerChoice(aiPlayer.id, junctionChoice);
                 break;
                 
            case 'AWAITING_END_OF_TURN_CARD':
                 logMessage(`${aiPlayer.name} is drawing an End of Turn card...`);
                 await new Promise(resolve => setTimeout(resolve, 1000)); // Pause before drawing
                 
                 // AI draws from a random end of turn card box (1 or 2)
                 cardBoxNumber = Math.random() < 0.5 ? 1 : 2;
                 console.log(`AI ${aiPlayer.name} drawing End of Turn card from box ${cardBoxNumber}.`);
                 
                 // Draw card and show it
                 endOfTurnCard = drawCard(DECK_TYPES.END_OF_TURN);
                 if (endOfTurnCard) {
                     await handleCardDisplay(endOfTurnCard, DECK_TYPES.END_OF_TURN, aiPlayer);
                     
                     // Pause to show the card (simulating reading time)
                     await new Promise(resolve => setTimeout(resolve, 2500));
                     
                     // Apply card effects
                     applyEndOfTurnCardEffects(endOfTurnCard, aiPlayer);
                     aiPlayer.hasDrawnEndOfTurnCard = true;
                     
                     // Update UI after effects
                     updatePlayerInfo();
                 } else {
                     logMessage(`No End of Turn cards available.`);
                     aiPlayer.hasDrawnEndOfTurnCard = true;
                 }
                 
                 // Set state to action complete
                 gameState.turnState = 'ACTION_COMPLETE';
                 updateGameControls();
                 
                 // End turn after a pause
                 await new Promise(resolve => setTimeout(resolve, 1200));
                 handlePlayerAction(aiPlayer.id, 'END_TURN');
                 break;
                 
            case 'ACTION_COMPLETE':
                 logMessage(`${aiPlayer.name} is ending their turn...`);
                 await new Promise(resolve => setTimeout(resolve, 1000)); // Pause before ending turn
                 handlePlayerAction(aiPlayer.id, 'END_TURN');
                 break;
                 
            default:
                 console.log(`AI ${aiPlayer.name} in unhandled state: ${currentState}. Ending turn as fallback.`);
                 await new Promise(resolve => setTimeout(resolve, 1000));
                 handlePlayerAction(aiPlayer.id, 'END_TURN');
                 break;
        }
    } catch (error) {
         console.error(`Error during AI turn (${aiPlayer.name}, State: ${currentState}):`, error);
         logMessage(`AI error for ${aiPlayer.name}: ${error.message}`);
         gameState.turnState = 'TURN_ENDED';
         await new Promise(resolve => setTimeout(resolve, 500));
         advanceToNextPlayer();
    }
}

export function initiateTrade(sourcePlayer, targetPlayer, offerDetails, requestDetails, isSwap = false) {
    console.log(`Initiating trade: ${sourcePlayer.role} -> ${targetPlayer.role}`);
    console.log('Offer:', offerDetails, 'Request:', requestDetails, 'Swap:', isSwap);

    const canSourceAfford = checkResourceAvailability(sourcePlayer.id, offerDetails);
    const canTargetAfford = checkResourceAvailability(targetPlayer.id, requestDetails);

    if (isSwap) {
        if (!canSourceAfford || !canTargetAfford) {
            logMessage(`${sourcePlayer.role} cannot initiate swap with ${targetPlayer.role}: Insufficient resources for one or both parties.`);
            console.log("Swap failed: Insufficient resources.");
            return;
        }
    } else {
        if (!canSourceAfford) {
            logMessage(`${sourcePlayer.role} cannot make offer to ${targetPlayer.role}: Insufficient resources.`);
            console.log("Trade failed: Source cannot afford offer.");
            return;
        }
    }

    if (targetPlayer.isAI) {
        const aiAccepts = isSwap ? canTargetAfford : true;
        console.log(`AI ${targetPlayer.role} decision: ${aiAccepts}`);
        if (aiAccepts) {
            handleTradeResponse(true, sourcePlayer.id, targetPlayer.id, offerDetails, requestDetails, isSwap);
        } else {
             handleTradeResponse(false, sourcePlayer.id, targetPlayer.id, offerDetails, requestDetails, isSwap);
             logMessage(`${targetPlayer.role} (AI) rejected the trade offer from ${sourcePlayer.role}.`);
        }
    } else {
        console.log(`Prompting human player ${targetPlayer.role} for trade...`);
        promptForTradeResponse(sourcePlayer, targetPlayer, offerDetails, requestDetails, isSwap, 
            (accepted) => handleTradeResponse(accepted, sourcePlayer.id, targetPlayer.id, offerDetails, requestDetails, isSwap)
        );
    }
    updateGameControls();
}

function handleTradeResponse(accepted, sourcePlayerId, targetPlayerId, offerDetails, requestDetails, isSwap) {
    gameState.tradePending = false;
    if (accepted) {
         if (!isSwap && !checkResourceAvailability(targetPlayerId, requestDetails)) {
             logMessage(`${targetPlayerId} accepted but cannot afford. Trade cancelled.`);
             gameState.turnState = 'ACTION_COMPLETE';
         } else {
             logMessage(`Trade accepted between ${sourcePlayerId} and ${targetPlayerId}.`);
             executeTrade(sourcePlayerId, targetPlayerId, offerDetails, requestDetails, isSwap);
             gameState.turnState = 'ACTION_COMPLETE';
         }
    } else {
         logMessage(`Trade rejected by ${targetPlayerId}.`);
         gameState.turnState = 'ACTION_COMPLETE';
    }
     updatePlayerInfo();
     updateGameControls();
}

function executeTrade(playerAId, playerBId, detailsA, detailsB, isSwap = false) {
    const playerA = getPlayerById(playerAId);
    const playerB = getPlayerById(playerBId);
    
    if (!playerA || !playerB) {
        console.error("Cannot execute trade: Player not found.");
        return;
    }
    
    console.log(`Executing trade between ${playerA.name} and ${playerB.name}...`);
    
    if (isSwap) {
        // For swaps, both players exchange the same resource
        const resourceA = detailsA.resource;
        const amountA = detailsA.amount;
        
        // Handle the swap in one transaction
        updatePlayerResources(playerAId, { [resourceA]: -amountA });
        updatePlayerResources(playerBId, { [resourceA]: amountA });
        logMessage(`${playerA.name} swapped ${amountA} ${resourceA} with ${playerB.name}.`);
    } else {
        // For regular trades, players exchange different resources
        updatePlayerResources(playerAId, { [detailsA.resource]: -detailsA.amount });
        updatePlayerResources(playerBId, { [detailsA.resource]: detailsA.amount });
        updatePlayerResources(playerBId, { [detailsB.resource]: -detailsB.amount });
        updatePlayerResources(playerAId, { [detailsB.resource]: detailsB.amount });
        logMessage(`${playerA.name} gives ${detailsA.amount} ${detailsA.resource} to ${playerB.name} in exchange for ${detailsB.amount} ${detailsB.resource}.`);
    }
}

function checkResourceAvailability(playerId, details) {
     if (!details || !details.resource || details.amount <= 0) return true;
     const player = getPlayerById(playerId);
     if (!player) return false;
     const currentAmount = player.resources[details.resource] || 0;
     return currentAmount >= details.amount;
}

export function handleCardMovement(player, effect) {
     console.warn("handleCardMovement needs review/implementation.");
     if (effect.spaces) {
         startMoveAnimation(player, parseInt(effect.spaces, 10), (result) => handleEndOfMove(player.id, result));
     } else {
         logMessage("Unsupported card movement effect.");
     }
}

export function initiateAlliance(playerA, playerB) {
    console.log(`Initiating alliance between ${playerA.name} (${playerA.role}) and ${playerB.name} (${playerB.role})`);
    
    // Store the alliance in the game state to track it
    const allianceId = `${playerA.id}-${playerB.id}`;
    gameState.alliances[allianceId] = {
        players: [playerA.id, playerB.id],
        formedInRound: gameState.currentRound,
        duration: 1 // Alliance lasts for 1 full round
    };
    
    // Grant temporary immunity to both players
    grantTemporaryImmunity(playerA.id, 1);
    grantTemporaryImmunity(playerB.id, 1);
    
    // Log the alliance formation
    logMessage(`${playerA.name} and ${playerB.name} have formed a temporary alliance!`);
    logMessage(`Both players are immune to negative effects for 1 turn.`);
    
    updatePlayerInfo();
}

/**
 * Handler for deck draws
 * @param {Player} player - The player drawing the card
 * @param {string} pathColor - The color of the path/deck to draw from
 */
export async function handleSpecialEventCardDraw(player, pathColor) {
    if (!player || !pathColor) {
        console.error('Invalid parameters for handleSpecialEventCardDraw');
        return;
    }

    // Draw card from the appropriate deck
    const card = drawCard(pathColor);
    if (!card) {
        console.error(`Failed to draw card from ${pathColor} deck`);
        return;
    }

    logGameEvent('CARD_DRAWN', {
        playerId: player.id,
        cardName: card.name,
        deckType: pathColor
    });

    // Mark that card has been drawn and update game state
    player.drewSpecialEventCard = true;
    gameState.turnState = 'AWAITING_END_OF_TURN_CARD';
    
    // For human players, prompt to draw end of turn card
    if (player.isHuman) {
        logMessage('Click on an End of Turn Card to draw.');
        // Get canvas context and pass it to highlightEndOfTurnCardBoxes
        const ctx = document.getElementById('board-canvas')?.getContext('2d');
        if (ctx) {
            highlightEndOfTurnCardBoxes(ctx);
        } else {
            console.error('Could not get canvas context for highlighting card boxes');
        }
    } else {
        // Auto-draw for CPU players after a delay
        setTimeout(() => {
            handleEndOfTurnCardDraw(Math.floor(Math.random() * 2) + 1);
        }, 2000);
    }
}

/**
 * Handles a player clicking on the board to move
 * @param {Object} coords - The coordinates the player clicked on
 */
function handleMoveClick(coords) {
    console.log("handleMoveClick:", coords);
    
    // Your existing move click handling code
    // ...
}

/**
 * Handles a player clicking on a deck
 * @param {string} deckName - The name of the deck that was clicked
 */
function handleDeckClick(deckName) {
    console.log("handleDeckClick:", deckName);
    
    // Your existing deck click handling code
    // ...
}

/**
 * Determine which age deck to draw from based on space properties
 * @param {Object} space - The space object with coordinate and color information
 * @returns {string} The deck type to draw from
 */
function getAgeDeckFromSpace(space) {
    // If space has an explicit deckType property, use that
    if (space.deckType) {
        return space.deckType;
    }
    
    // Otherwise determine from the space color
    // These path colors MUST match the exact values from PATH_COLORS in board-data.js
    if (space.color) {
        switch(space.color.toLowerCase()) {
            case '#9c54de':
            case 'purple':
                return 'AGE_OF_EXPANSION';
            case '#1b3de5':
            case 'blue':
                return 'AGE_OF_RESISTANCE';
            case '#00ffff':
            case 'cyan':
                return 'AGE_OF_RECKONING';
            case '#ff66ff':
            case 'pink':
                return 'AGE_OF_LEGACY';
            default:
                return 'END_OF_TURN'; // Default fallback
        }
    }
    
    // Fallback for spaces that don't have color information
    return 'END_OF_TURN';
}

// Function to handle presenting junction choices to the player
export function presentJunctionChoices(playerId, choices) {
    const player = getPlayerById(playerId);
    if (!player) {
        console.error(`Cannot present choices: Player ${playerId} not found`);
        return false;
    }
    
    console.log(`Presenting ${choices.length} junction choices to ${player.name}:`, choices);
    
    // Update game state
    gameState.currentChoices = choices;
    gameState.turnState = 'AWAITING_JUNCTION_CHOICE';
    
    // Highlight the choices on the board
    if (typeof highlightChoices === 'function') {
        highlightChoices(choices);
    }
    
    // If it's a human player, show a message prompting them to choose
    if (player.isHuman) {
        logMessage(`${player.name}, choose your path by clicking on a highlighted space`);
    } else {
        // For CPU players, automatically choose the first option after a delay
        setTimeout(() => {
            // CPU players don't change paths intentionally - choose the option that keeps them on their current path
            const currentPathOption = choices.find(choice => 
                choice.pathColor === player.currentPath
            );
            
            // If there's an option that keeps them on their path, choose it
            // Otherwise, just take the first option
            const chosenOption = currentPathOption || choices[0];
            
            resolvePlayerChoice(playerId, chosenOption);
        }, 1500); // Delay to show the highlight before auto-choosing
    }
    
    return true;
}

// Function to handle presenting initial path choices to the player
export function presentInitialPathChoices(playerId, choices) {
    const player = getPlayerById(playerId);
    if (!player) {
        console.error(`Cannot present initial choices: Player ${playerId} not found`);
        return false;
    }
    
    console.log(`Presenting ${choices.length} initial path choices to ${player.name}:`, choices);
    
    // Update game state
    gameState.currentChoices = choices;
    gameState.turnState = 'AWAITING_START_CHOICE';
    
    // Highlight the choices on the board
    if (typeof highlightChoices === 'function') {
        // Mark these as starting path choices
        const pathChoices = choices.map(choice => ({
            ...choice,
            type: 'start'
        }));
        
        highlightChoices(pathChoices);
    }
    
    // If it's a human player, show a message prompting them to choose
    if (player.isHuman) {
        logMessage(`${player.name}, choose your starting path by clicking on a highlighted space`);
    } else {
        // For CPU players, randomly choose a path after a delay
        setTimeout(() => {
            // Get a random index
            const randomIndex = Math.floor(Math.random() * choices.length);
            const chosenOption = choices[randomIndex];
            
            resolvePlayerChoice(playerId, chosenOption);
        }, 1500); // Delay to show the highlight before auto-choosing
    }
    
    return true;
}

// Function to handle dice roll actions
export async function handleDiceRoll(playerId) {
    const player = getPlayerById(playerId);
    if (!player) {
        console.error(`Cannot roll dice: Player ${playerId} not found`);
        return false;
    }
    
    console.log(`Handling dice roll for ${player.name}`);
    
    // Only allow dice rolls in the appropriate state
    if (gameState.turnState !== 'AWAITING_ROLL') {
        console.error(`Cannot roll dice: Invalid game state ${gameState.turnState}`);
        return false;
    }
    
    // Roll the dice
    const diceResult = Math.floor(Math.random() * 6) + 1;
    
    // Show the dice roll animation
    if (typeof showDiceRollAnimation === 'function') {
        // Start animation
        showDiceRollAnimation(true);
        
        // Wait a moment for animation to play
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show result
        showDiceRollAnimation(false, diceResult);
        
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Log the result
    logMessage(`${player.name} rolled a ${diceResult}!`, 'dice');
    
    // Update UI message
    logMessage(`${player.name} rolled ${diceResult}`);
    
    // Calculate possible moves
    const possibleMoves = getPossibleMoves(player, diceResult);
    
    // Update game state
    gameState.currentDiceRoll = diceResult;
    gameState.movesRemaining = diceResult;
    gameState.turnState = 'MOVING';
    
    // Update UI
    updateGameComponents();
    
    return true;
}

/**
 * Calculate possible moves for a player given a number of steps
 * @param {Object} player - The player object
 * @param {number} steps - Number of steps to move
 * @returns {Array} - Array of possible destination coordinates
 */
function getPossibleMoves(player, steps) {
    if (!player || !player.currentCoords || steps <= 0) {
        return [];
    }
    
    const possibleDestinations = [];
    const visited = new Set();
    
    // Start with current position
    const queue = [{
        coords: player.currentCoords,
        stepsLeft: steps
    }];
    
    // Use breadth-first search to find all possible destinations
    while (queue.length > 0) {
        const current = queue.shift();
        
        // Skip if we've already visited this position
        const coordKey = `${current.coords.x},${current.coords.y}`;
        if (visited.has(coordKey)) {
            continue;
        }
        
        // Mark as visited
        visited.add(coordKey);
        
        // If we've used all steps, this is a possible destination
        if (current.stepsLeft === 0) {
            possibleDestinations.push(current.coords);
            continue;
        }
        
        // Get next possible steps
        const nextOptions = getNextStepOptions(current.coords);
        
        // Add next positions to the queue
        for (const nextCoord of nextOptions) {
            queue.push({
                coords: nextCoord,
                stepsLeft: current.stepsLeft - 1
            });
        }
    }
    
    return possibleDestinations;
}

/**
 * Get the next space coordinates in a player's path
 * @param {Object} currentCoords - Current coordinates {x, y}
 * @returns {Object|null} - Next coordinates or null if no valid next step
 */
function getNextSpace(currentCoords) {
    if (!currentCoords) return null;
    
    // Use getNextStepOptions to get all possible next coordinates
    const nextOptions = getNextStepOptions(currentCoords);
    
    // If there are no options, return null
    if (!nextOptions || nextOptions.length === 0) {
        return null;
    }
    
    // If there's only one option, return it
    if (nextOptions.length === 1) {
        return nextOptions[0];
    }
    
    // If there are multiple options, we need to handle the junction
    // By default, return the first option but in a real game this should
    // prompt the player to choose a path
    console.warn('Multiple next steps available - automatically choosing first option');
    return nextOptions[0];
}

/**
 * Handle player reaching a choice point on the board
 * @param {string} playerId - ID of the player at the choice point
 * @param {Array} options - Array of possible path options
 */
function handleChoicePoint(playerId, options) {
    if (!playerId || !options || options.length === 0) {
        console.error('Invalid parameters for handleChoicePoint');
        return;
    }
    
    const player = getPlayerById(playerId);
    if (!player) {
        console.error(`Player ${playerId} not found`);
        return;
    }
    
    // Update game state to indicate we're waiting for a choice
    gameState.turnState = 'AWAITING_CHOICE';
    gameState.currentChoices = options;
    
    // If it's a CPU player, automatically choose
    if (!player.isHuman) {
        // CPU players always choose the first option
        setTimeout(() => {
            resolvePlayerChoice(playerId, options[0]);
        }, 1000);
        return;
    }
    
    // For human players, highlight the choice options on the board
    highlightPlayerChoices(options);
    
    // Show message to the player
    logMessage(`${player.name}, choose your path by clicking on one of the highlighted spaces.`);
    
    // Note: The choice will be resolved when the player clicks on the board
    // See resolvePlayerChoice function
}

/**
 * Helper function to use a player's special ability
 * @param {Object} player - The player using their ability
 * @returns {Promise<boolean>} - True if ability was used successfully
 */
async function usePlayerAbility(player) {
    if (!player) return false;
    
    try {
        // Call the useSpecialAbility function from cards.js
        const success = await useSpecialAbility(player.id);
        
        if (success) {
            logMessage(`${player.name} used their special ability!`);
            
            // Mark ability as used for this turn
            player.abilityUsed = true;
            
            // Log the ability use
            logPlayerAction(player.id, 'USE_ABILITY', {
                role: player.role
            });
            
            return true;
        } else {
            logMessage(`${player.name} could not use their special ability.`);
            return false;
        }
    } catch (error) {
        console.error('Error using player ability:', error);
        return false;
    }
}

/**
 * Shows a card to the player and returns a promise that resolves when the card is closed
 * @param {Object} card - The card to show
 * @param {string} deckType - The type of deck the card was drawn from
 * @param {Object} player - The player who drew the card
 * @returns {Promise<void>} - Resolves when the card is closed
 */
async function handleCardDisplay(card, deckType, player) {
    // First, log the card draw
    logCardDraw(player.id, card, deckType);
    
    // Make sure the card has the deckType property
    const fullCard = { ...card, deckType };
    
    // Use showCardPopup from ui.js
    return new Promise(resolve => {
        showCardPopup(fullCard, () => {
            resolve();
        });
    });
}

// Helper function to convert path colors to Age names for display
function getAgeNameFromPathColor(pathColor) {
    const ageMap = {
        'purple': 'Age of Expansion',
        'blue': 'Age of Resistance',
        'cyan': 'Age of Reckoning',
        'pink': 'Age of Legacy'
    };
    return ageMap[pathColor.toLowerCase()] || pathColor;
}
