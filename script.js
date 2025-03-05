// IndexedDB Setup
//--> Declares a global variable for the database connection <--//
let db;
//--> Opens (or creates) an IndexedDB database named “DeFloDB” with version 1 <--//
const request = indexedDB.open("DeFloDB", 1);
//--> Runs when the database is created/upgraded <--//
//--> Checks if the “tasks” object store exists; if not, it creates one with an auto-incrementing primary key (id). <--//
request.onupgradeneeded = (event) => {
  db = event.target.result;
  console.log(event.target);
  if (!db.objectStoreNames.contains("tasks")) {
    db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
  }
};
//--> Called when the database opens successfully <--//
//--> Saves the database reference and calls loadTasksFromDB() to retrieve tasks <--//
request.onsuccess = (event) => {
  db = event.target.result;
  loadTasksFromDB();
};
//--> Logs any errors that occur while opening the database <--//
request.onerror = (event) => {
  console.error("IndexedDB error:", event.target.errorCode);
};

// Global filter variables
//--> Variables to hold the current filter settings for status and priority <--//
let activeStatus = "all"; // "all", "Pending", "In Progress", "Completed"
let activePriority = ""; // empty string means no filter

// Toggle profile dropdown
const profile = document.getElementById("profile");
const dropdown = document.getElementById("dropdown");
console.log(dropdown.style);
//--> Listens for clicks on the profile container to toggle the dropdown menu visibility <--//
profile.addEventListener("click", (event) => {
  event.stopPropagation();
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
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

// Function to convert priority text to emoji
//--> Returns an emoji based on the task’s priority (High → red circle, Medium → yellow circle, Low → green circle) <--//
const getPriorityEmoji = (priority) => {
  switch (priority) {
    case "High":
      return "🔴";
    case "Medium":
      return "🟡";
    case "Low":
      return "🟢";
    default:
      return "";
  }
}

// Create a DOM element for a task
//--> Creates a DOM element for each task with data attributes storing all task properties <--//
const createTaskElement = (task) => {
  const taskItem = document.createElement("div");
  taskItem.className = "task-item";
  taskItem.dataset.id = task.id;
  taskItem.dataset.title = task.title;
  taskItem.dataset.description = task.description;
  taskItem.dataset.startDate = task.startDate;
  taskItem.dataset.endDate = task.endDate;
  taskItem.dataset.priority = task.priority;
  taskItem.dataset.status = task.status;
  taskItem.dataset.created = task.created;
  taskItem.dataset.modified = task.modified;
  //--> Sets inner HTML with the task title, priority (as emoji), status, and action buttons (Edit and Delete) <--//
  taskItem.innerHTML = `
    <div class="task-title">${task.title}</div>
    <div class="task-actions">
      <div class="priority" title="${task.priority}">${getPriorityEmoji(
    task.priority
  )}</div>
      <div class="status">${task.status}</div>
      <button type="button" class="edit-btn"><i class="fa-solid fa-edit"></i> Edit</button>
      <button type="button" class="delete-btn"><i class="fa-solid fa-trash"></i> Delete</button>
    </div>
  `;
  //--> Applies a "completed" class if the task’s status is "Completed" (and filters allow it) <--//
  if (task.status === "Completed" && activeStatus === "all") {
    taskItem.classList.add("completed");
  }
  return taskItem;
};

//--> Opens a read-only transaction on the "tasks" store and retrieves all tasks <--//
const loadTasksFromDB = () => {
  const transaction = db.transaction(["tasks"], "readonly");
  const store = transaction.objectStore("tasks");
  const requestAll = store.getAll();
  requestAll.onsuccess = (event) => {
    const tasks = event.target.result;
    const taskItems = document.getElementById("taskItems");
    //--> Clears the existing tasks list, creates elements for each task, and appends them to the task list container <--//
    taskItems.innerHTML = "";
    tasks.forEach((task) => {
      const taskEl = createTaskElement(task);
      taskItems.appendChild(taskEl);
    });
    //--> Calls applyFilters() and updateTaskView() to update the UI based on current filters and task count <--//
    applyFilters();
    updateTaskView();
  };
};

// Add task to IndexedDB
//--> Opens a read-write transaction to add a new task to the store <--//
const addTaskToDB = (task) => {
  const transaction = db.transaction(["tasks"], "readwrite");
  const store = transaction.objectStore("tasks");
  const addRequest = store.add(task);
  //--> Once added, assigns the new task’s ID, creates its element, and appends it to the task list <--//
  addRequest.onsuccess = (event) => {
    task.id = event.target.result;
    const taskEl = createTaskElement(task);
    document.getElementById("taskItems").appendChild(taskEl);
    applyFilters();
    updateTaskView();
  };
};

// Update task in IndexedDB
const updateTaskInDB = (task) =>{
  const transaction = db.transaction(["tasks"], "readwrite");
  const store = transaction.objectStore("tasks");
  store.put(task);
}

// Delete task from IndexedDB
const deleteTaskFromDB = (taskId) => {
  const transaction = db.transaction(["tasks"], "readwrite");
  const store = transaction.objectStore("tasks");
  store.delete(Number(taskId));
}

// Apply filters (status, priority, search term)
//--> Iterates over each task element, checking if it matches the active status, priority, and search term filters <--//
const applyFilters = () => {
  const tasks = document.querySelectorAll("#taskItems .task-item");
  const searchTerm = document
    .getElementById("searchBar")
    .value.trim()
    .toLowerCase();
  let visibleCount = 0;
  tasks.forEach((task) => {
    const statusMatch =
      activeStatus === "all" || task.dataset.status === activeStatus;
    const priorityMatch =
      activePriority === "" || task.dataset.priority === activePriority;
    const searchMatch =
      task.dataset.title.toLowerCase().includes(searchTerm) ||
      task.dataset.description.toLowerCase().includes(searchTerm);
    if (statusMatch && priorityMatch && searchMatch) {
      task.style.display = "flex";
      if (activePriority !== "") {
        task.querySelector(".priority").textContent = "";
      } else {
        task.querySelector(".priority").textContent = getPriorityEmoji(
          task.dataset.priority
        );
      }
      if (activeStatus === "all") {
        task.querySelector(".status").style.display = "block";
        if (task.dataset.status === "Completed")
          task.classList.add("completed");
        else task.classList.remove("completed");
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
  if (
    document.getElementById("taskItems").children.length > 0 &&
    visibleCount === 0
  ) {
    filterMessage.style.display = "block";
  } else {
    filterMessage.style.display = "none";
  }
  //--> Updates the export button visibility <--//
  updateExportButton(visibleCount);
};

// Update Export Button based on visible tasks
const updateExportButton = (visibleCount) => {
  //--> Determines whether to show the export button based on the count of visible tasks <--//
  const exportButton = document.getElementById("exportButton");
  if (
    document.getElementById("taskItems").children.length === 0 ||
    visibleCount === 0
  ) {
    exportButton.style.display = "none";
  } else {
    exportButton.style.display = "block";
    //--> Adjusts the button text depending on whether all tasks are shown or only filtered ones <--//
    if (
      activeStatus === "all" &&
      activePriority === "" &&
      document.getElementById("searchBar").value.trim() === ""
    ) {
      exportButton.textContent = "Export All";
    } else {
      exportButton.textContent = "Export";
    }
  }
}

// Update view based on task count
const updateTaskView = () => {
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
}

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
  addTaskToDB(task);
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
    document.getElementById("editDescription").value =
      taskItem.dataset.description;
    document.getElementById("editStartDate").value = taskItem.dataset.startDate;
    document.getElementById("editEndDate").value = taskItem.dataset.endDate;
    document.getElementById("editPriority").value = taskItem.dataset.priority;
    document.getElementById("editStatus").value = taskItem.dataset.status;
    document.getElementById("editModalHeading").textContent =
      taskItem.dataset.title;
    document.getElementById("editTaskModal").style.display = "flex";
  }
});

// Handle Edit Task form submission
//--> On submission, updates the task’s DOM element with the new values, updates its data attributes (including the modified timestamp), and calls updateTaskInDB() <--//
document
  .getElementById("editTaskForm")
  .addEventListener("submit", (e) => {
    e.preventDefault();
    if (currentEditingTask) {
      const newTitle = document.getElementById("editTitle").value.trim();
      const newDescription = document
        .getElementById("editDescription")
        .value.trim();
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
      currentEditingTask.querySelector(".priority").textContent =
        getPriorityEmoji(newPriority);
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
      updateTaskInDB(updatedTask);
      document.getElementById("editTaskModal").style.display = "none";
      applyFilters();
    }
  });

// Cancel Edit Task Modal
document
  .getElementById("cancelEditModal")
  .addEventListener("click", () => {
    document.getElementById("editTaskModal").style.display = "none";
  });

// Delete Task functionality
//--> Listens for clicks on the delete button within a task item, removes the task from both the database (via deleteTaskFromDB()) and the UI <--//
document.getElementById("taskItems").addEventListener("click", (e) => {
  if (e.target.closest(".delete-btn")) {
    const taskItem = e.target.closest(".task-item");
    deleteTaskFromDB(taskItem.dataset.id);
    taskItem.remove();
    updateTaskView();
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
      activeStatus = "all";
      document
        .querySelectorAll(".status-filters button")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelector('.status-filters button[data-filter="all"]')
        .classList.add("active");
    } else {
      activeStatus = this.dataset.filter;
      document
        .querySelectorAll(".status-filters button")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
    }
    applyFilters();
  });
});
activeStatus = "all";
document
  .querySelector('.status-filters button[data-filter="all"]')
  .classList.add("active");

// Priority filter event listener (dropdown)
//--> When an option is clicked, toggles the active state. Sets the activePriority variable and updates the dropdown button’s text accordingly <--//
document
  .querySelectorAll(
    ".dropdown-sort.priority-dropdown .dropdown-sort-content a[data-priority]"
  )
  .forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const filterPriority = this.dataset.priority;
      const priorityButton =
        this.closest(".dropdown-sort").querySelector("button");
      if (this.classList.contains("active")) {
        this.classList.remove("active");
        activePriority = "";
        priorityButton.innerHTML =
          "Priority <i class='fa-solid fa-caret-down'></i>";
        priorityButton.classList.remove("active");
        applyFilters();
        return;
      }
      document
        .querySelectorAll(
          ".dropdown-sort.priority-dropdown .dropdown-sort-content a[data-priority]"
        )
        .forEach((a) => a.classList.remove("active"));
      this.classList.add("active");
      activePriority = filterPriority;
      priorityButton.innerHTML =
        this.textContent + " <i class='fa-solid fa-caret-down'></i>";
      priorityButton.classList.add("active");
      applyFilters();
    });
  });

// Sorting functionality for sort dropdown
//--> Listeners on each button set the activeStatus variable. Clicking a button toggles its active state and applies the filter <--//
//--> If a sorting option is toggled off, it reverts to the default order (by creation time) <--//
document
  .querySelectorAll(
    ".dropdown-sort:not(.priority-dropdown) .dropdown-sort-content a[data-sort]"
  )
  .forEach((link) => {
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
        tasks.sort(
          (a, b) => Number(a.dataset.created) - Number(b.dataset.created)
        );
        tasks.forEach((task) => tasksContainer.appendChild(task));
        return;
      }
      document
        .querySelectorAll(
          ".dropdown-sort:not(.priority-dropdown) .dropdown-sort-content a[data-sort]"
        )
        .forEach((a) => a.classList.remove("active"));
      this.classList.add("active");
      sortButton.innerHTML =
        this.textContent + " <i class='fa-solid fa-caret-down'></i>";
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
  applyFilters();
});

// Export to CSV
//--> When clicked, builds a CSV string containing headers and each task’s data (only including visible tasks unless “Export All” is indicated) <--//
document.getElementById("exportButton").addEventListener("click", function () {
  const exportAll = this.textContent.trim() === "Export All";
  const tasks = document.querySelectorAll("#taskItems .task-item");
  let data =
    "Title,Description,Start Date,End Date,Priority,Status,Created,Modified\n";
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
  //--> Creates a Blob from the CSV data, generates a temporary URL, and programmatically triggers a download of the CSV file <--//
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks.csv";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Initial view update
//--> Ensures the correct view is displayed (either the motivational message or the task list) when the script first runs <--//
updateTaskView();
