/*****
 * Voluntword Game Logic
 *****/
// Global variables for the Voluntword game
let todayWord = ""; // The word for today (5-letter word)
let currentRow = 0; // The current row where the player is typing
let currentCol = 0; // The current column in the row where the player is typing
let gameOver = false; // Flag to check if the game is over
const wordLength = 5; // Length of the word (5 letters required for this game)
const maxRows = 6; // Maximum number of rows in the grid (6 attempts)

// Initialize the Voluntword game
initializeVoluntwordGame();

// Generate (or retrieve) the daily 5-letter volunteering word
async function generateDailyWord() {
  const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
  const stored = localStorage.getItem('dailyVoluntword'); // Retrieve stored word from localStorage
  const storedDate = localStorage.getItem('dailyVoluntwordDate'); // Retrieve the stored date

  // Check if a word for today already exists in localStorage
  if (stored && storedDate === today) {
    return stored; // If yes, return the stored word
  }

  // Define the prompt and system message for generating the daily word
  const prompt = "Generate a single, common 5-letter word related to volunteering and community service.";
  const systemMessage = "Return only a single 5-letter word.";

  const apiUrl = "/api/generate-chatbot-response"; // Production API endpoint

  try {
    // Call the backend API with the prompt and system message
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userText: prompt,
        systemMessage: systemMessage
      })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      console.error("Error from backend:", errData.error);
      // Fallback word in case of error
      localStorage.setItem('dailyVoluntword', "heart");
      localStorage.setItem('dailyVoluntwordDate', today);
      return "heart";
    }
    
    const data = await response.json();
    let generatedWord = data.response.trim(); // Get the generated word from the response
    
    // Remove any non-letter characters and convert to lowercase
    generatedWord = generatedWord.replace(/[^a-zA-Z]/g, "").toLowerCase();
    
    // Ensure the generated word is exactly 5 letters; if not, use a fallback
    if (generatedWord.length !== 5) {
      generatedWord = "heart"; // Fallback word
    }
    
    // Store the word for today in localStorage
    localStorage.setItem('dailyVoluntword', generatedWord);
    localStorage.setItem('dailyVoluntwordDate', today);
    return generatedWord;
  } catch (err) {
    console.error("Error generating daily word:", err);
    return "heart"; // Fallback word in case of an exception
  }
}

// Initialize the Voluntword game setup
function initializeVoluntwordGame() {
  // Reset game variables
  currentRow = 0;
  currentCol = 0;
  gameOver = false;

  // Clear the grid and status message
  const grid = document.getElementById('voluntwordGrid');
  grid.innerHTML = "";
  
  // Create the grid for the game (5x6 grid)
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < wordLength; c++) {
      const cell = document.createElement('div');
      cell.classList.add('wordle-cell');
      cell.setAttribute('data-row', r);
      cell.setAttribute('data-col', c);
      grid.appendChild(cell);
    }
  }

  // Set the initial game status
  document.getElementById('voluntwordStatus').innerHTML = "<p>Type your guess and press Enter.</p>";

  // Load today's word for the game
  generateDailyWord().then(word => {
    todayWord = word;
    //console.log("Today's word is:", todayWord); // Debugging; remove or comment out later
  });

  // Listen for keyboard events (key down events for guesses)
  document.addEventListener('keydown', handleVoluntwordKeydown);

  // Reveal button (for demo/testing)
  document.getElementById('revealWordBtn').onclick = function() {
    alert("Today's word is: " + todayWord); // Reveal today's word
  };
}

// Handle keydown events during the game (for user input)
function handleVoluntwordKeydown(e) {
  if (gameOver) return; // Do nothing if the game is over

  // Only consider letters A-Z, backspace, and enter
  if (e.key === "Enter") {
    submitVoluntwordGuess(); // Submit the guess
  } else if (e.key === "Backspace") {
    removeLetter(); // Remove a letter from the current guess
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    addLetter(e.key); // Add the letter to the current guess
  }
}

// Add a letter to the current guess
function addLetter(letter) {
  if (currentCol < wordLength) {
    const cell = getCell(currentRow, currentCol);
    cell.textContent = letter.toUpperCase();
    cell.setAttribute('data-letter', letter.toLowerCase());
    currentCol++; // Move to the next column
  }
}

// Remove the last letter from the current guess
function removeLetter() {
  if (currentCol > 0) {
    currentCol--;
    const cell = getCell(currentRow, currentCol);
    cell.textContent = "";
    cell.removeAttribute('data-letter');
  }
}

// Submit the current guess and evaluate it
function submitVoluntwordGuess() {
  if (currentCol < wordLength) {
    showStatus("Not enough letters!"); // Show an error message if the guess is incomplete
    return;
  }

  // Build the guess word from the grid
  let guess = "";
  for (let c = 0; c < wordLength; c++) {
    const cell = getCell(currentRow, c);
    guess += cell.getAttribute('data-letter');
  }
  guess = guess.toLowerCase();

  // Check if the guess is valid (you could add a word list check here)
  if (guess.length !== wordLength) {
    showStatus("Guess must be 5 letters!"); // Show an error message if the guess is not valid
    return;
  }

  // Evaluate the guess and provide feedback
  evaluateGuess(guess);
}

// Update user points if the guess is correct
async function updateWordleResult(correct) {
  const user = auth.currentUser;
  if (!user) return;
  const todayDate = new Date().toISOString().slice(0, 10);

  // Only award points if the guess was correct and points have not been awarded today
  if (correct && !localStorage.getItem('wordleAwarded_' + todayDate)) {
    // Award 25 points
    updateUserPoints(user.uid, 25);
    localStorage.setItem('wordleAwarded_' + todayDate, 'true');
  }
}

// Evaluate the guess against today's word
function evaluateGuess(guess) {
  const statusDiv = document.getElementById('voluntwordStatus');
  // Create arrays to mark which letters are correct
  const answer = todayWord.toLowerCase().split("");
  const guessArr = guess.split("");
  let letterStates = new Array(wordLength).fill("absent");

  // First pass: mark correct positions (green)
  for (let i = 0; i < wordLength; i++) {
    if (guessArr[i] === answer[i]) {
      letterStates[i] = "correct";
      answer[i] = null; // Remove the letter so it is not reused
    }
  }

  // Second pass: mark present letters (yellow)
  for (let i = 0; i < wordLength; i++) {
    if (letterStates[i] === "correct") continue;
    const letterIndex = answer.indexOf(guessArr[i]);
    if (letterIndex !== -1) {
      letterStates[i] = "present";
      answer[letterIndex] = null;
    }
  }

  // Update cell classes with feedback (colors)
  for (let c = 0; c < wordLength; c++) {
    const cell = getCell(currentRow, c);
    cell.classList.add(letterStates[c]);
  }

  // Check if the guess is correct (win)
  if (guess === todayWord.toLowerCase()) {
    showStatus("Congratulations! You guessed correctly.");
    gameOver = true; // End the game
    document.removeEventListener('keydown', handleVoluntwordKeydown); // Stop listening for input
    updateWordleResult(true); // Update the user's score
  } else {
    currentRow++;
    currentCol = 0;
    if (currentRow === maxRows) {
      showStatus(`Game Over! The word was "${todayWord.toUpperCase()}".`); // Show game over message
      gameOver = true; // End the game
      document.removeEventListener('keydown', handleVoluntwordKeydown); // Stop listening for input
    } else {
      showStatus("Try again.");
    }
  }
}

// Get the cell for a specific row and column in the grid
function getCell(row, col) {
  return document.querySelector(`.wordle-cell[data-row="${row}"][data-col="${col}"]`);
}

// Show status message on the screen
function showStatus(message) {
  document.getElementById('voluntwordStatus').innerHTML = `<p>${message}</p>`;
}
