document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  let activitiesData = {};

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activitiesData).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const participants = Array.isArray(details.participants) ? details.participants : [];
      const spotsLeft = details.max_participants - participants.length;
      const participantsMarkup = participants.length
        ? `<ul class="participants-list">${participants
            .map(
              (participant) => `
                <li class="participant-item">
                  <span>${participant}</span>
                  <button
                    type="button"
                    class="participant-remove"
                    data-activity-name="${name}"
                    data-participant-email="${participant}"
                    aria-label="Remove ${participant}"
                  >
                    🗑️
                  </button>
                </li>
              `
            )
            .join("")}</ul>`
        : '<p class="participants-empty">No participants yet — be the first to sign up!</p>';

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <h5>Participants</h5>
          ${participantsMarkup}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      activitiesData = activities;
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove");
    if (!removeButton) {
      return;
    }

    const activityName = removeButton.dataset.activityName;
    const participantEmail = removeButton.dataset.participantEmail;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(participantEmail)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        const activity = activitiesData[activityName];
        if (activity) {
          activity.participants = (activity.participants || []).filter(
            (participant) => participant !== participantEmail
          );
          renderActivities();
        }
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Unable to remove participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
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
        const selectedActivity = activitiesData[activity];
        if (selectedActivity) {
          selectedActivity.participants = Array.isArray(selectedActivity.participants)
            ? [...selectedActivity.participants, email]
            : [email];
          renderActivities();
        }
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
