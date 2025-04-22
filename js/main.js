// Main entry point for Critocracy game

import { 
    initializeUI, 
    showScreen, 
    setupPlayerCountUI,
    hideCard,
    hideTargetSelection,
    safeResizeCanvas,
    updateGameComponents,
    handleMessageAnimationEnd,
    handleCardAnimationEnd,
    handleBoardClick,
    validatePlayerCounts,
    logMessage
} from './ui.js';

import { 
    setupBoard
} from './board.js';

import * as gameModule from './game.js';

import './animations.js'; // Import animations module

// Expose game module to window for cross-module access
window.game = gameModule;

// Global event handler map
const eventHandlers = {
    'click': {
        'start-game-btn': () => {
            console.log("Start button clicked - going to player count screen");
            setupPlayerCountUI();
            showScreen('player-count-screen');
        },
        'role-confirm': () => gameModule.handleRoleConfirmation(),
        'roll-dice-btn': () => gameModule.handleDiceRoll(),
        'end-turn-btn': () => gameModule.handleEndTurn(),
        'use-ability-btn': () => gameModule.handleAbilityUse(),
        'close-card-btn': () => hideCard(),
        'new-game-btn': () => gameModule.handleNewGame(),
        'trade-accept-btn': () => gameModule.handleTradeResponse(true),
        'trade-reject-btn': () => gameModule.handleTradeResponse(false),
        'cancel-target-btn': () => hideTargetSelection(),
        'board-canvas': (e) => handleBoardClick(e)
    },
    'change': {
        'total-player-count': (e) => validatePlayerCounts(e),
        'human-player-count': (e) => validatePlayerCounts(e)
    },
    'resize': {
        'window': () => {
            safeResizeCanvas();
            updateGameComponents();
        }
    },
    'animationend': {
        'message': (e) => handleMessageAnimationEnd(e),
        'card': (e) => handleCardAnimationEnd(e)
    }
};

// Single event listener setup
function setupEventDelegation() {
    // Handle click events
    document.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.id;
        if (eventHandlers.click[id]) {
            eventHandlers.click[id](e);
        }
        
        // Special handling for role-confirm button to ensure game starts properly
        if (id === 'role-confirm') {
            const selectedRole = document.querySelector('.role-card.grid-item.selected');
            if (!selectedRole) {
                logMessage("Please select a role first!", "error");
                return;
            }
            
            console.log("Role confirmed, initializing game...");
            gameModule.handleRoleConfirmation();
        }
    });

    // Handle change events
    document.addEventListener('change', (e) => {
        const target = e.target;
        const id = target.id;
        if (eventHandlers.change[id]) {
            eventHandlers.change[id](e);
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        eventHandlers.resize.window();
    });

    // Handle animation end events
    document.addEventListener('animationend', (e) => {
        const target = e.target;
        const type = target.dataset.animationType;
        if (eventHandlers.animationend[type]) {
            eventHandlers.animationend[type](e);
        }
    });
}

// Initialize the game when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed. Initializing Critocracy...");

    try {
        // 1. Initialize UI (Setup screens, event listeners)
        const uiReady = initializeUI();
        if (!uiReady) {
            throw new Error("UI failed to initialize.");
        }

        // 2. Initialize Board Module (Load images, set up canvas)
        const boardReady = await setupBoard();
        if (!boardReady) {
            throw new Error("Board module failed to initialize (images/canvas).");
        }

        // 3. Set up the single event delegation system
        setupEventDelegation();

        // 4. Show the start screen - we'll initialize the game after player role selection
        showScreen('start-screen');
        
        console.log("Critocracy initialization sequence complete. Ready for user interaction.");
        
    } catch (error) {
        console.error("CRITICAL ERROR during game initialization:", error);
        // Display a user-friendly error message on the page
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = '<div style="color: red; padding: 20px;"><h1>Initialization Error</h1><p>Could not start the game. Please check the console (F12) for details and try refreshing.</p></div>';
        }
    }
});