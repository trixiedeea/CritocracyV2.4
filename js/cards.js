// cards.js - Manages card collections, drawing, and effects

// ===== Imports =====
import { PURPLE_CARDS, BLUE_CARDS, CYAN_CARDS, PINK_CARDS } from '../assets/Cards/Specialeventcards.js';
import { updatePlayerResources } from './players.js';
import { getPathColorFromCoords } from './board.js';
import { PATH_COLORS } from './board-data.js';
import { logMessage } from './logging.js';
import ENDOFTURNCARDS from '../assets/Cards/Endofturncards.js';

// ===== Constants =====
// These deck types correspond to the path colors defined in board-data.js
// IMPORTANT: These colors must match exactly with PATH_COLORS for proper gameplay
// Purple: #9C54DE - Age of Expansion
// Blue: #1B3DE5 - Age of Resistance  
// Cyan: #00FFFF - Age of Reckoning
// Pink: #FF66FF - Age of Legacy
export const DECK_TYPES = {
    PURPLE: 'purple',
    BLUE: 'blue',
    CYAN: 'cyan',
    PINK: 'pink',
    END_OF_TURN: 'end_of_turn'
};

// Path colors for easier reference
export const pathColors = {
    purple: PATH_COLORS.purple,
    blue: PATH_COLORS.blue,
    cyan: PATH_COLORS.cyan,
    pink: PATH_COLORS.pink
};

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
    // Path decks
    cardDecks[DECK_TYPES.PURPLE] = [...PURPLE_CARDS].map(card => ({ ...card, deckType: DECK_TYPES.PURPLE }));
    cardDecks[DECK_TYPES.BLUE] = [...BLUE_CARDS].map(card => ({ ...card, deckType: DECK_TYPES.BLUE }));
    cardDecks[DECK_TYPES.CYAN] = [...CYAN_CARDS].map(card => ({ ...card, deckType: DECK_TYPES.CYAN }));
    cardDecks[DECK_TYPES.PINK] = [...PINK_CARDS].map(card => ({ ...card, deckType: DECK_TYPES.PINK }));
    
    // End of turn deck
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
 * Get cards of a specific deck type
 * @param {string} deckType - Type of deck to get cards from
 * @returns {Array} - Array of cards from the specified deck
 */
export function getSpecialEventCards(deckType) {
    return cardDecks[deckType] || [];
}

/**
 * Get end of turn cards
 * @returns {Array} - Array of end of turn card objects
 */
export function getEndOfTurnCards() {
    return cardDecks[DECK_TYPES.END_OF_TURN];
}

/**
 * Draw a card from a specific deck
 * @param {string} deckType - Type of deck to draw from
 * @returns {Object|null} - The drawn card or null if no cards available
 */
export function drawCard(deckType) {
    const deck = cardDecks[deckType];
    if (!deck || deck.length === 0) {
        // If deck is empty, shuffle discard pile back into deck
        if (discardPiles[deckType] && discardPiles[deckType].length > 0) {
            cardDecks[deckType] = [...discardPiles[deckType]];
            discardPiles[deckType] = [];
            shuffleDeck(cardDecks[deckType]);
            return drawCard(deckType); // Try drawing again
        }
        return null;
    }
    return deck.shift();
}

/**
 * Log a card draw to the game log
 * @param {string} playerId - ID of the player who drew the card
 * @param {Object} card - The card that was drawn
 * @param {string} deckType - Type of deck the card was drawn from
 */
export function logCardDraw(playerId, card, deckType) {
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
                logMessage(`${player.name} moves to ${effect.moveToAge}`);
                
                return true;
            }
            
            return false;
            
        default:
            console.error(`Unknown effect type: ${effect.type}`);
            return false;
    }
}

/**
 * Discard a card to its appropriate discard pile
 * @param {Object} card - The card to discard
 */
export function discardCard(card) {
    if (!card || !card.deckType) {
        console.error('Cannot discard card: Invalid card or missing deck type');
        return;
    }
    discardPiles[card.deckType].push(card);
}