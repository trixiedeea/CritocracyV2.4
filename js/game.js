// Game Module for Critocracy
// Handles core game logic, game flow, and state management

// ===== Imports =====
import { 
    resetPlayers, getPlayers, createPlayer, getPlayerById, 
    updatePlayerResources, markPlayerFinished, 
    getPlayerRanking,
    grantTemporaryImmunity, decrementImmunityTurns, 
    decrementTradeBlockTurns,
    useSpecialAbility
} from './players.js';
import { 
    setupBoard, getNextStepOptions, 
    startMoveAnimation, highlightPlayerChoices, getPathColorFromCoords,
    highlightEndOfTurnCardBoxes, refreshPlayerTokens,
    synchronizePlayerCoordinates, findSpaceDetailsByCoords, clearHighlights
} from './board.js';
import { 
    setupDecks, drawCard, 
    applyCardEffects, getDeckTypeForSpace, DECK_TYPES
} from './cards.js';
import { START_SPACE, FINISH_SPACE, PATH_COLORS } from './board-data.js';
import {
    logMessage, updatePlayerInfo, clearMessages, 
    updateGameControls, showCardPopup, promptForTradeResponse,
    hideDiceRollAnimation, updateGameComponents,
    highlightChoices, createPlayerTokenElements,
    showEndGameScreen
} from './ui.js';
import {
    initLogging, logGameEvent, logPlayerAction, 
    logTurnStart, logCardDraw, logTurnEnd
} from './logging.js';

// Create a global game handlers object for board interactions
export const gameHandlers = {
    handleEndOfTurnCardDraw,
    handleSpecialEventCardDraw
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



export async function initializeGame(playerConfigs) {
    console.log("Initializing game...");
    logMessage("Setting up new game...");

    try {
        // Reset modules
        resetPlayers();
        await setupBoard(); // Only sets up the tracking, doesn't draw visible elements
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
        
        // Validate player configurations
        if (!playerConfigs || playerConfigs.length === 0) {
            throw new Error("Player configurations are required to initialize the game.");
        }
        
        const addedPlayerIds = [];
        const assignedRoles = new Set();

        // Add explicitly defined players (human and potentially pre-defined CPUs)
        console.log(`Attempting to add ${playerConfigs.length} players from config`);
        for (const config of playerConfigs) {
            if (assignedRoles.has(config.role)) {
                console.warn(`Skipping player config for ${config.name}: Role ${config.role} already assigned.`);
                continue;
            }
            const player = createPlayer(config.name, config.role, config.isHuman);
            if (player) {
                addedPlayerIds.push(player.id);
                assignedRoles.add(config.role);
                console.log(`Added player: ${config.name} (${config.role}), Human: ${config.isHuman}`);
            } else {
                console.error(`Failed to add configured player: ${config.name} (${config.role})`);
            }
        }

        // The totalPlayerCount is exactly what's in the playerConfigs
        const totalPlayerCount = playerConfigs.length;
        
        // We should not need to add any additional CPU players automatically
        // since the UI should have created all needed player configs
        const currentPlayerCount = getPlayers().length;
        if (currentPlayerCount !== totalPlayerCount) {
            throw new Error(`Failed to initialize correct number of players. Expected ${totalPlayerCount}, got ${currentPlayerCount}`);
        }
        
        console.log("Players initialized:", getPlayers().map(p => `${p.name} (${p.role})`));

        // Initialize the logging system with the players
        initLogging(getPlayers());
        
        // Log the game initialization
        logGameEvent('GAME_INITIALIZED', { 
            playerCount: playerConfigs.length,
            playerConfigs: playerConfigs
        });

        gameState.turnOrder = addedPlayerIds; 
        console.log("Turn order set:", gameState.turnOrder.map(id => getPlayerById(id)?.name));

        gameState.currentPlayerId = gameState.turnOrder[0];
        gameState.gamePhase = 'PLAYING';
        
        console.log(`Game starting. First player: ${getPlayerById(gameState.currentPlayerId)?.name}`);

        clearMessages();
        updatePlayerInfo();
        // Board and player visualization is handled by HTML
        // No need to call drawBoard() or drawPlayers()

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

// Add alias export for backward compatibility
export { initializeGame as initGame };

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

    const startX = START_SPACE.coordinates[0];
    const startY = START_SPACE.coordinates[1];
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
            // Add randomness to AI path choice
            const choices = [...gameState.currentChoices];
            const choiceIndex = Math.floor(Math.random() * choices.length);
            const choice = choices[choiceIndex];
            console.log(`AI ${player.name} chooses path: ${choice.pathColor}`);
            
            // Add human-like delay (800-1200ms)
            const delay = 800 + Math.floor(Math.random() * 400);
            setTimeout(() => resolvePlayerChoice(player.id, choice), delay);
        }
    } else {
        console.log(`${player.name} can roll the dice.`);
        logMessage(`${player.name}, roll the dice!`);
        gameState.turnState = 'AWAITING_ROLL';

        if (!player.isHuman) {
            console.log(`AI ${player.name} rolling dice...`);
            // Add human-like delay (800-1200ms)
            const delay = 800 + Math.floor(Math.random() * 400);
            setTimeout(() => handlePlayerAction(player.id, 'ROLL_DICE'), delay);
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
    
    try {
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
                    // Add human-like delay (800-1200ms)
                    const delay = 800 + Math.floor(Math.random() * 400);
                    setTimeout(() => {
                        handlePlayerAction(playerId, 'END_TURN');
                    }, delay);
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
    } catch (error) {
        console.error(`Error during ${player.name}'s turn (State: ${gameState.turnState}):`, error);
        logMessage(`Error during ${player.name}'s turn: ${error.message}`);
        gameState.turnState = 'TURN_ENDED';
        setTimeout(() => advanceToNextPlayer(), 500);
        return false;
    }
}

/**
 * Handles clicks on the game board, primarily for making choices.
 * Called from UI event listeners.
 * @param {number} clickX - The raw X coordinate of the click.
 * @param {number} clickY - The raw Y coordinate of the click.
 */
export function resolveBoardClick(coords) {
    if (!coords) {
        console.error('Invalid click coordinates');
        return;
    }
    
    const playerId = gameState.currentPlayerId;
    const player = getPlayerById(playerId);
    if (!player || !player.isHuman) {
        console.warn("resolveBoardClick ignored: Not a human player's turn or no current player.");
        return;
    }

    const currentState = gameState.turnState;
    if (!['AWAITING_START_CHOICE', 'AWAITING_CHOICEPOINT'].includes(currentState)) {
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
        console.error(`Player with ID ${playerId} not found`);
        return;
    }

    if (gameState.gamePhase !== 'PLAYER_CHOICE') {
        console.error(`Cannot resolve player choice during ${gameState.gamePhase} phase`);
        return;
    }

    // Update player position
    console.log(`Player ${player.name} chose to move to [${choice.coordinates}]`);
    player.coords = choice.coordinates;
    
    // Synchronize coordinates and refresh tokens
    synchronizePlayerCoordinates(player.id);
    createPlayerTokenElements();
    refreshPlayerTokens();
    
    // Show animation
    startMoveAnimation(player.id, choice.coordinates);
    
    // Process the player's choice
    processChoice(player, choice);
}

/**
 * Processes a player's choice at a junction or start space
 * @param {Object} player - The player making the choice
 * @param {Object} choice - The choice object containing path and coordinates
 */
function processChoice(player, choice) {
    if (!player || !choice) {
        console.error("Invalid parameters for processChoice");
        return;
    }

    console.log(`Processing choice for ${player.name}:`, choice);
    
    // Update the player's current path if a choice was made
    if (choice.pathColor) {
        player.currentPath = choice.pathColor;
        
        // Log the choice of path
        logPlayerAction(player.id, 'PATH_CHOSEN', {
            pathColor: choice.pathColor,
            coordinates: choice.coordinates,
            choiceType: choice.type || 'unknown'
        });
        
        logMessage(`${player.name} chose the ${choice.pathColor} path.`);
    }
    
    // Get space details at the chosen coordinates
    const spaceDetails = findSpaceDetailsByCoords(choice.coordinates);
    
    // Handle different types of choices
    if (choice.type === 'start') {
        // Player has chosen a starting path
        console.log(`${player.name} has chosen their starting path: ${choice.pathColor}`);
        
        // Move to action complete state after choice is made
        gameState.turnState = 'ACTION_COMPLETE';
        updateGameControls();
    } 
    else if (choice.type === 'junction' || choice.type === 'choicepoint') {
        // Player has chosen a path at a junction
        console.log(`${player.name} has chosen a path at a junction: ${choice.pathColor}`);
        
        // If there are remaining steps after the choice point, continue movement
        if (gameState.choicePointRemainingSteps > 0) {
            console.log(`${player.name} has ${gameState.choicePointRemainingSteps} steps remaining after junction`);
            // Continue movement with remaining steps
            setTimeout(() => {
                startMoveAnimation(player.id, gameState.choicePointRemainingSteps, (result) => {
                    handleEndOfMove(player.id, result);
                });
            }, 500);
        } else {
            // No remaining steps, end the move
            const moveResult = {
                success: true,
                spaceDetails: spaceDetails || { type: 'unknown' },
                options: []
            };
            handleEndOfMove(player.id, moveResult);
        }
    }
    else {
        // Unknown choice type, end the move
        console.warn(`Unknown choice type: ${choice.type}`);
        gameState.turnState = 'ACTION_COMPLETE';
        updateGameControls();
    }
    
    // Clear highlights after choice is made
    clearHighlights();
}

/**
 * Process the result of player movement, handling different space types and interactions.
 * @param {string} playerId - ID of the player
 * @param {Object} moveResult - Result data from the move
 */
function handleEndOfMove(playerId, moveResult) {
    const player = getPlayerById(playerId);
    if (!player) {
        console.error(`Cannot handle end of move: Player ${playerId} not found`);
        return;
    }

    // If there's a path color, it's a special event card space
    const pathColor = moveResult.spaceDetails.pathColor;
    if (pathColor) {
        logMessage(`${player.name} landed on a draw space. Draw a card from the ${getDeckTypeForSpace(pathColor)} deck.`);
        player.currentPathColor = pathColor;
        gameState.turnState = 'AWAITING_SPECIAL_EVENT_CARD';
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
        if (spaceType === 'finish' || 
            (player.coords[0] === FINISH_SPACE.coordinates[0] && 
             player.coords[1] === FINISH_SPACE.coordinates[1])) {
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
                logMessage(`${player.name} landed on a draw space. Draw a card from the ${getDeckTypeForSpace(pathColor)} deck.`);
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
        
        // If it's a junction or choice point, handle path choices
        if (spaceType === 'junction' || spaceType === 'choicepoint') {
            // Log reaching a choice point
            logGameEvent('PLAYER_AT_CHOICE_POINT', {
                playerId,
                choiceType: spaceType,
                coords: player.coords
            });
            
            // Update game state to indicate we're waiting for a choice
            gameState.turnState = 'AWAITING_CHOICEPOINT';
            gameState.currentChoices = moveResult.options || [];
            
            // If it's a CPU player, automatically choose
            if (!player.isHuman) {
                // CPU players always choose the first option
                setTimeout(() => {
                    resolvePlayerChoice(playerId, moveResult.options[0]);
                }, 1000);
                return;
            }
            
            // For human players, highlight the choice options on the board
            highlightPlayerChoices(moveResult.options);
            
            // Show message to the player
            logMessage(`${player.name}, choose your path by clicking on one of the highlighted spaces.`);
            return;
        }
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

export function handleTradeResponse(accepted, sourcePlayerId, targetPlayerId, offerDetails, requestDetails, isSwap) {
    const sourcePlayer = getPlayerById(sourcePlayerId);
    const targetPlayer = getPlayerById(targetPlayerId);
    
    // According to game specs, CPU players always agree to anything offered by human players
    if (targetPlayer && !targetPlayer.isHuman && sourcePlayer && sourcePlayer.isHuman) {
        accepted = true;
        logMessage(`${targetPlayer.name} (CPU) accepts the offer from ${sourcePlayer.name}.`);
    }
    
    gameState.tradePending = false;
    if (accepted) {
         if (!isSwap && !checkResourceAvailability(targetPlayerId, requestDetails)) {
             logMessage(`${targetPlayer?.name || 'Target player'} accepted but cannot afford. Trade cancelled.`);
             gameState.turnState = 'ACTION_COMPLETE';
         } else {
             logMessage(`Trade accepted between ${sourcePlayer?.name || sourcePlayerId} and ${targetPlayer?.name || targetPlayerId}.`);
             executeTrade(sourcePlayerId, targetPlayerId, offerDetails, requestDetails, isSwap);
             gameState.turnState = 'ACTION_COMPLETE';
         }
    } else {
         logMessage(`Trade rejected by ${targetPlayer?.name || targetPlayerId}.`);
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

// Add this helper function to standardize path color handling
function getStandardizedPathColor(pathColor) {
    if (!pathColor) return null;
    const lowerPathColor = pathColor.toLowerCase();
    return PATH_COLORS[lowerPathColor] ? lowerPathColor : null;
}

// Update handleSpecialEventCardDraw to use standardized path color and show card
export async function handleSpecialEventCardDraw(player, pathColor) {
    if (!player || !pathColor) {
        console.error('Invalid parameters for handleSpecialEventCardDraw');
        return;
    }

    const standardizedPathColor = getStandardizedPathColor(pathColor);
    if (!standardizedPathColor) {
        console.error(`Invalid path color: ${pathColor}`);
        return;
    }

    // Draw card from the appropriate deck
    const card = drawCard(standardizedPathColor);
    if (!card) {
        console.error(`Failed to draw card from ${standardizedPathColor} deck`);
        return;
    }

    // Log the card draw
    logCardDraw(player.id, card, standardizedPathColor);
    
    // Make sure the card has the deckType property and show it
    const fullCard = { ...card, deckType: standardizedPathColor };
    await new Promise(resolve => {
        showCardPopup(fullCard, resolve);
    });

    logGameEvent('CARD_DRAWN', {
        playerId: player.id,
        cardName: card.name,
        deckType: standardizedPathColor
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
export function handleMoveClick(coords) {
    console.log("handleMoveClick:", coords);
    
    const currentPlayer = gameState.currentPlayer;
    if (!currentPlayer) {
        console.error("No current player found");
        return;
    }

    // Get valid moves for current player
    const validMoves = getNextStepOptions(currentPlayer.currentCoords);
    
    // Check if clicked coordinates are valid
    let isValidMove = false;
    if (validMoves.type === 'Regular' || validMoves.type === 'Finish') {
        const nextCoords = validMoves.nextCoords;
        if (nextCoords[0] === coords.x && nextCoords[1] === coords.y) {
            isValidMove = true;
        }
    } else if (validMoves.type === 'Choicepoint') {
        for (const option of validMoves.options) {
            if (option.coordinates[0] === coords.x && option.coordinates[1] === coords.y) {
                isValidMove = true;
                break;
            }
        }
    }

    if (isValidMove) {
        // Move the player
        const moveResult = {
            success: true,
            newCoords: coords,
            pathColor: getPathColorFromCoords(coords.x, coords.y)
        };
        handleEndOfMove(currentPlayer.id, moveResult);
    } else {
        logMessage("Invalid move. Please select a valid space.");
    }
}

/**
 * Handles a player clicking on a deck
 * @param {string} deckName - The name of the deck that was clicked
 */
export function handleDeckClick(deckName) {
    console.log("handleDeckClick:", deckName);
    
    // Get the current player using the current player ID from game state
    const currentPlayerId = gameState.currentPlayerId;
    const currentPlayer = getPlayerById(currentPlayerId);
    
    if (!currentPlayer) {
        console.error("No current player found");
        logMessage("Cannot draw cards: No active player.");
        return;
    }

    console.log("Current player:", currentPlayer.name, currentPlayer.id);

    // Check if player is allowed to draw from this deck based on game state
    if (gameState.turnState !== 'AWAITING_ROLL' && gameState.turnState !== 'ACTION_COMPLETE') {
        logMessage(`You can only draw cards at the start of your turn or after completing an action.`);
        return;
    }

    // Draw a card from the deck using the current player and deck name
    handleSpecialEventCardDraw(currentPlayer, deckName);
}

/**
 * Handle player reaching a choice point on the board
 * @param {string} playerId - ID of the player at the choice point
 * @param {Array} options - Array of possible path options
 */
export function handleChoicePoint(playerId, options) {
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
    gameState.turnState = 'AWAITING_CHOICEPOINT';
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
    
    // Log the result
    logMessage(`${player.name} rolled a ${diceResult}!`, 'dice');
    
    // Update UI message
    logMessage(`${player.name} rolled ${diceResult}`);
    
    // Start the movement animation
    startMoveAnimation(player, diceResult, (result) => handleEndOfMove(player.id, result));
    
    // Update game state
    gameState.currentDiceRoll = diceResult;
    gameState.movesRemaining = diceResult;
    gameState.turnState = 'MOVING';
    
    // Update UI
    updateGameComponents();
    
    return true;
}

/**
 * Determine turn order by rolling dice for each player
 * Human players will be prompted to roll, CPU players will roll automatically
 * @returns {Promise<boolean>} True if the turn order was successfully determined
 */
export async function determineTurnOrder() {
    console.log("Determining turn order by rolling dice");
    
    // Get all players
    const players = getPlayers();
    if (!players || players.length === 0) {
        console.error("No players found for determining turn order");
        return false;
    }
    
    // Create object to store roll results
    const rollResults = {};
    
    // Set game phase to turn order determination
    gameState.gamePhase = 'TURN_ORDER_DETERMINATION';
    
    // Function to handle individual player rolls
    const handlePlayerRoll = (player) => {
        return new Promise(resolve => {
            // For human players, show roll button and wait for click
            if (player.isHuman) {
                // Show message to prompt human player
                logMessage(`${player.name}, click to roll the dice`);
                
                // This should be handled by the UI - the human player clicks the roll button
                // and the UI will call the rollForTurnOrder function
                
                // Listen for the roll (this would be handled by UI event listeners)
                window.currentTurnOrderRollCallback = (result) => {
                    rollResults[player.id] = result;
                    logMessage(`${player.name} rolled ${result}!`, 'dice');
                    resolve();
                };
                
                // Enable roll button for this player (UI should handle this)
                if (window.ui && typeof window.ui.enableTurnOrderRollButton === 'function') {
                    window.ui.enableTurnOrderRollButton(player.id);
                } else {
                    // If no UI handler, simulate a roll automatically as fallback
                    setTimeout(() => {
                        const result = Math.floor(Math.random() * 6) + 1;
                        rollResults[player.id] = result;
                        logMessage(`${player.name} rolled ${result}!`, 'dice');
                        resolve();
                    }, 500);
                }
            } else {
                // For CPU players, automatically roll after a slight delay
                setTimeout(() => {
                    const result = Math.floor(Math.random() * 6) + 1;
                    rollResults[player.id] = result;
                    logMessage(`${player.name} (CPU) rolled ${result}!`, 'dice');
                    resolve();
                }, 800 + Math.random() * 500); // Random delay between 800-1300ms
            }
        });
    };
    
    // Function to roll for all players
    const rollForAllPlayers = async () => {
        for (const player of players) {
            await handlePlayerRoll(player);
            
            // Update UI to show current roll results
            updateTurnOrderDisplay(rollResults);
        }
    };
    
    // Roll for all players
    await rollForAllPlayers();
    
    // Handle ties by re-rolling just for tied players
    let tiedPlayers = findTiedPlayers(rollResults);
    while (tiedPlayers.length > 1) {
        logMessage("Ties detected! Re-rolling for tied players...");
        
        // Re-roll for tied players only
        for (const player of tiedPlayers) {
            await handlePlayerRoll(player);
            updateTurnOrderDisplay(rollResults);
        }
        
        // Check for ties again
        tiedPlayers = findTiedPlayers(rollResults);
    }
    
    // Sort players by their roll results (highest to lowest)
    const sortedPlayers = [...players].sort((a, b) => {
        return rollResults[b.id] - rollResults[a.id];
    });
    
    // Set the turn order
    gameState.turnOrder = sortedPlayers.map(player => player.id);
    
    // Set the current player to the first player in the turn order
    gameState.currentPlayerId = gameState.turnOrder[0];
    
    // Log the determined turn order
    logMessage("Turn order determined!");
    gameState.turnOrder.forEach((playerId, index) => {
        const player = getPlayerById(playerId);
        logMessage(`${index + 1}. ${player.name} (${rollResults[playerId]})`);
    });
    
    // Update UI to reflect final turn order
    updateTurnOrderDisplay(rollResults, true);
    
    // Log game event
    logGameEvent('TURN_ORDER_DETERMINED', {
        turnOrder: gameState.turnOrder.map(id => ({ 
            id, 
            name: getPlayerById(id)?.name,
            roll: rollResults[id]
        }))
    });
    
    // Set game phase back to playing
    gameState.gamePhase = 'PLAYING';
    
    // Start first player's turn
    prepareTurnForPlayer(getPlayerById(gameState.currentPlayerId));
    
    return true;
}

/**
 * Helper function to find tied players (players with the same highest roll)
 * @param {Object} rollResults - Object mapping player IDs to roll results
 * @returns {Array} Array of players who are tied
 */
function findTiedPlayers(rollResults) {
    const players = getPlayers();
    
    // Group players by roll value
    const rollGroups = {};
    
    players.forEach(player => {
        const roll = rollResults[player.id];
        if (!rollGroups[roll]) {
            rollGroups[roll] = [];
        }
        rollGroups[roll].push(player);
    });
    
    // Find the highest roll
    const highestRoll = Math.max(...Object.keys(rollGroups).map(Number));
    
    // Return players with the highest roll if there are multiple
    return rollGroups[highestRoll].length > 1 ? rollGroups[highestRoll] : [];
}

/**
 * Update the turn order display in the UI
 * @param {Object} rollResults - Object mapping player IDs to roll results
 * @param {boolean} isFinal - Whether this is the final display after all rolls
 */
function updateTurnOrderDisplay(rollResults, isFinal = false) {
    // This function should be implemented in the UI module
    // It should update the UI to show the current roll results
    if (window.ui && typeof window.ui.updateTurnOrderDisplay === 'function') {
        window.ui.updateTurnOrderDisplay(rollResults, isFinal);
    } else {
        console.log("Turn order display update:", rollResults, isFinal ? "(Final)" : "");
    }
}

/**
 * Function for UI to call when a human player rolls for turn order
 * @param {string} playerId - ID of the player rolling
 * @returns {number} The dice roll result
 */
export function rollForTurnOrder(playerId) {
    const player = getPlayerById(playerId);
    if (!player) {
        console.error(`Cannot roll for turn order: Player ${playerId} not found`);
        return 0;
    }
    
    // Roll the dice
    const result = Math.floor(Math.random() * 6) + 1;
    
    // If there's a callback waiting for this roll, invoke it
    if (typeof window.currentTurnOrderRollCallback === 'function') {
        window.currentTurnOrderRollCallback(result);
        window.currentTurnOrderRollCallback = null;
    }
    
    return result;
}

export function handleRoleConfirmation() {
    // This function is not needed anymore as initialization happens directly from the index.html file
    console.log("Role confirmation handled directly by the HTML/UI layer");
}

export function handleEndTurn() {
    const currentPlayerId = gameState.currentPlayerId;
    if (currentPlayerId) {
        handlePlayerAction(currentPlayerId, 'END_TURN');
    }
}

export function handleAbilityUse() {
    const currentPlayerId = gameState.currentPlayerId;
    if (currentPlayerId) {
        handlePlayerAction(currentPlayerId, 'USE_ABILITY');
    }
}

export function handleNewGame() {
    window.location.reload();
}
