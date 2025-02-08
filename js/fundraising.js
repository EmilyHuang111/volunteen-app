/*****
 * Fundraising Functions
 *****/

// Function to show the fundraising section and hide all other sections.
function showFundraising() {
  hideAllSections(); // This hides all other sections.
  
  // Show the new fundraising section.
  const fundraisingSection = document.getElementById('fundraisingSection');
  if (fundraisingSection) fundraisingSection.classList.remove('hidden'); // Removes 'hidden' class to display the section.
  
  removeActiveLink(); // Removes 'active' class from any currently active nav link.
  
  // (Optionally) add an "active" class to the Fundraising nav link.
  document.querySelector('#fundraisingNav a').classList.add('active'); // Adds 'active' class to the fundraising navigation link.
}

/*****
* Generate Fundraising Campaign based on user input
*****/

// Async function to generate a fundraising campaign when the user submits details.
async function generateFundraisingCampaign() {
  const input = document.getElementById("fundraisingInput").value.trim(); // Get and trim the input from the user.
  
  // Check if the input is empty and alert the user if necessary.
  if (!input) {
    alert("Please enter some details about your cause."); // Prompt the user to enter details.
    return;
  }
  
  // Display a temporary message while waiting for the response.
  document.getElementById("fundraisingOutput").innerHTML = "<p>Generating campaign details...</p>"; // Loading message.
  
  // Build a custom prompt for the AI that includes the user’s input.
  const prompt = `
You are a fundraising expert helping volunteers create impactful campaigns for their causes.
Based on the following details:
"${input}"
please provide:
1. A compelling campaign description.
2. A suggested donation goal that is appropriate for the cause.
3. Outreach strategies to reach potential donors.
4. A checklist of steps for launching a successful campaign.
Format your answer in clear sections using Markdown.
  `;
  
  // Define a system message that sets the assistant’s role.
  const systemMessage = "You are a fundraising campaign expert."; // The assistant is a fundraising expert.
  
  // The URL of your backend endpoint.
  // const apiUrl = "http://localhost:5000/generate-chatbot-response"; //local
  const apiUrl = "/api/generate-chatbot-response"; //production (use this for live deployment)

  try {
    // Make the fetch request to the backend with the custom prompt and system message.
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json" // Specify the content type as JSON.
      },
      // Send both the prompt and system message to the backend.
      body: JSON.stringify({
        userText: prompt,
        systemMessage: systemMessage
      })
    });
    
    // If the response from the backend is not ok, handle the error.
    if (!response.ok) {
      const errData = await response.json(); // Parse the error message.
      document.getElementById("fundraisingOutput").innerText =
        "Error: " + (errData.error.message || "Unknown error"); // Display error message in the output section.
      return;
    }
    
    // Process the successful response from the backend.
    const data = await response.json();
    const aiResponse = data.response.trim(); // Get the response from the AI, trimming any extra spaces.
    
    // Convert the Markdown response to HTML using Marked.js for rendering.
    document.getElementById("fundraisingOutput").innerHTML = marked.parse(aiResponse); // Parse the AI response and display it.
  } catch (error) {
    // Handle any errors that occur during the request.
    console.error("Error generating fundraising campaign:", error); // Log the error in the console.
    document.getElementById("fundraisingOutput").innerText =
      "An error occurred while generating the campaign."; // Show an error message in the UI.
  }
}
