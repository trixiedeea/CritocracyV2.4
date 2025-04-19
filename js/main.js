// Main entry point for Critocracy game

import { initializeUI, showScreen, setupPlayerCountUI } from './ui.js';
import { 
    setupBoard,
    drawBoard
} from './board.js';
import { initGame } from './game.js';
import './animations.js'; // Import animations module

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

        // 4. Initial Board Draw (Needs canvas element to exist first)
        const canvas = document.getElementById('board-canvas');
        if (canvas) {
            drawBoard(); // Perform the initial draw
        } else {
            console.error("Board canvas element not found! Cannot perform initial draw.");
            throw new Error("Board canvas missing.");
        }
        
        console.log("Critocracy initialization sequence complete. Ready for user interaction.");
        
        // Define the function to show player count screen
        function showPlayerCountScreen() {
            console.log("Showing player count screen...");
            
            // Set up player count UI
            setupPlayerCountUI();
            
            // Use the showScreen function to handle the transition
            showScreen('player-count-screen');
        }
        
        // Set up the button for manual transition
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            // Remove existing event listeners
            const newStartBtn = startGameBtn.cloneNode(true);
            startGameBtn.parentNode.replaceChild(newStartBtn, startGameBtn);
            
            // Add our new event listener for manual transition
            newStartBtn.addEventListener('click', () => {
                console.log("Start button clicked - going to player count screen");
                showPlayerCountScreen();
            });
        }
        
    } catch (error) {
        console.error("CRITICAL ERROR during game initialization:", error);
        // Display a user-friendly error message on the page
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = '<div style="color: red; padding: 20px;"><h1>Initialization Error</h1><p>Could not start the game. Please check the console (F12) for details and try refreshing.</p></div>';
        }
    }
});