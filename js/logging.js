/**
 * Logging Module for Critocracy
 * Tracks player resources, actions, and game events
 */

// ===== Module State =====
const gameLog = [];
const resourceLog = {};
const eventLog = [];

/**
 * Initialize the logging system
 * @param {Array} players - Array of player objects to initialize resource tracking
 */
export const initLogging = (players) => {
    console.log('Initializing logging system for Critocracy');
    
    // Reset logs
    gameLog.length = 0;
    Object.keys(resourceLog).forEach(key => delete resourceLog[key]);
    eventLog.length = 0;
    
    // Setup initial resource tracking for each player
    players.forEach(player => {
        resourceLog[player.id] = {
            history: [{
                turn: 0,
                money: player.resources.money,
                knowledge: player.resources.knowledge,
                influence: player.resources.influence,
                timestamp: Date.now()
            }],
            current: { ...player.resources }
        };
    });
    
    // Log initialization
    logGameEvent('GAME_START', {
        playerCount: players.length,
        playerIds: players.map(p => p.id),
        timestamp: Date.now()
    });
    
    return true;
};

/**
 * Log a resource change for a player
 * @param {string} playerId - ID of the player whose resources changed
 * @param {Object} changes - Object containing resource changes: {money, knowledge, influence}
 * @param {string} source - Source of the resource change (e.g., 'CARD', 'TRADE', 'SPACE_EFFECT')
 * @param {Object} metadata - Additional metadata about the change
 */
export const logResourceChange = (playerId, changes, source, metadata = {}) => {
    if (!resourceLog[playerId]) {
        console.error(`Cannot log resources for unknown player: ${playerId}`);
        return false;
    }
    
    const player = resourceLog[playerId];
    const turn = metadata.turn || getCurrentTurn();
    const previousValues = { ...player.current };
    
    // Update current resource values
    Object.keys(changes).forEach(resource => {
        if (player.current[resource] !== undefined) {
            player.current[resource] += changes[resource];
        }
    });
    
    // Record the change in history
    player.history.push({
        turn,
        ...player.current,
        source,
        changes,
        metadata,
        timestamp: Date.now()
    });
    
    // Also log as a game event
    logGameEvent('RESOURCE_CHANGE', {
        playerId,
        previous: previousValues,
        current: { ...player.current },
        changes,
        source,
        metadata
    });
    
    // Output to console for debugging
    console.log(`Resource change for ${playerId}: ${formatResourceChanges(changes)} (${source})`);
    
    return true;
};

/**
 * Log a game event
 * @param {string} eventType - Type of event
 * @param {Object} data - Event data
 */
export const logGameEvent = (eventType, data = {}) => {
    const event = {
        eventType,
        turn: data.turn || getCurrentTurn(),
        timestamp: Date.now(),
        data
    };
    
    // Add to event log
    eventLog.push(event);
    
    // Add to combined game log
    gameLog.push({
        type: 'EVENT',
        ...event
    });
    
    return true;
};

/**
 * Log a player action
 * @param {string} playerId - ID of the player taking the action
 * @param {string} actionType - Type of action
 * @param {Object} data - Action data
 */
export const logPlayerAction = (playerId, actionType, data = {}) => {
    const action = {
        playerId,
        actionType,
        turn: data.turn || getCurrentTurn(),
        timestamp: Date.now(),
        data
    };
    
    // Add to combined game log
    gameLog.push({
        type: 'ACTION',
        ...action
    });
    
    console.log(`Player ${playerId} action: ${actionType}`);
    
    return true;
};

/**
 * Log a card draw event
 * @param {string} playerId - ID of the player drawing the card
 * @param {Object} card - The card drawn
 * @param {string} deckType - Type of deck the card was drawn from
 */
export const logCardDraw = (playerId, card, deckType) => {
    logPlayerAction(playerId, 'CARD_DRAW', {
        cardName: card.name,
        deckType,
        cardEffects: card.effects
    });
    
    console.log(`${playerId} drew card: ${card.name} from ${deckType} deck`);
    
    return true;
};

/**
 * Log a turn start
 * @param {string} playerId - ID of the player whose turn is starting
 * @param {number} turnNumber - The turn number
 */
export const logTurnStart = (playerId, turnNumber) => {
    logGameEvent('TURN_START', {
        playerId,
        turnNumber
    });
    
    console.log(`Starting turn ${turnNumber} for player ${playerId}`);
    
    return true;
};

/**
 * Log a turn end
 * @param {string} playerId - ID of the player whose turn is ending
 * @param {number} turnNumber - The turn number
 */
export const logTurnEnd = (playerId, turnNumber) => {
    logGameEvent('TURN_END', {
        playerId,
        turnNumber
    });
    
    console.log(`Ending turn ${turnNumber} for player ${playerId}`);
    
    return true;
};

/**
 * Log player movement
 * @param {string} playerId - ID of the player who moved
 * @param {Object} fromCoords - Starting coordinates
 * @param {Object} toCoords - Ending coordinates
 * @param {number} spaces - Number of spaces moved
 */
export const logPlayerMovement = (playerId, fromCoords, toCoords, spaces) => {
    logPlayerAction(playerId, 'MOVEMENT', {
        fromCoords,
        toCoords,
        spaces
    });
    
    console.log(`${playerId} moved ${spaces} spaces from (${fromCoords.x},${fromCoords.y}) to (${toCoords.x},${toCoords.y})`);
    
    return true;
};

/**
 * Get resource history for a player
 * @param {string} playerId - ID of the player
 * @param {number} turnLimit - Optional limit on number of turns to retrieve
 * @returns {Array} Array of resource changes
 */
export const getPlayerResourceHistory = (playerId, turnLimit = null) => {
    if (!resourceLog[playerId]) return [];
    
    let history = resourceLog[playerId].history;
    
    // If turn limit specified, filter to most recent turns
    if (turnLimit) {
        const currentTurn = getCurrentTurn();
        history = history.filter(entry => entry.turn >= currentTurn - turnLimit);
    }
    
    return [...history]; // Return a copy to prevent external modification
};

/**
 * Get current resources for a player
 * @param {string} playerId - ID of the player
 * @returns {Object} Current resource values
 */
export const getPlayerCurrentResources = (playerId) => {
    if (!resourceLog[playerId]) return null;
    return { ...resourceLog[playerId].current };
};

/**
 * Get game log filtered by specific criteria
 * @param {Object} filters - Filters to apply
 * @returns {Array} Filtered game log
 */
export const getFilteredGameLog = (filters = {}) => {
    let filtered = [...gameLog];
    
    if (filters.playerId) {
        filtered = filtered.filter(entry => 
            (entry.playerId === filters.playerId) || 
            (entry.data && entry.data.playerId === filters.playerId)
        );
    }
    
    if (filters.eventType) {
        filtered = filtered.filter(entry => entry.eventType === filters.eventType);
    }
    
    if (filters.actionType) {
        filtered = filtered.filter(entry => entry.actionType === filters.actionType);
    }
    
    if (filters.turn) {
        filtered = filtered.filter(entry => entry.turn === filters.turn);
    }
    
    if (filters.fromTurn) {
        filtered = filtered.filter(entry => entry.turn >= filters.fromTurn);
    }
    
    if (filters.toTurn) {
        filtered = filtered.filter(entry => entry.turn <= filters.toTurn);
    }
    
    return filtered;
};

/**
 * Clear all logs
 */
export const clearLogs = () => {
    gameLog.length = 0;
    Object.keys(resourceLog).forEach(key => delete resourceLog[key]);
    eventLog.length = 0;
    console.log('Cleared all game logs');
    return true;
};

/**
 * Export logs as JSON for saving
 * @returns {Object} All logs in JSON-serializable format
 */
export const exportLogs = () => {
    return {
        gameLog: [...gameLog],
        resourceLog: { ...resourceLog },
        eventLog: [...eventLog],
        exportTime: Date.now()
    };
};

/**
 * Import logs from saved JSON
 * @param {Object} logData - Log data to import
 */
export const importLogs = (logData) => {
    if (!logData) return false;
    
    try {
        // Clear existing logs
        clearLogs();
        
        // Import logs
        if (logData.gameLog) gameLog.push(...logData.gameLog);
        if (logData.eventLog) eventLog.push(...logData.eventLog);
        
        // Import resource log
        if (logData.resourceLog) {
            Object.keys(logData.resourceLog).forEach(playerId => {
                resourceLog[playerId] = logData.resourceLog[playerId];
            });
        }
        
        console.log(`Imported logs from ${new Date(logData.exportTime).toLocaleString()}`);
        return true;
    } catch (error) {
        console.error("Error importing logs:", error);
        return false;
    }
};

// ===== Helper Functions =====

/**
 * Get the current turn from the game module
 * This is a placeholder - the actual implementation would need to 
 * reference the game state module to get the current turn
 */
const getCurrentTurn = () => {
    // This should be implemented to get the actual current turn
    // from the game state module
    const gameState = window.gameState || { currentTurn: 0 };
    return gameState.currentTurn || 0;
};

/**
 * Format resource changes for readable console output
 * @param {Object} changes - Resource changes to format
 * @returns {string} Formatted string
 */
const formatResourceChanges = (changes) => {
    return Object.entries(changes)
        .map(([resource, value]) => {
            const sign = value > 0 ? '+' : '';
            return `${resource}: ${sign}${value}`;
        })
        .join(', ');
};

/**
 * Get formatted game log as a string
 * @param {number} limit - Maximum number of entries to return
 * @param {string} playerFilter - Filter by player ID
 * @param {string} typeFilter - Filter by event type
 * @returns {string} - Formatted log as a string
 */
export const getFormattedGameLog = (limit = 20, playerFilter = null, typeFilter = null) => {
    let filteredLog = [...gameLog];
    
    // Apply filters
    if (playerFilter) {
        filteredLog = filteredLog.filter(entry => 
            (entry.playerId === playerFilter) || 
            (entry.data && entry.data.playerId === playerFilter)
        );
    }
    
    if (typeFilter) {
        if (typeFilter === 'EVENT') {
            filteredLog = filteredLog.filter(entry => entry.type === 'EVENT');
        } else if (typeFilter === 'ACTION') {
            filteredLog = filteredLog.filter(entry => entry.type === 'ACTION');
        } else if (typeFilter === 'RESOURCE') {
            filteredLog = filteredLog.filter(entry => 
                entry.type === 'EVENT' && 
                entry.eventType === 'RESOURCE_CHANGE'
            );
        }
    }
    
    // Sort by timestamp (newest first)
    filteredLog.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limit number of entries
    filteredLog = filteredLog.slice(0, limit);
    
    // Format entries
    const formatted = filteredLog.map(entry => {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        
        if (entry.type === 'ACTION') {
            return `[${time}] Player ${entry.playerId}: ${entry.actionType}`;
        } else if (entry.type === 'EVENT') {
            if (entry.eventType === 'RESOURCE_CHANGE') {
                const changes = entry.data.changes;
                const changeStr = formatResourceChanges(changes);
                return `[${time}] Player ${entry.data.playerId}: ${changeStr} (${entry.data.source})`;
            } else {
                return `[${time}] ${entry.eventType}: ${JSON.stringify(entry.data).slice(0, 100)}`;
            }
        }
        
        return `[${time}] ${JSON.stringify(entry).slice(0, 100)}`;
    });
    
    return formatted.join('\n');
};

// Export the logging module functions 