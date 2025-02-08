/*****
 * Load & Render Volunteer Opportunities
 *****/
let allEvents = []; // Array to store all the events loaded from the database
let userLocation = null; // Variable to store the user's current location
let joinEventKey = null; // For handling the event join process

// Load all volunteer opportunities from the Firebase database.
function loadVolunteerOpportunities() {
  allEvents = []; // Reset the events array before loading new data.
  const eventsRef = database.ref('events'); // Reference to the 'events' node in the database.
  eventsRef.on('value', async (snapshot) => {
    allEvents = []; // Clear the existing events.
    if (snapshot.exists()) {
      // If there are events in the database, iterate over them and add them to the allEvents array.
      snapshot.forEach(childSnap => {
        const data = childSnap.val(); // Get the event data.
        data._key = childSnap.key; // Add the event key to the event data.
        if (!data.createdAt) data.createdAt = 0; // Set default value for createdAt if missing.
        allEvents.push(data); // Push the event to the allEvents array.
      });
    }
    // Optionally, geocode missing coordinates if needed:
    await geocodeMissingCoordinates(allEvents); // Geocode events if coordinates are missing.
    renderVolunteerOpportunities(); // Render the events after loading them.
  }, (error) => {
    console.error("Error loading events:", error); // Log error if data fetching fails.
    renderVolunteerOpportunities(); // Ensure rendering happens even if an error occurs.
  });
}

// Render the volunteer opportunities on the page.
function renderVolunteerOpportunities() {
  const container = document.getElementById('volunteerOpportunitiesContainer'); // Get the container element for the volunteer opportunities.
  if (!container) return; // Exit if container is not found.
  container.innerHTML = ""; // Clear any existing content in the container.

  // Get the current filter values from the form inputs.
  const text = (document.getElementById('volunteerSearch')?.value || "").toLowerCase(); // Search text input
  const type = document.getElementById('volTypeFilter')?.value; // Type filter
  const locationFilter = (document.getElementById('volLocationFilter')?.value || "").toLowerCase(); // Location filter
  const dateFilter = document.getElementById('volDateFilter')?.value; // Date filter
  const timeFilter = (document.getElementById('volTimeFilter')?.value || "").toLowerCase(); // Time filter
  const sortFilter = document.getElementById('volSortFilter')?.value; // Sorting filter

  const user = auth.currentUser; // Get the current user.
  const userId = user ? user.uid : null; // Get the user's ID.

  // Get today's date in 'yyyy-mm-dd' format for date comparison.
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1;
  let dd = today.getDate();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Filter events based on the provided filters (search text, type, location, date, time).
  let filtered = allEvents.filter(op => {
    const name = (op.name || "").toLowerCase();
    const org = (op.organization || "").toLowerCase();
    const loc = (op.location || "").toLowerCase();
    const tm = (op.time || "").toLowerCase();
    const textMatch = (name.includes(text) || org.includes(text) || loc.includes(text) || tm.includes(text));
    const typeMatch = (type === "All") ? true : (op.type === type); // Match event type.
    const locMatch = !locationFilter ? true : loc.includes(locationFilter); // Match location.
    let dateMatch = true;
    if (dateFilter) {
      dateMatch = (op.date === dateFilter); // Match date.
    }
    let tMatch = true;
    if (timeFilter) {
      tMatch = tm.includes(timeFilter); // Match time.
    }
    return textMatch && typeMatch && locMatch && dateMatch && tMatch; // Return true if all conditions are met.
  });

  // Sorting logic based on selected sort filter.
  if (sortFilter === "proximity") {
    if (userLocation) {
      // If the user's location is available, calculate distances for events and sort by proximity.
      filtered.forEach(event => {
        if (typeof event.latitude === 'number' && typeof event.longitude === 'number') {
          event.distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            event.latitude,
            event.longitude
          );
        } else {
          event.distance = 999999; // Set a large number for events without coordinates.
        }
      });
      filtered.sort((a, b) => a.distance - b.distance); // Sort by distance.
    } else {
      // If the user's location is not available, request the user's location.
      getUserLocation().then(location => {
        if (location) {
          userLocation = location; // Save the user's location.
          applyVolFilter(); // Apply the filter again after getting the location.
        } else {
          alert("Location access denied. Cannot sort by proximity.");
        }
      });
      return; // Exit early since we need the user's location to proceed.
    }
  }
  else if (sortFilter === "upcoming") {
    // Filter out past events if sorting by upcoming events.
    filtered = filtered.filter(event => event.date >= todayStr);
  }
  else if (sortFilter === "newest") {
    // Sort events by created date in descending order (newest first).
    filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  // If no events match the filters, display a "No events found" message.
  if (filtered.length === 0) {
    container.innerHTML = "<p>No volunteer opportunities found.</p>";
    return;
  }

  // Render the filtered events.
  filtered.forEach(ev => {
    const box = document.createElement('div');
    box.classList.add('volunteer-opportunity-box'); // Add the appropriate CSS class.

    let hasJoined = false; // Check if the user has already joined the event.
    if (userId && ev.participants && ev.participants[userId]) {
      hasJoined = true;
    }

    let joinButtonHTML = ''; // Initialize the join button HTML.
    if (hasJoined) {
      joinButtonHTML = `<span class="already-joined-badge">Already Joined</span>`; // Show badge if already joined.
    } else if (ev.spots > 0) {
      joinButtonHTML = `<button class="join-event-btn" onclick="openJoinEventModal('${ev._key}')">Join Event</button>`; // Show join button if spots are available.
    } else {
      joinButtonHTML = `<button class="join-event-btn disabled" disabled>Full</button>`; // Show "Full" button if no spots are available.
    }

    let distanceHTML = ''; // If sorting by proximity, show the distance to the event.
    if (sortFilter === "proximity" && typeof ev.distance === 'number') {
      distanceHTML = `<p>Distance: ${ev.distance.toFixed(2)} miles</p>`;
    }

    // Set the event details in the HTML.
    box.innerHTML = `
  <h3>${ev.name || "Untitled Event"}</h3>
  <p>Organization: ${ev.organization || "N/A"}</p>
  <p>Location: ${ev.location || "N/A"}</p>
  <p>Date: ${ev.date || "N/A"}</p>
  <p>Time: ${ev.time || "N/A"}</p>
  <p>Spots Left: ${ev.spots || 0}</p>
  ${distanceHTML}
  ${joinButtonHTML}
  <button class="view-details-btn" onclick="openEventDetails('${ev._key}')">View Details</button>
  <button class="get-directions-btn" onclick="getDirections('${ev._key}')">Get Directions</button>
`;

    container.appendChild(box); // Append the event box to the container.
  });
}

// Function to handle the Enter key press in the search input field.
function checkVolunteerSearchEnter(e) {
  if (e.key === "Enter") {
    e.preventDefault(); // Prevent default action on Enter key press.
    applyVolFilter(); // Apply the filter when Enter is pressed.
  }
}

// Function to apply the volunteer filter.
function applyVolFilter() {
  renderVolunteerOpportunities(); // Re-render the volunteer opportunities based on the filters.
}
