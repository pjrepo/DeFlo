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

// CRUD Functions
window.loadTasksFromDB = function () {
  const transaction = db.transaction(["tasks"], "readonly");
  const store = transaction.objectStore("tasks");
  const requestAll = store.getAll();
  requestAll.onsuccess = (event) => {
    const tasks = event.target.result;
    // Pass tasks to UI module for rendering
    window.renderTasks(tasks);
  };
};

window.addTaskToDB = function (task) {
  const transaction = db.transaction(["tasks"], "readwrite");
  const store = transaction.objectStore("tasks");
  const addRequest = store.add(task);
  //--> Once added, assigns the new task’s ID, creates its element, and appends it to the task list <--//
  addRequest.onsuccess = (event) => {
    task.id = event.target.result;
    window.appendTask(task);
  };
};

window.updateTaskInDB = function (task) {
  const transaction = db.transaction(["tasks"], "readwrite");
  const store = transaction.objectStore("tasks");
  store.put(task);
};

window.deleteTaskFromDB = function (taskId) {
  const transaction = db.transaction(["tasks"], "readwrite");
  const store = transaction.objectStore("tasks");
  store.delete(Number(taskId));
};
