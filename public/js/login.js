document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('https://expenses-tracking-application1.onrender.com/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }) // Send form data as JSON
            });

            const data = await response.json();

            if (response.ok) {
                // Display success message and redirect after 2 seconds
                showStatusMessage('Login successful. Redirecting...', 'green');
                localStorage.setItem('token', data.accessToken); // Store the token in localStorage
                setTimeout(() => window.location.href = '/Dashboard', 2000);
            } else {
                // Display error message
                showStatusMessage(data.message || 'Login failed.Check Your Username and Password again', 'red');
            }
        } catch (error) {
            console.error('Error during login:', error);
            showStatusMessage('An error occurred during login.', 'red'); // Display error message
        }
    });

    // Add event listeners to close buttons in modals
    document.querySelectorAll('.close, #okButton').forEach(btn => {
        btn.onclick = function() {
            this.closest('.modal').style.display = 'none'; // Close the modal when the close or OK button is clicked
        }
    });

    // Hide modals when clicking outside of them
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none'; // Close modal if clicked outside of it
        }
    };
});

// Show Password feature
const passwordInput = document.getElementById('password');
const showPasswordCheckbox = document.getElementById('showPassword');

showPasswordCheckbox.addEventListener('change', function () {
    passwordInput.type = showPasswordCheckbox.checked ? 'text' : 'password';
});

// Function to show status message in a modal
function showStatusMessage(message, color) {
    const modal = document.getElementById('statusMessageModal');
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message; // Set the message text
    statusMessage.style.color = color; // Set the message color
    modal.style.display = 'block'; // Show the modal
}