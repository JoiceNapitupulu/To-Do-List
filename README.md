Markdown

# To-Do List

## Overview

This is a simple and elegant to-do list application with a clean and modern aesthetic. It allows users to add, complete, and delete tasks. The application also supports deadlines and filtering of tasks. It is built with HTML, CSS (Tailwind CSS), and JavaScript, and uses Firebase for data persistence with a local storage fallback.

## Key Features

* **Add and Manage Tasks:** Easily add new tasks with optional deadlines.
* **Task Status:** Mark tasks as complete or undo completion.
* **Delete Tasks:** Delete tasks with a confirmation modal to prevent accidental deletions.
* **Advanced Filtering:** Filter tasks by status: all, active, and completed.
* **Real-time Synchronization:** Seamless data synchronization with Firebase Firestore.
* **Offline Fallback:** Offline functionality with a local storage fallback.
* **Responsive Interface:** An elegant and responsive design for an optimal user experience.

## Technologies Used

* **HTML5:** For the application structure.
* **CSS3 & Tailwind CSS:** For styling and responsive design.
* **JavaScript (ES6+):** For the application logic and interactivity.
* **Firebase:** For authentication and real-time database (Firestore).
* **Lucide Icons:** For clean and modern icons.

## Installation Prerequisites

Before you begin, ensure you have the following prerequisites:

1.  A modern web browser (e.g., Chrome, Firefox, Safari).
2.  (Optional) A Firebase account for real-time data synchronization.

## Project Structure

.
├── index.html
├── style.css
├── script.js
└── README.md


## Usage Examples

* **Adding a task:** Type your task in the input field and press Enter or click the "Add Task" button.
* **Setting a deadline:** Click on the date input field to select a deadline for your task.
* **Completing a task:** Click the checkmark icon next to a task to mark it as complete.
* **Deleting a task:** Click the 'x' icon to delete a task.
* **Filtering tasks:** Use the navigation links on the left to filter tasks.

## Contributions

Contributions are welcome! Please fork this repository and create a pull request with your changes.

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/awesome-feature-name`).
3.  Commit your changes (`git commit -m 'Add some awesome feature'`).
4.  Push to the branch (`git push origin feature/awesome-feature-name`).
5.  Open a Pull Request.


## License

This project is licensed under the [MIT License](LICENSE).
