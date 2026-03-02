// =========================================
// GOOGLE SHEETS API SETUP
// =========================================
const GOOGLE_APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw6_VCYxOT9wBPBCCEOfmSo5EBfNmlZfkeTNUGtsGoQiOxcfucgz7OSiWqZaj9qH29U/exec"; // PASTE URL HERE

// Mapping table to convert numbers from Sheets (1-5) into Text for the website, and vice versa
const TYPE_MAP = { 1: "LDR", 2: "Temperature", 3: "Humidity", 4: "MQ135", 5: "Soil Moisture" };
const REVERSE_TYPE_MAP = { "LDR": 1, "Temperature": 2, "Humidity": 3, "MQ135": 4, "Soil Moisture": 5 };

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
        
        // Start pulling real data instantly when dashboard opens
        fetchLiveSensorData();
    }, 1200);
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'flex';
});

// =========================================
// TWO-WAY GOOGLE SHEETS SYNC LOGIC
// =========================================

// 1. READ FROM GOOGLE SHEETS
async function fetchLiveSensorData() {
    if (GOOGLE_APP_SCRIPT_URL === "YOUR_WEB_APP_URL_HERE") return; // Safety check
    
    try {
        const response = await fetch(GOOGLE_APP_SCRIPT_URL + "?action=read");
        const data = await response.json(); // Array of 9 rows from the sheet
        
        data.forEach(sensor => {
            let targetReading = document.getElementById('s' + sensor.pin + '-val');
            let targetDesired = document.getElementById('s' + sensor.pin + '-desired');
            
            if (targetReading && targetDesired) {
                let card = targetReading.closest('.card');
                let titleElement = card.querySelector('h3');
                let toggle = card.querySelector('.sensor-toggle');
                
                // Fetch the live reading
                let liveVal = (sensor.live !== "" && sensor.live !== null) ? sensor.live : "--";
                targetReading.textContent = "Reading: " + liveVal;
                
                // Fetch the desired value
                let desiredVal = (sensor.desired_value !== "" && sensor.desired_value !== null) ? sensor.desired_value : "";
                titleElement.dataset.desired = desiredVal;
                targetDesired.textContent = "Desired: " + (desiredVal !== "" ? desiredVal : "--");
                
                // Fetch Type and Output Pin
                let typeName = TYPE_MAP[sensor.type] || "";
                titleElement.dataset.assigned = typeName;
                titleElement.dataset.pin = sensor.out_pin || "";
                
                // Fetch Enable (Toggle) State
                let isEnabled = (sensor.enable == 1);
                toggle.checked = isEnabled;
                
                if (isEnabled && typeName !== "") {
                    titleElement.textContent = typeName;
                } else {
                    titleElement.textContent = titleElement.dataset.default;
                }
            }
        });
    } catch (error) {
        console.error("Error fetching Google Sheets data:", error);
    }
}

// Ask sheets for updates every 4 seconds
setInterval(fetchLiveSensorData, 4000); 

// 2. WRITE TO GOOGLE SHEETS
function updateGoogleSheet(pin, enable, typeName, out_pin, desired) {
    if (GOOGLE_APP_SCRIPT_URL === "YOUR_WEB_APP_URL_HERE") return;
    
    let typeVal = REVERSE_TYPE_MAP[typeName] || ""; // Convert text back to 1-5
    let url = `${GOOGLE_APP_SCRIPT_URL}?action=write&pin=${pin}&enable=${enable}&type=${typeVal}&out_pin=${out_pin}&desired=${desired}`;
    
    // We use mode: 'no-cors' so the browser fires the command invisibly in the background without waiting
    fetch(url, { method: 'POST', mode: 'no-cors' }).catch(err => console.error(err));
}

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

// Prevent clicking the toggle switch from opening the modal
const toggleContainers = document.querySelectorAll('.toggle-container');
toggleContainers.forEach(container => {
    container.addEventListener('click', function(event) { event.stopPropagation(); });
});

// Listen for clicks on the cards to open the modal
cards.forEach(card => {
    card.addEventListener('click', function() {
        activeCardTitle = this.querySelector('h3');
        typeSelect.value = activeCardTitle.dataset.assigned || "";
        desiredInput.value = activeCardTitle.dataset.desired || "";
        
        // The Grey-out logic for used pins works perfectly here because fetchLiveSensorData 
        // constantly updates activeCardTitle.dataset.pin from the master Google Sheet!
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

// Handle toggling ON and OFF
const sensorToggles = document.querySelectorAll('.sensor-toggle');
sensorToggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
        const card = this.closest('.card');
        const title = card.querySelector('h3');
        const pinNumber = title.dataset.default.replace('Sensor ', ''); // Extracts "1" from "Sensor 1"
        const isEnabled = this.checked ? 1 : 0;
        
        // Silently push the new toggle state to Google Sheets
        updateGoogleSheet(pinNumber, isEnabled, title.dataset.assigned, title.dataset.pin, title.dataset.desired);
    });
});

// Listen for Cancel
cancelBtn.addEventListener('click', () => { modal.style.display = 'none'; });

// Listen for Apply
saveBtn.addEventListener('click', () => {
    if (typeSelect.value !== "") {
        activeCardTitle.dataset.assigned = typeSelect.value;
        const toggle = activeCardTitle.closest('.card').querySelector('.sensor-toggle');
        toggle.checked = true;
        activeCardTitle.textContent = typeSelect.value;
    }
    
    let rawDesiredValue = desiredInput.value;
    if (rawDesiredValue !== "") {
        let floatVal = parseFloat(rawDesiredValue);
        if (!isNaN(floatVal)) { rawDesiredValue = Math.round(floatVal).toString(); } 
        else { rawDesiredValue = ""; }
    }
    
    activeCardTitle.dataset.desired = rawDesiredValue;
    
    const desiredDisplay = activeCardTitle.parentElement.querySelector('.desired-display');
    if (rawDesiredValue !== "") { desiredDisplay.textContent = "Desired: " + rawDesiredValue; } 
    else { desiredDisplay.textContent = "Desired: --"; }

    activeCardTitle.dataset.pin = pinSelect.value;
    
    // SEND UPDATES TO GOOGLE SHEETS
    const pinNumber = activeCardTitle.dataset.default.replace('Sensor ', '');
    const isEnabled = activeCardTitle.closest('.card').querySelector('.sensor-toggle').checked ? 1 : 0;
    updateGoogleSheet(pinNumber, isEnabled, activeCardTitle.dataset.assigned, activeCardTitle.dataset.pin, rawDesiredValue);
    
    modal.style.display = 'none';
});