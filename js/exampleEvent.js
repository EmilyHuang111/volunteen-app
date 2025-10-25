/*****
 * Populate Example Events (if database is empty)
 *****/

// Example events data if no events are in the database
const exampleEvents = [
  {
    name: "Beach Cleanup",
    organization: "Green Youth",
    description: "Join us to clean up our local beach.", // Description of the event
    location: "123 Ocean View, Santa Monica, CA", // Event location
    date: "2025-06-12", // Event date
    time: "9AM - 12PM", // Event time
    type: "Environment", // Event type/category
    spots: 20, // Number of spots available
    age: 10, // Minimum age requirement
    organizerName: "John Doe", // Name of the event organizer
    organizerEmail: "john@example.com", // Email of the event organizer
    organizerPhone: "555-1234", // Phone number of the event organizer
    instructions: "Bring gloves and sunscreen!", // Additional instructions for attendees
    flyerURL: "", // URL for the flyer (if any)
    userId: "adminplaceholder", // User ID for the organizer (placeholder for now)
    createdAt: Date.now() // Timestamp of when the event was created
  },
  {
    name: "Reading Buddies",
    organization: "Community Library",
    description: "Help young kids learn to read.",
    location: "456 Library Lane, Townsville",
    date: "2025-07-03",
    time: "2PM - 4PM",
    type: "Education",
    spots: 10,
    age: 10,
    organizerName: "Jane Smith",
    organizerEmail: "jane@example.com",
    organizerPhone: "555-5678",
    instructions: "Please arrive 15 min early.",
    flyerURL: "",
    userId: "adminplaceholder",
    createdAt: Date.now()
  }
];

// Function to populate example events in the database if no events are found
function populateExampleEvents() {
  // Access the database and retrieve events that the user has joined
  database.ref('events')
  .orderByChild(`participants/${user.uid}/joinedAt`)  // Query by the user's join date
  .startAt(0)  // Start from the beginning (no filtering by date)
  .once('value')  // Fetch the events once from the database
  .then(snapshot => {
      // Clear the joined events container
      joinedEventsContainer.innerHTML = "";
      
      // Check if there are any events in the snapshot
      if (!snapshot.exists()) {
          joinedEventsContainer.innerHTML = "<p>You have not joined any events yet.";  // Message if no events are found
          return;
      }
      
      // Retrieve hidden joined event keys from local storage (events that the user has removed from the dashboard)
      let hiddenEvents = JSON.parse(localStorage.getItem('hiddenJoinedEvents')) || [];
      
      // Loop through each child snapshot (event) in the database
      snapshot.forEach(childSnap => {
          const event = childSnap.val();  // Get event data
          event._key = childSnap.key;  // Add the event's key
          
          // Skip events that the user has marked as hidden (removed from the dashboard)
          if (hiddenEvents.includes(event._key)) {
              return;
          }
          
          // Add the event element to the joined events container
          joinedEventsContainer.appendChild(createMyPlanEventElement(event, false));
      });
  })
  .catch(err => {
      // Handle error if event data loading fails
      console.error("Error loading joined events:", err);
      joinedEventsContainer.innerHTML = "<p>Error loading your joined events.</p>";  // Show error message
  });
}

