// Main entry point for Critocracy game

import { initializeUI, showScreen, setupPlayerCountUI } from './ui.js';
import { setupBoard } from './board.js'; 
import './animations.js'; // Import animations module

// Initialize the UI when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded. Initializing Critocracy UI...");

    try {
        // 1. Initialize Board Module (Load images, set up canvas)
        const boardReady = await setupBoard(); 
        if (!boardReady) {
            throw new Error("Board module failed to initialize (images/canvas).");
        }

        // 2. Initialize UI (Setup screens, event listeners)
        const uiReady = initializeUI();
        if (!uiReady) {
            throw new Error("UI failed to initialize.");
        }
        
        console.log("Critocracy UI ready");
        
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
        console.error("CRITICAL ERROR during initial setup:", error);
        // Display a user-friendly error message
        const body = document.querySelector('body');
        if (body) {
             body.innerHTML = '<div style="color: red; padding: 20px;"><h1>Setup Error</h1><p>Could not prepare the game interface. Please check the console (F12) for details and try refreshing.</p></div>';
        }
    }
});