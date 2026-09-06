document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const usernameField = document.getElementById("username");
  const passwordField = document.getElementById("password");

  const triggerSubmit = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      form.requestSubmit();
    }
  };

  if (usernameField) usernameField.addEventListener("keydown", triggerSubmit);
  if (passwordField) passwordField.addEventListener("keydown", triggerSubmit);
});
