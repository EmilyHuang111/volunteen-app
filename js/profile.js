/*****
 * Profile Logic
 *****/

// Function to update the medal emoji and text based on volunteer hours
function updateMedalEmoji(hours) {
  const medalElement = document.getElementById('medalEmoji'); // Get the medal emoji element
  const medalText = document.getElementById('medalText'); // Get the medal text element
  let emoji = '';
  let words = '';
  
  // Assign appropriate emoji and text based on the number of hours
  if (hours >= 1000) {
    emoji = '🏆';
    words = '1000+ Hours!';
  } else if (hours >= 500) {
    emoji = '🥇';
    words = '500+ Hours!';
  } else if (hours >= 250) {
    emoji = '🥈';
    words = '250+ Hours!';
  } else if (hours >= 100) {
    emoji = '🥉';
    words = '100+ Hours!';
  } else if (hours >= 50) {
    emoji = '🎉';
    words = '50+ Hours!';
  } else if (hours >= 25) {
    emoji = '🦄';
    words = '25+ Hours!';
  } else if (hours >= 10) {
    emoji = '😎';
    words = '10+ Hours!';
  } else if (hours >= 5) {
    emoji = '👍';
    words = '5+ Hours!';
  } else {
    emoji = '';
    words = 'N/A'; // No emoji if the hours are below 5
  }

  // Update the HTML elements with the emoji and words
  if (medalElement) medalElement.textContent = emoji;
  if (medalText) medalText.textContent = words;
}

// Function to update the user's profile in the database
function updateUserProfile() {
  const user = auth.currentUser; // Get the current logged-in user
  if (!user) {
    alert("No user logged in. Cannot update profile."); // Alert if no user is logged in
    return;
  }

  const uid = user.uid; // Get the user ID
  const description = document.getElementById('profileDescription').value.trim(); // Get description input
  const organization = document.getElementById('profileOrg').value.trim(); // Get organization input
  const photoFile = document.getElementById('profilePhotoInput').files[0]; // Get selected profile photo file

  // If no new photo file is selected, just update the description and organization
  if (!photoFile) {
    database.ref('users/' + uid).update({
      description: description,
      organization: organization
    })
      .then(() => {
        alert("Profile updated (no new photo)."); // Success message
        loadUserProfile(); // Reload user profile
      })
      .catch((error) => {
        console.error("Error updating profile:", error); // Log error if update fails
        alert(error.message); // Alert the user of the error
      });
  } else {
    // If new photo is selected, upload it to Firebase Storage
    const storageRef = storage.ref('profile_photos/' + uid + '/' + photoFile.name);
    storageRef.put(photoFile)
      .then((snap) => snap.ref.getDownloadURL()) // Get the download URL of the uploaded photo
      .then((downloadURL) => {
        return database.ref('users/' + uid).update({
          photoURL: downloadURL, // Update the profile photo URL in the database
          description: description, // Update the description
          organization: organization // Update the organization
        });
      })
      .then(() => {
        alert("Profile updated successfully with new photo."); // Success message
        loadUserProfile(); // Reload user profile
      })
      .catch((error) => {
        console.error("Error uploading photo or updating profile:", error); // Log error if upload or update fails
        alert(error.message); // Alert the user of the error
      });
  }
}

// Event listener to display the selected file name when a photo is selected for the profile
const fileInput = document.getElementById('profilePhotoInput');
const fileLabel = document.querySelector('.custom-file-label'); // Get the file label element

// Update the label text when a file is selected
fileInput.addEventListener('change', function() {
  if (fileInput.files.length > 0) {
    fileLabel.textContent = fileInput.files[0].name; // Display the selected file name
  } else {
    fileLabel.textContent = 'Choose Photo'; // Reset label text if no file is selected
  }
});

// Function to save the profile photo (update or reset to default)
function saveProfilePhoto() {
  const user = auth.currentUser; // Get the current logged-in user
  if (!user) {
    alert("You must be logged in to update your photo."); // Alert if no user is logged in
    return;
  }

  const photoInput = document.getElementById('profilePhotoInput'); // Get the photo input element

  // If no new file is selected, set the default profile photo
  if (!photoInput.files || !photoInput.files[0]) {
    database.ref('users/' + user.uid).update({
      photoURL: "images/default-profile.png" // Set the default profile photo URL
    })
    .then(() => {
      document.getElementById('profilePhoto').src = "images/default-profile.png"; // Update the profile photo UI
      alert("No photo uploaded. Default profile photo has been set."); // Alert that default photo is set
    })
    .catch((error) => {
      console.error("Error setting default profile photo:", error); // Log any error during the process
      alert("Error setting default profile photo: " + error.message); // Alert the user of the error
    });
    return;
  }

  const photoFile = photoInput.files[0]; // Get the selected photo file

  // Retrieve the current user profile from the database
  database.ref('users/' + user.uid).once('value')
    .then(snapshot => {
      const data = snapshot.val();
      // If the user already has a non-default photo, delete the old photo from Firebase Storage
      if (data && data.photoURL && !data.photoURL.includes("default-profile.png")) {
        const oldPhotoURL = data.photoURL;
        return storage.refFromURL(oldPhotoURL).delete().catch(err => {
          console.warn("Failed to delete old profile photo:", err); // Warn if deletion fails
          return Promise.resolve(); // Continue even if deletion fails
        });
      }
    })
    .then(() => {
      // Upload the new profile photo
      const storageRef = storage.ref('profile_photos/' + user.uid + '/' + photoFile.name);
      return storageRef.put(photoFile); // Upload the photo file to Firebase Storage
    })
    .then((snap) => snap.ref.getDownloadURL()) // Get the download URL of the uploaded photo
    .then((downloadURL) => {
      // Update the user profile with the new photo URL
      return database.ref('users/' + user.uid).update({
        photoURL: downloadURL // Set the new photo URL in the database
      }).then(() => downloadURL);
    })
    .then((downloadURL) => {
      document.getElementById('profilePhoto').src = downloadURL; // Update the UI with the new profile photo
      alert("Profile photo updated successfully!"); // Success message
    })
    .catch((error) => {
      console.error("Error updating profile photo:", error); // Log any error during the process
      alert("Error updating profile photo: " + error.message); // Alert the user of the error
    });

  // After saving, reset the file input and label text
  fileInput.value = ""; // Reset the file input
  fileLabel.textContent = 'Choose Photo'; // Reset the label text
}
