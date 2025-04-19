# Critocracy Game Project Configuration

****Most important thing is to stick to my script as outlined in gameoutline 4.txt. Take no creative liberties Do not add any elements at all that are not already outlined. Your job is to separate the code and give the overall ai a sleek, professional feel. You may introduce animations, color schemes and backend functionality but only as they will enhance gameplay, not to establish new elem3ents. Do not take any creative license everything from the text that is on the cards to the way that the characters interact to the role plays to the resources management everything has all been very carefully planned out do not worry about the style sheet to separate the code and make sure that it's functional professional it has a nice flow to it, Whenever possible Introduce elements to encourage player engagement Calls to action such as clicking the dice or clicking to pick up a card be very careful in your handling of the junction boxes just all of this is really complex with a very close attention to what's going on Very very carefully stick to the code and reference the materials to understand what it is I'm trying to ac There is no functionality set up yet nor do I think there will be ever for certain elements that I was planning to introduce such as sabotages and alliances so just leave those out for the moment. Use highlighting and flashing to hold attention just do whatever you can to make this feel like a whole, complete, well coded game. 
every turn a player will: Roll the dice move their token and draw a end of turn card that will have some sort of effect on their role other things that might happen they might land on a space tagged a draw space in which case they will draw another card from one of the four special event decks of cards in which case they will be drawing 2 cards in at one turn the other thing that they may do is get to a choice point square or a jct point and these are places where the players can switch to a different path so there's two coordinates for a possible next move and they have to decide which path they want to continue on So there will have to be an event listener there and there will have to be a little pop up box asking them which way they would like to go the buttons of the pop up box should match the colors of the Paths so that they can just click the color they want to go to Do not try and deviate from the settings I've already implemented for example do not try and change from a coordinate based movement system I've tried it this is what works best so there is absolutely no leeway for any deviation from my instructions you may add to them if it's things that follow my instructions but we'll make it more Human engaging and player engaging or it will make it run smoother or more efficiently or whatever but you are you introduce no nothing of your own if you're unsure Ask me for clarification and if you find any inconsistencies or discrepancies between what is in the code or what i have written here or in gameoutline4.txt scrap the code its the one thats wrong so on that logic keep everything consistent


## JavaScript Rules

BRFORE ADDING ANY FUNCTION MAKE SURE IT IS NOT IN USE ANYWHERE ELSE. ONCE A FUNCTION HAS BEEN ADDED MAKE SURE IT IS DEFINED AND USED.

1. **ES6 Standards Only**:
   - All JavaScript code must follow ES6 standards
   - Use arrow functions instead of traditional function declarations
   - Use const/let instead of var
   - Use ES6 module syntax (import/export) for dependencies
   - Use template literals for string interpolation
   - Use destructuring assignment, rest/spread operators, and other ES6 features
   - Avoid pre-ES6 practices like IIFE patterns or function hoisting

2. **Dependency Management**:
   - Scripts must be included in the correct order in the HTML
   - Use ES6 import/export syntax for module dependencies
   - Functions should be exported using named exports or default exportsp
   -Do not create circular dependencies
   -Do nor add or remove functions without adding or removing them to or from the entire path


3. **Browser Compatibility**:
   - Code must run directly in the browser without a build step
   - Avoid features requiring transpilation or polyfills
   - Ensure all ES6 features used are supported by modern browsers

## Code Quality Standards

1. **Pre-commit Verification**:
   - All code must be checked for duplicate functions before inclusion
   - Circular dependencies must be identified and eliminated
   - Code redundancies must be refactored before committing
   - All code must be syntax-checked to prevent errors
   - No code shall be committed that breaks existing functionality

2. **Maintenance Guidelines**:
   - When adding functionality, check if similar functions already exist
   - Document dependencies clearly to prevent circular references
   - Prioritize reuse of existing code over creating new implementations
   - Run syntax validation tools before submitting any code changes
   = Do not create anything new norintroduce any new concepts, mechanics, players, resources, tokens, roles ideas etc on your own. 

## File Structure

- `js/` - JavaScript files (ES6 module format)
- `css/` - Stylesheets
- `assets/` - Images, fonts, and other media files

## Browser Support
- This project aims to work on modern browsers without requiring a server
- Files are loaded directly from the filesystem 
- All browsers must support ES6 modules and features 

## CSS Amalgamation Strategy

1. **Base File Priority**:
   - Use css/styles.css as the base file for amalgamation
   - Prioritize and preserve styles from css/styles.css when conflicts occur

2. **Role Selection Screen Styling**:
   - Incorporate background image setup from styles(2).css (`background-image: url('../assets/Critocracy.jpg')`)
   - Use the flexible grid layout for role cards from styles(2).css
   - Include improved hover effects and transitions from styles(2).css
   - Adopt the role card styling with blue background (#7fb2e1) for better contrast

3. **General Styling Priorities**:
   - Maintain responsive layouts from css/styles.css
   - Keep consistent color scheme from css/styles.css
   - Incorporate enhanced animation effects from styles(2).css
   - Preserve accessibility features (text contrast, button sizes)
   - Retain media queries for responsive design

4. **Conflict Resolution Approach**:
   - When styles conflict, prioritize css/styles.css
   - For visual enhancements, take the better option regardless of source
   - For functional CSS (layouts, positioning), keep what best supports the HTML structure
   - Preserve vendor prefixes for better browser compatibility 