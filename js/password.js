
/*****
 * Forgot Password
 *****/
function forgotPasswordSubmit() {
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    auth.sendPasswordResetEmail(email)
      .then(() => {
        alert("A password reset link has been sent.");
        login();
      })
      .catch(error => {
        console.error("Error sending reset:", error);
        alert(error.message);
      });
  }
  
  /*****
   * Show/Hide Password
   *****/
  function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === "password" ? "text" : "password";
  }
  