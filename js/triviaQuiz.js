// ================================
// Volunteer Impact Trivia Quiz - Single Card Navigation with Submit Button and Streaks
// ================================

// Global array to store trivia question objects
let triviaQuestions = [];
// Global index of the currently displayed question
let currentTriviaIndex = -1;
// Array to store the text of the last 30 questions (to avoid repeats)
let recentQuestions = [];

// Global streak counter for correct answers in a row
let currentStreak = 0;

// Function to update the streak display (icon and count)
function updateStreakDisplay() {
  const streakCountEl = document.getElementById('streakCount');
  streakCountEl.textContent = currentStreak;
  // Optionally, you can change the icon color or add effects based on the streak
  const streakIconEl = document.getElementById('streakIcon');
  if (currentStreak >= 5) {
    streakIconEl.style.color = "#ffd700"; // gold for high streaks
  } else {
    streakIconEl.style.color = "#fff"; // default white
  }
}

// Function to call the backend API and generate a trivia question.
async function generateTriviaQuestion() {
  // The prompt that instructs the generation of a trivia question.
  const prompt = `
Generate a multiple-choice trivia question about volunteering, social impact, community service, different types of volunteering, community facts, environmental sustainability, or best volunteering practices. Some questions should be like: Which country has the highest volunteer participation rate?
What is the most common type of community service?
How much CO2 does planting one tree absorb annually?
What is the most popular volunteering activity among teenagers?
Make sure to not repeat questions. The questions must be different for at least 30 questions.
Return the result as a JSON object with exactly these keys:
- "question": the trivia question (a string),
- "options": an array of exactly four options (strings),
- "correctAnswer": the exact text of the correct answer (one of the options).
For example:
{"question": "Which country has the highest volunteer participation rate?", "options": ["USA", "Canada", "Sweden", "Australia"], "correctAnswer": "Sweden"}
Only return the JSON, nothing else.
  `;
  
  // The system message that sets the assistant’s behavior.
  const systemMessage = "You are a trivia question generator specializing in volunteering and social impact.";
  
  // URL of the backend endpoint.
  //const apiUrl = "http://localhost:5000/generate-chatbot-response"; //local
  const apiUrl = "/api/generate-chatbot-response"; //production

  const maxAttempts = 5;
  let attempt = 0;
  let questionObj = null;
  
  while (attempt < maxAttempts) {
    try {
      // Call the backend API with the prompt and system message.
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
        console.error("Error from backend:", response.statusText);
        return null;
      }
      
      const data = await response.json();
      // The backend returns an object with a key "response" that contains the generated text.
      let content = data.response.trim();
      
      // Extract the JSON object from the response (in case extra text is included)
      const jsonMatch = content.match(/\{.*\}/s);
      if (!jsonMatch) {
        console.error("Failed to parse trivia question JSON:", content);
        return null;
      }
      questionObj = JSON.parse(jsonMatch[0]);
      
      // Check if this question has been asked recently.
      // (Assumes a global or higher scoped array "recentQuestions" exists.)
      if (recentQuestions.includes(questionObj.question)) {
        attempt++;
        continue; // Try generating another question.
      }
      
      // If accepted, add the question text to recentQuestions (limit list to 30 entries).
      recentQuestions.push(questionObj.question);
      if (recentQuestions.length > 30) {
        recentQuestions.shift();
      }
      
      return questionObj;
    } catch (err) {
      console.error("Error generating trivia question:", err);
      return null;
    }
  }
  
  return questionObj;
}


// Function to render a single trivia question card and return it as a DOM element.
function renderTriviaQuestion(qObj) {
  // Create the main container
  const questionDiv = document.createElement('div');
  questionDiv.classList.add('trivia-question');
  questionDiv.style.background = "rgba(255,255,255,0.1)";
  questionDiv.style.padding = "20px";
  questionDiv.style.marginBottom = "20px";
  questionDiv.style.borderRadius = "8px";
  
  // Create and append the question text.
  const questionText = document.createElement('p');
  questionText.textContent = qObj.question;
  questionText.style.fontSize = "1.2rem";
  questionText.style.fontWeight = "600";
  questionDiv.appendChild(questionText);
  
  // Container for answer options.
  const optionsDiv = document.createElement('div');
  optionsDiv.classList.add('trivia-options');
  optionsDiv.style.display = "flex";
  optionsDiv.style.flexDirection = "column";
  optionsDiv.style.gap = "10px";
  
  // Store the user's selected answer in the questionDiv.
  questionDiv.selectedAnswer = null;
  
  // Create a button for each option.
  qObj.options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.classList.add('trivia-option-btn');
    btn.style.padding = "10px";
    btn.style.borderRadius = "5px";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.style.background = "rgba(255,255,255,0.8)";
    btn.style.color = "#000";
    
    btn.onclick = () => {
      // Clear previous selection styling.
      const allBtns = optionsDiv.querySelectorAll('button');
      allBtns.forEach(b => {
        b.style.background = "rgba(255,255,255,0.8)";
        b.style.color = "#000";
      });
      // Mark this button as selected.
      btn.style.background = "#007bff";
      btn.style.color = "#fff";
      // Store selected answer in the parent container.
      questionDiv.selectedAnswer = option;
      // Clear any previous feedback.
      feedbackEl.textContent = "";
    };
    
    optionsDiv.appendChild(btn);
  });
  
  questionDiv.appendChild(optionsDiv);
  
  // Feedback element to show the result after submission.
  const feedbackEl = document.createElement('p');
  feedbackEl.classList.add('trivia-feedback');
  feedbackEl.style.fontSize = "1rem";
  feedbackEl.style.fontWeight = "500";
  feedbackEl.style.marginTop = "10px";
  feedbackEl.style.color = "#ffd700";
  questionDiv.feedbackEl = feedbackEl; // attach for later use
  questionDiv.appendChild(feedbackEl);
  
  // "Submit Answer" button.
  const submitBtn = document.createElement('button');
  submitBtn.textContent = "Submit Answer";
  submitBtn.classList.add('trivia-submit-btn');
  submitBtn.style.marginTop = "10px";
  submitBtn.style.padding = "8px 12px";
  submitBtn.style.border = "none";
  submitBtn.style.borderRadius = "5px";
  submitBtn.style.cursor = "pointer";
  submitBtn.style.background = "rgba(0,123,255,0.8)";
  submitBtn.style.color = "#fff";
  
  submitBtn.onclick = () => {
    if (!questionDiv.selectedAnswer) {
      feedbackEl.textContent = "Please select an answer first.";
      return;
    }
    if (questionDiv.selectedAnswer === qObj.correctAnswer) {
      feedbackEl.textContent = "Correct!";
      // Increment streak counter and update display.
      currentStreak++;
      updateStreakDisplay();
      const user = auth.currentUser;
    if (user) {
      updateUserPoints(user.uid, 10);
    }

    } else {
      feedbackEl.textContent = "Incorrect!";
      // Reset the streak.
      currentStreak = 0;
      updateStreakDisplay();
    }
  };
  
  questionDiv.appendChild(submitBtn);
  
  // "Show Answer" button.
  const showAnswerBtn = document.createElement('button');
  showAnswerBtn.textContent = "Show Answer";
  showAnswerBtn.classList.add('trivia-show-answer-btn');
  showAnswerBtn.style.marginTop = "10px";
  showAnswerBtn.style.padding = "8px 12px";
  showAnswerBtn.style.border = "none";
  showAnswerBtn.style.borderRadius = "5px";
  showAnswerBtn.style.cursor = "pointer";
  showAnswerBtn.style.background = "rgba(0,123,255,0.8)";
  showAnswerBtn.style.color = "#fff";
  
  showAnswerBtn.onclick = () => {
    feedbackEl.textContent = "Answer: " + qObj.correctAnswer;
  };
  
  questionDiv.appendChild(showAnswerBtn);
  
  return questionDiv;
}

// Function to update the display to show the current trivia question.
function displayCurrentTrivia() {
  const container = document.getElementById('triviaQuizContainer');
  container.innerHTML = ""; // Clear any existing content.
  if (currentTriviaIndex >= 0 && currentTriviaIndex < triviaQuestions.length) {
    const qObj = triviaQuestions[currentTriviaIndex];
    const questionCard = renderTriviaQuestion(qObj);
    container.appendChild(questionCard);
  }
  // Update navigation button disabled states.
  document.getElementById('prevTriviaBtn').disabled = currentTriviaIndex <= 0;
}

// Function to load (or navigate to) the next trivia question.
async function loadNextTrivia() {
  // If there is a next question already, just move forward.
  if (currentTriviaIndex < triviaQuestions.length - 1) {
    currentTriviaIndex++;
    displayCurrentTrivia();
  } else {
    // Otherwise, generate a new trivia question.
    const qObj = await generateTriviaQuestion();
    if (qObj) {
      triviaQuestions.push(qObj);
      currentTriviaIndex++;
      displayCurrentTrivia();
    } else {
      alert("Could not load a new trivia question. Please try again later.");
    }
  }
}

// Function to go to the previous trivia question.
function loadPrevTrivia() {
  if (currentTriviaIndex > 0) {
    currentTriviaIndex--;
    displayCurrentTrivia();
  }
}

// Attach event listeners to the navigation buttons.
document.getElementById('nextTriviaBtn').addEventListener('click', loadNextTrivia);
document.getElementById('prevTriviaBtn').addEventListener('click', loadPrevTrivia);

// On page load (or when the quiz section is shown), load the first trivia question.
loadNextTrivia();


// Update the streak display initially.
updateStreakDisplay();
