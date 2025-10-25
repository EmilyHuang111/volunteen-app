/*****************************************************************************
 * Chatbot with ChatGPT (Markdown -> HTML) and Command Processing
 *****************************************************************************/

// Function to fetch all data for the chatbot response
async function fetchAllDataForChat() {
  let eventsStr = "";
  let postsStr = "";
  let userProfileStr = "";
  let userOrganized = "";
  let userJoined = "";
  let userLocationStr = "";

  // Fetch events with participants from the Firebase database
  const eventsSnapshot = await database.ref('events').once('value');
  if (eventsSnapshot.exists()) {
    const events = [];
    eventsSnapshot.forEach(child => {
      const ev = child.val();
      let participants = "";
      // Check if participants exist for the event and format them
      if (ev.participants) {
        const arr = Object.values(ev.participants).map(obj => {
          return `${obj.firstName || "Anon"} ${obj.lastName || ""} (${obj.email || "no-email"})`;
        });
        participants = arr.join(", ");
      } else {
        participants = "No participants yet";
      }
      events.push({
        ...ev,
        _participants: participants,
        _key: child.key
      });
    });
    await geocodeMissingCoordinates(events); // Add geocode information to events with missing coordinates
    const userLocation = await getUserLocation(); // Get user's location
    if (userLocation) {
      userLocationStr = `User Location: Latitude ${userLocation.latitude}, Longitude ${userLocation.longitude}`;
      events.forEach(ev => {
        // Calculate the distance between the user and the event if coordinates are available
        if (typeof ev.latitude === 'number' && typeof ev.longitude === 'number') {
          ev.distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            ev.latitude,
            ev.longitude
          );
        } else {
          ev.distance = "Unknown";
        }
      });
    } else {
      userLocationStr = "User Location: Not Available"; // If location is not available
      events.forEach(ev => {
        ev.distance = "Unknown"; // Mark distance as "Unknown"
      });
    }
    // Generate a string containing all events' details
    eventsStr = events.map(e => {
      return `• Event Name: ${e.name || "Untitled"}
 - Organization: ${e.organization || "N/A"}
 - Date: ${e.date || "N/A"}
 - Time: ${e.time || "N/A"}
 - Location: ${e.location || "N/A"}
 - Type: ${e.type || "N/A"}
 - Spots Left: ${e.spots || 0}
 - Description: ${e.description || "N/A"}
 - Instructions: ${e.instructions || "N/A"}
 - Minimum Age: ${e.age || 10}
 - Organizer Name: ${e.organizerName || "N/A"}
 - Organizer Email: ${e.organizerEmail || "N/A"}
 - Organizer Phone: ${e.organizerPhone || "N/A"}
 - Participants: ${e._participants}
 - Distance: ${typeof e.distance === 'number' ? e.distance.toFixed(2) + " miles" : e.distance}
`;
    }).join("\n");
  }

  // Fetch community posts from the Firebase database
  const postsSnapshot = await database.ref('communityPosts').once('value');
  if (postsSnapshot.exists()) {
    const posts = [];
    postsSnapshot.forEach(child => {
      posts.push(child.val());
    });
    // Generate a string containing all posts
    postsStr = posts.map((p, idx) => {
      return `• Post #${idx + 1} by ${p.authorName || "Someone"}: "${p.content}"`
    }).join("\n");
  }

  // Fetch the user profile and events if the user is logged in
  const user = auth.currentUser;
  if (user && user.emailVerified) {
    const uid = user.uid;
    const userSnap = await database.ref('users/' + uid).once('value');
    if (userSnap.exists()) {
      const data = userSnap.val();
      // Create a string representing the user's profile
      userProfileStr = `User Profile:
Name: ${data.firstName || "N/A"} ${data.lastName || ""}
Email: ${data.email || user.email}
Total Hours: ${data.totalVolunteerHours || 0}
Description: ${data.description || ""}
Organization: ${data.organization || ""}`;
      
      // Fetch events organized by the user
      const orgEventsSnap = await database.ref('events').orderByChild('userId').equalTo(uid).once('value');
      if (orgEventsSnap.exists()) {
        const userOrgEv = [];
        orgEventsSnap.forEach(childSnap => {
          userOrgEv.push(childSnap.val().name || "Untitled");
        });
        userOrganized = userOrgEv.join(", ");
      }

      // Fetch events the user has joined
      const joinedSnap = await database.ref('events')
        .orderByChild(`participants/${uid}/joinedAt`)
        .startAt(0)
        .once('value');
      if (joinedSnap.exists()) {
        const userJoinedEv = [];
        joinedSnap.forEach(childSnap => {
          userJoinedEv.push(childSnap.val().name || "Untitled");
        });
        userJoined = userJoinedEv.join(", ");
      }
    }
  }

  // Create a section for user profile information
  let userSection = "";
  if (userProfileStr) {
    userSection = `
======== USER PROFILE & EVENTS =========
${userProfileStr}
Organized Events: ${userOrganized || "None"}
Joined Events: ${userJoined || "None"}
${userLocationStr}
`;
  }

  // Return the chatbot's response with all data (events, posts, user profile)
  return `
You are a helpful volunteering chatbot for the Volunteen website. 
**Important**: If the user asks about anything other than volunteering events, participants, or their user data, you must refuse to answer. 
Only respond if the question is about:
- volunteering events (with name, date, time, location, instructions, organizer, distance, etc.)
- participants
- the user's own profile & hours
- or community posts from the data

======== ALL EVENTS =========
${eventsStr || "No events found."}

======== COMMUNITY POSTS =========
${postsStr || "No community posts found."}

${userSection}
`;
}

// Generate a response from the chatbot based on user input
async function generateChatbotResponseFromOpenAI(userText) {
  // Backend API URL for generating the chatbot response
  const apiUrl = "/api/generate-chatbot-response"; // Production

  // Fetch the dynamic data (dbDataString) for the response
  const dbDataString = await fetchAllDataForChat();

  // Build the complete system message including the dynamic data
  const systemMessage = `You have access to the events, participants, community posts, and the user's data if logged in.
Refuse to answer if the user's question is NOT about volunteering events, participants, or user data.
Otherwise, answer from the data. Use Markdown if needed.

${dbDataString}`;

  try {
    // Send both the user text and the composed system message to the backend
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userText, systemMessage })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from backend:", errorData.error);
      return "Error from backend: " + errorData.error;
    }

    // Return the generated response from the backend
    const data = await response.json();
    return data.response.trim();
  } catch (err) {
    console.error("Error contacting backend:", err);
    return "An error occurred while contacting the backend.";
  }
}

// Check if the Enter key was pressed for chat submission
function checkEnter(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage(); // Send the chat message
  }
}

// Function to send the chat message
async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const userMessage = input.value.trim();
  if (!userMessage) return; // Do nothing if the message is empty
  appendMessage("user", userMessage, false); // Display user message
  input.value = ""; // Clear the input field

  const loadingId = "loading-" + Date.now();
  appendMessage("bot", "Thinking...", false, loadingId); // Display loading message

  // First, check if the message is a command
  const commandResponse = await processChatCommand(userMessage);
  if (commandResponse !== null) {
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) loadingDiv.remove();
    appendMessage("bot", commandResponse); // Display command response
    return;
  }

  // Generate a chatbot response if it's not a command
  const rawResponse = await generateChatbotResponseFromOpenAI(userMessage);
  const formattedHTML = marked.parse(rawResponse); // Convert Markdown to HTML
  const loadingDiv = document.getElementById(loadingId);
  if (loadingDiv) loadingDiv.remove();
  appendMessage("bot", formattedHTML, true); // Display the bot's response
}

  function appendMessage(sender, content, isHTML = false, customId = null) {
    const chatMessages = document.getElementById("chatMessages");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    if (customId) messageDiv.id = customId;
    if (isHTML) {
      messageDiv.innerHTML = content;
    } else {
      messageDiv.textContent = content;
    }
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  /*****
   * 12. Chatbot Command Processing
   *
   * Supported commands:
   *  - "register for event: Event Name"  
   *    or loosely worded variants such as "sign me up", "sign me", "register", "put me in", "add me"
   *
   *  - "organize event:" or "create event:" or "arrange event:" followed by details in the format:
   *      event name, organization, description, location, date, time, type, spots left, organizer name, organizer email, organizer phone, (optional) instructions
   *
   * If the command does not follow the proper colon-separated format, instructions will be returned.
   *****/
  async function processChatCommand(message) {
    message = message.trim(); 
  
    // Registration-related keywords: allow "register", "sign me up", "sign me", "put me in", "add me"
    const registerKeywordsRegex = /\b(register( for event)?|sign me up|sign me|put me in|add me|enroll|sign up|join|subscribe|opt in|enter|list me|record me|apply|commit|submit|volunteer|include me|assign me|log me in|book me|count me in|reserve a spot|reserve|sign on|attach me)\b/i;
    if (registerKeywordsRegex.test(message) && message.indexOf(":") === -1) {
      return "To register for an event, please use the following format:\n\n`register for event: Event Name`\n\nFor example:\n`register for event: Beach Cleanup`";
    }
  
    // Organize-related keywords: allow "organize", "create", "arrange" when followed by the word "event"
    const organizeKeywordsRegex = /\b(organize|create|arrange|structure|plan|set up|establish|coordinate|manage|sort|arrange|initiate|put together)\b/i;
    if (organizeKeywordsRegex.test(message) && message.indexOf(":") === -1) {
      return "To organize an event, please use the following format:\n\n`organize event: event name, organization, description, location, date, time, type, spots left, organizer name, organizer email, organizer phone, (optional) instructions`\n\nFor example:\n`organize event: Beach Cleanup, Green Youth, Clean up the beach, 123 Ocean View, 2025-06-12, 9AM-12PM, Environment, 20, John Doe, john@example.com, 555-1234, Bring gloves and sunscreen`";
    }
  
    // Command: Register for an event (expects the colon format)
    if (message.toLowerCase().includes("register for event")) {
      const parts = message.split(":");
      if (parts.length <= 1 || !parts[1].trim()) {
        return "To register for an event, please use the format:\n`register for event: Event Name`\nFor example:\n`register for event: Beach Cleanup`";
      }
      const eventName = parts[1].trim();
      const event = allEvents.find(ev => ev.name.toLowerCase() === eventName.toLowerCase());
      if (event) {
        if (!auth.currentUser) return "Please log in to register for an event.";
        joinEventKey = event._key;
        // Automatically confirm registration (which now retrieves user profile from Firebase)
        confirmJoinEvent();
        return `You have been registered for event: ${event.name}`;
      } else {
        // If event not found, list similar events
        let similarEvents = allEvents.filter(ev => ev.name.toLowerCase().includes(eventName.toLowerCase()));
        if (similarEvents.length > 0) {
          let eventListStr = `No exact match found for "${eventName}". Did you mean one of these?\n`;
          // Try to get user location to sort similar events by proximity or sort by upcoming date
          if (!userLocation) {
            userLocation = await getUserLocation();
          }
          if (userLocation) {
            similarEvents.forEach(ev => {
              if (typeof ev.latitude === 'number' && typeof ev.longitude === 'number') {
                ev.distance = calculateDistance(userLocation.latitude, userLocation.longitude, ev.latitude, ev.longitude);
              } else {
                ev.distance = Infinity;
              }
            });
            similarEvents.sort((a, b) => a.distance - b.distance);
          } else {
            // Sort by upcoming date if user location is not available
            similarEvents.sort((a, b) => a.date.localeCompare(b.date));
          }
          similarEvents.forEach(ev => {
            eventListStr += `• ${ev.name} (Date: ${ev.date}, Location: ${ev.location}${(ev.distance && ev.distance !== Infinity) ? ", " + ev.distance.toFixed(2) + " miles away" : ""})\n`;
          });
          return eventListStr;
        } else {
          return `No events found matching "${eventName}". Please check the event name and try again.\nTo register for an event, use the format:\n\`register for event: Event Name\``;
        }
      }
    }
  
    // Command: Organize/Create/Arrange an event (expects the colon format)
    if (organizeKeywordsRegex.test(message) && message.indexOf(":") !== -1) {
      const parts = message.split(":");
      if (parts.length <= 1 || !parts[1].trim()) {
        return "To organize an event, please use the format:\n`organize event: event name, organization, description, location, date, time, type, spots left, organizer name, organizer email, organizer phone, (optional) instructions`\nFor example:\n`organize event: Beach Cleanup, Green Youth, Clean up the beach, 123 Ocean View, 2025-06-12, 9AM-12PM, Environment, 20, John Doe, john@example.com, 555-1234, Bring gloves and sunscreen`";
      }
      const details = parts[1].split(",");
      if (details.length < 11) {
        return "Incorrect format for organizing an event. Please provide all required details.\nCorrect format:\n`organize event: event name, organization, description, location, date, time, type, spots left, organizer name, organizer email, organizer phone, (optional) instructions`";
      }
      const eventName = details[0].trim();
      const organization = details[1].trim();
      const description = details[2].trim();
      const location = details[3].trim();
      const date = details[4].trim();
      const time = details[5].trim();
      const type = details[6].trim();
      const spots = parseInt(details[7].trim());
      const organizerName = details[8].trim();
      const organizerEmail = details[9].trim();
      const organizerPhone = details[10].trim();
      const instructions = details.length >= 12 ? details[11].trim() : "";
      const age = details.length >= 13 ? details[12].trim() : 10;
  
      if (!auth.currentUser) return "Please log in to organize an event.";
      const eventObj = {
        name: eventName,
        organization: organization,
        description: description,
        location: location,
        date: date,
        time: time,
        type: type,
        spots: spots,
        organizerName: organizerName,
        organizerEmail: organizerEmail,
        organizerPhone: organizerPhone,
        instructions: instructions,
        age:age,
        flyerURL: "",
        userId: auth.currentUser.uid,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      };
      try {
        await database.ref('events').push(eventObj);
        return `Your event "${eventName}" has been organized successfully!`;
      } catch (err) {
        console.error("Error organizing event:", err);
        return "There was an error organizing your event.";
      }
    }
  
    // No command recognized; return null so the normal ChatGPT reply is generated.
    return null;
  }
  
  