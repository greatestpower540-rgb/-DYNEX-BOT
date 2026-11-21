
document.addEventListener("DOMContentLoaded", () => {
  const closeButton = document.querySelector(".close-announcement");
  const announcement = document.querySelector(".announcement");
  const promptInput = document.getElementById("promptInput");

  // Close the announcement
  if (closeButton && announcement) {
    closeButton.addEventListener("click", () => {
      announcement.style.display = "none";
    });
  }

  // Automatically adjust the prompt box height
  if (promptInput) {
    promptInput.addEventListener("input", () => {
      promptInput.style.height = "auto";
      promptInput.style.height =
        Math.min(promptInput.scrollHeight, 180) + "px";
    });
  }
});
