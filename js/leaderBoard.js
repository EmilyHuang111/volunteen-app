/*****
 * Leaderboard Functions
 *****/

// Function to display the leaderboard section and load the leaderboard data
function showLeaderboard() {
  hideAllSections(); // Hide all other sections
  document.getElementById('leaderboardSection').classList.remove('hidden'); // Show the leaderboard section
  loadLeaderboard(); // Load the leaderboard data
}

/*****
* Load Leaderboard Data from Firebase
*****/

// Function to load the leaderboard data from Firebase and display it
function loadLeaderboard() {
  const usersRef = database.ref('users'); // Reference to the 'users' data in Firebase
  const container = document.getElementById('leaderboardContainer'); // The container where the leaderboard items will be displayed

  usersRef.once('value').then(snapshot => {
    const users = []; // Array to hold user data for the leaderboard
    snapshot.forEach(userSnap => {
      const user = userSnap.val(); // Get the user data
      const points = user.points || 0; // Get the user's points (default to 0 if not available)
      if (points > 0) { // Only show users with points
        users.push({
          name: `${user.firstName} ${user.lastName}`, // User's full name
          points: points, // User's points
          photo: user.photoURL || 'images/default-profile.png' // User's profile photo (default if not available)
        });
      }
    });

    // Sort the users array by points in descending order (highest points first)
    users.sort((a, b) => b.points - a.points);

    // Display the leaderboard items by mapping over the sorted users array
    container.innerHTML = users.map((user, index) => `
      <div class="leaderboard-item">
        <span class="rank">${index + 1}</span> <!-- Rank number -->
        <img src="${user.photo}" alt="${user.name}" class="leaderboard-photo"> <!-- User's profile photo -->
        <span class="name">${user.name}</span> <!-- User's full name -->
        <span class="badge">${user.points} points</span> <!-- User's points -->
      </div>
    `).join('');
  }).catch(err => {
    console.error("Error loading leaderboard:", err); // Handle errors during leaderboard data fetching
  });
}

/*****
* Monthly Reset Logic for Leaderboard
*****/

// Function to check if the leaderboard needs to be reset based on the month
function checkMonthlyReset() {
  const lastReset = localStorage.getItem('lastReset'); // Get the last reset month from localStorage
  const currentMonth = new Date().getMonth(); // Get the current month (0-based index)
  
  // If the last reset was not this month, perform a reset
  if (!lastReset || parseInt(lastReset) !== currentMonth) {
    localStorage.setItem('lastReset', currentMonth); // Update the last reset month in localStorage
    resetMonthlyCounts(); // Call the function to reset the counts
  }
}

/*****
* Reset Monthly Event Counts for All Users
*****/

// Function to reset the monthly event completion counts for all users
function resetMonthlyCounts() {
  const usersRef = database.ref('users'); // Reference to the 'users' data in Firebase
  usersRef.once('value').then(snapshot => {
    snapshot.forEach(userSnap => {
      // Remove the 'completedEvents' field from each user to reset their monthly progress
      userSnap.ref.child('completedEvents').remove();
    });
  });
}
