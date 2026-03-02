// =========================================
// PAGE NAVIGATION LOGIC
// =========================================

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    if (usernameInput === "" || passwordInput === "") {
        errorMessage.textContent = "Please fill in both fields.";
        return;
    }
    
    errorMessage.style.color = "#2c7a3f"; 
    errorMessage.textContent = "Authenticating... Loading dashboard.";
    
    setTimeout(() => {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'flex';
        document.getElementById('loginForm').reset();
        errorMessage.textContent = "";
        
        simulateAllSensors();
    }, 1200);
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'flex';
});

// =========================================
// SENSOR DATA SIMULATION
// =========================================

function simulateAllSensors() {
    for (let i = 1; i <= 9; i++) {
        let randomValue = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
        let targetElement = document.getElementById('s' + i + '-val');
        
        if (targetElement) {
            targetElement.textContent = "Reading: " + randomValue;
        }
    }
}

setInterval(simulateAllSensors, 3000);

// =========================================
// MODAL / POP-UP LOGIC
// =========================================

// Grab the elements needed for the pop-up
const cards = document.querySelectorAll('.card');
const modal = document.getElementById('sensorModal');
const typeSelect = document.getElementById('sensorType');
const saveBtn = document.getElementById('saveModalBtn');
const cancelBtn = document.getElementById('cancelModalBtn');

let activeCardTitle = null; // This will remember which card we clicked on

// 1. Listen for clicks on EVERY card in the grid
cards.forEach(card => {
    card.addEventListener('click', function() {
        // Find the <h3> element specifically inside the card that was clicked
        activeCardTitle = this.querySelector('h3');
        
        // Reset the dropdown back to default empty state
        typeSelect.value = "";
        
        // Show the modal
        modal.style.display = 'flex';
    });
});

// 2. Listen for the Cancel button
cancelBtn.addEventListener('click', () => {
    // Hide the modal without making changes
    modal.style.display = 'none';
});

// 3. Listen for the Apply/Save button
saveBtn.addEventListener('click', () => {
    // If the user actually selected a dropdown option
    if (typeSelect.value !== "") {
        // Change the text of the previously clicked card's title
        activeCardTitle.textContent = typeSelect.value;
    }
    
    // Hide the modal after saving
    modal.style.display = 'none';
});