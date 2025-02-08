/*****
 * Load User Profile Data
 *****/
function loadUserProfile() {
  const user = auth.currentUser; // Get the currently logged-in user.
  if (!user) return; // If no user is logged in, exit the function.
  const uid = user.uid; // Get the user's unique ID.
  
  // Fetch the user's data from the Firebase Realtime Database.
  database.ref('users/' + uid).once('value')
    .then(snapshot => {
      if (!snapshot.exists()) return; // If no user data exists, exit the function.
      const data = snapshot.val(); // Get the user data from the snapshot.
      
      // Display the user's email, name, profile photo, description, organization, and volunteer hours.
      document.getElementById('profileEmail').textContent = data.email || user.email;
      document.getElementById('profileName').textContent = (data.firstName || "") + " " + (data.lastName || "");
      document.getElementById('profilePhoto').src = data.photoURL || "images/default-profile.png"; // Default profile photo if none exists.
      document.getElementById('profileDescription').value = data.description || "";
      document.getElementById('profileOrg').value = data.organization || "";
      document.getElementById('profileVolunteerHours').textContent = data.totalVolunteerHours || 0;
      
      // Fetch the login streak for the currently logged-in user.
      document.getElementById('profileStreak').textContent = data.loginStreak || 0;
      
      // Update the user's volunteer hours medal emoji based on their total volunteer hours.
      updateMedalEmoji(data.totalVolunteerHours || 0);
    })
    .catch(error => {
      console.error("Error fetching profile data:", error); // Log any errors that occur during data fetching.
    });
}

/*****
* Handle Auth State Change
*****/
auth.onAuthStateChanged((user) => {
  // If the user is logged in and their email is verified, update the UI to show profile options.
  if (user && user.emailVerified) {
    document.getElementById("signInNav").style.display = "none"; // Hide Sign In link.
    document.getElementById("signUpNav").style.display = "none"; // Hide Sign Up link.
    document.getElementById("profileNav").style.display = "inline-block"; // Show Profile link.
    document.getElementById("logoutNav").style.display = "inline-block"; // Show Logout link.
    document.getElementById("myPlansNav").style.display = "inline-block"; // Show My Plans link.
    
    // Update the login streak for the currently logged-in user.
    updateLoginStreak(user.uid);
  } else {
    // If no user is logged in or email is not verified, hide the profile-related navigation links.
    document.getElementById("signInNav").style.display = "inline-block"; // Show Sign In link.
    document.getElementById("signUpNav").style.display = "inline-block"; // Show Sign Up link.
    document.getElementById("profileNav").style.display = "none"; // Hide Profile link.
    document.getElementById("logoutNav").style.display = "none"; // Hide Logout link.
    document.getElementById("myPlansNav").style.display = "none"; // Hide My Plans link.
  }
});

/*****
* On Window Load (initial setup)
*****/
window.onload = () => {
  // Call necessary functions on window load to initialize various sections.
  // updateWeekDisplay(); // Optionally update the week display (commented out).
  loadChallenges(); // Load challenges.
  checkMonthlyReset(); // Check if monthly reset is needed.
  // populateExampleEvents(); // Optionally populate example events (commented out).
  showHome(); // Show the home section.
  loadVolunteerOpportunities(); // Load volunteer opportunities.
  loadLeaderboard(); // Load leaderboard data.
  loadUserProfile(); // Load the user's profile information.

  // Set up event listener for calculating impact (when the user submits the impact calculation form).
  const calculateImpactForm = document.getElementById('calculateImpactForm');
  if (calculateImpactForm) {
    calculateImpactForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Prevent the default form submission.
      const hours = parseFloat(document.getElementById('impactHoursInput').value); // Get the hours input by the user.
      if (isNaN(hours) || hours <= 0) { // Validate the input.
        alert("Please enter a valid number of hours."); // Show an alert if the input is invalid.
        return;
      }
      calculateImpact(hours); // Call the function to calculate the impact.
    });
  }

  // Set up event listener for adding volunteer hours (when the user submits the form).
  const addVolunteerHoursForm = document.getElementById('addVolunteerHoursFormProfile');
  if (addVolunteerHoursForm) {
    addVolunteerHoursForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Prevent the default form submission.
      const hours = parseFloat(document.getElementById('profileAddHoursInput').value); // Get the hours input by the user.
      if (isNaN(hours) || hours <= 0) { // Validate the input.
        alert("Please enter a valid number of hours."); // Show an alert if the input is invalid.
        return;
      }
      addVolunteerHours(hours); // Call the function to add volunteer hours.
      document.getElementById('profileAddHoursInput').value = ""; // Clear the input field after submission.
    });
  }

  // Set up event listener for creating a new post (when the user submits the post creation form).
  const createPostForm = document.getElementById('createPostForm');
  if (createPostForm) {
    createPostForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Prevent the default form submission.
      const content = document.getElementById('postContent').value.trim(); // Get the content of the post.
      if (!content) { // If no content is provided, show an alert.
        alert("Please enter some content to post.");
        return;
      }
      createNewPost(content); // Call the function to create the new post.
    });
  }
};
