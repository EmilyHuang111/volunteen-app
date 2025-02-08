
/***** Initialize Google Auth Provider *****/
const googleProvider = new firebase.auth.GoogleAuthProvider();

/**** Keep user logged in after refresh ****/
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Auth persistence set to LOCAL");
  })
  .catch((err) => {
    console.error("Error setting persistence:", err);
  });

/*****
 * Google Sign-In & Sign-Up Functions
 *****/
function signInWithGoogle() {
  auth.signInWithPopup(googleProvider)
    .then((result) => {
      const user = result.user;
      // Check if user data exists in the database
      database.ref('users/' + user.uid).once('value')
        .then((snapshot) => {
          if (!snapshot.exists()) {
            // Create a new user entry if none exists
            const profileData = {
              firstName: user.displayName ? user.displayName.split(' ')[0] : "",
              lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : "",
              email: user.email || "",
              photoURL: user.photoURL || "",
              description: "",
              organization: "",
              totalVolunteerHours: 0
            };
            return database.ref('users/' + user.uid).set(profileData);
          }
        })
        .then(() => {
          document.getElementById("signInNav").style.display = "none";
          document.getElementById("signUpNav").style.display = "none";
          document.getElementById("profileNav").style.display = "inline-block";
          document.getElementById("logoutNav").style.display = "inline-block";
          document.getElementById("myPlansNav").style.display = "inline-block";
          alert("Google Sign-In successful!");
          showProfile();
        })
        .catch((error) => {
          console.error("Error during Google Sign-In:", error);
          alert("An error occurred during Google Sign-In. Please try again.");
        });
    })
    .catch((error) => {
      console.error("Google Sign-In error:", error);
      alert("Google Sign-In failed. Please try again.");
    });
}

function signUpWithGoogle() {
  // Google Sign-Up is essentially the same as Sign-In
  signInWithGoogle();
}
