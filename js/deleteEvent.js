/*****
 * Delete Event
 *****/

// Function to delete an event created by the logged-in user
function deleteMyPlanEvent(eventKey) {
  const user = auth.currentUser;  // Get the current logged-in user
  if (!user) {
    alert("You must be logged in to delete an event.");  // Alert if the user is not logged in
    showLogin();  // Show login screen if user is not logged in
    return;
  }
  const eventRef = database.ref(`events/${eventKey}`);  // Reference to the specific event in the database
  // Fetch the event to confirm that the current user is the organizer of the event
  eventRef.once('value')
    .then(snapshot => {
      if (!snapshot.exists()) throw "NotFound";  // If the event doesn't exist, throw an error
      const ev = snapshot.val();
      if (ev.userId !== user.uid) throw "Unauthorized";  // If the current user is not the event organizer, throw "Unauthorized"
      return ev;
    })
    .then((ev) => {
      // Remove the event from the database if user is the organizer
      return eventRef.remove().then(() => ev);
    })
    .then((ev) => {
      alert("Event deleted successfully.");  // Alert success if event was successfully deleted
      // NEW: Deduct 300 points from the organizer for canceling their event
      updateUserPoints(user.uid, -300);  // Deduct points using the updateUserPoints function
      loadMyPlans();  // Reload the user's planned events
      loadVolunteerOpportunities();  // Reload volunteer opportunities
    })
    .catch(err => {
      if (err === "NotFound") alert("Event not found.");  // If the event is not found, alert the user
      else if (err === "Unauthorized") alert("You are not authorized to delete this event.");  // If the user is unauthorized, alert them
      else {
        console.error("Error deleting event:", err);  // Log any other errors
        alert("An error occurred while deleting the event.");  // Show a generic error message
      }
    });
}

// Function to remove an event from the user's dashboard (after they join the event)
function removeFromDashboard(eventKey) {
  // Retrieve the current list of hidden event keys (for joined events) from local storage
  let hiddenEvents = JSON.parse(localStorage.getItem('hiddenJoinedEvents')) || [];  // If no hidden events exist, initialize as an empty array
  
  // Add the event key to the hidden events list if it is not already present
  if (!hiddenEvents.includes(eventKey)) {
    hiddenEvents.push(eventKey);  // Add the event key to the array
    localStorage.setItem('hiddenJoinedEvents', JSON.stringify(hiddenEvents));  // Save the updated list in local storage
  }
  
  // Optionally remove the event element from the dashboard UI
  // (Assuming the event element has a data attribute with the event key)
  const eventElement = document.querySelector(`[data-event-key="${eventKey}"]`);  // Find the event element by its data attribute
  if (eventElement) {
    eventElement.remove();  // Remove the event element from the DOM
  }
  
  alert("Event removed from your dashboard.");  // Alert the user that the event was removed from the dashboard
}
