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
// MODAL & TOGGLE SWITCH LOGIC
// =========================================

const cards = document.querySelectorAll('.card');
const modal = document.getElementById('sensorModal');
const typeSelect = document.getElementById('sensorType');
const saveBtn = document.getElementById('saveModalBtn');
const cancelBtn = document.getElementById('cancelModalBtn');

let activeCardTitle = null; 

// 1. Prevent clicking the toggle switch from opening the modal
const toggleContainers = document.querySelectorAll('.toggle-container');
toggleContainers.forEach(container => {
    container.addEventListener('click', function(event) {
        event.stopPropagation(); // Stops the click from registering on the card behind it
    });
});

// 2. Listen for clicks on the cards to open the modal
cards.forEach(card => {
    card.addEventListener('click', function() {
        activeCardTitle = this.querySelector('h3');
        typeSelect.value = "";
        modal.style.display = 'flex';
    });
});

// 3. Handle toggling ON and OFF
const sensorToggles = document.querySelectorAll('.sensor-toggle');
sensorToggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
        // The visual change (Green/Grey) is handled entirely by your CSS.
        // We removed the code that reverted the title text here.
        // Now, flipping the switch leaves the selected option exactly as it is!
    });
});

// 4. Listen for the Cancel button on the modal
cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// 5. Listen for the Apply/Save button on the modal
saveBtn.addEventListener('click', () => {
    if (typeSelect.value !== "") {
        // Save the selection in the background
        activeCardTitle.dataset.assigned = typeSelect.value;
        
        // Find the toggle switch for this specific card
        const toggle = activeCardTitle.closest('.card').querySelector('.sensor-toggle');
        
        // Automatically turn the toggle ON and update the text so the user sees their change
        toggle.checked = true;
        activeCardTitle.textContent = typeSelect.value;
    }
    
    modal.style.display = 'none';
});