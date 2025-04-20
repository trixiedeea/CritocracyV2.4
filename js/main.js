// Main entry point for Critocracy game

import { 
    initializeUI, 
    showScreen, 
    setupPlayerCountUI,
    setupRoleSelectionUI,
    hideCard,
    hideTargetSelection,
    safeResizeCanvas,
    updateGameComponents,
    handleMessageAnimationEnd,
    handleCardAnimationEnd,
    handleBoardClick,
    validatePlayerCounts
} from './ui.js';

import { 
    setupBoard,
    drawBoard
} from './board.js';

import { 
    initGame,
    handleRoleConfirmation,
    handleDiceRoll,
    handleEndTurn,
    handleAbilityUse,
    handleNewGame,
    handleTradeResponse
} from './game.js';

import './animations.js'; // Import animations module

// Global event handler map
const eventHandlers = {
    'click': {
        'start-game-btn': () => {
            console.log("Start button clicked - going to player count screen");
            setupPlayerCountUI();
            showScreen('player-count-screen');
        },
        'role-confirm': () => handleRoleConfirmation(),
        'roll-dice-btn': () => handleDiceRoll(),
        'end-turn-btn': () => handleEndTurn(),
        'use-ability-btn': () => handleAbilityUse(),
        'close-card-btn': () => hideCard(),
        'new-game-btn': () => handleNewGame(),
        'trade-accept-btn': () => handleTradeResponse(true),
        'trade-reject-btn': () => handleTradeResponse(false),
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
        // 1. Initialize Game Logic (Cards, Board spaces, Players)
        const gameReady = await initGame();
        if (!gameReady) {
            throw new Error("Core game logic failed to initialize.");
        }

        // 2. Initialize Board Module (Load images, set up canvas)
        const boardReady = await setupBoard();
        if (!boardReady) {
            throw new Error("Board module failed to initialize (images/canvas).");
        }

        // 3. Initialize UI (Setup screens, event listeners)
        const uiReady = initializeUI();
        if (!uiReady) {
            throw new Error("UI failed to initialize.");
        }

        // 4. Set up the single event delegation system
        setupEventDelegation();

        // 5. Initial Board Draw (Needs canvas element to exist first)
        const canvas = document.getElementById('board-canvas');
        if (canvas) {
            drawBoard(); // Perform the initial draw
        } else {
            console.error("Board canvas element not found! Cannot perform initial draw.");
            throw new Error("Board canvas missing.");
        }
        
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