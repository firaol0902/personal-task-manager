const API_URL = 'http://localhost:5000';
let isRegistering = false;

// Toggle between Login and Register views
document.getElementById('toggle-auth').addEventListener('click', (e) => {
    e.preventDefault();
    isRegistering = !isRegistering;
    document.getElementById('form-title').innerText = isRegistering ? 'Create Account' : 'Welcome Back';
    document.getElementById('auth-btn').innerText = isRegistering ? 'Register' : 'Login';
    document.getElementById('username-field').style.display = isRegistering ? 'block' : 'none';
    document.getElementById('toggle-text').innerText = isRegistering ? 'Already have an account?' : "Don't have an account?";
    document.getElementById('toggle-auth').innerText = isRegistering ? 'Login here' : 'Register here';
});

// Handle Login / Registration Form Submission
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegistering ? { username, email, password } : { email, password };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Authentication failed');
            return;
        }

        if (isRegistering) {
            alert('Registration successful! Please log in.');
            isRegistering = false;
            document.getElementById('toggle-auth').click();
        } else {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            showDashboard(data.user.username);
        }
    } catch (err) {
        console.error('Auth error:', err);
        alert('Could not connect to server.');
    }
});

// Handle Task Creation Form Submission
document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('task-title');
    const title = titleInput.value.trim();
    const token = localStorage.getItem('token');

    if (!title) return;

    try {
        const response = await fetch(`${API_URL}/api/tasks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.error || 'Failed to create task');
            return;
        }

        titleInput.value = '';
        loadTasks();
    } catch (err) {
        console.error('Task creation error:', err);
    }
});

// Fetch and Display Tasks
async function loadTasks() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) logoutUser();
            return;
        }

        const tasks = await response.json();
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="empty-msg">No tasks yet. Add one above to get started!</p>';
            return;
        }

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="task-info">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTaskCompletion('${task._id}', ${!task.completed})">
                    <span class="task-title">${task.title}</span>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" onclick="editTask('${task._id}', '${task.title.replace(/'/g, "\\'")}')">Edit</button>
                    <button class="delete-btn" onclick="deleteTask('${task._id}')">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    } catch (err) {
        console.error('Error loading tasks:', err);
    }
}

// Delete Task Function
async function deleteTask(id) {
    const token = localStorage.getItem('token');
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_URL}/api/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            alert('Failed to delete task');
            return;
        }

        loadTasks();
    } catch (err) {
        console.error('Delete error:', err);
    }
}

// Edit Task Function
async function editTask(id, currentTitle) {
    const newTitle = prompt('Edit your task:', currentTitle);
    if (newTitle === null || newTitle.trim() === '') return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: newTitle.trim() })
        });

        if (!response.ok) {
            alert('Failed to update task');
            return;
        }

        loadTasks();
    } catch (err) {
        console.error('Update error:', err);
    }
}

// Toggle Task Completion Status
async function toggleTaskCompletion(id, completedStatus) {
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completed: completedStatus })
        });
        loadTasks();
    } catch (err) {
        console.error('Toggle completion error:', err);
    }
}

// Display Dashboard View
function showDashboard(username) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('welcome-user').innerText = `Welcome back, ${username}!`;
    loadTasks();
}

// Handle Logout Action
function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
}

document.getElementById('logout-btn').addEventListener('click', logoutUser);

// Persistent session check on load
const savedToken = localStorage.getItem('token');
const savedUsername = localStorage.getItem('username');
if (savedToken && savedUsername) {
    showDashboard(savedUsername);
}
