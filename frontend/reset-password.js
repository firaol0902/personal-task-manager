const resetForm = document.getElementById('reset-form');
const newPasswordInput = document.getElementById('new-password');
const resetMessage = document.getElementById('reset-message');

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    resetMessage.style.color = '#e74c3c';
    resetMessage.textContent = 'Invalid or missing password reset token.';
    resetForm.style.display = 'none';
}

resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resetMessage.style.color = '#3498db';
    resetMessage.textContent = 'Updating password...';

    try {
        const response = await fetch('https://personal-task-manager-1-mwy4.onrender.com/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword: newPasswordInput.value })
        });

        const data = await response.json();

        if (response.ok) {
            resetMessage.style.color = '#27ae60';
            resetMessage.textContent = data.message || 'Password updated successfully! Redirecting to login...';
            resetForm.style.display = 'none';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else {
            resetMessage.style.color = '#e74c3c';
            resetMessage.textContent = data.error || data.message || 'Failed to reset password.';
        }
    } catch (err) {
        console.error(err);
        resetMessage.style.color = '#e74c3c';
        resetMessage.textContent = 'Failed to connect to the server.';
    }
});