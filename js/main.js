// Main Module

// Toggle profile dropdown
const profile = document.getElementById("profile");
const dropdown = document.getElementById("dropdown");
console.log(dropdown.style);
//--> Listens for clicks on the profile container to toggle the dropdown menu visibility <--//
profile.addEventListener("click", (event) => {
  event.stopPropagation();
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
});
//--> A document-level click event hides the dropdown if it’s open and a click happens outside <--//
document.addEventListener("click", () => {
  if (dropdown.style.display === "block") {
    dropdown.style.display = "none";
  }
});

// Open Create Task Modal
const addButton = document.getElementById("addButton");
const taskModal = document.getElementById("taskModal");
const cancelModal = document.getElementById("cancelModal");
//--> Clicking the floating button (#addButton) sets the modal’s display to flex (visible) <--//
addButton.addEventListener("click", () => {
  taskModal.style.display = "flex";
});
//--> The cancel button (#cancelModal) hides the modal when clicked <--//
cancelModal.addEventListener("click", () => {
  taskModal.style.display = "none";
});

// Create Task form submission
const taskForm = document.getElementById("taskForm");
//--> On submission, gathers values from the inputs, constructs a task object (including created and modified timestamps), and adds it to IndexedDB using addTaskToDB() <--//
taskForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const priority = document.getElementById("priority").value;
  const status = "Pending";
  const now = Date.now();
  const task = {
    title,
    description,
    startDate,
    endDate,
    priority,
    status,
    created: now,
    modified: now,
  };
  window.addTaskToDB(task);
  //--> Resets the form and hides the modal <--//
  taskForm.reset();
  taskModal.style.display = "none";
});

// Edit Task functionality
let currentEditingTask = null;
//--> When the edit button is clicked on a task, fills the edit modal with the task’s current data and shows the modal <--//
document.getElementById("taskItems").addEventListener("click", (e) => {
  if (e.target.closest(".edit-btn")) {
    const taskItem = e.target.closest(".task-item");
    currentEditingTask = taskItem;
    document.getElementById("editTitle").value = taskItem.dataset.title;
    document.getElementById("editDescription").value = taskItem.dataset.description;
    document.getElementById("editStartDate").value = taskItem.dataset.startDate;
    document.getElementById("editEndDate").value = taskItem.dataset.endDate;
    document.getElementById("editPriority").value = taskItem.dataset.priority;
    document.getElementById("editStatus").value = taskItem.dataset.status;
    document.getElementById("editModalHeading").textContent = taskItem.dataset.title;
    document.getElementById("editTaskModal").style.display = "flex";
  }
});

// Handle Edit Task form submission
//--> On submission, updates the task’s DOM element with the new values, updates its data attributes (including the modified timestamp), and calls updateTaskInDB() <--//
document.getElementById("editTaskForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (currentEditingTask) {
    const newTitle = document.getElementById("editTitle").value.trim();
    const newDescription = document.getElementById("editDescription").value.trim();
    const newStartDate = document.getElementById("editStartDate").value;
    const newEndDate = document.getElementById("editEndDate").value;
    const newPriority = document.getElementById("editPriority").value;
    const newStatus = document.getElementById("editStatus").value;
    currentEditingTask.dataset.title = newTitle;
    currentEditingTask.dataset.description = newDescription;
    currentEditingTask.dataset.startDate = newStartDate;
    currentEditingTask.dataset.endDate = newEndDate;
    currentEditingTask.dataset.priority = newPriority;
    currentEditingTask.dataset.status = newStatus;
    currentEditingTask.dataset.modified = Date.now();
    currentEditingTask.querySelector(".task-title").textContent = newTitle;
    currentEditingTask.querySelector(".priority").textContent = window.getPriorityEmoji(newPriority);
    currentEditingTask.querySelector(".priority").title = newPriority;
    currentEditingTask.querySelector(".status").textContent = newStatus;
    // Update in IndexedDB
    const updatedTask = {
      id: Number(currentEditingTask.dataset.id),
      title: newTitle,
      description: newDescription,
      startDate: newStartDate,
      endDate: newEndDate,
      priority: newPriority,
      status: newStatus,
      created: Number(currentEditingTask.dataset.created),
      modified: Number(currentEditingTask.dataset.modified),
    };
    window.updateTaskInDB(updatedTask);
    document.getElementById("editTaskModal").style.display = "none";
    window.applyFilters();
  }
});

// Cancel Edit Task Modal
document.getElementById("cancelEditModal").addEventListener("click", () => {
  document.getElementById("editTaskModal").style.display = "none";
});

// Delete Task functionality
//--> Listens for clicks on the delete button within a task item, removes the task from both the database (via deleteTaskFromDB()) and the UI <--//
document.getElementById("taskItems").addEventListener("click", (e) => {
  if (e.target.closest(".delete-btn")) {
    const taskItem = e.target.closest(".task-item");
    window.deleteTaskFromDB(taskItem.dataset.id);
    taskItem.remove();
    window.updateTaskView();
  }
});

// Logout click event
const logout = document.getElementById("logout");
logout.addEventListener("click", (e) => {
  e.preventDefault();
  alert("Logout functionality, loading soon!");
});

// Status filter event listener
//--> Listeners on each button set the activeStatus variable. Clicking a button toggles its active state and applies the filter <--//
document.querySelectorAll(".status-filters button").forEach((btn) => {
  btn.addEventListener("click", function () {
    if (this.classList.contains("active")) {
      window.activeStatus = "all";
      document.querySelectorAll(".status-filters button").forEach((b) => b.classList.remove("active"));
      document.querySelector('.status-filters button[data-filter="all"]').classList.add("active");
    } else {
      window.activeStatus = this.dataset.filter;
      document.querySelectorAll(".status-filters button").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
    }
    window.applyFilters();
  });
});
document.querySelector('.status-filters button[data-filter="all"]').classList.add("active");

// Priority filter event listener (dropdown)
//--> When an option is clicked, toggles the active state. Sets the activePriority variable and updates the dropdown button’s text accordingly <--//
document.querySelectorAll(".dropdown-sort.priority-dropdown .dropdown-sort-content a[data-priority]").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const filterPriority = this.dataset.priority;
    const priorityButton = this.closest(".dropdown-sort").querySelector("button");
    if (this.classList.contains("active")) {
      this.classList.remove("active");
      window.activePriority = "";
      priorityButton.innerHTML = "Priority <i class='fa-solid fa-caret-down'></i>";
      priorityButton.classList.remove("active");
      window.applyFilters();
      return;
    }
    document.querySelectorAll(".dropdown-sort.priority-dropdown .dropdown-sort-content a[data-priority]").forEach((a) => a.classList.remove("active"));
    this.classList.add("active");
    window.activePriority = filterPriority;
    priorityButton.innerHTML = this.textContent + " <i class='fa-solid fa-caret-down'></i>";
    priorityButton.classList.add("active");
    window.applyFilters();
  });
});

// Sorting functionality for sort dropdown
//--> Listeners on each button set the activeStatus variable. Clicking a button toggles its active state and applies the filter <--//
//--> If a sorting option is toggled off, it reverts to the default order (by creation time) <--//
document.querySelectorAll(".dropdown-sort:not(.priority-dropdown) .dropdown-sort-content a[data-sort]").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const sortType = this.dataset.sort;
    const sortButton = this.closest(".dropdown-sort").querySelector("button");
    if (this.classList.contains("active")) {
      this.classList.remove("active");
      sortButton.innerHTML = "Sort <i class='fa-solid fa-caret-down'></i>";
      sortButton.classList.remove("active");
      const tasksContainer = document.getElementById("taskItems");
      const tasks = Array.from(tasksContainer.children);
      tasks.sort((a, b) => Number(a.dataset.created) - Number(b.dataset.created));
      tasks.forEach((task) => tasksContainer.appendChild(task));
      return;
    }
    document.querySelectorAll(".dropdown-sort:not(.priority-dropdown) .dropdown-sort-content a[data-sort]").forEach((a) => a.classList.remove("active"));
    this.classList.add("active");
    sortButton.innerHTML = this.textContent + " <i class='fa-solid fa-caret-down'></i>";
    sortButton.classList.add("active");
    const tasksContainer = document.getElementById("taskItems");
    const tasks = Array.from(tasksContainer.children);
    tasks.sort((a, b) => {
      if (sortType === "start") {
        return a.dataset.startDate.localeCompare(b.dataset.startDate);
      } else if (sortType === "end") {
        return a.dataset.endDate.localeCompare(b.dataset.endDate);
      } else if (sortType === "created") {
        return Number(a.dataset.created) - Number(b.dataset.created);
      } else if (sortType === "modified") {
        return Number(a.dataset.modified) - Number(b.dataset.modified);
      }
    });
    tasks.forEach((task) => tasksContainer.appendChild(task));
  });
});

// Search bar event listener
//--> Calls applyFilters() as the user types in the search bar to dynamically filter tasks by title or description <--//
document.getElementById("searchBar").addEventListener("input", function () {
  window.applyFilters();
});

// Export to CSV
//--> When clicked, builds a CSV string containing headers and each task’s data (only including visible tasks unless “Export All” is indicated) <--//
document.getElementById("exportButton").addEventListener("click", function () {
  window.exportTasksToCSV();
});

// Update view based on task count
window.updateTaskView = function () {
  const taskItems = document.getElementById("taskItems");
  const noTaskMessage = document.getElementById("noTaskMessage");
  const taskListContainer = document.getElementById("taskListContainer");
  //--> Toggles between showing the motivational message (if no tasks exist) and displaying the task list container <--//
  if (taskItems.children.length === 0) {
    noTaskMessage.style.display = "flex";
    taskListContainer.style.display = "none";
  } else {
    noTaskMessage.style.display = "none";
    taskListContainer.style.display = "block";
  }
};
window.updateTaskView();
