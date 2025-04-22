// Player Module for Critocracy
// Manages player state, roles, resources, and actions.

import { START_SPACE } from './board-data.js';
import { updatePlayerInfo, logMessage, promptTargetSelection } from './ui.js';
import { logResourceChange, logPlayerAction } from './logging.js';

// ===== Player Constants =====
export const PLAYER_ROLES = {
    HISTORIAN: { 
        name: 'Suetonius the Historian', 
        description: 'Rome\'s Greatest Gossip....err Historian',
        startingResources: { knowledge: 14, money: 8, influence: 0 },
        opposingRole: 'POLITICIAN',
        abilityIdentifier: 'knowledgeTheftImmunity',
        token: 'H.png',
        abilityDescription: 'Cannot have knowledge stolen',
        activeAbilityDescription: 'Gain 5 Knowledge by activating historical insights'
    },
    REVOLUTIONARY: {
        name: 'Audre Lorde the Revolutionary',
        description: 'The Quietest Revolutionary That Ever There Was',
        startingResources: { knowledge: 14, influence: 8, money: 0 },
        opposingRole: 'COLONIALIST',
        abilityIdentifier: 'sabotageImmunity',
        token: 'R.png',
        abilityDescription: 'Ignores 1 sabotage per game',
        activeAbilityDescription: 'Target an opponent and reduce their Influence by 5'
    },
    COLONIALIST: { 
        name: 'Jacques Cartier the Colonialist', 
        description: 'For The Glory Of The Empire! but to the detriment of everyone else...',
        startingResources: { money: 14, influence: 8, knowledge: 0 },
        opposingRole: 'REVOLUTIONARY',
        abilityIdentifier: 'influenceTheftImmunity',
        token: 'C.png',
        abilityDescription: 'Immune to influence theft',
        activeAbilityDescription: 'Gain 5 Influence through colonial governance'
    },
    ENTREPRENEUR: { 
        name: 'Regina Basilier the Entrepreneur', 
        description: 'Making Bank Before It Was Even Legal, Literally',
        startingResources: { money: 14, knowledge: 8, influence: 0 },
        opposingRole: 'ARTIST',
        abilityIdentifier: 'skipTurnImmunity',
        token: 'E.png',
        abilityDescription: 'Never has to miss a turn',
        activeAbilityDescription: 'Gain 5 Money through clever business ventures'
    },
    POLITICIAN: { 
        name: 'Winston Churchill the Politician', 
        description: 'A Politician With A Plan...Unless You Are Irish',
        startingResources: { influence: 14, money: 8, knowledge: 0 },
        opposingRole: 'HISTORIAN',
        abilityIdentifier: 'moneyTheftImmunity',
        token: 'P.png',
        abilityDescription: 'Money cannot be stolen from',
        activeAbilityDescription: 'Gain 5 Influence through political maneuvering'
    },
    ARTIST: { 
        name: 'Salvador Dali the Artist', 
        description: 'A Brilliant Nutjob And Entertaining Loose Cannon',
        startingResources: { influence: 14, knowledge: 8, money: 0 },
        opposingRole: 'ENTREPRENEUR',
        abilityIdentifier: 'pathChangeImmunity',
        token: 'A.png',
        abilityDescription: 'Cannot be forced to change paths',
        activeAbilityDescription: 'Gain 5 Knowledge through artistic innovation'
    }
};

// Resource types (for validation, maybe)
const RESOURCES = ['money', 'knowledge', 'influence'];

// ===== Player State =====
let players = [];

// ===== Player Functions =====

/**
 * Resets the player state, clearing all players.
 */
export const resetPlayers = () => {
    console.log("Player state reset.");
    players = [];
};

/**
 * Retrieves the current list of players.
 * @returns {Array<Object>} Copy of the players array
 */
export const getPlayers = () => {
    // Return a shallow copy to prevent external modification
    return [...players];
};

/**
 * Creates a new player with the specified role and settings.
 * Initializes position using START_SPACE coordinates.
 * @param {string} name - The player's name
 * @param {string} role - The player's role (must be a key in PLAYER_ROLES)
 * @param {boolean} [isHuman=false] - Whether this player is human-controlled
 * @returns {Object|null} The created player object or null if role is invalid
 */
export const createPlayer = (name, role, isHuman = false) => {
    if (!PLAYER_ROLES[role]) {
        console.error(`Invalid role: ${role}`);
        return null;
    }
    
    const startCoords = {
        x: START_SPACE.coordinates[0],
        y: START_SPACE.coordinates[1]
    };
    
    const player = {
        id: `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name,
        role,
        isHuman,
        coords: { ...startCoords }, // Original property
        currentCoords: { ...startCoords }, // Add this for animations.js compatibility
        resources: { ...PLAYER_ROLES[role].startingResources },
        finished: false,
        skipTurns: 0, // Use number for multiple skips
        cards: [],
        items: [],
        alliances: [], // Maybe store alliance partner IDs here?
        temporaryImmunityTurns: 0, // Renamed for clarity
        tradeBlockedTurns: 0, 
        forcePathChange: false, 
        currentAlliancePartnerId: null,
        abilityUsed: false
    };
    
    console.log(`Created player ${player.name} (${player.role}), Human: ${player.isHuman}, starting at (${player.coords.x},${player.coords.y})`);
    players.push(player);
    return player;
};

/**
 * Updates a player's resources based on changes.
 * Ensures resources do not go below zero.
 * Triggers UI update for the player.
 * @param {string} playerId - The ID of the player.
 * @param {object} resourceChanges - An object like { money: 10, influence: -5 }.
 * @param {string} [source='UNKNOWN'] - Source of the resource change.
 * @param {object} [metadata={}] - Additional metadata about the change.
 */
export const updatePlayerResources = (playerId, changes, source = 'UNKNOWN', metadata = {}) => {
    const player = getPlayerById(playerId);
    if (!player || !changes) {
        console.warn("updatePlayerResources: Invalid player ID or no changes provided.", { playerId, changes });
        return; 
    }
    
    console.log(`Updating resources for ${player.name} (ID: ${playerId}):`, changes);
    let changed = false;
    const actualChanges = {}; // Track actual changes made (may differ from requested changes)
    
    for (const resource in changes) {
        if (RESOURCES.includes(resource)) {
            const currentValue = player.resources[resource] || 0;
            const changeAmount = changes[resource];
            const newValue = Math.max(0, currentValue + changeAmount);
            
            // Only record actual changes
            if (newValue !== currentValue) {
                const actualChange = newValue - currentValue; // This accounts for "floor at zero" 
                player.resources[resource] = newValue;
                actualChanges[resource] = actualChange;
                changed = true;
            }
        } else {
             console.warn(`Attempted to update invalid resource '${resource}' for player ${player.name}`);
        }
    }
    
    if (changed) {
        console.log(`New resources for ${player.name}:`, player.resources);
        
        // Log the resource change to the logging system
        logResourceChange(
            playerId, 
            actualChanges, 
            source, 
            {
                ...metadata,
                playerName: player.name,
                playerRole: player.role
            }
        );
        
        // Update UI
        updatePlayerInfo();
    }
};

/**
 * Marks a player as finished.
 * @param {string} playerId - ID of the player to mark.
 */
export const markPlayerFinished = (playerId) => {
    const player = getPlayerById(playerId);
    if (!player) return;
    console.log(`Marking player ${player.name} as finished.`);
    player.finished = true;
    
    // Log player finished game
    logPlayerAction(playerId, 'PLAYER_FINISHED', {
        playerName: player.name,
        playerRole: player.role,
        resources: { ...player.resources }
    });
};

/**
 * Checks if all players in the game have finished.
 */
export const allPlayersFinished = () => {
    if (players.length === 0) return false; // No players, game can't be finished
    return players.every(p => p.finished);
};

/**
 * Sets the skipTurns counter for a player.
 * @param {string} playerId - ID of the player.
 * @param {number} [turns=1] - Number of turns to skip.
 * @param {string} [source='UNKNOWN'] - Source of the skip turn effect.
 */
export const setPlayerSkipTurn = (playerId, turns = 1, source = 'UNKNOWN') => {
    const player = getPlayerById(playerId);
    if (player) {
        // Skip "skip turn" for Entrepreneurs
        if (player.role === 'ENTREPRENEUR' && !player.abilityUsed) {
            console.log(`Player ${player.name} (Entrepreneur) is immune to skip turn effects.`);
            return;
        }
        
        player.skipTurns = Math.max(0, turns); // Ensure non-negative
        console.log(`Player ${player.name} will skip ${player.skipTurns} turn(s).`);
        
        // Log the skip turn action
        logPlayerAction(playerId, 'SKIP_TURN_SET', {
            turns: player.skipTurns,
            source,
            playerName: player.name,
            playerRole: player.role
        });
    }
};

/**
 * Calculates the score for a single player (sum of resources).
 */
export const getPlayerScore = (player) => {
    // Placeholder scoring logic
    let score = 0;
    if (player.finished) score += 100; // Bonus for finishing
    // Add points for resources, cards, etc. later
    // score += Object.values(player.resources).reduce((sum, val) => sum + val, 0);
    return score;
};

/**
 * Calculates the final player rankings based on score and elimination.
 */
export const getPlayerRanking = () => {
    // Simple ranking: finished players first, then by name (for tie-breaking)
    return [...players].sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        return a.name.localeCompare(b.name); // Alphabetical for ties/unfinished
    });
};

/**
 * Gets a player by their role.
 * @param {string} role - The role to search for.
 * @returns {Object|null} The player with the specified role, or null if not found.
 */
export const getPlayerByRole = (role) => {
    return players.find(player => player.role === role);
};

/**
 * Gets a random player from the list, excluding the provided player.
 * @param {object} currentPlayer - The player to exclude.
 * @returns {object | null} A random other player, or null if none exist.
 */
export const getRandomOtherPlayer = (currentPlayer) => {
    if (!currentPlayer) return null; 
    const otherPlayers = players.filter(p => p.id !== currentPlayer.id);
    if (otherPlayers.length === 0) {
        return null; // No other players in the game
    }
    const randomIndex = Math.floor(Math.random() * otherPlayers.length);
    return otherPlayers[randomIndex];
};

/**
 * Checks if a player has temporary immunity active.
 * @param {string} playerId - ID of the player.
 * @returns {boolean}
 */
export const hasTemporaryImmunity = (playerId) => {
    const player = getPlayerById(playerId);
    return player && player.temporaryImmunityTurns > 0;
};

/**
 * Uses a player's special ability.
 * @param {string} playerId - ID of the player.
 * @returns {boolean} - True if ability was successfully used.
 */
export const useSpecialAbility = (playerId) => {
    const player = getPlayerById(playerId);
    if (!player) return false;
    
    console.log(`Attempting to use special ability for ${player.name} (${player.role})`);
    
    // Check if player has already used their ability
    if (player.abilityUsed) {
        logMessage(`${player.name} has already used their special ability.`);
        console.log(`${player.name} has already used their special ability.`);
        return false;
    }
    
    // Add property to track ability usage if it doesn't exist
    if (player.abilityUsed === undefined) {
        player.abilityUsed = false;
    }
    
    const roleInfo = PLAYER_ROLES[player.role];
    if (!roleInfo || !roleInfo.abilityIdentifier) {
        console.warn(`${player.role} has no defined ability.`);
        return false;
    }
    
    // Get the ability description for logging
    const abilityDescription = roleInfo.activeAbilityDescription || "Use special ability";
    
    // Each ability has its own implementation
    switch (roleInfo.abilityIdentifier) {
        case 'knowledgeTheftImmunity': // HISTORIAN
            // Already passive, but we can grant an active knowledge boost
            updatePlayerResources(player.id, { knowledge: 5 });
            player.abilityUsed = true;
            console.log(`${player.name} used ability: ${abilityDescription}`);
            logMessage(`${player.name} used special ability: Gained 5 Knowledge!`);
            return true;
            
        case 'sabotageImmunity': { // REVOLUTIONARY
            // Already passive for one sabotage, can be used to sabotage another player
            // Display a target selection UI for the player
            const possibleTargets = getPlayers().filter(p => p.id !== player.id);
            if (possibleTargets.length === 0) {
                logMessage(`No other players to target with revolutionary tactics.`);
                return false;
            }
            
            // For human players, show target selection
            if (player.isHuman) {
                const handleTargetSelection = (targetPlayer) => {
                    if (targetPlayer) {
                        // Apply the effect to the chosen target
                        updatePlayerResources(targetPlayer.id, { influence: -5 });
                        player.abilityUsed = true;
                        console.log(`${player.name} used revolutionary tactics against ${targetPlayer.name}`);
                        logMessage(`${player.name} used revolutionary tactics against ${targetPlayer.name}: -5 Influence to target!`);
                        updatePlayerInfo();
                    } else {
                        // User canceled, don't mark ability as used
                        logMessage(`${player.name} canceled using revolutionary tactics.`);
                    }
                };
                
                promptTargetSelection(
                    player, 
                    possibleTargets, 
                    "Choose a player to reduce their Influence by 5:",
                    handleTargetSelection
                );
                // Return true to indicate successful ability use, but don't mark as used yet
                // The callback will handle that when selection is made
                return true;
            } else {
                // For AI, just target the first player
                const target = possibleTargets[0];
                updatePlayerResources(target.id, { influence: -5 });
                player.abilityUsed = true;
                console.log(`AI ${player.name} used ability: revolutionary tactics targeting ${target.name}`);
                logMessage(`${player.name} used revolutionary tactics against ${target.name}: -5 Influence to target!`);
                return true;
            }
        }
            
        case 'influenceTheftImmunity': // COLONIALIST
            // Already passive, but can be used to gain influence
            updatePlayerResources(player.id, { influence: 5 });
            player.abilityUsed = true;
            console.log(`${player.name} used ability: ${abilityDescription}`);
            logMessage(`${player.name} used colonial governance: Gained 5 Influence!`);
            return true;
            
        case 'skipTurnImmunity': // ENTREPRENEUR
            // Already passive, can be used to gain money
            updatePlayerResources(player.id, { money: 5 });
            player.abilityUsed = true;
            console.log(`${player.name} used ability: ${abilityDescription}`);
            logMessage(`${player.name} used entrepreneurial ventures: Gained 5 Money!`);
            return true;
            
        case 'moneyTheftImmunity': // POLITICIAN
            // Already passive, can be used to gain influence
            updatePlayerResources(player.id, { influence: 5 });
            player.abilityUsed = true;
            console.log(`${player.name} used ability: ${abilityDescription}`);
            logMessage(`${player.name} used political maneuvering: Gained 5 Influence!`);
            return true;
            
        case 'pathChangeImmunity': // ARTIST
            // Already passive, can be used to gain knowledge
            updatePlayerResources(player.id, { knowledge: 5 });
            player.abilityUsed = true;
            console.log(`${player.name} used ability: ${abilityDescription}`);
            logMessage(`${player.name} used artistic innovation: Gained 5 Knowledge!`);
            return true;
            
        default:
            console.warn(`Unknown ability: ${roleInfo.abilityIdentifier}`);
            return false;
    }
};

/**
 * Grants temporary immunity to a player.
 * @param {string} playerId - ID of the player.
 * @param {number} [turns=1] - Duration of immunity.
 */
export const grantTemporaryImmunity = (playerId, turns = 1) => {
    const player = getPlayerById(playerId);
    if (player) {
        player.temporaryImmunityTurns = Math.max(player.temporaryImmunityTurns, turns);
        console.log(`${player.name} granted immunity for ${turns} turn(s). Total: ${player.temporaryImmunityTurns}`);
    }
};

/**
 * Decrements temporary immunity turns for all players.
 */
export const decrementImmunityTurns = () => {
    players.forEach(p => {
        if (p.temporaryImmunityTurns > 0) {
            p.temporaryImmunityTurns--;
            console.log(`Immunity turns decremented for ${p.name}. Remaining: ${p.temporaryImmunityTurns}`);
        }
    });
};

/**
 * Blocks trading for a player.
 * @param {string} playerId - ID of the player.
 * @param {number} [turns=1] - Duration of block.
 */
export const blockTrade = (playerId, turns = 1) => {
    const player = getPlayerById(playerId);
    if (player) {
        player.tradeBlockedTurns = Math.max(player.tradeBlockedTurns, turns);
        console.log(`${player.name} trade blocked for ${turns} turn(s). Total: ${player.tradeBlockedTurns}`);
    }
};

/**
 * Checks if trading is blocked for a player.
 * @param {string} playerId - ID of the player.
 * @returns {boolean}
 */
export const isTradeBlocked = (playerId) => {
    const player = getPlayerById(playerId);
    return player && player.tradeBlockedTurns > 0;
};

/**
 * Decrements trade block turns for all players.
 */
export const decrementTradeBlockTurns = () => {
    players.forEach(p => {
        if (p.tradeBlockedTurns > 0) {
            p.tradeBlockedTurns--;
            console.log(`Trade block turns decremented for ${p.name}. Remaining: ${p.tradeBlockedTurns}`);
        }
    });
};

/**
 * Sets or clears the forcePathChange flag for a player.
 * @param {string} playerId - ID of the player.
 * @param {boolean} force - True to set the flag, false to clear it.
 */
export const setPlayerForcedPathChange = (playerId, force) => {
    const player = getPlayerById(playerId);
    if (player) {
        player.forcePathChange = !!force;
        console.log(`Player ${player.name} forcePathChange set to: ${player.forcePathChange}`);
    }
};

/**
 * Finds a player object by their ID.
 * @param {string} playerId - The ID of the player to find.
 * @returns {object|null} - The player object or null if not found.
 */
export const getPlayerById = (playerId) => {
    return players.find(p => p.id === playerId) || null;
};

/**
 * Check if a player is immune to a particular type of resource theft
 * @param {object} player - The player to check
 * @param {string} resourceType - The type of resource (money, knowledge, influence)
 * @returns {boolean} - True if the player is immune to theft of this resource
 */
export function isImmuneToTheft(player, resourceType) {
    if (!player || !resourceType) return false;
    
    // Check role-specific immunities
    switch (player.role) {
        case 'Politician':
            // Politician is immune to money theft
            if (resourceType.toLowerCase() === 'money') {
                console.log(`${player.name} is immune to money theft as a Politician`);
                return true;
            }
            break;
            
        case 'Historian':
            // Historian is immune to knowledge theft
            if (resourceType.toLowerCase() === 'knowledge') {
                console.log(`${player.name} is immune to knowledge theft as a Historian`);
                return true;
            }
            break;
            
        case 'Colonialist':
            // Colonialist is immune to influence theft
            if (resourceType.toLowerCase() === 'influence') {
                console.log(`${player.name} is immune to influence theft as a Colonialist`);
                return true;
            }
            break;
    }
    
    return false;
}

/**
 * Check if a player is immune to sabotage
 * @param {object} player - The player to check
 * @returns {boolean} - True if the player is immune to sabotage
 */
export function isImmuneToSabotage(player) {
    if (!player) return false;
    
    // Check if player is a Revolutionary and has not used their sabotage immunity
    if (player.role === 'Revolutionary' && !player.usedSabotageImmunity) {
        // Mark the immunity as used
        player.usedSabotageImmunity = true;
        console.log(`${player.name} used their Revolutionary ability to ignore sabotage`);
        return true;
    }
    
    return false;
}

/**
 * Check if a player can be forced to change paths
 * @param {object} player - The player to check
 * @returns {boolean} - True if the player can be forced to change paths
 */
export function canBeForcePathChange(player) {
    if (!player) return true;
    
    // Artist cannot be forced to change paths
    if (player.role === 'Artist') {
        console.log(`${player.name} cannot be forced to change paths as an Artist`);
        return false;
    }
    
    return true;
}

/**
 * Force a player to skip their next turn
 * @param {object} player - The player to affect
 * @returns {boolean} - True if successful, false if player is immune
 */
export function forceSkipTurn(player) {
    if (!player) return false;
    
    // Entrepreneur never has to miss a turn
    if (player.role === 'Entrepreneur') {
        console.log(`${player.name} is immune to missing turns as an Entrepreneur`);
        return false;
    }
    
    // Set the skip turn flag
    player.skipTurns = (player.skipTurns || 0) + 1;
    console.log(`${player.name} will skip their next turn`);
    return true;
}

// Move player - REMOVED UNUSED STUB
/*
export async function movePlayer(player, spaces) {
    // Implementation missing...
}
*/ 