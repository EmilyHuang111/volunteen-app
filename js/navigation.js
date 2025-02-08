/*****
 * Navigation Functions
 *****/

// Function to toggle the navigation menu on mobile (responsive view)
function myMenuFunction() {
  const nav = document.getElementById("navMenu"); // Get the navigation menu element
  if (nav.className === "nav-menu") {
    nav.className += " responsive"; // Add "responsive" class for mobile view
  } else {
    nav.className = "nav-menu"; // Revert back to normal navigation menu for desktop
  }
}

// Function to hide all sections in the application
function hideAllSections() {
  const sections = [
    'homeSection',
    'chatSection',
    'impactSection',
    'profileSection',
    'volunteerSection',
    'organizeSection',
    'myPlansSection',
    'login',
    'register',
    'forgotPasswordForm',
    'eventModal',
    'participantsModal',
    'editEventModal',
    'joinEventModal',
    'impactResultsSection',
    'communitySection',
    'fundraisingSection',
    'leaderboardSection', 
    'volunteerSection', 
    'recommendationsSection',
    'deleteConfirmationModal',
    'challengesSection',
    'aboutUsSection',
    'missionSection',
    'volunteerMapSection'
  ]; // List of section IDs to hide
  sections.forEach(id => {
    const s = document.getElementById(id); // Get each section by its ID
    if (s) s.classList.add('hidden'); // Add the 'hidden' class to hide the section
  });
}

// Function to remove the active class from all navigation links
function removeActiveLink() {
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active')); // Loop through all nav links and remove 'active' class
}

// Function to show the home section
function showHome() {
  hideAllSections(); // Hide all sections first
  document.getElementById('homeSection').classList.remove('hidden'); // Show the home section
  removeActiveLink(); // Remove the active class from any nav links
  document.getElementById('homeLink').classList.add('active'); // Add the active class to the home link
}

// Function to show the chat section
function showChat() {
  hideAllSections(); // Hide all sections first
  document.getElementById('chatSection').classList.remove('hidden'); // Show the chat section
  removeActiveLink(); // Remove the active class from any nav links
}

// Function to show the volunteer section
function showVolunteer() {
  hideAllSections(); // Hide all sections first
  document.getElementById('volunteerSection').classList.remove('hidden'); // Show the volunteer section
  removeActiveLink(); // Remove the active class from any nav links
  loadVolunteerOpportunities(); // Load volunteer opportunities
}

// Function to show the organize section
function showOrganize() {
  hideAllSections(); // Hide all sections first
  document.getElementById('organizeSection').classList.remove('hidden'); // Show the organize section
  removeActiveLink(); // Remove the active class from any nav links
}

// Function to show the user's plans (organized and joined events)
function showMyPlans() {
  hideAllSections(); // Hide all sections first
  document.getElementById('myPlansSection').classList.remove('hidden'); // Show the my plans section
  removeActiveLink(); // Remove the active class from any nav links
  loadMyPlans(); // Load the user's plans
}

// Function to show the user's profile section
function showProfile() {
  hideAllSections(); // Hide all sections first
  document.getElementById('profileSection').classList.remove('hidden'); // Show the profile section
  removeActiveLink(); // Remove the active class from any nav links
  loadUserProfile(); // Load the user's profile data
}

// Function to show the login form
function login() {
  hideAllSections(); // Hide all sections first
  const loginForm = document.getElementById('login'); // Get the login form
  if (loginForm) loginForm.classList.remove('hidden'); // Show the login form
  removeActiveLink(); // Remove the active class from any nav links
}

// Function to show the registration form
function register() {
  hideAllSections(); // Hide all sections first
  const registerForm = document.getElementById('register'); // Get the registration form
  if (registerForm) registerForm.classList.remove('hidden'); // Show the registration form
  removeActiveLink(); // Remove the active class from any nav links
}

// Function to show the forgot password form
function showForgotPassword() {
  hideAllSections(); // Hide all sections first
  const forgotForm = document.getElementById('forgotPasswordForm'); // Get the forgot password form
  if (forgotForm) forgotForm.classList.remove('hidden'); // Show the forgot password form
}


// Function to show the "About Us" section
function showAboutUs() {
  hideAllSections(); // Hide all sections first
  document.getElementById('aboutUsSection').classList.remove('hidden'); // Show the About Us section
  removeActiveLink(); // Optional: remove active class from nav links
}

// Function to show the "Mission" section
function showMission() {
  hideAllSections(); // Hide all sections first
  document.getElementById('missionSection').classList.remove('hidden'); // Show the Mission section
  removeActiveLink(); // Optional: remove active class from nav links
}

// Function to show the "News" section
function showNews() {
  // Hide all other sections
  hideAllSections();
  
  // Show the #newsSection
  const newsSection = document.getElementById('newsSection');
  if (newsSection) {
    newsSection.classList.remove('hidden'); // Show the news section
  }

  removeActiveLink(); // Remove active class from nav links
  // Optionally, if you have a News nav link, add an active class to that link
  // document.querySelector('#newsNav').classList.add('active');
}
