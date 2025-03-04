// IndexedDB Setup
let db;
const request = indexedDB.open("DeFloDB", 1);
request.onupgradeneeded = function (event) {
  db = event.target.result;
  console.log(event.target);
  if (!db.objectStoreNames.contains("tasks")) {
    db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
  }
};
request.onsuccess = function (event) {
  db = event.target.result;
  loadTasksFromDB();
};
request.onerror = function (event) {
  console.error("IndexedDB error:", event.target.errorCode);
};

// Global filter variables
let activeStatus = "all"; // "all", "Pending", "In Progress", "Completed"
let activePriority = ""; // empty string means no filter

// Toggle profile dropdown
const profile = document.getElementById("profile");
const dropdown = document.getElementById("dropdown");
profile.addEventListener("click", function (event) {
  event.stopPropagation();
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
});
document.addEventListener("click", function () {
  if (dropdown.style.display === "block") {
    dropdown.style.display = "none";
  }
});

// Open Create Task Modal
const addButton = document.getElementById("addButton");
const taskModal = document.getElementById("taskModal");
const cancelModal = document.getElementById("cancelModal");
addButton.addEventListener("click", function () {
  taskModal.style.display = "flex";
});
cancelModal.addEventListener("click", function () {
  taskModal.style.display = "none";
});

// Function to convert priority text to emoji
function getPriorityEmoji(priority) {
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
function createTaskElement(task) {
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
  if (task.status === "Completed" && activeStatus === "all") {
    taskItem.classList.add("completed");
  }
  return taskItem;
}

// Load tasks from IndexedDB
function loadTasksFromDB() {
  const transaction = db.transaction(["tasks"], "readonly");
  const store = transaction.objectStore("tasks");
  const requestAll = store.getAll();
  requestAll.onsuccess = function (event) {
    const tasks = event.target.result;
    const taskItems = document.getElementById("taskItems");
    taskItems.innerHTML = "";
    tasks.forEach((task) => {
      const taskEl = createTaskElement(task);
      taskItems.appendChild(taskEl);
    });
    applyFilters();
    updateTaskView();
  };
}

// Add task to IndexedDB
function addTaskToDB(task) {
  const transaction = db.transaction(["tasks"], "readwrite");
  const store = transaction.objectStore("tasks");
  const addRequest = store.add(task);
  addRequest.onsuccess = function (event) {
    task.id = event.target.result;
    const taskEl = createTaskElement(task);
    document.getElementById("taskItems").appendChild(taskEl);
    applyFilters();
    updateTaskView();
  };
}

// Update task in IndexedDB
function updateTaskInDB(task) {
  const transaction = db.transaction(["tasks"], "readwrite");
  const store = transaction.objectStore("tasks");
  store.put(task);
}

// Delete task from IndexedDB
function deleteTaskFromDB(taskId) {
  const transaction = db.transaction(["tasks"], "readwrite");
  const store = transaction.objectStore("tasks");
  store.delete(Number(taskId));
}

// Apply filters (status, priority, search term)
function applyFilters() {
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
  const filterMessage = document.getElementById("filterMessage");
  if (
    document.getElementById("taskItems").children.length > 0 &&
    visibleCount === 0
  ) {
    filterMessage.style.display = "block";
  } else {
    filterMessage.style.display = "none";
  }
  updateExportButton(visibleCount);
}

// Update Export Button based on visible tasks
function updateExportButton(visibleCount) {
  const exportButton = document.getElementById("exportButton");
  if (
    document.getElementById("taskItems").children.length === 0 ||
    visibleCount === 0
  ) {
    exportButton.style.display = "none";
  } else {
    exportButton.style.display = "block";
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
function updateTaskView() {
  const taskItems = document.getElementById("taskItems");
  const noTaskMessage = document.getElementById("noTaskMessage");
  const taskListContainer = document.getElementById("taskListContainer");
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
  taskForm.reset();
  taskModal.style.display = "none";
});

// Edit Task functionality
let currentEditingTask = null;
document.getElementById("taskItems").addEventListener("click", function (e) {
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
document
  .getElementById("editTaskForm")
  .addEventListener("submit", function (e) {
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
  .addEventListener("click", function () {
    document.getElementById("editTaskModal").style.display = "none";
  });

// Delete Task functionality
document.getElementById("taskItems").addEventListener("click", function (e) {
  if (e.target.closest(".delete-btn")) {
    const taskItem = e.target.closest(".task-item");
    deleteTaskFromDB(taskItem.dataset.id);
    taskItem.remove();
    updateTaskView();
  }
});

// Logout click event
const logout = document.getElementById("logout");
logout.addEventListener("click", function (e) {
  e.preventDefault();
  alert("Logout functionality here!");
});

// Status filter event listener
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
document.getElementById("searchBar").addEventListener("input", function () {
  applyFilters();
});

// Export to CSV
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
updateTaskView();
