/*****
 * Authentication Logic (Sign Up, Sign In, Forgot Password)
 *****/

// Handle Sign Up button click
const signUpBtn = document.getElementById('signUpBtn');
if (signUpBtn) {
  signUpBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent form submission
    // Get input values from the form
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const remember = document.getElementById('register-check').checked;
    
    // Check if any of the required fields are empty
    if (!firstName || !lastName || !email || !password) {
      alert("Please fill out all fields!");
      return;
    }
    
    // Create a new user with the provided email and password
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        // Save user details to Firebase database
        return database.ref('users/' + user.uid).set({
          firstName: firstName,
          lastName: lastName,
          email: user.email,
          photoURL: "",
          description: "",
          organization: "",
          totalVolunteerHours: 0
        }).then(() => user.sendEmailVerification()); // Send verification email
      })
      .then(() => {
        // If "remember me" is checked, save email to localStorage
        if (remember) {
          localStorage.setItem('volunteenRememberEmail', email);
        }
        // Sign out the user after successful registration
        return auth.signOut();
      })
      .then(() => {
        // Notify user that registration was successful
        alert("Registration successful! A verification email has been sent.");
      })
      .catch((error) => {
        console.error("Error creating user:", error);
        alert(error.message); // Display error message
      });
  });
}

// Handle Sign In button click
const signInBtn = document.getElementById('signInBtn');
if (signInBtn) {
  signInBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent form submission
    // Get input values from the form
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const remember = document.getElementById('login-check').checked;
    
    // Check if email or password is empty
    if (!email || !password) {
      alert("Please enter your email and password!");
      return;
    }
    
    // Sign in the user with provided email and password
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        
        // Check if email is verified
        if (!user.emailVerified) {
          alert("Please verify your email before logging in.");
          return auth.signOut(); // Sign out if email is not verified
        }
        
        // Save email to localStorage if "remember me" is checked
        if (remember) {
          localStorage.setItem('volunteenRememberEmail', email);
        } else {
          localStorage.removeItem('volunteenRememberEmail');
        }
        
        // Hide sign-in/up buttons and show profile/log-out buttons
        document.getElementById("signInNav").style.display = "none";
        document.getElementById("signUpNav").style.display = "none";
        document.getElementById("profileNav").style.display = "inline-block";
        document.getElementById("logoutNav").style.display = "inline-block";
        document.getElementById("myPlansNav").style.display = "inline-block";
        
        // Notify user that login was successful
        alert("Login successful!");
        
        // Redirect to the page the user tried to access before login
        const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
        if (redirectAfterLogin === 'organize') {
          localStorage.removeItem('redirectAfterLogin');
          showOrganize(); // Show organize section
        } else if (redirectAfterLogin === 'volunteer') {
          localStorage.removeItem('redirectAfterLogin');
          showVolunteer(); // Show volunteer section
        } else {
          showProfile(); // Show profile section by default
        }
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        alert(error.message); // Display error message
      });
  });
}

// Monitor authentication state changes
auth.onAuthStateChanged((user) => {
  if (user && user.emailVerified) {
    // User is signed in and email is verified, update navigation buttons
    document.getElementById("signInNav").style.display = "none";
    document.getElementById("signUpNav").style.display = "none";
    document.getElementById("profileNav").style.display = "inline-block";
    document.getElementById("logoutNav").style.display = "inline-block";
    document.getElementById("myPlansNav").style.display = "inline-block";
    
    // Update login streak for the user
    updateLoginStreak(user.uid);
  } else {
    // User is not signed in, show sign-in and sign-up buttons
    document.getElementById("signInNav").style.display = "inline-block";
    document.getElementById("signUpNav").style.display = "inline-block";
    document.getElementById("profileNav").style.display = "none";
    document.getElementById("logoutNav").style.display = "none";
    document.getElementById("myPlansNav").style.display = "none";
  }
});

// Handle Logout
function logout() {
  auth.signOut()
    .then(() => {
      // Update navigation buttons after logout
      document.getElementById("signInNav").style.display = "inline-block";
      document.getElementById("signUpNav").style.display = "inline-block";
      document.getElementById("profileNav").style.display = "none";
      document.getElementById("logoutNav").style.display = "none";
      document.getElementById("myPlansNav").style.display = "none";
      
      // Show home page after logout
      showHome();
      alert("You have been logged out successfully.");
    })
    .catch((error) => {
      console.error("Error logging out:", error);
      alert(error.message); // Display error message
    });
}

