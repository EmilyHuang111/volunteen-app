// --- Google Calendar Sync Integration ---

// Load the Google API client library if not already loaded.
function loadGapiClient() {
    return new Promise((resolve) => {
      if (typeof gapi !== 'undefined') {
        resolve();
      } else {
        const script = document.createElement('script');
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => resolve();
        document.body.appendChild(script);
      }
    });
  }
  

  // Initialize Google Identity Services
  function initializeGoogleAuth() {
    google.accounts.id.initialize({
      client_id: '', // Replace with your Client ID
      callback: handleCredentialResponse
    });
  
    google.accounts.id.renderButton(
      document.getElementById("google-signin-btn"), // The button element where the sign-in button should appear
      { theme: "outline", size: "large" }
    );
  }
  
  
  // Called when the "Sync to Google Calendar" button is clicked.
  async function syncToGoogleCalendar() {
    try {
  
      await loadGapiClient();
      await gapi.load('client', async () => {
        // Initialize the Google API client
        await initGapiClient();
        
        // Proceed with the calendar sync
        await syncUserEventsToCalendar();
       // console.log('codes here')
  
        alert("Your events have been synced to your Google Calendar!");
      });
  
    } catch (err) {
      console.error("Error during calendar sync:", err);
      alert("An error occurred during calendar sync. Please try again.");
    }
  }
  
  // Handle the credential response from Google Sign-In
  function handleCredentialResponse(response) {
    const token = response.credential;
  
    // Use the token to authenticate the user and initialize Google API client
    gapi.auth.setToken({ access_token: token });
  
    // Sync the user's events to the Google Calendar after successful sign-in
    syncToGoogleCalendar();
  }
  
  
  // Retrieve the user’s events from Firebase (both organized and joined)
  async function syncUserEventsToCalendar() {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to sync events.");
      return;
    }
  
    const eventsToSync = [];
  
    // Fetch organized events
    const organizedSnap = await database.ref('events').orderByChild('userId').equalTo(user.uid).once('value');
    if (organizedSnap.exists()) {
      organizedSnap.forEach(child => {
        const ev = child.val();
        ev._key = child.key;
        eventsToSync.push(ev);
      });
    }
  
  
    // Fetch joined events (look for events where the user is in participants)
    const joinedSnap = await database.ref('events')
      .orderByChild(`participants/${user.uid}/joinedAt`)
      .startAt(0)
      .once('value');
    if (joinedSnap.exists()) {
      joinedSnap.forEach(child => {
        const ev = child.val();
        ev._key = child.key;
        // Optionally, check if the event is already in organized events to avoid duplicates.
        if (!eventsToSync.some(e => e._key === ev._key)) {
          eventsToSync.push(ev);
        }
      });
    }
  
    // Loop through each event and add it to Google Calendar.
    for (const firebaseEvent of eventsToSync) {
      await addEventToGoogleCalendar(firebaseEvent);
    }
  }
  // Helper: Add a single event to Google Calendar.
  async function addEventToGoogleCalendar(firebaseEvent) {
    let startDateTime = new Date(firebaseEvent.date + "T09:00:00");
    let endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 hour
  
    const eventResource = {
      summary: firebaseEvent.name || "Untitled Event",
      location: firebaseEvent.location || "",
      description: firebaseEvent.description || "",
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Los_Angeles'  // Adjust as needed
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Los_Angeles'
      },
      reminders: {
        useDefault: true
      }
    };
  
    try {
      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: eventResource
      });
      console.log("Created event:", response.result);
    } catch (err) {
      console.error("Failed to create event on Google Calendar:", err);
    }
  }
  
  // Initialize the Google Sign-In button when the page loads.
  window.onload = function() {
    initializeGoogleAuth();
  }
  
  // Attach the click event to the sync button.
  document.getElementById('syncCalendarBtn').addEventListener('click', syncToGoogleCalendar);
  
