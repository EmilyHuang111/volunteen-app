/*****
 * Edit Event
 *****/

// Function to fetch event details for editing
function editMyPlanEvent(eventKey) {
  // Fetch event data from the database based on eventKey
  database.ref(`events/${eventKey}`).once('value')
    .then(snapshot => {
      if (!snapshot.exists()) {
        alert("Event not found.");  // Alert if event is not found
        return;
      }
      const event = snapshot.val();  // Retrieve event data
      event._key = snapshot.key;  // Add the event key to the event object
      populateEditEventModal(event);  // Populate modal with event data
    })
    .catch(err => {
      console.error("Error fetching event for editing:", err);  // Log error if fetching event fails
      alert("Error fetching event details.");  // Alert user if fetching event fails
    });
}

// Function to populate the edit event modal with event data
function populateEditEventModal(event) {
  // Populate modal fields with existing event details
  document.getElementById('editEventName').value = event.name || "";
  document.getElementById('editEventOrg').value = event.organization || "";
  document.getElementById('editEventDesc').value = event.description || "";
  document.getElementById('editEventLocation').value = event.location || "";
  document.getElementById('editEventDate').value = event.date || "";
  document.getElementById('editEventTime').value = event.time || "";
  document.getElementById('editEventType').value = event.type || "Environment";
  document.getElementById('editEventSpots').value = event.spots || 0;
  document.getElementById('editEventOrganizerName').value = event.organizerName || "";
  document.getElementById('editEventOrganizerEmail').value = event.organizerEmail || "";
  document.getElementById('editEventOrganizerPhone').value = event.organizerPhone || "";
  document.getElementById('editEventInstructions').value = event.instructions || "";
  document.getElementById('editMinAge').value = event.age || 10;
  const form = document.getElementById('editEventForm');
  form.setAttribute('data-event-key', event._key);  // Set event key in the form's data attribute
  document.getElementById('editEventModal').classList.remove('hidden');  // Show the modal
}

// Function to close the edit event modal
function closeEditEventModal() {
  document.getElementById('editEventModal').classList.add('hidden');  // Hide the modal
}

// Add event listener to handle the form submission
const editEventForm = document.getElementById('editEventForm');
if (editEventForm) {
  editEventForm.addEventListener('submit', function(e) {
    e.preventDefault();  // Prevent default form submission
    const eventKey = this.getAttribute('data-event-key');  // Get the event key from the form's data attribute
    if (!eventKey) {
      alert("Event key not found.");  // Alert if event key is missing
      return;
    }
    saveEditedEvent(eventKey);  // Call function to save edited event
  });
}

// Function to save the edited event
function saveEditedEvent(eventKey) {
  const user = auth.currentUser;  // Get the current logged-in user
  if (!user) {
    alert("No user logged in. Cannot edit event.");  // Alert if user is not logged in
    return;
  }
  const eventRef = database.ref(`events/${eventKey}`);  // Reference to the event in the database
  eventRef.once('value').then(snapshot => {
    if (!snapshot.exists()) throw "EventNotFound";  // If event doesn't exist, throw error
    const ev = snapshot.val();
    if (ev.userId !== user.uid) throw "Unauthorized";  // If the user is not the organizer, throw error
  })
  .then(() => {
    // Collect the new event data from the form fields
    const name = document.getElementById('editEventName').value.trim();
    const org = document.getElementById('editEventOrg').value.trim();
    const desc = document.getElementById('editEventDesc').value.trim();
    const loc = document.getElementById('editEventLocation').value.trim();
    const date = document.getElementById('editEventDate').value;
    const time = document.getElementById('editEventTime').value.trim();
    const type = document.getElementById('editEventType').value;
    const spots = parseInt(document.getElementById('editEventSpots').value) || 0;
    const orgName = document.getElementById('editEventOrganizerName').value.trim();
    const orgEmail = document.getElementById('editEventOrganizerEmail').value.trim();
    const orgPhone = document.getElementById('editEventOrganizerPhone').value.trim();
    const age = parseInt(document.getElementById('editMinAge').value) || 0;
    const instructions = document.getElementById('editEventInstructions').value.trim();
    const flyerField = document.getElementById('editEventFlyer');
    if (!name || !date || !time || !loc) {
      alert("Please fill in at least Name, Date, Time, and Location.");  // Alert if required fields are empty
      return;
    }
    const updatedData = {
      name,
      organization: org,
      description: desc,
      location: loc,
      date,
      time,
      type,
      spots,
      organizerName: orgName,
      organizerEmail: orgEmail,
      organizerPhone: orgPhone,
      instructions,
      age
    };

    // Function to update the event data and upload flyer if available
    function doUpdate(flyerURL) {
      if (flyerURL) {
        updatedData.flyerURL = flyerURL;  // Add flyer URL to updated data
      }
      return eventRef.update(updatedData).then(() => {
        alert("Event updated successfully!");  // Alert success
        closeEditEventModal();  // Close the modal
        loadMyPlans();  // Reload the user's planned events
        loadVolunteerOpportunities();  // Reload volunteer opportunities
      });
    }

    // If flyer is uploaded, upload it and get the URL before updating event
    if (flyerField.files && flyerField.files[0]) {
      const flyerFile = flyerField.files[0];  // Get the flyer file
      const storageRef = storage.ref('event_flyers/' + user.uid + '/' + flyerFile.name);  // Create a reference in Firebase storage
      const uploadTask = storageRef.put(flyerFile);  // Upload the file
      
      uploadTask.on('state_changed',
        () => {},
        (error) => {
          console.error("Flyer upload error:", error);  // Log error if upload fails
          alert("Error uploading flyer.");
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            doUpdate(downloadURL);  // Update the event with the flyer URL
          });
        }
      );
    } else {
      doUpdate();  // If no flyer is uploaded, simply update the event
    }
  })
  .catch((err) => {
    // Handle errors during event fetching or updating
    if (err === "EventNotFound") {
      alert("Event does not exist.");
    } else if (err === "Unauthorized") {
      alert("You are not authorized to edit this event.");
    } else {
      console.error("Error editing event:", err);
      alert("An error occurred while editing the event.");
    }
  });
}
