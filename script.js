// FIX 1: Import icons object and pass it to createIcons
import { createIcons, icons } from "https://unpkg.com/lucide@latest?module";
createIcons({ icons });

// ----------------------------------------------------
// FIREBASE & STATE SETUP
// ----------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, onSnapshot, doc, setDoc, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global State
let db;
let auth;
let userId = 'anonymous'; 
let appId;
let tasksRef; 
let allTasks = []; // Array storing all tasks from Firestore/Local Storage
let currentFilter = 'all'; // 'all', 'completed', 'active'

// Ensure global Canvas variables are available
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
appId = typeof __app_id !== 'undefined' ? __app_id : 'default-todo-app';

/**
 * Initializes Firebase and Authentication.
 */
async function initializeFirebase() {
    try {
        if (firebaseConfig) {
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
            
            // Perform authentication
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
            
            // Get userId after authentication
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    userId = user.uid;
                    document.getElementById('user-id-display').textContent = `User ID: ${userId.substring(0, 15)}...`;
                    setupTaskListener();
                } else {
                    userId = crypto.randomUUID();
                    document.getElementById('user-id-display').textContent = `Temporary User ID: ${userId.substring(0, 15)}...`;
                    setupTaskListener();
                }
            });

        } else {
            console.error("Firebase config is not available. Using local array for storage.");
            setupLocalFallback();
        }
    } catch (error) {
        console.error("Error initializing Firebase or signing in:", error);
        setupLocalFallback();
    }
}

/**
 * Sets up real-time listener for tasks from Firestore.
 * (Fetches all tasks and sorts them in memory)
 */
function setupTaskListener() {
    // Collection path: /artifacts/{appId}/users/{userId}/tasks
    tasksRef = collection(db, 'artifacts', appId, 'users', userId, 'tasks');
    
    // Simple query (without orderBy to avoid index error)
    const q = query(tasksRef);

    onSnapshot(q, (snapshot) => {
        allTasks = []; // Reset tasks array
        snapshot.forEach((doc) => {
            allTasks.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort in memory by creation time
        allTasks.sort((a, b) => a.createdAt - b.createdAt);
        
        renderTasks(allTasks); // Render based on the active filter
        updateStatus(allTasks);
    }, (error) => {
        console.error("Error listening to tasks:", error);
        showCustomModal('Error', 'Failed to load tasks. Check connection or console.', 'error');
    });
    updateSidebarActiveLink();
}

/**
 * Local fallback if Firebase cannot be initialized.
 */
let localTasks = JSON.parse(localStorage.getItem('localTasks') || '[]');
function setupLocalFallback() {

    allTasks = localTasks;
    renderTasks(allTasks);
    updateStatus(allTasks);
    updateSidebarActiveLink();
}

/**
 * Changes the filter and triggers a re-render.
 */
function changeFilter(newFilter) {
    currentFilter = newFilter;
    renderTasks(allTasks); 
    updateSidebarActiveLink();
}

// FIX 2: Expose changeFilter to the global window object
window.changeFilter = changeFilter; 

// ----------------------------------------------------
// CRUD LOGIC
// ----------------------------------------------------

/**
 * Adds a new task.
 */
async function addTask() {
    const input = document.getElementById('task-input');
    const deadlineInput = document.getElementById('task-deadline'); // NEW
    const taskText = input.value.trim();
    const deadline = deadlineInput.value.trim(); // NEW

    if (taskText === "") {
        return; // Do not add empty tasks
    }

    const newTask = {
        text: taskText,
        completed: false,
        createdAt: Date.now(),
        deadline: deadline || null // Store deadline, null if empty // NEW
    };

    try {
        if (db) {
            await addDoc(tasksRef, newTask);
        } else {
            newTask.createdAt = Date.now(); // Use timestamp as unique local ID
            allTasks.push(newTask);
            localStorage.setItem('localTasks', JSON.stringify(allTasks));
            // Manually update the view in local mode
            renderTasks(allTasks);
            updateStatus(allTasks);
        }
    } catch (error) {
        console.error("Error adding task:", error);
        showCustomModal('Error', 'Failed to add task. Please try again.', 'error');
    }

    input.value = ''; 
    deadlineInput.value = ''; // Clear deadline input // NEW
}

// FIX 2: Expose addTask to the global window object
window.addTask = addTask; 

/**
 * Toggles the completion status of a task.
 */
async function toggleComplete(id, currentStatus) {
    try {
        if (db) {
            const taskDocRef = doc(db, 'artifacts', appId, 'users', userId, 'tasks', id);
            await setDoc(taskDocRef, { completed: !currentStatus }, { merge: true });
        } else {
            // Local Storage Fallback: ID is createdAt
            const task = allTasks.find(t => t.createdAt === id);
            if (task) {
                task.completed = !currentStatus;
                localStorage.setItem('localTasks', JSON.stringify(allTasks));
                renderTasks(allTasks);
                updateStatus(allTasks);
            }
        }
    } catch (error) {
        console.error("Error toggling task status:", error);
        showCustomModal('Error', 'Failed to update task status.', 'error');
    }
}

// FIX 2: Expose toggleComplete to the global window object
window.toggleComplete = toggleComplete; 

/**
 * Deletes a task.
 */
async function deleteTask(id) {
    // Display custom confirmation modal (not alert/confirm)
    showCustomConfirmation('Are you sure you want to delete this task?', async () => {
        try {
            if (db) {
                const taskDocRef = doc(db, 'artifacts', appId, 'users', userId, 'tasks', id);
                await deleteDoc(taskDocRef);
            } else {
                // Local Storage Fallback: ID is createdAt
                const initialLength = allTasks.length;
                allTasks = allTasks.filter(t => t.createdAt !== id);
                if (allTasks.length < initialLength) {
                    localStorage.setItem('localTasks', JSON.stringify(allTasks));
                    renderTasks(allTasks);
                    updateStatus(allTasks);
                }
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            showCustomModal('Error', 'Failed to delete task. Please try again.', 'error');
        }
    });
}

// FIX 2: Expose deleteTask to the global window object
window.deleteTask = deleteTask; 

// ----------------------------------------------------
// RENDER & UI LOGIC
// ----------------------------------------------------

/**
 * Renders all tasks to the DOM based on the active filter.
 */
function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    
    let filteredTasks = tasks;
    
    // --- FILTERING LOGIC ---
    if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    } else if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } 
    // 'all' filter is the default
    // --- END OF FILTERING LOGIC ---

    if (filteredTasks.length === 0) {
        let message = "No tasks today. Add a new one!";
        if (currentFilter === 'completed') {
             message = "No completed tasks in this list.";
        } else if (currentFilter === 'active') {
             message = "All tasks are complete! Enjoy your day.";
        }
        
        taskList.innerHTML = `
            <li class="p-4 bg-color-light-pink rounded-xl text-center text-color-mid-pink font-medium">
                <i data-lucide="check-circle" class="w-5 h-5 inline mr-2"></i>
                ${message}
            </li>
        `;
        createIcons({ icons }); // Use fixed Lucide call
        return;
    }

    filteredTasks.forEach(task => {
        taskList.appendChild(createListItem(task));
    });
}

/**
 * Creates a list item (li) element for a single task.
 */
function createListItem(task) {
    // Determine the ID used: doc.id for Firestore, createdAt for Local Storage
    const taskId = db ? task.id : task.createdAt; 
    
    // Check deadline status
    const hasDeadline = task.deadline && task.deadline.length > 0;
    const isOverdue = hasDeadline && !task.completed && (new Date(task.deadline) < new Date());
    
    const li = document.createElement('li');
    
    // Change color if overdue and not completed
    let liClasses = `p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl transition-all duration-200`;
    if (task.completed) {
        liClasses += ' bg-color-light-pink task-completed';
    } else if (isOverdue) {
        // Warning color for overdue tasks
        liClasses += ' bg-red-100 hover:shadow-lg border-l-4 border-red-500';
    } else {
        liClasses += ' bg-white hover:shadow-md';
    }
    li.className = liClasses;
    li.setAttribute('data-id', taskId);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex-grow mr-4 w-full';

    const textSpan = document.createElement('span');
    textSpan.className = 'color-dark-berry text-base sm:text-lg block mb-1 ' + (task.completed ? 'task-completed' : 'font-medium');
    textSpan.textContent = task.text;

    // Deadline element
    if (hasDeadline) {
        const deadlineDate = new Date(task.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const deadlineElement = document.createElement('span');
        
        let deadlineClasses = 'text-xs flex items-center mt-1';
        let iconHtml;

        if (task.completed) {
            deadlineClasses += ' text-gray-400';
            iconHtml = `<i data-lucide="calendar-check" class="w-4 h-4 mr-1"></i>`;
        } else if (isOverdue) {
            deadlineClasses += ' text-red-600 font-bold';
            iconHtml = `<i data-lucide="alert-circle" class="w-4 h-4 mr-1"></i>`;
            deadlineElement.innerHTML = iconHtml + ` OVERDUE: ${deadlineDate}`;
        } else {
            deadlineClasses += ' text-gray-500';
            iconHtml = `<i data-lucide="calendar" class="w-4 h-4 mr-1"></i>`;
        }

        if (!isOverdue) {
            deadlineElement.innerHTML = iconHtml + ` Deadline: ${deadlineDate}`;
        }
        
        deadlineElement.className = deadlineClasses;
        contentDiv.appendChild(deadlineElement);
    }
    
    contentDiv.appendChild(textSpan);
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'flex items-center space-x-2 shrink-0 mt-3 sm:mt-0'; // Responsive margin fix
    
    // Toggle Complete Button
    const completeBtn = document.createElement('button');
    completeBtn.onclick = () => toggleComplete(taskId, task.completed);
    completeBtn.className = 'p-2 rounded-full hover:bg-color-mid-pink hover:bg-opacity-20 transition-colors';
    completeBtn.innerHTML = task.completed 
        ? `<i data-lucide="undo" class="w-5 h-5 text-color-mid-pink"></i>`
        : `<i data-lucide="check" class="w-5 h-5 text-color-mid-pink"></i>`;
    
    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.onclick = (e) => {
        e.stopPropagation(); // Prevents toggleComplete when the delete button is pressed
        deleteTask(taskId);
    };
    deleteBtn.className = 'p-2 rounded-full hover:bg-red-200 transition-colors';
    deleteBtn.innerHTML = `<i data-lucide="x" class="w-5 h-5 text-red-500"></i>`;
    
    actionsDiv.appendChild(completeBtn);
    actionsDiv.appendChild(deleteBtn);
    
    li.appendChild(contentDiv);
    li.appendChild(actionsDiv);
    
    setTimeout(() => createIcons({ icons }), 0); // Use fixed Lucide call
    
    return li;
}

/**
 * Updates the status text at the bottom of the list.
 */
function updateStatus(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const statusElement = document.getElementById('task-status');

    statusElement.innerHTML = `${completedTasks} tasks completed | ${totalTasks} total tasks`;
}

/**
 * Updates the active sidebar link styling.
 */
function updateSidebarActiveLink() {
    document.querySelectorAll('.filter-link').forEach(link => {
        link.classList.remove('bg-color-mid-pink', 'bg-opacity-80', 'text-white');
        link.classList.add('hover:bg-white', 'hover:text-color-dark-berry', 'text-white');
    });

    // Set active class based on current filter
    const activeLink = document.getElementById(`filter-${currentFilter}`);
    if (activeLink) {
        activeLink.classList.remove('hover:bg-white', 'hover:text-color-dark-berry');
        activeLink.classList.add('bg-color-mid-pink', 'bg-opacity-80', 'text-white');
    }
}

/**
 * Function to display a custom confirmation modal.
 */
function showCustomConfirmation(message, onConfirm) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = ''; // Clear container

    const modalHtml = `
        <div id="custom-modal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div class="bg-color-off-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                <h3 class="text-xl font-semibold color-dark-berry mb-4">Confirmation</h3>
                <p class="text-gray-700 mb-6">${message}</p>
                <div class="flex justify-end space-x-3">
                    <button id="modal-cancel" class="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                    <button id="modal-confirm" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold">Delete</button>
                </div>
            </div>
        </div>
    `;
    
    modalContainer.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('custom-modal');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');
    
    const closeModal = () => modalContainer.innerHTML = '';

    confirmBtn.onclick = () => {
        onConfirm();
        closeModal();
    };

    cancelBtn.onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target.id === 'custom-modal') {
            closeModal();
        }
    };
}

/**
 * Function to display a simple message modal (Error, Info).
 */
function showCustomModal(title, message, type = 'info') {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = ''; 

    const titleColor = type === 'error' ? 'text-red-600' : 'color-dark-berry';
    const icon = type === 'error' ? 'alert-triangle' : 'info';

    const modalHtml = `
        <div id="custom-alert-modal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div class="bg-color-off-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                <h3 class="text-xl font-semibold ${titleColor} mb-4 flex items-center">
                    <i data-lucide="${icon}" class="w-5 h-5 mr-2"></i> ${title}
                </h3>
                <p class="text-gray-700 mb-6">${message}</p>
                <div class="flex justify-end">
                    <button id="modal-close" class="px-4 py-2 bg-color-dark-berry text-white rounded-lg hover:bg-color-mid-pink transition-colors font-semibold">Close</button>
                </div>
            </div>
        </div>
    `;
    
    modalContainer.insertAdjacentHTML('beforeend', modalHtml);
    createIcons({ icons }); // Use fixed Lucide call

    const modal = document.getElementById('custom-alert-modal');
    const closeBtn = document.getElementById('modal-close');
    
    const closeModal = () => modalContainer.innerHTML = '';

    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target.id === 'custom-alert-modal') {
            closeModal();
        }
    };
}


// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
window.onload = () => {
    initializeFirebase();
    
    // Add event listener for the enter key on the input
    document.getElementById('task-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
};