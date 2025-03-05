// Filters Module

// Global filter variables
//--> Variables to hold the current filter settings for status and priority <--//
window.activeStatus = "all"; // "all", "Pending", "In Progress", "Completed"
window.activePriority = "";  // empty string means no filter

// Apply filters (status, priority, search term)
//--> Iterates over each task element, checking if it matches the active status, priority, and search term filters <--//
window.applyFilters = function () {
  const tasks = document.querySelectorAll("#taskItems .task-item");
  const searchTerm = document.getElementById("searchBar").value.trim().toLowerCase();
  let visibleCount = 0;
  tasks.forEach((task) => {
    const statusMatch = window.activeStatus === "all" || task.dataset.status === window.activeStatus;
    const priorityMatch = window.activePriority === "" || task.dataset.priority === window.activePriority;
    const searchMatch = task.dataset.title.toLowerCase().includes(searchTerm) ||
                        task.dataset.description.toLowerCase().includes(searchTerm);
    if (statusMatch && priorityMatch && searchMatch) {
      task.style.display = "flex";
      if (window.activePriority !== "") {
        task.querySelector(".priority").textContent = "";
      } else {
        task.querySelector(".priority").textContent = window.getPriorityEmoji(task.dataset.priority);
      }
      if (window.activeStatus === "all") {
        task.querySelector(".status").style.display = "block";
        if (task.dataset.status === "Completed") {
          task.classList.add("completed");
        } else {
          task.classList.remove("completed");
        }
      } else {
        task.querySelector(".status").style.display = "none";
        task.classList.remove("completed");
      }
      visibleCount++;
    } else {
      task.style.display = "none";
    }
  });
  //--> Shows or hides tasks accordingly <--//
  const filterMessage = document.getElementById("filterMessage");
  if (document.getElementById("taskItems").children.length > 0 && visibleCount === 0) {
    filterMessage.style.display = "block";
  } else {
    filterMessage.style.display = "none";
  }
  //--> Updates the export button visibility <--//
  window.updateExportButton(visibleCount);
};

// Update Export Button based on visible tasks
//--> Determines whether to show the export button based on the count of visible tasks <--//
window.updateExportButton = function (visibleCount) {
  const exportButton = document.getElementById("exportButton");
  if (document.getElementById("taskItems").children.length === 0 || visibleCount === 0) {
    exportButton.style.display = "none";
  } else {
    exportButton.style.display = "block";
    //--> Adjusts the button text depending on whether all tasks are shown or only filtered ones <--//
    if (
      window.activeStatus === "all" &&
      window.activePriority === "" &&
      document.getElementById("searchBar").value.trim() === ""
    ) {
      exportButton.textContent = "Export All";
    } else {
      exportButton.textContent = "Export";
    }
  }
};

// Export to CSV
//--> When clicked, builds a CSV string containing headers and each task’s data (only including visible tasks unless “Export All” is indicated) <--//
window.exportTasksToCSV = function () {
  const exportAll = document.getElementById("exportButton").textContent.trim() === "Export All";
  const tasks = document.querySelectorAll("#taskItems .task-item");
  let data = "Title,Description,Start Date,End Date,Priority,Status,Created,Modified\n";
  tasks.forEach((task) => {
    if (exportAll || task.style.display !== "none") {
      const title = `"${task.dataset.title}"`;
      const description = `"${task.dataset.description}"`;
      const startDate = task.dataset.startDate;
      const endDate = task.dataset.endDate;
      const priority = task.dataset.priority;
      const status = task.dataset.status;
      const created = task.dataset.created;
      const modified = task.dataset.modified;
      data += `${title},${description},${startDate},${endDate},${priority},${status},${created},${modified}\n`;
    }
  });
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks.csv";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
