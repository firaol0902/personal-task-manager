const forgotForm = document.getElementById('forgot-form');
const forgotEmail = document.getElementById('forgot-email');
const forgotMessage = document.getElementById('forgot-message');

forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    forgotMessage.style.color = '#3498db';
    forgotMessage.textContent = 'Sending reset link...';

    try {
        const response = await fetch('https://personal-task-manager-1-mwy4.onrender.com/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotEmail.value })
        });

        const data = await response.json();

        if (response.ok) {
            forgotMessage.style.color = '#27ae60';
            forgotMessage.textContent = data.message || 'Password reset email sent! Check your inbox.';
        } else {
            forgotMessage.style.color = '#e74c3c';
            forgotMessage.textContent = data.error || data.message || 'Something went wrong.';
        }
    } catch (err) {
        console.error(err);
        forgotMessage.style.color = '#e74c3c';
        forgotMessage.textContent = 'Failed to connect to the server.';
    }
});