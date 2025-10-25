/*****
 * Post New Event
 *****/

// Display the selected file name for the event flyer when the file input changes
const flyerInput = document.getElementById('orgEventFlyer');
const flyerLabel = document.querySelector('.custom-flyer-label');

// Event listener for when a file is selected in the flyer input
flyerInput.addEventListener('change', function() {
    if (flyerInput.files.length > 0) {
      flyerLabel.textContent = flyerInput.files[0].name; // Show the file name if a file is selected
    } else {
      flyerLabel.textContent = 'Choose Photo'; // Default text if no file is selected
    }
});

// Function to post a new event
function postNewEvent() {
  const user = auth.currentUser; // Get the current logged-in user
  if (!user) {
    alert("You must be logged in to create events!"); // Alert if user is not logged in
    localStorage.setItem('redirectAfterLogin', 'organize'); // Redirect after login
    showLogin(); // Show the login form
    return;
  }

  // Collect the values from the event creation form
  const nameField = document.getElementById('orgEventName');
  const orgField = document.getElementById('orgEventOrg');
  const descField = document.getElementById('orgEventDesc');
  const locField = document.getElementById('orgEventLocation');
  const dateField = document.getElementById('orgEventDate');
  const timeField = document.getElementById('orgEventTime');
  const typeField = document.getElementById('orgEventType');
  const spotsField = document.getElementById('orgEventSpots');
  const organizerNameField = document.getElementById('orgEventOrganizerName');
  const organizerEmailField = document.getElementById('orgEventOrganizerEmail');
  const organizerPhoneField = document.getElementById('orgEventOrganizerPhone');
  const instructionsField = document.getElementById('orgEventInstructions');
  const ageField = document.getElementById('orgMinAge');
  const flyerField = document.getElementById('orgEventFlyer');

  // Create an event object with the form data
  const eventObj = {
    name: nameField.value.trim(),
    organization: orgField.value.trim(),
    description: descField.value.trim(),
    location: locField.value.trim(),
    date: dateField.value,
    time: timeField.value.trim(),
    type: typeField.value,
    spots: spotsField.value ? parseInt(spotsField.value) : 0,
    organizerName: organizerNameField.value.trim(),
    organizerEmail: organizerEmailField.value.trim(),
    organizerPhone: organizerPhoneField.value.trim(),
    instructions: instructionsField.value.trim() || "",
    age: ageField.value ? parseInt(ageField.value) : 10,
    flyerURL: "",
    userId: user.uid,
    createdAt: firebase.database.ServerValue.TIMESTAMP
  };

  // Validate required fields (Event Name, Date, Time, and Location)
  if (!eventObj.name || !eventObj.date || !eventObj.time || !eventObj.location) {
    alert("Please fill in at least the Event Name, Date, Time, and Location!"); // Alert if required fields are missing
    return;
  }

  // Handle the event flyer upload if a file is selected
  if (flyerField.files && flyerField.files[0]) {
    const flyerFile = flyerField.files[0]; // Get the selected flyer file
    const storageRef = storage.ref('event_flyers/' + user.uid + '/' + flyerFile.name); // Reference to upload location in Firebase Storage
    const uploadTask = storageRef.put(flyerFile); // Upload the file to Firebase

    uploadTask.on('state_changed',
      () => {},
      (error) => {
        console.error("Error uploading flyer:", error); // Log any errors during upload
        alert("Error uploading flyer. Please try again."); // Alert the user if upload fails
      },
      () => {
        uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
          eventObj.flyerURL = downloadURL; // Get the download URL after upload
          database.ref('events').push(eventObj) // Push the event data to Firebase
            .then(() => {
              alert("Your event has been posted successfully!"); // Success message
              updateUserPoints(user.uid, 300); // Update user points for creating an event
              clearOrganizeForm(); // Clear the form
              loadMyPlans(); // Reload user plans
              loadVolunteerOpportunities(); // Reload volunteer opportunities
            })
            .catch(err => {
              console.error("Error creating event:", err); // Log any errors during event creation
              alert(err.message); // Alert the user of the error
            });
        });
      }
    );
  } else {
    // If no flyer file is selected, create event without flyer
    database.ref('events').push(eventObj)
      .then(() => {
        alert("Your event has been posted successfully!"); // Success message
        updateUserPoints(user.uid, 300); // Update user points for creating an event
        clearOrganizeForm(); // Clear the form
        loadMyPlans(); // Reload user plans
        loadVolunteerOpportunities(); // Reload volunteer opportunities
      })
      .catch(err => {
        console.error("Error creating event:", err); // Log any errors during event creation
        alert(err.message); // Alert the user of the error
      });
  }
}

// Function to clear the event creation form after posting the event
function clearOrganizeForm() {
  document.getElementById('orgEventName').value = "";
  document.getElementById('orgEventOrg').value = "";
  document.getElementById('orgEventDesc').value = "";
  document.getElementById('orgEventLocation').value = "";
  document.getElementById('orgEventDate').value = "";
  document.getElementById('orgEventTime').value = "";
  document.getElementById('orgEventType').value = "Environment";
  document.getElementById('orgEventSpots').value = "";
  document.getElementById('orgEventOrganizerName').value = "";
  document.getElementById('orgEventOrganizerEmail').value = "";
  document.getElementById('orgEventOrganizerPhone').value = "";
  document.getElementById('orgEventInstructions').value = "";
  document.getElementById('orgMinAge').value = "";
  document.getElementById('orgEventFlyer').value = ""; // Clear the flyer input
}

