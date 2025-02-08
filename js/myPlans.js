/*****
 * My Plans (Organized & Joined Events)
 *****/

// Function to load the user's organized and joined events
function loadMyPlans() {
  const user = auth.currentUser; // Get the current logged-in user
  if (!user) {
    alert("You must be logged in to view your plans."); // Alert if user is not logged in
    showHome(); // Show home if not logged in
    return;
  }

  // Get the containers for organized and joined events
  const organizedEventsContainer = document.getElementById('organizedEventsContainer');
  const joinedEventsContainer = document.getElementById('joinedEventsContainer');
  
  // Set loading message while fetching data
  organizedEventsContainer.innerHTML = "Loading your organized events...";
  joinedEventsContainer.innerHTML = "Loading your joined events...";

  // Fetch and display organized events for the current user
  database.ref('events').orderByChild('userId').equalTo(user.uid).once('value')
    .then(snapshot => {
      organizedEventsContainer.innerHTML = ""; // Clear container
      if (!snapshot.exists()) {
        organizedEventsContainer.innerHTML = "<p>You have not organized any events yet.</p>"; // No events
        return;
      }
      snapshot.forEach(childSnap => {
        const event = childSnap.val();
        event._key = childSnap.key; // Add event key for reference
        organizedEventsContainer.appendChild(createMyPlanEventElement(event, true)); // Append event to container
      });
    })
    .catch(err => {
      console.error("Error loading organized events:", err);
      organizedEventsContainer.innerHTML = "<p>Error loading your organized events.</p>"; // Error message
    });

  // Fetch and display joined events for the current user
  database.ref('events')
    .orderByChild(`participants/${user.uid}/joinedAt`)
    .startAt(0)
    .once('value')
    .then(snapshot => {
      joinedEventsContainer.innerHTML = ""; // Clear container
      if (!snapshot.exists()) {
        joinedEventsContainer.innerHTML = "<p>You have not joined any events yet.</p>"; // No joined events
        return;
      }

      // Retrieve hidden joined event keys from local storage
      let hiddenEvents = JSON.parse(localStorage.getItem('hiddenJoinedEvents')) || [];
      
      snapshot.forEach(childSnap => {
        const event = childSnap.val();
        event._key = childSnap.key; // Add event key for reference
        
        // Skip events that the user has removed from the dashboard
        if (hiddenEvents.includes(event._key)) {
          return;
        }
        
        joinedEventsContainer.appendChild(createMyPlanEventElement(event, false)); // Append joined events
      });
    })
    .catch(err => {
      console.error("Error loading joined events:", err);
      joinedEventsContainer.innerHTML = "<p>Error loading your joined events.</p>"; // Error message
    });
}

/*****
* Event Details (Open & Close Modal)
*****/

// Function to open the event details modal
function openEventDetails(eventKey) {
  const event = allEvents.find(ev => ev._key === eventKey); // Find the event using the eventKey
  if (!event) {
    alert("Event not found."); // Alert if event is not found
    return;
  }
  // Set the event details in the modal
  document.getElementById('detailEventName').textContent = event.name || "Untitled";
  document.getElementById('detailEventOrg').textContent = event.organization || "N/A";
  document.getElementById('detailEventLocation').textContent = event.location || "N/A";
  document.getElementById('detailEventDate').textContent = event.date || "N/A";
  document.getElementById('detailEventTime').textContent = event.time || "N/A";
  document.getElementById('detailEventSpots').textContent = event.spots || 0;
  document.getElementById('detailEventOrganizerName').textContent = event.organizerName || "N/A";
  document.getElementById('detailEventOrganizerEmail').textContent = event.organizerEmail || "N/A";
  document.getElementById('detailEventOrganizerPhone').textContent = event.organizerPhone || "N/A";
  document.getElementById('detailEventDescription').textContent = event.description || "N/A";
  document.getElementById('detailEventInstructions').textContent = event.instructions || "N/A";
  document.getElementById('detailMinAge').textContent = event.age || 10;

  // Handle event flyer image display
  const flyerImg = document.getElementById('detailEventFlyer');
  if (event.flyerURL) {
    flyerImg.src = event.flyerURL;
    flyerImg.style.display = "block"; // Show flyer
  } else {
    flyerImg.style.display = "none"; // Hide flyer if not available
  }
  document.getElementById('eventModal').classList.remove('hidden'); // Show modal
}

// Function to close the event details modal
function closeEventModal() {
  document.getElementById('eventModal').classList.add('hidden'); // Hide modal
}

/*****
* Event Check-in (Participating in an Event)
*****/

// Function to check in to an event
function checkinEvent(eventKey) {
  const user = auth.currentUser; // Get the current user
  if (!user) {
    alert("You must be logged in to check in.");
    return;
  }
  const eventRef = database.ref(`events/${eventKey}`);
  eventRef.transaction(currentEvent => {
    if (currentEvent) {
      // Ensure the participants object exists and the current user is listed
      if (!currentEvent.participants) {
        currentEvent.participants = {};
      }
      if (currentEvent.participants[user.uid]) {
        // Set the checkedIn property to true for the user
        currentEvent.participants[user.uid].checkedIn = true;
      }
      return currentEvent;
    }
    return;
  }, (error, committed, snapshot) => {
    if (error) {
      console.error("Error during check-in:", error);
      alert("Error during check-in.");
    } else if (!committed) {
      alert("Check-in not committed.");
    } else {
      alert("You have checked in successfully!");
      // Reload events to reflect the change
      loadVolunteerOpportunities();
      loadMyPlans();
    }
  });
}

/*****
* View Participants
*****/

// Function to view the list of participants in an event
function viewParticipants(eventKey) {
  database.ref(`events/${eventKey}/participants`).once('value')
    .then(snapshot => {
      const participants = snapshot.val();
      let html = "";
      if (!participants) {
        html = "<p>No participants yet.</p>";
      } else {
        html = "<ul>";
        Object.values(participants).forEach(p => {
          // Append "(Checked In)" if the participant has checked in.
          let checkInStatus = p.checkedIn ? " (Checked In)" : "";
          html += `<li>${p.firstName} ${p.lastName} - ${p.email}${checkInStatus}</li>`;
        });
        html += "</ul>";
      }
      document.getElementById('participantsList').innerHTML = html; // Display participants list
      document.getElementById('participantsModal').classList.remove('hidden'); // Show modal
    })
    .catch(err => {
      console.error("Error fetching participants:", err);
      alert("Error loading participants.");
    });
}

// Function to close the participants modal
function closeParticipantsModal() {
  document.getElementById('participantsModal').classList.add('hidden'); // Hide modal
}

/*****
* Cancel Participation (Remove from event)
*****/

// Function to prompt the user to confirm cancellation of participation
function promptCancelParticipation(eventKey) {
  const confirmationModal = document.createElement('div');
  confirmationModal.classList.add('modal', 'confirmation-modal');
  confirmationModal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" onclick="closeConfirmationModal(this)">&times;</span>
      <h2>Confirm Cancellation</h2>
      <p>Are you sure you want to cancel your participation?</p>
      <button class="confirm-btn" onclick="cancelParticipation('${eventKey}')">Yes, Cancel</button>
      <button class="cancel-btn" onclick="closeConfirmationModal(this)">No, Keep</button>
    </div>
  `;
  document.body.appendChild(confirmationModal); // Append modal to the body
  confirmationModal.classList.remove('hidden'); // Show the modal
}

// Function to close the confirmation modal
function closeConfirmationModal(element) {
  const modal = element.closest('.modal');
  if (modal) {
    modal.classList.add('hidden'); // Hide the modal
    modal.remove(); // Remove the modal
  }
}

// Function to cancel participation in an event
function cancelParticipation(eventKey) {
  const user = auth.currentUser; // Get the current user
  if (!user) {
    alert("You must be logged in to cancel participation.");
    showLogin(); // Show login if the user is not logged in
    return;
  }
  const eventRef = database.ref(`events/${eventKey}`);
  eventRef.transaction((currentEvent) => {
    if (currentEvent) {
      if (!currentEvent.participants || !currentEvent.participants[user.uid]) {
        throw "NotJoined"; // If the user is not a participant, throw error
      }
      currentEvent.spots += 1; // Increase available spots
      delete currentEvent.participants[user.uid]; // Remove the user from the participants list
      return currentEvent;
    }
    return;
  }, (error, committed) => {
    if (error) {
      if (error === "NotJoined") {
        alert("You are not a participant of this event.");
      } else {
        console.error("Transaction failed:", error);
        alert("An error occurred. Please try again.");
      }
    } else if (!committed) {
      alert("Event does not exist.");
    } else {
      alert("You have canceled your participation.");
      loadVolunteerOpportunities(); // Reload opportunities
      loadMyPlans(); // Reload the user's plans
    }
    const confModal = document.querySelector('.confirmation-modal');
    if (confModal) confModal.remove(); // Remove the confirmation modal after cancellation
  });
}

/*****
* Event Element Creation for My Plans
*****/

// Function to create an event element for the user's plans (either organized or joined)
function createMyPlanEventElement(event, isOrganized) {
const eventDiv = document.createElement('div');
eventDiv.classList.add('my-plan-event-box');
let buttonsHTML = "";

if (isOrganized) {
  // Organize event actions: View participants, Edit, Delete
  buttonsHTML += `
    <button class="view-participants-btn" onclick="viewParticipants('${event._key}')">
      View Participants
    </button>
    <button class="edit-event-btn" onclick="editMyPlanEvent('${event._key}')">Edit</button>
    <button class="delete-event-btn" onclick="deleteMyPlanEvent('${event._key}')">Delete</button>
  `;
} else {
  // Joined event actions: View participants, Cancel participation, Check-in (on event day)
  const user = auth.currentUser;
  const userId = user ? user.uid : null;
  let participantStatus = "";
  if (userId && event.participants && event.participants[userId]) {
    participantStatus = event.participants[userId].status || "";
  }
  const eventDate = new Date(event.date);
  const now = new Date();

  // Check if the event date is today
  const isEventToday = eventDate.toDateString() === now.toDateString();

  if (eventDate < now) {
    // Past event actions
    if (!participantStatus) {
      buttonsHTML += `
        <button class="mark-finished-btn" onclick="markEventAttendance('${event._key}', 'finished')">Finished</button>
        <button class="mark-did-not-attend-btn" onclick="markEventAttendance('${event._key}', 'did_not_attend')">Did Not Attend</button>
        <button class="remove-from-dashboard-btn" onclick="removeFromDashboard('${event._key}')">Remove from Dashboard</button>
      `;
    } else {
      buttonsHTML += `
        <p>Status: ${participantStatus.replace('_', ' ')}</p>
        <button class="remove-from-dashboard-btn" onclick="removeFromDashboard('${event._key}')">Remove from Dashboard</button>
      `;
    }
  } else {
    // Upcoming event actions
    buttonsHTML += `
      <button class="view-participants-btn" onclick="viewParticipants('${event._key}')">
        View Participants
      </button>
      <button class="cancel-participation-btn" onclick="promptCancelParticipation('${event._key}')">     
        Cancel
      </button>
    `;
    
    // Check-in button only visible on the event day
    if (isEventToday) {
      buttonsHTML += `
        ${ (event.participants &&
           event.participants[userId] &&
           event.participants[userId].checkedIn) ?
          `<button class="check-in-btn checked-in" disabled>Checked In</button>` :
          `<button class="check-in-btn" onclick="checkinEvent('${event._key}')">Check In</button>`
        }
      `;
    }
  }
}

eventDiv.innerHTML = `
  <h3>${event.name || "Untitled Event"}</h3>
  <p><strong>Organization:</strong> ${event.organization || "N/A"}</p>
  <p><strong>Location:</strong> ${event.location || "N/A"}</p>
  <p><strong>Date:</strong> ${event.date || "N/A"}</p>
  <p><strong>Time:</strong> ${event.time || "N/A"}</p>
  <p><strong>Type:</strong> ${event.type || "N/A"}</p>
  <p><strong>Spots Left:</strong> ${event.spots || 0}</p>
  ${buttonsHTML}
  <button class="view-details-btn" style="margin-top:10px;" onclick="openEventDetails('${event._key}')">
    View Details
  </button>
`;

return eventDiv;
}

/*****
* Event Attendance Marking (Finished / Did Not Attend)
*****/

// Function to mark event attendance (Finished or Did Not Attend)
function markEventAttendance(eventKey, status) {
const user = auth.currentUser;
if (!user) return;

const eventRef = database.ref(`events/${eventKey}/participants/${user.uid}`);
const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM

eventRef.transaction(current => {
  if (current) {
    current.status = status;
    current.completedAt = Date.now();
    current.monthKey = monthKey;
  }
  return current;
}).then(() => {
  if (status === 'finished') {
    updateUserPoints(user.uid, 200); // Add points if finished
  }
  updateCompletedEventsCount(user.uid, monthKey, status === 'finished' ? 1 : 0);
  loadMyPlans(); // Reload the plans to reflect changes
});
}

/*****
* Completed Event Count Update
*****/

// Function to update the count of completed events for a user in the current month
function updateCompletedEventsCount(userId, monthKey, increment) {
const countRef = database.ref(`users/${userId}/completedEvents/${monthKey}`);
countRef.transaction(current => (current || 0) + increment);
}
