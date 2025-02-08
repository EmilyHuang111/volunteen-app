/*****
 * Geolocation for "Near Me" (Miles)
 *****/

// Function to get the user's location using the browser's geolocation API
function getUserLocation() {
  return new Promise((resolve) => {
    // Check if geolocation is supported by the browser
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser."); // Alert if not supported
      resolve(null); // Resolve with null if geolocation is unavailable
    } else {
      // Attempt to retrieve the current position
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude, // Latitude of the user
            longitude: pos.coords.longitude // Longitude of the user
          });
        },
        (err) => {
          console.error("Error obtaining location:", err); // Log any geolocation error
          resolve(null); // Resolve with null if error occurs
        }
      );
    }
  });
}

// Function to calculate the distance between two geographic points in miles
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Helper function to convert degrees to radians
  function toRad(x) {
    return x * Math.PI / 180;
  }

  const R = 3958.8; // Radius of the Earth in miles
  const dLat = toRad(lat2 - lat1); // Difference in latitude
  const dLon = toRad(lon2 - lon1); // Difference in longitude

  // Haversine formula to calculate the distance between two points
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); // Angular distance in radians
  return R * c; // Return distance in miles
}

// Global variable to hold the chart instance (so you can update it later)
window.myImpactChart = null;
Chart.defaults.color = '#fff'; // Set default color for chart elements

// Function to update the impact chart based on volunteer hours
function updateImpactChart(volunteerHours) {
  // Calculate the simulated impact based on the hours worked
  const meals = volunteerHours * 10;
  const trash = volunteerHours * 5;
  const students = volunteerHours * 3;
  const trees = volunteerHours * 2;

  // Prepare the data and configuration for the bar chart
  const ctx = document.getElementById('impactChart').getContext('2d'); // Get the canvas context
  const chartData = {
    labels: ['Meals Prepared', 'Trash Collected (kg)', 'Students Taught', 'Trees Planted'],
    datasets: [{
      label: 'Community Impact',
      data: [meals, trash, students, trees], // Data for the chart
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(255, 205, 86, 0.6)'
      ], // Background color for each bar
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(255, 205, 86, 1)'
      ], // Border color for each bar
      borderWidth: 1
    }]
  };

  // If a chart already exists, destroy it before creating a new one
  if (window.myImpactChart) {
    window.myImpactChart.destroy(); // Destroy previous chart
  }

  // Create a new chart
  window.myImpactChart = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true, // Ensure the chart is responsive
      maintainAspectRatio: false, // Allow custom canvas height
      scales: {
        y: {
          beginAtZero: true, // Start the y-axis from 0
          max: Math.max(meals, trash, students, trees) * 1.2, // Set max y-axis value based on data
          ticks: {
            color: '#fff', // Set Y-axis tick color to white
            stepSize: Math.ceil(Math.max(meals, trash, students, trees) / 10) // Set step size for ticks
          },
          title: {
            display: true,
            text: 'Impact', // Title for the Y-axis
            color: '#fff' // Title text in white
          }
        },
        x: {
          ticks: {
            color: '#fff' // Set X-axis tick color to white
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Your Community Impact', // Title for the chart
          color: '#fff' // Title text in white
        },
        legend: {
          labels: {
            color: '#fff' // Legend label texts in white
          }
        }
      }
    }
  });
}

/*****
* Geocode Missing Coordinates (Optional)
*****/

// Function to geocode missing coordinates for events (if latitude and longitude are missing)
async function geocodeMissingCoordinates(events) {
  for (const ev of events) {
    if (typeof ev.latitude !== 'number' || typeof ev.longitude !== 'number') { // Check if coordinates are missing
      if (ev.location) { // If location is available, attempt to geocode it
        const coords = await geocodeAddress(ev.location); // Call geocoding function
        if (coords) { // If geocoding is successful, update the event with coordinates
          await database.ref('events/' + ev._key).update({
            latitude: coords.lat,
            longitude: coords.lng
          });
          ev.latitude = coords.lat;
          ev.longitude = coords.lng;
        }
      }
    }
  }
}

// Function to geocode an address using the Google Maps API
async function geocodeAddress(address) {
  try {
    const response = await fetch(url); // Fetch the geocoding data
    const data = await response.json(); // Parse the response as JSON
    if (data.status === "OK" && data.results && data.results.length > 0) { // Check if geocoding is successful
      const result = data.results[0]; // Get the first result
      const lat = result.geometry.location.lat; // Extract latitude
      const lng = result.geometry.location.lng; // Extract longitude
      return { lat, lng }; // Return the coordinates
    } else {
      console.error("Geocoding failed:", data.status); // Log error if geocoding fails
      return null; // Return null if geocoding failed
    }
  } catch (error) {
    console.error("Error in geocoding request:", error); // Log any errors that occur during the request
    return null; // Return null if there is an error
  }
}
