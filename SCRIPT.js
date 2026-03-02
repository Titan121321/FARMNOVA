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
// SENSOR DATA SIMULATION & DISPLAY LOGIC
// =========================================

function simulateAllSensors() {
    for (let i = 1; i <= 9; i++) {
        let readingElement = document.getElementById('s' + i + '-val');
        let desiredElement = document.getElementById('s' + i + '-desired');
        
        if (readingElement && desiredElement) {
            // 1. Simulate the live reading
            let randomValue = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
            readingElement.textContent = "Reading: " + randomValue;
            
            // 2. Fetch and display the desired value below it
            let titleElement = readingElement.previousElementSibling;
            let savedDesired = titleElement.dataset.desired;
            
            if (savedDesired && savedDesired !== "") {
                desiredElement.textContent = "Desired: " + savedDesired;
            } else {
                desiredElement.textContent = "Desired: --";
            }
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
const desiredInput = document.getElementById('sensorDesired');
const pinSelect = document.getElementById('sensorPin');
const saveBtn = document.getElementById('saveModalBtn');
const cancelBtn = document.getElementById('cancelModalBtn');

let activeCardTitle = null; 

// 1. Prevent clicking the toggle switch from opening the modal
const toggleContainers = document.querySelectorAll('.toggle-container');
toggleContainers.forEach(container => {
    container.addEventListener('click', function(event) {
        event.stopPropagation();
    });
});

// 2. Listen for clicks on the cards to open the modal
cards.forEach(card => {
    card.addEventListener('click', function() {
        activeCardTitle = this.querySelector('h3');
        
        typeSelect.value = activeCardTitle.dataset.assigned || "";
        desiredInput.value = activeCardTitle.dataset.desired || "";
        
        // Output Pin Logic (Grey out used pins)
        const allTitles = document.querySelectorAll('.card h3');
        const usedPins = [];
        
        allTitles.forEach(title => {
            if (title !== activeCardTitle && title.dataset.pin) {
                usedPins.push(title.dataset.pin);
            }
        });

        Array.from(pinSelect.options).forEach(option => {
            if (option.value === "") return; 
            if (usedPins.includes(option.value)) {
                option.disabled = true; 
            } else {
                option.disabled = false; 
            }
        });
        
        pinSelect.value = activeCardTitle.dataset.pin || "";
        modal.style.display = 'flex';
    });
});

// 3. Handle toggling ON and OFF
const sensorToggles = document.querySelectorAll('.sensor-toggle');
sensorToggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
        // Maintained without resetting
    });
});

// 4. Listen for the Cancel button
cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// 5. Listen for the Apply/Save button
saveBtn.addEventListener('click', () => {
    // Save Sensor Type & Toggle
    if (typeSelect.value !== "") {
        activeCardTitle.dataset.assigned = typeSelect.value;
        const toggle = activeCardTitle.closest('.card').querySelector('.sensor-toggle');
        toggle.checked = true;
        activeCardTitle.textContent = typeSelect.value;
    }
    
    // --- ROUND FLOAT TO INTEGER LOGIC ---
    let rawDesiredValue = desiredInput.value;
    
    if (rawDesiredValue !== "") {
        let floatVal = parseFloat(rawDesiredValue);
        
        if (!isNaN(floatVal)) {
            rawDesiredValue = Math.round(floatVal).toString();
        } else {
            rawDesiredValue = ""; 
        }
    }
    
    // Save to the card's data
    activeCardTitle.dataset.desired = rawDesiredValue;
    
    // Immediately display the updated desired value below the reading
    const desiredDisplay = activeCardTitle.parentElement.querySelector('.desired-display');
    if (rawDesiredValue !== "") {
        desiredDisplay.textContent = "Desired: " + rawDesiredValue;
    } else {
        desiredDisplay.textContent = "Desired: --";
    }

    // Save output pin
    activeCardTitle.dataset.pin = pinSelect.value;
    
    modal.style.display = 'none';
});