"use strict"
// *****************************************************************************
//
//      Author: Destiny Lewis
//      Course: DGL-213 Applied JavaScript
//      Section: DLU-1
//      Instructor: Bradley Best
//      Last Modified: October 20th 2021
//      floodfill.js
//    
// *****************************************************************************



// *****************************************************************************
// #region Constants and Variables

// Canvas references
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

// UI references
const restartButton = document.querySelector("#restart");
const colorSelectButtons = document.querySelectorAll(".color-select");

// Reference for undo Button.
const undoBtn = document.querySelector("#undo");

// References for score tracking
let scoreTracker = document.querySelector("#score");
let clickTracker = document.querySelector("#clicks");
let changeTracker = document.querySelector("#changes");

// Constants
const CELL_COLORS = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 255, 0], 
    blue: [0, 0, 255]
}
const CELLS_PER_AXIS = 9;
const CELL_WIDTH = canvas.width/CELLS_PER_AXIS;
const CELL_HEIGHT = canvas.height/CELLS_PER_AXIS;

// Game objects
let replacementColor = CELL_COLORS.white;
let grids;
let winGame = false; // Initially set to false, becomes true when player wins the game.

// Score Counters
let Clicks = 0;    // Count how many times a player clicks on a grid.

// #endregion


// *****************************************************************************
// #region Game Logic

function startGame(startingGrid = []) {
    if (Array.isArray(startingGrid)) {
        if (startingGrid.length === 0) {
            startingGrid = initializeGrid();
        }
    } else {
        startingGrid = initializeGrid();
    }
    initializeHistory(startingGrid);
    render(grids[0]);
}

function initializeGrid() {
    const newGrid = [];
    for (let i = 0; i < CELLS_PER_AXIS * CELLS_PER_AXIS; i++) {
        newGrid.push(chooseRandomPropertyFrom(CELL_COLORS));
    }
    return newGrid;
}

function initializeHistory(startingGrid) {
    grids = [];
    grids.push(startingGrid);
}

function rollBackHistory() {
    // Conditional disallows players from undoing a turn from the initial board state.
    if (grids.length > 1) {
        grids = grids.slice(0, grids.length-1);
        // Decrement Counter to revoke a score point on undo.
        Clicks--;
        endTurn();
    }
}

// At the end of each turn (when the player clicks a grid square, or clicks undo) update the player score and render the grid.
// This method reduces the number of times we call "render" - now only called on startGame()
function endTurn() {
    updatePlayerScore();
    render(grids[grids.length-1]);
}

function render(grid) {
    for (let i = 0; i < grid.length; i++) {
        ctx.fillStyle = `rgb(${grid[i][0]}, ${grid[i][1]}, ${grid[i][2]})`;
        ctx.fillRect((i % CELLS_PER_AXIS) * CELL_WIDTH, Math.floor(i / CELLS_PER_AXIS) * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
    }
}

function updatePlayerScore() {
    scoreTracker.innerHTML = Clicks;
    winGameCheck(grids[grids.length-1]);
}

function updateGridAt(mousePositionX, mousePositionY) {
    // "Clicks" tracks the number of times user clicks, increments by 1 for each time the player clicks on a grid.
    Clicks++;                                                                  
    const gridCoordinates = convertCartesiansToGrid(mousePositionX, mousePositionY);
    const newGrid = grids[grids.length-1].slice();                                                                     
    floodFill(newGrid, gridCoordinates, newGrid[gridCoordinates.row * CELLS_PER_AXIS + gridCoordinates.column]);         
    grids.push(newGrid);
    endTurn();    
}

function floodFill(grid, gridCoordinate, colorToChange) { 
    if (arraysAreEqual(colorToChange, replacementColor)) { return } //The current cell is already the selected color
    else if (!arraysAreEqual(grid[gridCoordinate.row * CELLS_PER_AXIS + gridCoordinate.column], colorToChange)) { return }  //The current cell is a different color than the initially clicked-on cell
    else {
        grid[gridCoordinate.row * CELLS_PER_AXIS + gridCoordinate.column] = replacementColor;
        floodFill(grid, {column: Math.max(gridCoordinate.column - 1, 0), row: gridCoordinate.row}, colorToChange);
        floodFill(grid, {column: Math.min(gridCoordinate.column + 1, CELLS_PER_AXIS - 1), row: gridCoordinate.row}, colorToChange);
        floodFill(grid, {column: gridCoordinate.column, row: Math.max(gridCoordinate.row - 1, 0)}, colorToChange);
        floodFill(grid, {column: gridCoordinate.column, row: Math.min(gridCoordinate.row + 1, CELLS_PER_AXIS - 1)}, colorToChange);
    }
    return
}

function restart() {
    // Reset counter to 0 when player restarts the game.
    Clicks = 0;
    winGame = false;
    startGame();
    updatePlayerScore();
}

// Compares the first cell of the grid to all other grid cells to check for a win, a win occurs if all grid cells are equal.
// If the game has been won, restart the game to prevent players from making more moves.
function winGameCheck(grid) {
    let cell = grid[0];
    for (let i = 0; i < grid.length; i++) {
        if(!arraysAreEqual(grid[i], cell)) {
            return;
        }
    }
    alert("You've won with a score of: " + Clicks);
    winGame = true;
    if (winGame === true) {
        restart();
    }
}

// #endregion


// *****************************************************************************
// #region Event Listeners

canvas.addEventListener("mousedown", gridClickHandler);
function gridClickHandler() {
    updateGridAt(event.offsetX, event.offsetY);
}

restartButton.addEventListener("mousedown", restartClickHandler);
function restartClickHandler() {
    restart();
}

// Event listener added onto undo button to call the undo() function on a mousedown event.
undoBtn.addEventListener("mousedown", undoClickHandler); // Add event listener w/click handler.
function undoClickHandler() {
    rollBackHistory();
}

colorSelectButtons.forEach(button => {
    button.addEventListener("mousedown", () => replacementColor = CELL_COLORS[button.name])
});

// #endregion


// *****************************************************************************
// #region Helper Functions

// To convert canvas coordinates to grid coordinates
function convertCartesiansToGrid(xPos, yPos) {
    return {
        column: Math.floor(xPos/CELL_WIDTH),
        row: Math.floor(yPos/CELL_HEIGHT)
    };
}

// To choose a random property from a given object
function chooseRandomPropertyFrom(object) {
    const keys = Object.keys(object);
    return object[keys[ Math.floor(keys.length * Math.random()) ]]; //Truncates to integer
};

// To compare two arrays
function arraysAreEqual(arr1, arr2) {
    if (arr1.length != arr2.length) { return false }
    else {
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] != arr2[i]) {
                return false;
            }
        }
        return true;
    }
}

function equalArray(arr1, arr2) {
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) {
            return false;
        }
    }
}

// #endregion

//Start game
startGame();