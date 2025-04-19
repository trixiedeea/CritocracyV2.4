// cards.js - Manages card collections, drawing, and effects

// ===== Imports =====
import { PURPLE_CARDS, BLUE_CARDS, CYAN_CARDS, PINK_CARDS } from '../assets/Cards/Specialeventcards.js';
import { updatePlayerResources } from './players.js';
import { getPathColorFromCoords } from './board.js';
import { PATH_COLORS } from './board-data.js';
import { logMessage } from './ui.js';
import { logCardDraw as logCardDrawToSystem, logPlayerAction } from './logging.js';

// ===== Constants =====
// These deck types correspond to the path colors defined in board-data.js
// IMPORTANT: These colors must match exactly with PATH_COLORS for proper gameplay
// Purple: #9C54DE - Age of Expansion
// Blue: #1B3DE5 - Age of Resistance  
// Cyan: #00FFFF - Age of Reckoning
// Pink: #FF66FF - Age of Legacy
export const DECK_TYPES = {
    PURPLE: 'purple',   // #9C54DE
    BLUE: 'blue',       // #1B3DE5
    CYAN: 'cyan',       // #00FFFF
    PINK: 'pink',       // #FF66FF
    END_OF_TURN: 'end_of_turn'
};

// Path colors for easier reference
export const pathColors = {
    purple: PATH_COLORS.purple,
    blue: PATH_COLORS.blue,
    cyan: PATH_COLORS.cyan,
    pink: PATH_COLORS.pink
};

// Import the End of Turn cards, using dynamic import to prevent circular dependencies
let ENDOFTURNCARDS = [];

// Export ENDOFTURNCARDS so it can be imported by other modules
export { ENDOFTURNCARDS };

// ===== Module state =====
const cardDecks = {
    [DECK_TYPES.PURPLE]: [],
    [DECK_TYPES.BLUE]: [],
    [DECK_TYPES.CYAN]: [],
    [DECK_TYPES.PINK]: [],
    [DECK_TYPES.END_OF_TURN]: []
};

const discardPiles = {
    [DECK_TYPES.PURPLE]: [],
    [DECK_TYPES.BLUE]: [],
    [DECK_TYPES.CYAN]: [],
    [DECK_TYPES.PINK]: [],
    [DECK_TYPES.END_OF_TURN]: []
};

// ===== Setup Functions =====

/**
 * Initialize all card decks
 */
export const setupDecks = async () => {
    try {
        // Import the End of Turn cards module
        const endOfTurnModule = await import('../assets/Cards/Endofturncards.js');
        ENDOFTURNCARDS = endOfTurnModule.default || [];
        
        // Reset decks
        resetDecks();
        
        // Populate decks with cards
        populateDecks();
        
        // Shuffle all decks
        shuffleAllDecks();
        
        console.log("All card decks initialized and shuffled");
        return true;
    } catch (error) {
        console.error("Error setting up card decks:", error);
        return false;
    }
};

/**
 * Reset all decks and discard piles
 */
const resetDecks = () => {
    Object.keys(cardDecks).forEach(deckType => {
        cardDecks[deckType] = [];
        discardPiles[deckType] = [];
    });
};

/**
 * Populate decks with their respective cards
 */
const populateDecks = () => {
    // Special event cards
    cardDecks[DECK_TYPES.PURPLE] = [...PURPLE_CARDS].map(card => ({ ...card, deckType: DECK_TYPES.PURPLE }));
    cardDecks[DECK_TYPES.BLUE] = [...BLUE_CARDS].map(card => ({ ...card, deckType: DECK_TYPES.BLUE }));
    cardDecks[DECK_TYPES.CYAN] = [...CYAN_CARDS].map(card => ({ ...card, deckType: DECK_TYPES.CYAN }));
    cardDecks[DECK_TYPES.PINK] = [...PINK_CARDS].map(card => ({ ...card, deckType: DECK_TYPES.PINK }));
    
    // End of turn cards
    cardDecks[DECK_TYPES.END_OF_TURN] = [...ENDOFTURNCARDS].map(card => ({ ...card, deckType: DECK_TYPES.END_OF_TURN }));
};

// ===== Deck Management Functions =====

/**
 * Shuffle all card decks
 */
export const shuffleAllDecks = () => {
    Object.keys(cardDecks).forEach(deckType => {
        shuffleDeck(deckType);
    });
};

/**
 * Shuffle a specific deck
 */
export const shuffleDeck = (deckType) => {
    if (!cardDecks[deckType]) return;
    
    const deck = cardDecks[deckType];
    
    // Fisher-Yates shuffle algorithm
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    console.log(`Shuffled ${deckType} deck`);
};

/**
 * Check if a deck exists
 * @param {string} deckType - The type of deck to check
 * @returns {boolean} - True if the deck exists, false otherwise
 */
export const doesDeckExist = (deckType) => {
    return Boolean(cardDecks[deckType]) && Array.isArray(cardDecks[deckType]);
};

/**
 * Get the appropriate deck type for a space
 */
export const getDeckTypeForSpace = (spaceDetails) => {
    if (!spaceDetails) return null;
    
    // If it's a draw space, use the path color
    if (spaceDetails.type === 'draw') {
        const color = getPathColorFromCoords(spaceDetails.coords);
        return color;
    }
    
    return null;
};

/**
 * Get special event cards of a specific type
 * @param {string} deckType - The type of deck to retrieve
 * @returns {Array} - Array of card objects
 */
export function getSpecialEventCards(deckType) {
    if (!deckType) return [];
    
    switch(deckType.toLowerCase()) {
        case 'purple':
        case 'expansion':
            return cardDecks[DECK_TYPES.PURPLE];
            
        case 'blue':
        case 'resistance':
            return cardDecks[DECK_TYPES.BLUE];
            
        case 'cyan':
        case 'reckoning':
            return cardDecks[DECK_TYPES.CYAN];
            
        case 'pink':
        case 'legacy':
            return cardDecks[DECK_TYPES.PINK];
            
        default:
            console.error(`Unknown special event deck type: ${deckType}`);
            return [];
    }
}

/**
 * Get end of turn cards
 * @returns {Array} - Array of end of turn card objects
 */
export function getEndOfTurnCards() {
    return cardDecks[DECK_TYPES.END_OF_TURN];
}

/**
 * Draw a card from a deck
 */
export function drawCard(deckType, boxNumber = 1) {
    console.log(`Drawing card from ${deckType} deck, box ${boxNumber}`);
    
    let cardPool = [];
    
    // Determine which deck to draw from
    switch(deckType.toLowerCase()) {
        case 'purple':
        case 'expansion':
            // Age of Expansion cards (purple)
            cardPool = getSpecialEventCards('purple');
            break;
            
        case 'blue':
        case 'resistance':
            // Age of Resistance cards (blue)
            cardPool = getSpecialEventCards('blue');
            break;
            
        case 'cyan':
        case 'reckoning':
            // Age of Reckoning cards (cyan)
            cardPool = getSpecialEventCards('cyan');
            break;
            
        case 'pink':
        case 'legacy':
            // Age of Legacy cards (pink)
            cardPool = getSpecialEventCards('pink');
            break;
            
        case 'end_of_turn':
            // End of Turn cards
            cardPool = getEndOfTurnCards();
            break;
            
        default:
            console.error(`Unknown deck type: ${deckType}`);
            return null;
    }
    
    // Check if deck is empty
    if (!cardPool || cardPool.length === 0) {
        console.error(`No cards available in ${deckType} deck`);
        return null;
    }
    
    // Randomly select a card from the pool
    const index = Math.floor(Math.random() * cardPool.length);
    const card = cardPool[index];
    
    // Remove from deck and add to discard pile
    cardPool.splice(index, 1);
    
    // Return the card with its deck type
    return { ...card, deckType };
}

/**
 * Log a card draw event to both game log and UI
 * @param {string} playerId - ID of the player drawing the card
 * @param {Object} card - The card drawn
 * @param {string} deckType - Type of deck the card was drawn from
 */
export function logCardDraw(playerId, card, deckType) {
    // Use the imported log function
    logCardDrawToSystem(playerId, card, deckType);
    
    // Also log to UI message log
    logMessage(`Player ${playerId} drew a ${card.name} card from the ${deckType} deck`, 'card');
}

/**
 * Checks if a player has temporary immunity
 * @param {string} playerId - ID of the player to check
 * @returns {boolean} - True if player has temporary immunity
 */
export function hasTemporaryImmunity(playerId) {
    // Import the player function dynamically to avoid circular dependency
    return import('./players.js')
        .then(playersModule => {
            if (typeof playersModule.hasTemporaryImmunity === 'function') {
                return playersModule.hasTemporaryImmunity(playerId);
            }
            return false;
        })
        .catch(err => {
            console.error('Error checking temporary immunity:', err);
            return false;
        });
}

/**
 * Allows a player to use their special ability
 * @param {string} playerId - ID of the player using their ability
 * @returns {Promise<boolean>} - True if ability was used successfully
 */
export function useSpecialAbility(playerId) {
    // Import the player function dynamically to avoid circular dependency
    return import('./players.js')
        .then(playersModule => {
            if (typeof playersModule.useSpecialAbility === 'function') {
                return playersModule.useSpecialAbility(playerId);
            }
            return false;
        })
        .catch(err => {
            console.error('Error using special ability:', err);
            return false;
        });
}

/**
 * Set a player to skip their next turn(s)
 * @param {string} playerId - ID of the player to set
 * @param {number} turns - Number of turns to skip
 * @param {string} source - Source of this effect
 * @returns {Promise<boolean>} - True if successful
 */
export function setPlayerSkipTurn(playerId, turns = 1, source = 'CARD_EFFECT') {
    // Import the player function dynamically to avoid circular dependency
    return import('./players.js')
        .then(playersModule => {
            if (typeof playersModule.setPlayerSkipTurn === 'function') {
                return playersModule.setPlayerSkipTurn(playerId, turns, source);
            }
            return false;
        })
        .catch(err => {
            console.error('Error setting player skip turn:', err);
            return false;
        });
}

/**
 * Displays a resource change effect in the UI
 * @param {string} playerId - ID of the player whose resources changed
 * @param {string} resourceType - Type of resource that changed (money, knowledge, influence)
 * @param {number} amount - Amount of change (positive or negative)
 */
export function displayResourceChangeEffect(playerId, resourceType, amount) {
    // Import the UI function dynamically to avoid circular dependency
    import('./ui.js')
        .then(uiModule => {
            if (typeof uiModule.displayResourceChangeEffect === 'function') {
                uiModule.displayResourceChangeEffect(playerId, resourceType, amount);
            } else {
                console.log(`Resource change: ${playerId} ${resourceType} ${amount > 0 ? '+' : ''}${amount}`);
            }
        })
        .catch(err => {
            console.error('Error displaying resource change effect:', err);
        });
}

/**
 * Apply effects from an End of Turn card
 */
export const applyEndOfTurnCardEffects = (card, player) => {
    if (!card || !player) return false;
    
    // End of Turn cards have role-specific effects
    const roleEffect = card.effects[player.role];
    
    if (!roleEffect) {
        console.log(`No specific effect for ${player.role} in card ${card.name}`);
        return false;
    }
    
    // Apply resource changes
    if (roleEffect.type === 'RESOURCE_CHANGE' && roleEffect.changes) {
        updatePlayerResources(
            player.id, 
            roleEffect.changes, 
            'CARD_END_OF_TURN', 
            { 
                cardName: card.name, 
                explanation: roleEffect.explanation || "End of turn card effect"
            }
        );
        console.log(`Applied resource changes to ${player.name} from ${card.name}`);
        return true;
    }
    
    return false;
};

/**
 * Apply effects from a Special Event card
 */
export function applyCardEffects(card, player) {
    if (!card || !player) {
        console.error("Cannot apply card effects: Invalid card or player");
        return false;
    }
    
    console.log(`Applying effects of card ${card.name} to player ${player.name}`);
    
    // Handle End of Turn cards (role-specific effects)
    if (card.deckType === 'end_of_turn') {
        // Get the effect specific to this player's role
        const roleEffect = card.effects[player.role] || card.effects['ALL'];
        
        if (!roleEffect) {
            console.log(`No effects found for ${player.role} in card ${card.name}`);
            return false;
        }
        
        // Apply the effect based on type
        applyEffect(roleEffect, player);
        
        return true;
    }
    
    // Handle Special Event cards (array of effects)
    if (Array.isArray(card.effects)) {
        let appliedAny = false;
        
        // Apply each effect in the array
        card.effects.forEach(effect => {
            const success = applyEffect(effect, player);
            if (success) appliedAny = true;
        });
        
        return appliedAny;
    }
    
    // If effects format is unknown, try as a single effect
    return applyEffect(card.effects, player);
}

// Create an alias for compatibility with singular naming
export const applyCardEffect = applyCardEffects;

// Helper function to apply a single effect
function applyEffect(effect, player) {
    if (!effect || !player) {
        console.error("Cannot apply effect: Invalid effect or player");
        return false;
    }
    
    console.log(`Applying effect type ${effect.type} to ${player.name}`);
    
    // Declare variables outside the switch to avoid lexical declaration errors
    let money, knowledge, influence, direction, spaces;
    let turns, tradeTurns;
    
    switch(effect.type) {
        case 'RESOURCE_CHANGE':
            // Handle resource changes
            if (!effect.changes) return false;
            
            // Destructure outside the case block
            ({ money = 0, knowledge = 0, influence = 0 } = effect.changes);
            
            // Update player resources
            if (money) {
                player.resources.money = Math.max(0, player.resources.money + money);
                logMessage(`${player.name} ${money > 0 ? 'gained' : 'lost'} ${Math.abs(money)} Money`);
                
                // Animate resource change if animation function exists
                if (typeof displayResourceChangeEffect === 'function') {
                    displayResourceChangeEffect(player.id, 'money', money);
                }
            }
            
            if (knowledge) {
                player.resources.knowledge = Math.max(0, player.resources.knowledge + knowledge);
                logMessage(`${player.name} ${knowledge > 0 ? 'gained' : 'lost'} ${Math.abs(knowledge)} Knowledge`);
                
                // Animate resource change
                if (typeof displayResourceChangeEffect === 'function') {
                    displayResourceChangeEffect(player.id, 'knowledge', knowledge);
                }
            }
            
            if (influence) {
                player.resources.influence = Math.max(0, player.resources.influence + influence);
                logMessage(`${player.name} ${influence > 0 ? 'gained' : 'lost'} ${Math.abs(influence)} Influence`);
                
                // Animate resource change
                if (typeof displayResourceChangeEffect === 'function') {
                    displayResourceChangeEffect(player.id, 'influence', influence);
                }
            }
            
            return true;
            
        case 'MOVEMENT':
            // Handle movement effects
            if (effect.spaces) {
                // Move player forward or backward by spaces
                direction = effect.spaces > 0 ? 'forward' : 'backward';
                spaces = Math.abs(effect.spaces);
                
                logMessage(`${player.name} moves ${direction} ${spaces} spaces`);
                
                // TODO: Implement actual movement logic
                // This would use the presentJunctionChoices or movePlayer functions
                
                return true;
            }
            
            if (effect.moveToAge) {
                // Move player to a specific age/path
                logMessage(`${player.name} moves to the ${effect.moveToAge} path`);
                
                // TODO: Implement path changing logic
                
                return true;
            }
            
            return false;
            
        case 'SKIP_TURN':
            // Set player to skip their next turn
            player.skipNextTurn = true;
            logMessage(`${player.name} will skip their next turn`);
            return true;
            
        case 'IMMUNITY':
            // Grant immunity for a number of turns
            turns = effect.turns || 1;
            player.immunity = (player.immunity || 0) + turns;
            logMessage(`${player.name} is immune from negative effects for ${turns} turn(s)`);
            return true;
            
        case 'TRADE_BLOCKED':
            // Block player from trading
            tradeTurns = effect.turns || 1;
            player.tradeBlocked = (player.tradeBlocked || 0) + tradeTurns;
            logMessage(`${player.name} cannot trade for ${tradeTurns} turn(s)`);
            return true;
            
        default:
            console.log(`Unhandled effect type: ${effect.type}`);
            return false;
    }
}

/**
 * Get the number of cards remaining in a deck
 */
export const getCardCount = (deckType) => {
    if (!cardDecks[deckType]) return 0;
    return cardDecks[deckType].length;
};

/**
 * Get the number of cards in a discard pile
 */
export const getDiscardCount = (deckType) => {
    if (!discardPiles[deckType]) return 0;
    return discardPiles[deckType].length;
};

/**
 * Discard a card
 * @param {Object} card - The card to discard
 * @param {string} deckType - The deck type to discard to
 * @param {string} playerId - ID of the player discarding the card (optional)
 */
export function discardCard(card, deckType, playerId = null) {
    if (!card) return;
    
    // Use card's deckType if not provided
    const type = deckType || card.deckType;
    
    if (!discardPiles[type]) {
        console.error(`Invalid deck type for discard: ${type}`);
        return;
    }
    
    discardPiles[type].push(card);
    console.log(`Discarded card: ${card.name} to ${type} discard pile`);
    
    // Log the discard if playerId is provided
    if (playerId) {
        logPlayerAction(playerId, 'CARD_DISCARD', {
            cardName: card.name,
            deckType: type
        });
    }
} 