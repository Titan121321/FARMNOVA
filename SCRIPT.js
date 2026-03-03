// =========================================
// GOOGLE SHEETS API SETUP
// =========================================
const GOOGLE_APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzgBGo4ml7UWiXXyesRzgAeYB1bmV7XAUR2EdVU5PXlf10E64zGdh6vSmXMogrOEeXf/exec"; // PASTE YOUR URL HERE

const REVERSE_TYPE_MAP = { "LDR": 1, "Temperature": 2, "Humidity": 3, "MQ135": 4, "Soil Moisture": 5 };

// =========================================
// PAGE NAVIGATION & BUTTON LOGIC
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
        
        fetchLiveSensorData();
    }, 1200);
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'flex';
});

document.getElementById('refreshBtn').addEventListener('click', async function() {
    const btn = this;
    const originalText = btn.textContent;
    btn.textContent = "Refreshing..."; 
    
    await fetchLiveSensorData(); 
    
    setTimeout(() => { btn.textContent = originalText; }, 500);
});

// =========================================
// TWO-WAY GOOGLE SHEETS SYNC LOGIC
// =========================================

// 1. READ FROM GOOGLE SHEETS
async function fetchLiveSensorData() {
    if (GOOGLE_APP_SCRIPT_URL === "YOUR_WEB_APP_URL_HERE") return; 
    
    try {
        const response = await fetch(GOOGLE_APP_SCRIPT_URL + "?action=read");
        const data = await response.json(); 
        
        data.forEach(sensor => {
            let cardElement = document.querySelector(`h3[data-id="${sensor.pin}"]`);
            if (!cardElement) return;
            
            let card = cardElement.closest('.card');
            let targetReading = card.querySelector('.card-text p:nth-of-type(1)');
            let targetDesired = card.querySelector('.desired-display');
            let toggle = card.querySelector('.sensor-toggle');
            
            // Fetch live reading
            let liveVal = (sensor.live !== "" && sensor.live !== null) ? sensor.live : "--";
            targetReading.textContent = "Reading: " + liveVal;
            
            if (card.dataset.locked === "true") return; 
            
            // Fetch desired value
            let desiredVal = (sensor.desired_value !== "" && sensor.desired_value !== null) ? sensor.desired_value : "";
            cardElement.dataset.desired = desiredVal;
            targetDesired.textContent = "Desired: " + (desiredVal !== "" ? desiredVal : "--");
            
            // Convert Pin assignment
            let parsedPin = parseInt(sensor.out_pin, 10);
            cardElement.dataset.pin = (!isNaN(parsedPin)) ? String(parsedPin) : "";
            
            // Toggle state
            let isEnabled = (sensor.enable == 1);
            toggle.checked = isEnabled;
        });
    } catch (error) {
        console.error("Error fetching Google Sheets data:", error);
    }
}

setInterval(fetchLiveSensorData, 4000); 

// 2. WRITE TO GOOGLE SHEETS (Using GET to bypass CORS)
function updateGoogleSheet(pin, enable, typeName, out_pin, desired) {
    if (GOOGLE_APP_SCRIPT_URL === "YOUR_WEB_APP_URL_HERE") return;
    
    let typeVal = REVERSE_TYPE_MAP[typeName] || "";
    let parsedOutPin = out_pin ? parseInt(out_pin, 10) : ""; 
    
    let url = `${GOOGLE_APP_SCRIPT_URL}?action=write&pin=${pin}&enable=${enable}&type=${typeVal}&out_pin=${parsedOutPin}&desired=${desired}`;
    
    fetch(url).catch(err => console.error("Error writing to Google Sheets:", err));
}

// =========================================
// MODAL & TOGGLE SWITCH LOGIC
// =========================================

const cards = document.querySelectorAll('.card');
const modal = document.getElementById('sensorModal');
const desiredInput = document.getElementById('sensorDesired');
const pinSelect = document.getElementById('sensorPin');
const saveBtn = document.getElementById('saveModalBtn');
const cancelBtn = document.getElementById('cancelModalBtn');

const sensorToggles = document.querySelectorAll('.sensor-toggle');

let activeCardTitle = null; 

const toggleContainers = document.querySelectorAll('.toggle-container');
toggleContainers.forEach(container => {
    container.addEventListener('click', function(event) { event.stopPropagation(); });
});

cards.forEach(card => {
    card.addEventListener('click', function() {
        activeCardTitle = this.querySelector('h3');
        desiredInput.value = activeCardTitle.dataset.desired || "";
        
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

sensorToggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
        const card = this.closest('.card');
        const title = card.querySelector('h3');
        const pinNumber = title.dataset.id; 
        const isEnabled = this.checked ? 1 : 0;
        
        card.dataset.locked = "true";
        setTimeout(() => { card.dataset.locked = "false"; }, 10000);
        
        updateGoogleSheet(pinNumber, isEnabled, title.dataset.assigned, title.dataset.pin, title.dataset.desired);
    });
});

cancelBtn.addEventListener('click', () => { 
    modal.style.display = 'none'; 
});

saveBtn.addEventListener('click', () => {
    if (!activeCardTitle) return; 

    const card = activeCardTitle.closest('.card');
    const toggle = card.querySelector('.sensor-toggle');
    
    card.dataset.locked = "true";
    setTimeout(() => { card.dataset.locked = "false"; }, 10000);
    
    toggle.checked = true;
    
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
    
    const pinNumber = activeCardTitle.dataset.id;
    updateGoogleSheet(pinNumber, 1, activeCardTitle.dataset.assigned, activeCardTitle.dataset.pin, rawDesiredValue);
    
    modal.style.display = 'none';
});