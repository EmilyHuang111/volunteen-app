// Helper function to load an HTML partial into a target element
function loadPartial(url, targetId) {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Could not load ${url}: ${response.statusText}`);
        }
        return response.text();
      })
      .then(html => {
        document.getElementById(targetId).innerHTML = html;
      })
      .catch(error => console.error(error));
  }
  
  // Load static parts (navigation and footer) on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    loadPartial('navbar.html', 'navbarContainer');
    loadPartial('impact.html', 'impactContainer');
    loadPartial('profile.html', 'profileContainer');
    loadPartial('volunteer.html', 'volunteerContainer');
    loadPartial('organize.html', 'organizeContainer');
    loadPartial('myPlan.html', 'myPlanContainer');
    loadPartial('authentication.html', 'authenticationContainer');
    loadPartial('event.html', 'eventContainer');
    loadPartial('footer.html', 'footerContainer');
  });
  
