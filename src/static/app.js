document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(type, text) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsMarkup = details.participants.length
          ? details.participants
              .map(
                (participant) => `
                  <li class="participant-item">
                    <span class="participant-email">${participant}</span>
                    <button
                      type="button"
                      class="participant-delete"
                      data-activity-name="${encodeURIComponent(name)}"
                      data-email="${encodeURIComponent(participant)}"
                      aria-label="Remove ${participant} from ${name}"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M9 3.75h6l.75 1.5H19.5a.75.75 0 0 1 0 1.5h-.81l-.78 11.07A2.25 2.25 0 0 1 15.67 20.25H8.33a2.25 2.25 0 0 1-2.24-2.43L5.31 6.75H4.5a.75.75 0 0 1 0-1.5h3.75L9 3.75Zm-1.19 3 .77 10.96a.75.75 0 0 0 .75.69h6.34a.75.75 0 0 0 .75-.69l.77-10.96H7.81Zm2.94 2.25c.41 0 .75.34.75.75v5.25a.75.75 0 0 1-1.5 0V9.75c0-.41.34-.75.75-.75Zm3.75 0c.41 0 .75.34.75.75v5.25a.75.75 0 0 1-1.5 0V9.75c0-.41.34-.75.75-.75Z" />
                      </svg>
                    </button>
                  </li>
                `
              )
              .join("")
          : '<li class="participants-empty">No students signed up yet.</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title">Participants</p>
            <ul class="participants-list">
              ${participantsMarkup}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete");

    if (!deleteButton) {
      return;
    }

    const activityName = decodeURIComponent(deleteButton.dataset.activityName);
    const email = decodeURIComponent(deleteButton.dataset.email);

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage("success", result.message);
        await fetchActivities();
      } else {
        showMessage("error", result.detail || "An error occurred");
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      showMessage("error", "Failed to remove participant. Please try again.");
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage("success", result.message);
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage("error", result.detail || "An error occurred");
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      showMessage("error", "Failed to sign up. Please try again.");
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
