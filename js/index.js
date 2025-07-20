let currentConfig = {};

// Carica configurazione all'avvio
document.addEventListener('DOMContentLoaded', function () {
    loadConfig();
    updateStatus();

    // Aggiorna status ogni 30 secondi
    setInterval(updateStatus, 30000);
});

// Gestione click modalità
document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', function () {
        const mode = this.dataset.mode;
        selectMode(mode);
    });
});

// Gestione form configurazione
document.getElementById('configForm').addEventListener('submit', function (e) {
    e.preventDefault();
    saveConfig();
});

// Gestione bottoni
document.getElementById('refreshBtn').addEventListener('click', updateStatus);

function selectMode(mode) {
    // Aggiorna UI
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // Aggiorna configurazione
    currentConfig.modalità_corrente = mode;

    // Invia al server
    fetch('/api/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modalità_corrente: mode })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert('Modalità cambiata con successo!', 'success');
                document.getElementById('currentMode').textContent = mode.toUpperCase();
            } else {
                showAlert('Errore nel cambio modalità', 'error');
            }
        })
        .catch(error => {
            showAlert('Errore di connessione', 'error');
        });
}

function loadConfig() {
    fetch('/api/config')
        .then(response => response.json())
        .then(data => {
            currentConfig = data;
            updateUI();
        })
        .catch(error => {
            showAlert('Errore caricamento configurazione', 'error');
        });
}

function saveConfig() {
    const formData = new FormData(document.getElementById('configForm'));
    const config = {};

    for (let [key, value] of formData.entries()) {
        config[key] = value;
    }

    fetch('/api/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert('Configurazione salvata!', 'success');
                loadConfig();
            } else {
                showAlert('Errore salvataggio configurazione', 'error');
            }
        })
        .catch(error => {
            showAlert('Errore di connessione', 'error');
        });
}

function updateStatus() {
    fetch('/api/status')
        .then(response => response.json())
        .then(data => {
            const statusDot = document.getElementById('statusDot');
            const statusText = document.getElementById('statusText');

            if (data.status === 'running') {
                statusDot.style.background = '#28a745';
                statusText.textContent = 'Sistema in funzione';
            } else {
                statusDot.style.background = '#dc3545';
                statusText.textContent = 'Sistema offline';
            }

            const lastUpdate = new Date(data.timestamp);
            document.getElementById('lastUpdate').textContent = lastUpdate.toLocaleString('it-IT');
        })
        .catch(error => {
            document.getElementById('statusDot').style.background = '#ffc107';
            document.getElementById('statusText').textContent = 'Errore connessione';
        });
}

function updateUI() {
    // Aggiorna modalità attiva
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('active');
    });

    const currentMode = currentConfig.modalità_corrente || 'led';
    document.querySelector(`[data-mode="${currentMode}"]`).classList.add('active');
    document.getElementById('currentMode').textContent = currentMode.toUpperCase();

    // Aggiorna campi form
    document.getElementById('webUrl').value = currentConfig.web_url || '';
    document.getElementById('pptPath').value = currentConfig.ppt_path || '';
    document.getElementById('chromecastName').value = currentConfig.chromecast_name || '';
    document.getElementById('youtubeId').value = currentConfig.youtube_video_id || '';

    // Aggiorna last update
    if (currentConfig.last_updated) {
        const lastUpdate = new Date(currentConfig.last_updated);
        document.getElementById('lastUpdate').textContent = lastUpdate.toLocaleString('it-IT');
    }
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.style.maxWidth = '300px';

    alertContainer.appendChild(alert);

    // Rimuovi dopo 5 secondi
    setTimeout(() => {
        alert.remove();
    }, 5000);
}