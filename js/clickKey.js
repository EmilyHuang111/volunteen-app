/*****
 Modal Outside Click and Escape Key
 *****/

// Handle clicks outside of the modal to close it
window.onclick = function(event) {
  // Get references to all the modal elements
  const editModal = document.getElementById('editEventModal');
  const eventModal = document.getElementById('eventModal');
  const participantsModal = document.getElementById('participantsModal');
  const joinEventModal = document.getElementById('joinEventModal');
  const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
  const confirmationModal = document.querySelector('.confirmation-modal');
  
  // Check if the click target is the modal itself, and close the modal if it is
  if (event.target == editModal) { 
      editModal.classList.add('hidden'); // Hide the edit event modal
  }
  if (event.target == eventModal) { 
      eventModal.classList.add('hidden'); // Hide the event modal
  }
  if (event.target == participantsModal) { 
      participantsModal.classList.add('hidden'); // Hide the participants modal
  }
  if (event.target == joinEventModal) {
      joinEventModal.classList.add('hidden'); // Hide the join event modal
      joinEventModal.removeAttribute('data-event-key'); // Remove event key data attribute
  }
  if (deleteConfirmationModal && event.target == deleteConfirmationModal) { 
      deleteConfirmationModal.classList.add('hidden'); // Hide the delete confirmation modal
  }
  if (confirmationModal && event.target == confirmationModal) {
      confirmationModal.classList.add('hidden'); // Hide the confirmation modal
      confirmationModal.remove(); // Remove the confirmation modal from the DOM
  }
};

// Listen for 'Escape' key press to close all modals
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
      // Close all modals when 'Escape' key is pressed
      closeEditEventModal(); 
      closeEventModal();
      closeParticipantsModal();
      closeJoinEventModal();
      closeDeleteConfirmationModal();
      
      // Close the confirmation modal if it exists
      const confirmationModal = document.querySelector('.confirmation-modal');
      if (confirmationModal) {
          confirmationModal.classList.add('hidden'); // Hide the confirmation modal
          confirmationModal.remove(); // Remove the confirmation modal from the DOM
      }
  }
});

// Function to close the delete confirmation modal
function closeDeleteConfirmationModal() {
  const modal = document.getElementById('deleteConfirmationModal');
  if (modal) {
      modal.classList.add('hidden'); // Hide the delete confirmation modal
  }
}
