// UI Module

// Function to convert priority text to emoji
//--> Returns an emoji based on the task’s priority (High → red circle, Medium → yellow circle, Low → green circle) <--//
window.getPriorityEmoji = function (priority) {
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
  };
  
  // Create a DOM element for a task
  //--> Creates a DOM element for each task with data attributes storing all task properties <--//
  window.createTaskElement = function (task) {
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
        <div class="priority" title="${task.priority}">${getPriorityEmoji(task.priority)}</div>
        <div class="status">${task.status}</div>
        <button type="button" class="edit-btn"><i class="fa-solid fa-edit"></i> Edit</button>
        <button type="button" class="delete-btn"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;
    //--> Applies a "completed" class if the task’s status is "Completed" (and filters allow it) <--//
    if (task.status === "Completed" && window.activeStatus === "all") {
      taskItem.classList.add("completed");
    }
    return taskItem;
  };
  
  // Render tasks on the UI
  //--> Clears the existing tasks list, creates elements for each task, and appends them to the task list container <--//
  window.renderTasks = function (tasks) {
    const taskItemsContainer = document.getElementById("taskItems");
    taskItemsContainer.innerHTML = "";
    tasks.forEach((task) => {
      const taskEl = window.createTaskElement(task);
      taskItemsContainer.appendChild(taskEl);
    });
    //--> Calls applyFilters() and updateTaskView() to update the UI based on current filters and task count <--//
    if (window.applyFilters) {
      window.applyFilters();
    }
    if (window.updateTaskView) {
      window.updateTaskView();
    }
  };
  
  // Append a single task element (used after adding a task)
  //--> Appends the created task element to the task list container <--//
  window.appendTask = function (task) {
    const taskItemsContainer = document.getElementById("taskItems");
    const taskEl = window.createTaskElement(task);
    taskItemsContainer.appendChild(taskEl);
    if (window.applyFilters) {
      window.applyFilters();
    }
    if (window.updateTaskView) {
      window.updateTaskView();
    }
  };
  