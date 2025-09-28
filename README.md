# To-Do List

## Overview

This is a simple and elegant to-do list application with a clean and modern aesthetic. It allows users to add, complete, and delete tasks. The application also supports deadlines and filtering of tasks. It is built with HTML, CSS (Tailwind CSS), and JavaScript, and uses Firebase for data persistence with a local storage fallback.

## Project Structure

```
├───index.html
├───style.css
├───script.js
└───README.md
```

## Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd To-do-list
    ```
3.  **Open `index.html` in your browser.**

    *Note: For Firebase integration, you will need to create a Firebase project and add your Firebase configuration to the `script.js` file.*

## Features

*   Add tasks with optional deadlines.
*   Mark tasks as complete or undo completion.
*   Delete tasks with a confirmation modal.
*   Filter tasks by all, active, and completed status.
*   Real-time data synchronization with Firebase Firestore.
*   Local storage fallback for offline use.
*   Elegant and responsive user interface.

## Usage Guidelines

*   **Adding a task:** Type your task in the input field and press Enter or click the "Add Task" button.
*   **Setting a deadline:** Click on the date input field to select a deadline for your task.
*   **Completing a task:** Click the checkmark icon next to a task to mark it as complete.
*   **Deleting a task:** Click the 'x' icon to delete a task.
*   **Filtering tasks:** Use the navigation links on the left to filter tasks.

## License

This project is licensed under the [MIT License](LICENSE).
