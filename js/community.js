/*****
 * Community Functions
 *****/

// Show the Community Section by hiding all other sections and displaying the community section
function showCommunity() {
  hideAllSections();  // Hide all other sections
  const community = document.getElementById('communitySection');
  if (community) community.classList.remove('hidden');  // Show the community section
  removeActiveLink();  // Remove any active link styles
  loadCommunityPosts();  // Load and display community posts
}

// Load and display community posts from Firebase
function loadCommunityPosts() {
  const container = document.getElementById('communityPostsContainer');
  container.innerHTML = "Loading posts...";  // Display loading message
  
  const postsRef = database.ref('communityPosts').orderByChild('likes');  // Reference to community posts ordered by likes
  postsRef.on('value', (snapshot) => {
      container.innerHTML = "";  // Clear the loading message
      if (snapshot.exists()) {
          const posts = [];
          snapshot.forEach((childSnap) => {  // Loop through each post in the snapshot
              const post = childSnap.val();
              post._key = childSnap.key;  // Assign unique post key
              posts.push(post);  // Add the post to the posts array
          });
          posts.sort((a, b) => (b.likes || 0) - (a.likes || 0));  // Sort posts by likes in descending order
          posts.forEach((post) => {  // Display each post
              container.appendChild(createCommunityPostElement(post));  // Create and append each post element to the container
          });
      } else {
          container.innerHTML = "<p>No posts yet. Be the first to share your experience!</p>";  // If no posts, show this message
      }
  }, (error) => {
      console.error("Error loading community posts:", error);  // Log any errors
      container.innerHTML = "<p>Error loading posts. Please try again later.</p>";  // Show error message
  });
}

// Create HTML for a community post element
function createCommunityPostElement(post) {
  const postDiv = document.createElement('div');
  postDiv.classList.add('community-post');  // Add class to the post div
  const user = auth.currentUser;
  const userId = user ? user.uid : null;  // Get the current user's ID
  const hasLiked = post.likedBy && post.likedBy[userId];  // Check if the user has liked the post
  const likeButtonHTML = `
    <button 
      class="like-btn"
      style="
        background: ${hasLiked ? '#ff6b81' : '#fff'};
        color: ${hasLiked ? '#fff' : '#000'};
      "
      onclick="likePost('${post._key}')"
    >
      ❤️ Like (${post.likes || 0})
    </button>
  `;
  
  // Only show the edit button if the logged-in user is the post's author
  let editButtonHTML = '';
  if (userId === post.userId) {
    editButtonHTML = `
      <button class="edit-post-btn" onclick="editCommunityPost('${post._key}')">
        ✏️ Edit
      </button>
    `;
  }

  // Show delete button only if the logged-in user is the post's author
  let deleteButtonHTML = '';
  if (userId === post.userId) {
    deleteButtonHTML = `
      <button 
        class="delete-btn"
        style="position: absolute; bottom: 15px; right: 120px;"
        onclick="promptDeletePost('${post._key}')"
      >
        🗑️ Delete
      </button>
    `;
  }

  // Build the post content HTML
  let postContentHTML = `<p id="postContent-${post._key}">${post.content}</p>`;
  
  // If media is attached (image/video), display it
  if (post.mediaURL && post.mediaType) {
    if (post.mediaType === "image") {
      postContentHTML += `<img src="${post.mediaURL}" alt="Post Image" style="max-width: 100%; margin-top:10px; border-radius:8px;">`;
    } else if (post.mediaType === "video") {
      postContentHTML += `
        <video controls style="max-width: 100%; margin-top:10px; border-radius:8px;">
          <source src="${post.mediaURL}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `;
    }
  }

  // Combine all post elements into one div
  postDiv.innerHTML = `
    ${postContentHTML}
    <p style="font-size:0.8rem; color:#ccc; margin-top:10px;">
      Posted by ${post.authorName || "Anonymous"} on ${new Date(post.timestamp).toLocaleString()}
    </p>
    ${editButtonHTML}
    ${deleteButtonHTML}
    ${likeButtonHTML}
  `;
  
  return postDiv;  // Return the constructed post div
}

// Handle liking a post
function likePost(postKey) {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to like/unlike a post.");
    showLogin();
    return;
  }
  const userId = user.uid;
  const postRef = database.ref(`communityPosts/${postKey}`);
  postRef.transaction((currentPost) => {
    if (currentPost) {
      if (!currentPost.likedBy) currentPost.likedBy = {};  // Initialize likedBy if not already
      if (currentPost.likedBy[userId]) {
        currentPost.likes = (currentPost.likes || 0) - 1;  // Decrease like count if already liked
        delete currentPost.likedBy[userId];  // Remove user from likedBy
      } else {
        currentPost.likes = (currentPost.likes || 0) + 1;  // Increase like count if not liked
        currentPost.likedBy[userId] = true;  // Add user to likedBy
      }
      return currentPost;  // Return the modified post
    }
    return;
  }, (error) => {
    if (error) {
      console.error("Transaction failed:", error);  // Log any errors
      alert("An error occurred. Please try again.");
    }
  });
}

// Edit a community post
function editCommunityPost(postKey) {
  // Retrieve the current post content from Firebase
  database.ref('communityPosts/' + postKey).once('value')
    .then(snapshot => {
      if (!snapshot.exists()) {
        alert("Post not found.");
        return;
      }
      const post = snapshot.val();
      // Use a simple prompt to allow the user to edit their post
      const newContent = prompt("Edit your post:", post.content);
      if (newContent !== null && newContent.trim() !== "") {
        // Update the post content in Firebase
        database.ref('communityPosts/' + postKey).update({
          content: newContent.trim()
        })
        .then(() => {
          alert("Post updated successfully!");
          // Reload the community posts to reflect changes
          loadCommunityPosts();
        })
        .catch(err => {
          console.error("Error updating post:", err);
          alert("Error updating post.");
        });
      }
    })
    .catch(err => {
      console.error("Error fetching post data:", err);
      alert("An error occurred. Please try again.");
    });
}

// Handle media file selection for posts
document.getElementById('postMedia').addEventListener('change', function() {
  const fileNameSpan = document.getElementById('fileName');
  if (this.files && this.files.length > 0) {
    fileNameSpan.textContent = this.files[0].name;  // Display the selected file name
  } else {
    fileNameSpan.textContent = "";  // Clear the file name display if no file is selected
  }
});

// Create and post a new community post
function createNewPost(content) {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to post.");
    showLogin();
    return;
  }
  const userId = user.uid;
  const userRef = database.ref(`users/${userId}`);
  
  // Get the file from the file input
  const mediaFile = document.getElementById('postMedia').files[0];
  
  userRef.once('value').then((snapshot) => {
    const userData = snapshot.val();
    // Build the post object with text content.
    let newPost = {
      content: content,
      authorName: (userData.firstName || "") + " " + (userData.lastName || ""),
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      likes: 0,
      likedBy: {},
      userId: userId,
      // Optionally include a mediaType and mediaURL if a file is attached.
      mediaType: "",  // e.g., "image" or "video"
      mediaURL: ""
    };

    // If there is a file attached, upload it first
    if (mediaFile) {
      const fileType = mediaFile.type;
      // Determine if it's an image or video based on MIME type
      let mediaCategory = "";
      if (fileType.startsWith("image/")) {
        mediaCategory = "image";
      } else if (fileType.startsWith("video/")) {
        mediaCategory = "video";
      }

      const storageRef = storage.ref(`community_media/${userId}/${Date.now()}_${mediaFile.name}`);
      const uploadTask = storageRef.put(mediaFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          // Optional: You could show upload progress here.
        },
        (error) => {
          console.error("Error uploading media:", error);
          alert("Error uploading media. Please try again.");
        },
        () => {
          // On successful upload, get the download URL.
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            newPost.mediaURL = downloadURL;
            newPost.mediaType = mediaCategory;
            // Save the post including media details.
            database.ref('communityPosts').push(newPost)
              .then(() => {
                alert("Your post has been published!");
                document.getElementById('createPostForm').reset();
              })
              .catch((error) => {
                console.error("Error creating post:", error);
                alert("An error occurred while creating your post. Please try again.");
              });
          });
        }
      );
    } else {
      // No media attached—simply push the post.
      database.ref('communityPosts').push(newPost)
        .then(() => {
          alert("Your post has been published!");
          document.getElementById('createPostForm').reset();
        })
        .catch((error) => {
          console.error("Error creating post:", error);
          alert("An error occurred while creating your post. Please try again.");
        });
    }
  }).catch((error) => {
    console.error("Error fetching user data:", error);
    alert("An error occurred. Please try again.");
  });
}

// Prompt for post deletion confirmation
function promptDeletePost(postKey) {
  const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
  if (!deleteConfirmationModal) return;
  deleteConfirmationModal.classList.remove('hidden');  // Show the delete confirmation modal
  window.postToDeleteKey = postKey;  // Store the post key to delete
}

// Close the delete confirmation modal
function closeDeleteConfirmationModal() {
  const modal = document.getElementById('deleteConfirmationModal');
  if (modal) {
    modal.classList.add('hidden');  // Hide the delete confirmation modal
  }
  window.postToDeleteKey = null;  // Clear the post key
}

// Confirm and delete the post
function confirmDeletePost() {
  if (!window.postToDeleteKey) {
    closeDeleteConfirmationModal();
    return;
  }
  deletePost(window.postToDeleteKey);  // Delete the post
  window.postToDeleteKey = null;  // Clear the post key
  closeDeleteConfirmationModal();  // Close the confirmation modal
}

// Delete the specified post
function deletePost(postKey) {
  database.ref(`communityPosts/${postKey}`).remove()
    .then(() => {
      alert("Post deleted successfully!");  // Alert success
    })
    .catch((error) => {
      console.error("Error deleting post:", error);  // Log error
      alert("An error occurred while deleting the post.");
    });
}


// Maps-related functionality

let volunteerMap;
let volunteerMarkers = [];

// Show the map of volunteer opportunities
function showVolunteerMap() {
const volunteerSection = document.getElementById("volunteerSection");
if (volunteerSection) volunteerSection.classList.add("hidden");
const mapSection = document.getElementById("volunteerMapSection");
if (mapSection) mapSection.classList.remove("hidden");
initVolunteerMap();  // Initialize the map
}

// Show the list of volunteer opportunities
function showVolunteerList() {
const mapSection = document.getElementById("volunteerMapSection");
if (mapSection) mapSection.classList.add("hidden");
const volunteerSection = document.getElementById("volunteerSection");
if (volunteerSection) volunteerSection.classList.remove("hidden");
}

// Initialize the volunteer map with markers
function initVolunteerMap() {
let defaultCenter = { lat: 37.7749, lng: -122.4194 }; // Default: San Francisco
if (userLocation) {
  defaultCenter = { lat: userLocation.latitude, lng: userLocation.longitude };  // Use user location if available
}
volunteerMap = new google.maps.Map(document.getElementById("volunteerMap"), {
  center: defaultCenter,
  zoom: 10,  // Set zoom level
});
volunteerMarkers.forEach(marker => marker.setMap(null));  // Remove existing markers
volunteerMarkers = [];

// Loop through all events and add markers on the map
allEvents.forEach((ev) => {
  if (typeof ev.latitude === 'number' && typeof ev.longitude === 'number') {
    const markerPos = { lat: ev.latitude, lng: ev.longitude };
    const marker = new google.maps.Marker({
      position: markerPos,
      map: volunteerMap,
      title: ev.name || "Untitled Event",
    });
    
    // Event info window content
    const contentString = `
      <div style="min-width:150px;">
        <h3 style="margin-top:0;">${ev.name || "Untitled Event"}</h3>
        <p><strong>Org:</strong> ${ev.organization || "N/A"}</p>
        <p><strong>Spots:</strong> ${ev.spots || 0}</p>
        <button 
          style="
            background:#007bff; 
            color:#fff; 
            border:none; 
            padding:5px 10px; 
            border-radius:5px;
            cursor:pointer;
          "
          onclick="openEventDetails('${ev._key}')"
        >
          Details
        </button>
      </div>
    `;
    
    const infowindow = new google.maps.InfoWindow({ content: contentString });
    
    // Show info window when marker is clicked
    marker.addListener("click", () => {
      infowindow.open({
        anchor: marker,
        map: volunteerMap,
        shouldFocus: false,
      });
    });
    volunteerMarkers.push(marker);  // Add marker to the array
  }
});
}
