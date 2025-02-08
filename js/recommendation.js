/*****
 * Get Directions to an Event
 *****/
function getDirections(eventKey) {
  // Find the event by its key from the global allEvents array.
  const event = allEvents.find(ev => ev._key === eventKey);
  if (!event) {
    alert("Event not found."); // Alert if event is not found
    return;
  }
  
  // Ensure the volunteer map section is visible.
  showVolunteerMap();
  
  // Verify that we have coordinate data for the event.
  if (typeof event.latitude !== 'number' || typeof event.longitude !== 'number') {
    alert("Event coordinates are not available. Please check the event location.");
    return;
  }
  
  // Get the user's current location using geolocation API.
  getUserLocation().then(userLoc => {
    if (!userLoc) {
      alert("Your current location is not available.");
      return;
    }
    
    // Create a DirectionsService instance to handle the directions request.
    const directionsService = new google.maps.DirectionsService();
    // Create a DirectionsRenderer instance to display the directions on the map.
    const directionsRenderer = new google.maps.DirectionsRenderer();
    
    // Set the renderer to display on the volunteer map (assumes volunteerMap is a global variable).
    directionsRenderer.setMap(volunteerMap);
    
    // Create the directions request to calculate the route from the user's location to the event location.
    const request = {
      origin: new google.maps.LatLng(userLoc.latitude, userLoc.longitude), // User's current location
      destination: new google.maps.LatLng(event.latitude, event.longitude), // Event's location
      travelMode: google.maps.TravelMode.DRIVING  // You can change this to WALKING, BICYCLING, etc.
    };
    
    // Request the route from Google Maps API.
    directionsService.route(request, function(result, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result); // Render the directions on the map.
        // Extract the travel duration from the first leg of the route.
        const duration = result.routes[0].legs[0].duration.text;
        // Display the estimated travel time.
        alert("Estimated travel time: " + duration);
      } else {
        alert("Directions request failed due to " + status); // Alert if directions request fails.
      }
    });
    
  });
}

/*****
* Recommendations
*****/
function showRecommendations() {
  hideAllSections(); // Hide all sections before showing the recommendations.
  document.getElementById('recommendationsSection').classList.remove('hidden'); // Show recommendations section.
  removeActiveLink(); // Remove the active class from other navigation links.
  generatePersonalizedRecommendations(); // Generate personalized recommendations for the user.
}

/*****
* Generate Personalized Recommendations for the User
*****/
async function generatePersonalizedRecommendations() {
  const user = auth.currentUser; // Get the current logged-in user.
  if (!user) {
    alert("Please log in to see personalized recommendations."); // Alert if no user is logged in.
    showLogin(); // Show the login screen if the user is not logged in.
    return;
  }
  
  // If allEvents is empty, fetch events directly from Firebase.
  if (!allEvents.length) {
    const snapshot = await database.ref('events').once('value');
    allEvents = [];
    snapshot.forEach(childSnap => {
      const data = childSnap.val();
      data._key = childSnap.key;
      allEvents.push(data);
    });
    await geocodeMissingCoordinates(allEvents); // Optionally geocode missing coordinates if required.
  }
  
  // 1. Fetch the user's organized and joined events.
  let userEvents = [];
  try {
    // Fetch events the user organized.
    const organizedSnap = await database.ref('events')
      .orderByChild('userId')
      .equalTo(user.uid)
      .once('value');
    organizedSnap.forEach(child => {
      const ev = child.val();
      ev._key = child.key;
      userEvents.push(ev);
    });
  
    // Fetch events the user joined.
    const joinedSnap = await database.ref('events')
      .orderByChild(`participants/${user.uid}/joinedAt`)
      .startAt(0)
      .once('value');
    joinedSnap.forEach(child => {
      const ev = child.val();
      ev._key = child.key;
      userEvents.push(ev);
    });
  } catch (err) {
    console.error("Error fetching user's events", err); // Log any error when fetching events.
  }
  
  // 2. Determine the user's interests based on event type frequency.
  let typeFrequency = {};
  userEvents.forEach(ev => {
    if (ev.type) {
      typeFrequency[ev.type] = (typeFrequency[ev.type] || 0) + 1;
    }
  });
  
  // 3. Filter candidate events: only upcoming events that the user did not organize or join.
  let candidateEvents = allEvents.filter(ev => {
    if (ev.userId === user.uid) return false; // Exclude events organized by the user.
    if (ev.participants && ev.participants[user.uid]) return false; // Exclude events the user has already joined.
    let eventDate = new Date(ev.date); // Convert event date string to Date object.
    return eventDate >= new Date(); // Only include events that are upcoming.
  });
  
  // 4. Score each candidate event by the frequency of its type.
  candidateEvents.forEach(ev => {
    ev.score = typeFrequency[ev.type] || 0; // Assign a score based on event type frequency.
  });
  
  // 5. Sort candidates by score (and by date as a tiebreaker).
  candidateEvents.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score; // Sort primarily by score.
    return new Date(a.date) - new Date(b.date); // If scores are equal, sort by event date.
  });
  
  // 6. Select the top recommendations (for example, the top 6 events).
  let recommendations = candidateEvents.slice(0, 6);
  
  // 7. Render the recommendations using the same structure as your volunteer boxes.
  const container = document.getElementById('recommendationsContainer');
  container.innerHTML = ""; // Clear the container before rendering new recommendations.
  
  if (recommendations.length === 0) {
    container.innerHTML = "<p>No recommendations available at this time.</p>"; // Alert if no recommendations are available.
    return;
  }
  
  recommendations.forEach(rec => {
    const box = document.createElement('div');
    box.classList.add('volunteer-opportunity-box');
    
    // Determine if the user has already joined the event.
    const userId = user.uid;
    let hasJoined = false;
    if (rec.participants && rec.participants[userId]) {
      hasJoined = true;
    }
    
    // Build the join button HTML based on whether the user has already joined the event.
    let joinButtonHTML = '';
    if (hasJoined) {
      joinButtonHTML = `<span class="already-joined-badge">Already Joined</span>`; // Show "Already Joined" badge.
    } else if (rec.spots > 0) {
      joinButtonHTML = `<button class="join-event-btn" onclick="openJoinEventModal('${rec._key}')">Join Event</button>`; // Show "Join Event" button if spots are available.
    } else {
      joinButtonHTML = `<button class="join-event-btn disabled" disabled>Full</button>`; // Show "Full" button if no spots are available.
    }
    
    // Display distance if available (if rec.distance is calculated).
    let distanceHTML = '';
    if (typeof rec.distance === 'number') {
      distanceHTML = `<p>Distance: ${rec.distance.toFixed(2)} miles</p>`;
    }
    
    // Build the inner HTML to match the volunteer opportunity box template.
    box.innerHTML = `
      <h3>${rec.name || "Untitled Event"}</h3>
      <p>Organization: ${rec.organization || "N/A"}</p>
      <p>Location: ${rec.location || "N/A"}</p>
      <p>Date: ${rec.date || "N/A"}</p>
      <p>Time: ${rec.time || "N/A"}</p>
      <p>Spots Left: ${rec.spots || 0}</p>
      ${distanceHTML}
      ${joinButtonHTML}
      <button class="view-details-btn" onclick="openEventDetails('${rec._key}')">View Details</button>
      <button class="get-directions-btn" onclick="getDirections('${rec._key}')">Get Directions</button>
    `;
    
    container.appendChild(box); // Append the created recommendation box to the container.
  });
}

/*****
* Update User Points Logic
*****/
function updateUserPoints(userId, pointsToAdd) {
  const currentMonth = getCurrentMonthKey(); // Get the current month key for tracking points per month.
  const userRef = database.ref('users/' + userId); // Get reference to the user's data in Firebase.
  userRef.once('value').then(snapshot => {
    let userData = snapshot.val() || {};
    if (userData.pointsMonth !== currentMonth) {
      // Reset points and update the pointsMonth for the new month.
      return userRef.update({ points: 0, pointsMonth: currentMonth });
    }
  }).then(() => {
    // Now update the points in a transaction.
    const pointsRef = database.ref('users/' + userId + '/points');
    pointsRef.transaction(currentPoints => {
      return (currentPoints || 0) + pointsToAdd; // Add the new points to the user's current points.
    });
  }).catch(err => {
    console.error("Error updating points:", err); // Log error if points update fails.
  });
}

/*****
* Get Today Date String
*****/
function getTodayDateString() {
  // 'en-CA' locale returns the date in YYYY-MM-DD format
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York'
  }).format(new Date()); // Return today's date in YYYY-MM-DD format.
}

/*****
* Update Volunteer Streak Logic
*****/
function updateVolunteerStreak(userId) {
  const userRef = database.ref('users/' + userId); // Get reference to the user's data in Firebase.
  const today = getTodayDateString(); // Get today's date.
  
  userRef.once('value').then(snapshot => {
    const userData = snapshot.val() || {}; // Get the user's data.
    const lastLogin = userData.lastLoginDate;
    let streak = userData.volunteerStreak || 0;
    
    // If the user has already logged in today or interacted, do nothing.
    if (lastLogin === today) {
      return;
    }
    
    if (lastLogin) {
      // Calculate yesterday's date.
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      
      if (lastLogin === yesterdayStr) {
        // Increment streak if consecutive.
        streak = streak + 1;
        // Award points for consecutive logins and actions.
        if (streak === 2) {
          updateUserPoints(userId, 50);  // Award 50 points for 2 consecutive days.
        } else if (streak > 2) {
          updateUserPoints(userId, 50);  // Award 50 points for each additional day in a row.
        }
      } else {
        // Reset streak if not consecutive.
        streak = 1;
      }
    } else {
      // First time logging in.
      streak = 1;
    }
    
    // Update the user's last login date and streak in the database.
    return userRef.update({
      lastLoginDate: today,
      volunteerStreak: streak
    });
  })
  .then(() => {
    // After updating, reload the user profile to show the updated streak.
    loadUserProfile();
  })
  .catch(err => {
    console.error("Error updating volunteer streak:", err); // Log error if updating the streak fails.
  });
}
