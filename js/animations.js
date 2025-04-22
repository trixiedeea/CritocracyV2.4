/**
 * Animation-related functions
 */

/**
 * Animates a value from start to end over a duration
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} duration - Duration in milliseconds
 * @param {Function} callback - Callback function with current value
 */
export const animateValue = (start, end, duration, callback) => {
    const startTime = performance.now();
    
    const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease in-out cubic
        const eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const current = start + (end - start) * eased;
        callback(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    };
    
    requestAnimationFrame(update);
};

/**
 * Animates an element's position
 * @param {HTMLElement} element - Element to animate
 * @param {Object} start - Starting position {x, y}
 * @param {Object} end - Ending position {x, y}
 * @param {number} duration - Duration in milliseconds
 * @returns {Promise} Resolves when animation completes
 */
export const animatePosition = (element, start, end, duration = 500) => {
    return new Promise(resolve => {
        const startTime = performance.now();
        
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease in-out cubic
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            const currentX = start.x + (end.x - start.x) * eased;
            const currentY = start.y + (end.y - start.y) * eased;
            
            element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                resolve();
            }
        };
        
        requestAnimationFrame(update);
    });
};

/**
 * Animates a dice roll
 * @param {HTMLElement} diceElement - Dice element to animate
 * @param {number} finalValue - Final dice value
 * @param {number} duration - Duration in milliseconds
 * @returns {Promise} Resolves when animation completes
 */
export const animateDiceRoll = (diceElement, finalValue, duration = 1000) => {
    return new Promise(resolve => {
        const frames = 20; // Number of frames to show
        const frameDuration = duration / frames;
        let currentFrame = 0;
        
        const update = () => {
            if (currentFrame < frames) {
                // Show random values during animation
                const randomValue = Math.floor(Math.random() * 6) + 1;
                diceElement.textContent = randomValue;
                currentFrame++;
                
                setTimeout(() => {
                    requestAnimationFrame(update);
                }, frameDuration);
            } else {
                // Show final value
                diceElement.textContent = finalValue;
                resolve();
            }
        };
        
        requestAnimationFrame(update);
    });
};

/**
 * Animates a card being drawn with proper timing for CPU vs Human
 * @param {HTMLElement} cardElement - Card element to animate
 * @param {Object} start - Starting position {x, y}
 * @param {Object} end - Ending position {x, y}
 * @param {boolean} isCPU - Whether this is a CPU player
 * @returns {Promise} Resolves when animation completes
 */
export const animateCardDraw = (cardElement, start, end, isCPU = false) => {
    return new Promise(resolve => {
        // Set initial position and make visible
        cardElement.style.transform = `translate(${start.x}px, ${start.y}px)`;
        cardElement.style.opacity = '0';
        cardElement.style.display = 'block';
        
        // Fade in
        requestAnimationFrame(() => {
            cardElement.style.opacity = '1';
        });
        
        // Animate to final position
        animatePosition(cardElement, start, end, 500).then(() => {
            if (isCPU) {
                // For CPU, wait fixed time
                setTimeout(() => {
                    cardElement.style.opacity = '0';
                    setTimeout(() => {
                        cardElement.style.display = 'none';
                        resolve();
                    }, 300);
                }, TIMING.CPU_CARD_DISPLAY);
            } else {
                // For human, wait for user interaction
                const closeButton = cardElement.querySelector('.close-card-btn');
                if (closeButton) {
                    closeButton.onclick = () => {
                        cardElement.style.opacity = '0';
                        setTimeout(() => {
                            cardElement.style.display = 'none';
                            resolve();
                        }, 300);
                    };
                }
            }
        });
    });
};

/**
 * Animates a deck flashing to indicate it's time to draw
 * @param {HTMLElement} deckElement - Deck element to animate
 * @param {boolean} isCPU - Whether this is a CPU player
 * @returns {Promise} Resolves when animation completes
 */
export const animateDeckFlash = (deckElement, isCPU = false) => {
    return new Promise(resolve => {
        let flashCount = 0;
        const maxFlashes = isCPU ? 4 : 999; // CPU: 4 seconds, Human: indefinite
        
        const flash = () => {
            if (flashCount >= maxFlashes) {
                deckElement.style.opacity = '1';
                resolve();
                return;
            }
            
            deckElement.style.opacity = flashCount % 2 === 0 ? '0.3' : '1';
            flashCount++;
            
            setTimeout(flash, isCPU ? 500 : 300); // Faster flash for human
        };
        
        flash();
    });
};

/**
 * Gets valid moves for a player
 * @param {Object} position - Current position
 * @param {number} steps - Number of steps remaining
 * @returns {Array} Array of valid moves with path information
 */
const getValidMoves = (position, steps) => {
    const moves = [];
    // Add moves based on current position and available paths
    // This is a placeholder - actual implementation would check board state
    moves.push({ x: position.x + steps * 20, y: position.y, path: 'PURPLE' });
    moves.push({ x: position.x - steps * 20, y: position.y, path: 'BLUE' });
    moves.push({ x: position.x, y: position.y + steps * 20, path: 'CYAN' });
    moves.push({ x: position.x, y: position.y - steps * 20, path: 'PINK' });
    return moves;
};

/**
 * Animates a token moving to a new position with proper timing
 * @param {Object} player - The player whose token is moving
 * @param {Object} newPosition - The new position coordinates
 * @param {boolean} isCPU - Whether this is a CPU player
 * @returns {Promise} Resolves when animation completes
 */
export const animateTokenToPosition = (player, newPosition, isCPU = false) => {
    return new Promise(resolve => {
        const token = document.querySelector(`[data-player-id="${player.id}"]`);
        if (!token) {
            resolve();
            return;
        }
        
        // Enlarge token
        token.style.transform = `scale(${TIMING.TOKEN_ENLARGE})`;
        
        // Move token
        animatePosition(token, 
            { x: token.offsetLeft, y: token.offsetTop },
            { x: newPosition.x, y: newPosition.y },
            isCPU ? 500 : 300 // Faster movement for CPU
        ).then(() => {
            // Pause
            setTimeout(() => {
                // Return to normal size
                token.style.transform = 'scale(1)';
                resolve();
            }, TIMING.TOKEN_PAUSE);
        });
    });
};

/**
 * Animates a resource change
 * @param {HTMLElement} element - Element to animate
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} duration - Duration in milliseconds
 * @returns {Promise} Resolves when animation completes
 */
export const animateResourceChange = (element, start, end, duration = 500) => {
    return new Promise(resolve => {
        // Add highlight class
        element.classList.add('resource-change');
        
        // Animate value
        animateValue(start, end, duration, (current) => {
            element.textContent = Math.round(current);
        });
        
        setTimeout(() => {
            // Remove highlight class
            element.classList.remove('resource-change');
            resolve();
        }, duration);
    });
};

/**
 * Animates a turn transition
 * @param {string} fromPlayer - ID of player ending turn
 * @param {string} toPlayer - ID of player starting turn
 * @param {number} duration - Duration in milliseconds
 * @returns {Promise} Resolves when animation completes
 */
export const showTurnTransition = (fromPlayer, toPlayer, duration = 1000) => {
    return new Promise(resolve => {
        const transition = document.createElement('div');
        transition.className = 'turn-transition';
        transition.innerHTML = `
            <div class="transition-content">
                <div class="player-ending">${fromPlayer}'s Turn</div>
                <div class="transition-arrow">→</div>
                <div class="player-starting">${toPlayer}'s Turn</div>
            </div>
        `;
        
        document.body.appendChild(transition);
        
        // Animate in
        requestAnimationFrame(() => {
            transition.style.opacity = '1';
            transition.style.transform = 'translateY(0)';
        });
        
        // Remove after duration
        setTimeout(() => {
            transition.style.opacity = '0';
            transition.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                transition.remove();
                resolve();
            }, 300);
        }, duration);
    });
};

/**
 * Animates a victory celebration
 * @param {string} winnerId - ID of winning player
 * @param {number} duration - Duration in milliseconds
 * @returns {Promise} Resolves when animation completes
 */
export const showVictoryCelebration = (winnerId, duration = 3000) => {
    return new Promise(resolve => {
        const celebration = document.createElement('div');
        celebration.className = 'victory-celebration';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="winner-name">${winnerId} Wins!</div>
                <div class="celebration-effects">
                    <div class="confetti"></div>
                    <div class="confetti"></div>
                    <div class="confetti"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        // Animate in
        requestAnimationFrame(() => {
            celebration.style.opacity = '1';
            celebration.style.transform = 'scale(1)';
        });
        
        // Remove after duration
        setTimeout(() => {
            celebration.style.opacity = '0';
            celebration.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                celebration.remove();
                resolve();
            }, 300);
        }, duration);
    });
};

/**
 * Shows a card with animation
 * @param {Object} card - The card to show
 * @param {Object} player - The player viewing the card
 * @param {Function} onClose - Callback when card is closed
 */
export const showCard = (card, player, onClose) => {
    if (!card) return;
    
    // Create card element
    const cardElement = document.createElement('div');
    cardElement.className = 'card-popup';
    cardElement.innerHTML = `
        <div class="card-content">
            <h3>${card.name}</h3>
            <p>${card.description}</p>
            ${card.effect ? `<div class="card-effect">${card.effect.description}</div>` : ''}
            <button class="close-button">Close</button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(cardElement);
    
    // Add close handler
    const closeButton = cardElement.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        cardElement.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(cardElement);
            if (onClose) onClose();
        }, 300);
    });
    
    // Animate in
    requestAnimationFrame(() => {
        cardElement.classList.add('visible');
    });
};

/**
 * Highlights valid move paths with exact colors
 * @param {Object} currentPosition - Current position coordinates
 * @param {number} stepsRemaining - Number of steps remaining
 */
export const highlightValidMovePaths = (currentPosition, stepsRemaining) => {
    const validMoves = getValidMoves(currentPosition, stepsRemaining);
    
    validMoves.forEach(move => {
        const pathElement = document.querySelector(`[data-path="${move.path}"]`);
        if (pathElement) {
            pathElement.style.backgroundColor = PATH_COLORS[move.path.toUpperCase()];
            pathElement.style.opacity = '0.5';
        }
    });
};

/**
 * Clears all move highlights
 */
export const clearHighlights = () => {
    const highlights = document.querySelectorAll('.move-highlight');
    highlights.forEach(highlight => {
        highlight.classList.add('closing');
        setTimeout(() => {
            highlight.remove();
        }, 300);
    });
};

// Animations module for Critocracy
// Contains animations for various game elements and transitions

document.addEventListener('DOMContentLoaded', () => {
  // Animate the start screen elements when the page loads
  animateStartScreen();
  
  // Set up other animation event listeners
  const startGameBtn = document.getElementById('start-game-btn');
  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
      animateScreenTransition('start-screen', 'player-count-screen');
    });
  }
  
  // Player count buttons animation
  const playerCountButtons = document.querySelectorAll('.player-count-btn');
  playerCountButtons.forEach(btn => {
    btn.addEventListener('mouseenter', () => pulseAnimation(btn));
  });
});

/**
 * Animates the start screen elements with a fade-in and slight upward movement
 */
function animateStartScreen() {
  const startScreen = document.getElementById('start-screen');
  if (!startScreen) return;
  
  // Animate the title
  const title = startScreen.querySelector('h1');
  if (title) {
    title.style.opacity = '0';
    title.style.transform = 'translateY(20px)';
    setTimeout(() => {
      title.style.transition = 'opacity 1.2s ease-out, transform 1s ease-out';
      title.style.opacity = '1';
      title.style.transform = 'translateY(0)';
    }, 300);
  }
  
  // Animate the start button
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) {
    startBtn.style.opacity = '0.5';
    startBtn.style.transform = 'translateY(20px)';
    setTimeout(() => {
      startBtn.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
      startBtn.style.opacity = '1';
      startBtn.style.transform = 'translateY(0)';
    }, 800); // Delay to appear after the title
  }
}

/**
 * Creates a pulse animation effect on an element
 * @param {HTMLElement} element - The element to animate
 */
function pulseAnimation(element) {
  element.classList.add('pulse');
  element.addEventListener('animationend', () => {
    element.classList.remove('pulse');
  }, { once: true });
}

/**
 * Animates the transition between screens
 * @param {string} fromScreenId - ID of the current screen
 * @param {string} toScreenId - ID of the screen to show
 */
export function animateScreenTransition(fromScreenId, toScreenId) {
  console.log(`Direct transition to: ${toScreenId}`);
  
  // Get target screen element
  const targetScreen = document.getElementById(toScreenId);
  if (!targetScreen) {
    console.error(`Target screen ${toScreenId} not found`);
    return;
  }
  
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.style.display = 'none';
    screen.classList.remove('active');
  });
  
  // Show and activate target screen
  targetScreen.style.display = 'flex';
  targetScreen.classList.add('active');
  
  // Add a log message to help with debugging
  console.log(`Screen ${toScreenId} should now be visible with display: ${targetScreen.style.display} and classList: ${targetScreen.classList}`);
}

// Export animation functions for use in other modules
export { animateStartScreen, pulseAnimation };

// Card Animation Module
// Handles all card-related animations for consistent visual feedback

/**
 * Performs a card draw animation from a deck to a display position
 * @param {string} deckType - Type of deck (end_of_turn, special_event, etc.)
 * @param {Object} sourcePos - Starting position {x, y} of the animation
 * @param {Object} targetPos - Target position {x, y} for the card
 * @param {Function} onComplete - Callback when animation completes
 */
export function animateCardDrawFromDeck(deckType, sourcePos, targetPos, onComplete) {
    // Get the color based on the deck type
    const color = getDeckColor(deckType);
    
    // Create a temporary card element for the animation
    const tempCard = document.createElement('div');
    tempCard.className = 'card-animation';
    tempCard.style.background = color;
    tempCard.style.position = 'absolute';
    tempCard.style.width = '80px';
    tempCard.style.height = '120px';
    tempCard.style.borderRadius = '8px';
    tempCard.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    tempCard.style.left = `${sourcePos.x}px`;
    tempCard.style.top = `${sourcePos.y}px`;
    tempCard.style.transform = 'scale(0.8)';
    tempCard.style.opacity = '0';
    tempCard.style.zIndex = '1000';
    
    document.body.appendChild(tempCard);
    
    // Fade in
    setTimeout(() => {
        tempCard.style.transition = 'opacity 0.3s ease-out';
        tempCard.style.opacity = '1';
        
        // Move to target position
        setTimeout(() => {
            tempCard.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            tempCard.style.left = `${targetPos.x}px`;
            tempCard.style.top = `${targetPos.y}px`;
            tempCard.style.transform = 'scale(1)';
            
            // Remove the element after animation
            setTimeout(() => {
                tempCard.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(tempCard);
                    if (onComplete && typeof onComplete === 'function') {
                        onComplete();
                    }
                }, 300);
            }, 500);
        }, 300);
    }, 10);
}

/**
 * Animates card being played from hand to board/discard
 * @param {HTMLElement} cardElement - The source card element
 * @param {Object} targetPos - Target position {x, y}
 * @param {Function} onComplete - Callback when animation completes
 */
export function animateCardPlay(cardElement, targetPos, onComplete) {
    if (!cardElement) {
        if (onComplete) onComplete();
        return;
    }
    
    // Clone the card for animation
    const cardRect = cardElement.getBoundingClientRect();
    const clone = cardElement.cloneNode(true);
    
    // Set clone styles
    clone.style.position = 'fixed';
    clone.style.left = `${cardRect.left}px`;
    clone.style.top = `${cardRect.top}px`;
    clone.style.width = `${cardRect.width}px`;
    clone.style.height = `${cardRect.height}px`;
    clone.style.zIndex = '1000';
    clone.style.transition = 'all 0.4s ease-out';
    clone.style.pointerEvents = 'none';
    
    // Add to document
    document.body.appendChild(clone);
    
    // Force reflow
    void clone.offsetWidth;
    
    // Set destination styles
    clone.style.left = `${targetPos.x}px`;
    clone.style.top = `${targetPos.y}px`;
    clone.style.transform = 'scale(0.5) rotate(10deg)';
    clone.style.opacity = '0.7';
    
    // Listen for transition end
    clone.addEventListener('transitionend', function() {
        document.body.removeChild(clone);
        if (onComplete) onComplete();
    }, {once: true});
}

/**
 * Animates a card flip to reveal content
 * @param {HTMLElement} cardElement - Card element to animate
 * @param {Function} onRevealed - Callback at mid-flip to update content
 * @param {Function} onComplete - Callback when animation completes
 */
export function animateCardFlip(cardElement, onRevealed, onComplete) {
    if (!cardElement) {
        if (onComplete) onComplete();
        return;
    }
    
    // Add flip animation class
    cardElement.classList.add('card-flip-animation');
    
    // Handle the halfway point to change content
    setTimeout(() => {
        if (onRevealed) onRevealed();
    }, 150); // Half of the animation duration
    
    // Handle animation completion
    setTimeout(() => {
        cardElement.classList.remove('card-flip-animation');
        if (onComplete) onComplete();
    }, 300); // Full animation duration
}

/**
 * Shows a visual effect for card being discarded
 * @param {HTMLElement} cardElement - Card to discard
 * @param {Function} onComplete - Callback when animation completes
 */
export function animateCardDiscard(cardElement, onComplete) {
    if (!cardElement) {
        if (onComplete) onComplete();
        return;
    }
    
    // Add discard animation class
    cardElement.classList.add('card-discard-animation');
    
    // Listen for animation end
    cardElement.addEventListener('animationend', function() {
        cardElement.classList.remove('card-discard-animation');
        if (onComplete) onComplete();
    }, {once: true});
}

/**
 * Get appropriate color for deck type
 * @param {string} deckType - Type of deck
 * @returns {string} - CSS color value
 */
function getDeckColor(deckType) {
    const colors = {
        end_of_turn: '#FFD700',
        special_event: '#4CAF50',
        expansion: '#9C54DE',  // Purple
        resistance: '#1B3DE5', // Blue
        reckoning: '#00FFFF',  // Cyan
        legacy: '#FF66FF'      // Pink
    };
    
    return colors[deckType] || '#888888';
}

// Constants for game colors
const PATH_COLORS = {
    PURPLE: '#9C54DE',
    BLUE: '#1B3DE5',
    CYAN: '#00FFFF',
    PINK: '#FF66FF'
};

// Constants for timing
const TIMING = {
    CPU_CARD_DISPLAY: 4000,
    CPU_DECK_FLASH: 4000,
    HUMAN_CARD_DISPLAY: 0, // Indefinite until user closes
    HUMAN_DECK_FLASH: 0, // Indefinite until user clicks
    TOKEN_PAUSE: 1000,
    TOKEN_ENLARGE: 1.25 // 25% enlargement
}; 