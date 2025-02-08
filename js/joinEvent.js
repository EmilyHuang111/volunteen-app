
/*****
 * 6. Join Event
 *****/
// Updated confirmJoinEvent now fetches user profile from the database
function openJoinEventModal(eventKey) {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to join an event!");
      localStorage.setItem('redirectAfterLogin', 'volunteer');
      showLogin();
      return;
    }
    joinEventKey = eventKey;
    const modal = document.getElementById('joinEventModal');
    if (modal) modal.classList.remove('hidden');
  }
  
  function closeJoinEventModal() {
    joinEventKey = null;
    const joinEventModal = document.getElementById('joinEventModal');
    if (joinEventModal) joinEventModal.classList.add('hidden');
  }
  
  function confirmJoinEvent() {
    if (!joinEventKey) {
      closeJoinEventModal();
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      alert("No user logged in; cannot join event.");
      closeJoinEventModal();
      return;
    }
    // Retrieve the user's profile from the database
    database.ref('users/' + user.uid).once('value')
      .then(snapshot => {
        const profile = snapshot.val() || {};
        const firstName = profile.firstName || (user.displayName ? user.displayName.split(' ')[0] : "");
        const lastName = profile.lastName || (user.displayName ? user.displayName.split(' ').slice(1).join(' ') : "");
        const eventRef = database.ref('events/' + joinEventKey);
        eventRef.transaction((currentEvent) => {
          if (currentEvent) {
            if (!currentEvent.participants) currentEvent.participants = {};
            if (!currentEvent.participants[user.uid]) {
              currentEvent.spots = currentEvent.spots - 1;
              if (currentEvent.spots < 0) currentEvent.spots = 0;
              currentEvent.participants[user.uid] = {
                email: user.email,
                firstName: firstName,
                lastName: lastName,
                joinedAt: Date.now()
              };
            }
            return currentEvent;
          }
          return;
        }, (error, committed, snapshot) => {
          closeJoinEventModal();
          if (error) {
            console.error("Transaction failed:", error);
            alert("Error joining event.");
          } else if (!committed) {
            alert("Event no longer exists.");
          } else {
            alert("You have successfully joined this event!");
            loadVolunteerOpportunities();
            loadMyPlans();
            sendConfirmationEmail(user.email, snapshot.val());
          }
        });
      })
      .catch(err => {
        console.error("Error fetching user profile:", err);
        closeJoinEventModal();
        alert("Error joining event. Please try again.");
      });
  }
  
  /**
   * Helper function that calls the server API to send an email.
   * It builds the email subject and body based on the event data and also computes
   * the reminder date (one day before the event).
   *
   * @param {string} recipient - The user’s email address.
   * @param {object} eventData - The event object (containing name, date, time, location, etc.).
   */
  function sendConfirmationEmail(recipient, eventData) {
    // Build the subject and email body using event details
    const subject = "Event Confirmation: " + (eventData.name || "Your Event");
    const bodyText = `Hello,
  
  You have successfully joined the event: ${eventData.name}.
  Date: ${eventData.date}
  Time: ${eventData.time}
  Location: ${eventData.location}
  Instructions: ${eventData.instructions || "None"}
  
  Thank you for volunteering!`;
  
    // Compute the reminder date (one day before the event date)
    // Assumes eventData.date is in "YYYY-MM-DD" format.
    let eventDate = new Date(eventData.date);
    eventDate.setDate(eventDate.getDate() - 1);
    const reminderDate = eventDate.toISOString().slice(0, 10); // Format: "YYYY-MM-DD"
  
    // Build the payload to send to the server API
    const payload = {
      recipient: recipient,
      subject: subject,
      body_text: bodyText,
      // Include reminder info so the server can schedule a reminder email.
      reminder: {
        send: true,
        reminderDate: reminderDate
      }
    };
  
    // Call the server API endpoint using fetch.
    //fetch(" http://localhost:5000/send-email", {     //For local development
    fetch("/api/send-email", {   //For production
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(response => {
        if (!response.ok) {
          console.error("Failed to send confirmation email. Status:", response.status);
        } else {
          console.log("Confirmation email sent successfully.");
        }
      })
      .catch(error => {
        console.error("Error sending confirmation email:", error);
      });
  }
  
