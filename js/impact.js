/*****
 * Show Impact Section and Results
 *****/

// Function to show the impact section and display the impact results
function showImpact() {
  hideAllSections(); // Hide all other sections
  const impact = document.getElementById('impactSection');
  if (impact) impact.classList.remove('hidden'); // Show the impact section
  const impactResults = document.getElementById('impactResultsSection');
  if (impactResults) impactResults.classList.remove('hidden'); // Show the impact results section
  removeActiveLink(); // Remove active class from all links
  displayImpactResults(); // Display the user's impact results
}

/*****
* Calculate Impact based on Volunteer Hours
*****/

// Function to calculate the community impact based on the volunteer hours entered
function calculateImpact(hours) {
  if (isNaN(hours) || hours <= 0) {
    alert("Please enter a valid number of hours."); // Check if the input is a valid number
    return;
  }
 
  const MEALS_PER_HOUR = 10;
  const TRASH_PER_HOUR = 5;
  const STUDENTS_PER_HOUR = 3;
  const TREES_PER_HOUR = 2;
 
  // Calculate the impact based on the volunteer hours
  const meals = hours * MEALS_PER_HOUR;
  const trash = hours * TRASH_PER_HOUR;
  const students = hours * STUDENTS_PER_HOUR;
  const trees = hours * TREES_PER_HOUR;
 
  const peopleHelped = calculatePeopleHelped(hours); // Calculate the number of people helped
  const percentile = calculateVolunteerPercentile(hours); // Calculate the volunteer percentile
  const money = Math.round(hours * 33.49); // Calculate the labor cost saved

  // Prepare the HTML output with the calculated data
  const impactHTML = `
    <h2>Your Impact</h2>
    <p><strong>Total Volunteer Hours:</strong> <strong>${hours}</strong> hours</p>
    <p><strong>Estimated People Helped:</strong> <strong>${peopleHelped}</strong></p>
    <p><strong>Labor Costs Saved:</strong> <strong>$${money}</strong></p>
    <p><strong>You are in the:</strong> <strong>${percentile}</strong> percentile of volunteers.</p>
    <br/>
    <h3><strong>Depending on the type of volunteering, you could've:</strong></h3>
    <p><strong>Meals Prepared:</strong> <strong>${meals}</strong> meals</p>
    <p><strong>Trash Collected:</strong> <strong>${trash}</strong> kg</p>
    <p><strong>Students Taught:</strong> <strong>${students}</strong> students</p>
    <p><strong>Trees Planted:</strong> <strong>${trees}</strong> trees</p>
  `;
 
  document.getElementById('impactResults').innerHTML = impactHTML; // Display the impact results

  // Update the impact chart with the current volunteer hours
  updateImpactChart(hours); // Update the chart with the calculated impact
}

/*****
* Display User's Impact Results
*****/

// Function to display the user's impact results based on total volunteer hours from the database
function displayImpactResults() {
  const user = auth.currentUser; // Get the current logged-in user
  if (!user) {
    document.getElementById('impactResults').innerHTML = "<p>Please log in to see your impact.</p>";
    return;
  }
 
  const userRef = database.ref(`users/${user.uid}/totalVolunteerHours`);
  userRef.once('value').then((snapshot) => {
    const totalHours = snapshot.val() || 0; // Get the total volunteer hours from the database
    const peopleHelped = calculatePeopleHelped(totalHours); // Calculate people helped
    const percentile = calculateVolunteerPercentile(totalHours); // Calculate percentile
 
    const MEALS_PER_HOUR = 10;
    const TRASH_PER_HOUR = 5;
    const STUDENTS_PER_HOUR = 3;
    const TREES_PER_HOUR = 2;
 
    // Calculate the impact based on total hours
    const meals = totalHours * MEALS_PER_HOUR;
    const trash = totalHours * TRASH_PER_HOUR;
    const students = totalHours * STUDENTS_PER_HOUR;
    const trees = totalHours * TREES_PER_HOUR;
 
    // Prepare the HTML output for the user's impact
    const impactHTML = `
      <h2>Your Impact</h2>
      <p><strong>Total Volunteer Hours:</strong> <strong>${totalHours}</strong> hours</p>
      <p><strong>Estimated People Helped:</strong> <strong>${peopleHelped}</strong></p>
      <p><strong>Meals Prepared:</strong> <strong>${meals}</strong> meals</p>
      <p><strong>Trash Collected:</strong> <strong>${trash}</strong> kg</p>
      <p><strong>Students Taught:</strong> <strong>${students}</strong> students</p>
      <p><strong>Trees Planted:</strong> <strong>${trees}</strong> trees</p>
      <p><strong>You are in the:</strong> <strong>${percentile}</strong> percentile of volunteers.</p>
    `;
    document.getElementById('impactResults').innerHTML = impactHTML; // Display the impact results
 
    // Update the chart with the current total hours
    updateImpactChart(totalHours); // Update the chart with the calculated impact
  }).catch((error) => {
    console.error("Error fetching volunteer hours:", error);
    document.getElementById('impactResults').innerHTML = "<p>Error loading your impact. Please try again later.</p>";
  });
}

/*****
* Calculate Impact Metrics (People Helped, Percentile)
*****/

// Function to calculate the estimated number of people helped based on hours
function calculatePeopleHelped(hours) {
  return Math.round(hours * 5) + " to " + Math.round(hours * 30); // Return estimated range
}

// Function to calculate the volunteer percentile based on hours
function calculateVolunteerPercentile(hours) {
  const averageHours = 50; // Average volunteer hours
  const stdDev = 20; // Standard deviation
  const zscore = ((hours - averageHours) / stdDev); // Calculate z-score

  // Determine the percentile based on the z-score
  if (zscore < -1) {
    return "Below 10";
  } else if (zscore < 0) {
    return "20";
  } else if (zscore < 1) {
    return "50";
  } else if (zscore < 2) {
    return "80";
  } else {
    return "90+";
  }
}

/*****
* Add/Remove Volunteer Hours
*****/

// Function to add volunteer hours to the current user's profile
function addVolunteerHours(hours) {
   const user = auth.currentUser; // Get the current logged-in user
   if (!user) {
     alert("You must be logged in to add volunteer hours.");
     showLogin(); // Show login if the user is not logged in
     return;
   }
   const userRef = database.ref(`users/${user.uid}/totalVolunteerHours`);
   userRef.transaction((currentHours) => {
     return (currentHours || 0) + hours; // Add the new hours to the current total
   }, (error, committed, snapshot) => {
     if (error) {
       console.error("Error adding volunteer hours:", error);
       alert("Error adding volunteer hours. Please try again.");
     } else if (!committed) {
       alert("Volunteer hours were not added. Please try again.");
     } else {
       alert(`Successfully added ${hours} hours to your profile.`);
       loadUserProfile(); // Refresh the profile to show the updated hours
     }
   });
}

// Function to handle the adding of volunteer hours from input
function handleAddHours() {
   const hoursInput = document.getElementById('profileAddHoursInput');
   const hours = parseFloat(hoursInput.value); // Get the number of hours from input
   if (isNaN(hours) || hours <= 0) {
     alert("Please enter a valid number of hours.");
     return;
   }
   addVolunteerHours(hours); // Add the entered hours
   hoursInput.value = ""; // Clear the input field
}

/*****
* Remove Volunteer Hours
*****/

// Function to remove volunteer hours from the current user's profile
function removeVolunteerHours() {
  const user = auth.currentUser; // Get the current logged-in user
  if (!user) {
    alert("You must be logged in to remove volunteer hours.");
    showLogin(); // Show login if the user is not logged in
    return;
  }

  const hoursInput = document.getElementById('profileAddHoursInput');
  const hours = parseFloat(hoursInput.value); // Get the number of hours to remove

  if (isNaN(hours) || hours <= 0) {
    alert("Please enter a valid number of hours to remove.");
    return;
  }

  const userRef = database.ref(`users/${user.uid}/totalVolunteerHours`);
  userRef.transaction((currentHours) => {
    if (!currentHours) currentHours = 0;
    let newHours = currentHours - hours; // Subtract the hours from the current total
    if (newHours < 0) newHours = 0; // Ensure the hours don't go below 0
    return newHours;
  }, (error, committed) => {
    if (error) {
      console.error("Transaction failed:", error);
      alert("An error occurred while removing volunteer hours.");
    } else if (!committed) {
      alert("Transaction not committed.");
    } else {
      alert(`Successfully removed ${hours} hours from your profile.`);
      hoursInput.value = ""; // Clear the input field
      loadUserProfile(); // Refresh the profile to show the updated hours
    }
  });
}

/*****
* Update Impact Chart with Chart.js
*****/

// Function to update the impact chart based on volunteer hours
   function updateImpactChart(hours) {
    const MEALS_PER_HOUR = 10;
    const TRASH_PER_HOUR = 5;
    const STUDENTS_PER_HOUR = 3;
    const TREES_PER_HOUR = 2;
   
    const meals = hours * MEALS_PER_HOUR;
    const trash = hours * TRASH_PER_HOUR;
    const students = hours * STUDENTS_PER_HOUR;
    const trees = hours * TREES_PER_HOUR;
   
    const ctx = document.getElementById('impactChart').getContext('2d');
   
    const chartData = {
      labels: ['Meals Prepared', 'Trash Collected (kg)', 'Students Taught', 'Trees Planted'],
      datasets: [{
        label: 'Community Impact',
        data: [meals, trash, students, trees],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 205, 86, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 205, 86, 1)'
        ],
        borderWidth: 1
      }]
    };
   
    const chartOptions = {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          // Adjust the maximum so the bars appear longer:
          max: Math.max(meals, trash, students, trees) * 1.2,
          ticks: {
            stepSize: Math.ceil(Math.max(meals, trash, students, trees) / 10)
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Your Community Impact'
        }
      }
    };
   
    // Destroy any existing chart instance before creating a new one
    if (window.myImpactChart) {
      window.myImpactChart.destroy();
    }
   
    window.myImpactChart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: chartOptions
    });
   }
   
   