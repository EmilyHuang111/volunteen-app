// Show challenges section and load the challenges
function showChallenges() {
  hideAllSections(); // Hide all other sections on the page
  document.getElementById('challengesSection').classList.remove('hidden'); // Display challenges section
  loadChallenges(); // Load challenges for the current month
 // updateWeekDisplay(); // Optional: Uncomment to display week number
}

// Get current week number
function getWeekNumber() {
  const now = new Date(); // Get the current date
  const start = new Date(now.getFullYear(), 0, 1); // Get the first day of the current year
  const diff = now - start; // Get the difference between now and the first day of the year
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7); // Calculate the current week number
}

// Get the current month in the format 'YYYY-MM'
function getCurrentMonthKey() {
  const now = new Date(); // Get the current date
  const year = now.getFullYear(); // Get the current year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Get the current month and format it to 2 digits
  return `${year}-${month}`; // Return the formatted month key
}

// Generate new volunteering challenges for the current month
async function generateNewChallenges() {
  const monthKey = getCurrentMonthKey(); // Get the current month key

  // Build the prompt asking for 5 creative volunteering challenges
  const prompt = `Generate 5 creative volunteering challenges focused on community service, environmental protection, and education.
For each challenge include:
1. A catchy title
2. A short description (50-70 words)
3. Estimated time commitment
4. Difficulty level (Easy/Medium/Hard)
5. Potential impact metric

Format your answer as a JSON array where each element is an object with the keys: title, description, time, difficulty, impact.`;

  // Define the system message to guide the assistant
  const systemMessage = "Generate volunteering challenges";

  // Backend API endpoint to generate challenges
  const apiUrl = "/api/generate-chatbot-response"; // API URL for production

  try {
    // Call the backend API to generate challenges
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

    if (!response.ok) { // Check if the response is okay
      const errData = await response.json();
      console.error("Error from backend:", errData.error); // Log the error
      throw new Error("Backend error: " + errData.error); // Throw an error
    }

    // Extract challenges from the response
    const data = await response.json();
    const content = data.response.trim();

    // Extract the challenges from the response text (JSON format)
    const match = content.match(/\[.*\]/s); // Match the JSON array in the response
    if (!match) {
      throw new Error("Failed to parse challenges JSON from response: " + content); // Handle JSON parsing failure
    }
    let challenges = JSON.parse(match[0]); // Parse the challenges array

    // Limit the challenges to 5 if more are returned
    if (challenges.length > 5) {
      challenges = challenges.slice(0, 5); // Limit to 5 challenges
    }

    // Save the generated challenges to Firebase Realtime Database under the current month's key
    await database.ref(`monthlyChallenges/${monthKey}`).set({
      generatedAt: Date.now(),
      challenges: challenges
    });

    // Display the generated challenges on the page
    displayChallenges(challenges);
  } catch (error) {
    console.error("Error generating challenges:", error); // Log the error
    alert("Error generating challenges. Please try again."); // Display error message
  }
}

// Load challenges for the current month
async function loadChallenges() {
  const monthKey = getCurrentMonthKey(); // Get the current month key
  const snapshot = await database.ref(`monthlyChallenges/${monthKey}`).once('value'); // Get challenges data from Firebase

  if (snapshot.exists()) { // If challenges already exist for this month
    displayChallenges(snapshot.val().challenges); // Display the existing challenges
  } else {
    // If no challenges exist for this month, generate new ones automatically
    await generateNewChallenges();
  }
}

// Display the list of challenges on the page
function displayChallenges(challenges) {
  const container = document.getElementById('challengesContainer'); // Get the container to display the challenges
  container.innerHTML = challenges.map(challenge => `
    <div class="challenge-card">
      <h3>${challenge.title}</h3> <!-- Display challenge title -->
      <p>${challenge.description}</p> <!-- Display challenge description -->
      <div class="challenge-meta">
        <span>⏱️${challenge.time} |</span> <!-- Display estimated time -->
        <span>⚡${challenge.difficulty}</span> <!-- Display difficulty level -->
      </div>
    </div>
  `).join(''); // Map through the challenges and generate HTML for each
}
