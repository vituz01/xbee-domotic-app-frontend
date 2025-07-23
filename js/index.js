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
    // Verifica parametri richiesti per la modalità
    const validationResult = validateModeParameters(mode);
    if (!validationResult.isValid) {
        showAlert(validationResult.message, 'error');
        return;
    }

    // Aggiorna UI
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // Prepara configurazione con parametri richiesti
    const config = { modalità_corrente: mode };
    
    // Aggiungi parametri richiesti in base alla modalità
    if (mode === 'web') {
        config.web_url = document.getElementById('webUrl').value || currentConfig.web_url;
        if (!config.web_url) {
            showAlert('URL web richiesto per la modalità web', 'error');
            return;
        }
    } else if (mode === 'chromecast') {
        config.chromecast_name = document.getElementById('chromecastName').value || currentConfig.chromecast_name;
        config.youtube_video_id = document.getElementById('youtubeId').value || currentConfig.youtube_video_id;
        if (!config.chromecast_name || !config.youtube_video_id) {
            showAlert('Nome Chromecast/Youtube video ID richiesto per la modalità chromecast', 'error');
            return;
        }
    }

    // Invia al server
    fetch('http://localhost:3000/api/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert('Modalità cambiata con successo!', 'success');
                document.getElementById('currentMode').textContent = mode.toUpperCase();
                currentConfig.modalità_corrente = mode;
            } else {
                showAlert(`Errore nel cambio modalità: ${data.message || 'Errore sconosciuto'}`, 'error');
            }
        })
        .catch(error => {
            showAlert('Errore di connessione', 'error');
            console.error('Errore:', error);
        });
}

function validateModeParameters(mode) {
    switch (mode) {
        case 'web':
            const webUrl = currentConfig.web_url || document.getElementById('webUrl').value;
            if (!webUrl || webUrl.trim() === '') {
                return {
                    isValid: false,
                    message: 'URL web richiesto per la modalità web. Compilare il campo nella configurazione.'
                };
            }
            break;
        
        case 'chromecast':
            const chromecastName = currentConfig.chromecast_name || document.getElementById('chromecastName').value;
            const youtubeId = currentConfig.youtube_video_id || document.getElementById('youtubeId').value;
            if (!chromecastName || chromecastName.trim() === '') {
                return {
                    isValid: false,
                    message: 'Nome Chromecast richiesto per la modalità chromecast. Compilare il campo nella configurazione.'
                };
            }
            if (!youtubeId || youtubeId.trim() === '') {
                return {
                    isValid: false,
                    message: 'Youtube video ID richiesto per la modalità chromecast. Compilare il campo nella configurazione.'
                };
            }
            break;
        
        case 'led':
            // Nessun parametro richiesto per queste modalità
            break;
        
        default:
            return {
                isValid: false,
                message: 'Modalità non riconosciuta'
            };
    }
    
    return { isValid: true };
}

function loadConfig() {
    fetch('http://localhost:3000/api/config')
        .then(response => response.json())
        .then(data => {
            currentConfig = data;
            updateUI();
        })
        .catch(error => {
            showAlert('Errore caricamento configurazione', 'error');
            console.error('Errore:', error);
        });
}

function saveConfig() {
    const formData = new FormData(document.getElementById('configForm'));
    const config = {};

    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '') {
            config[key] = value;
        }
    }

    // Aggiungi la modalità corrente se esiste
    if (currentConfig.modalità_corrente) {
        config.modalità_corrente = currentConfig.modalità_corrente;
        
        // Valida parametri richiesti per la modalità corrente
        const validationResult = validateConfigForMode(config, currentConfig.modalità_corrente);
        if (!validationResult.isValid) {
            showAlert(validationResult.message, 'error');
            return;
        }
    }

    fetch('http://localhost:3000/api/config', {
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
                showAlert(`Errore salvataggio configurazione: ${data.message || 'Errore sconosciuto'}`, 'error');
            }
        })
        .catch(error => {
            showAlert('Errore di connessione', 'error');
            console.error('Errore:', error);
        });
}

function validateConfigForMode(config, mode) {
    switch (mode) {
        case 'web':
            if (!config.web_url || config.web_url.trim() === '') {
                return {
                    isValid: false,
                    message: 'URL web richiesto per la modalità web corrente'
                };
            }
            break;
        
        case 'chromecast':
            if (!config.chromecast_name || config.chromecast_name.trim() === '') {
                return {
                    isValid: false,
                    message: 'Nome Chromecast richiesto per la modalità chromecast corrente'
                };
            }
            break;
    }
    
    return { isValid: true };
}

function updateStatus() {
    fetch('http://localhost:3000/api/status')
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
            console.error('Errore status:', error);
        });
}

function updateUI() {
    // Aggiorna modalità attiva
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('active');
    });

    const currentMode = currentConfig.modalità_corrente || 'led';
    const modeCard = document.querySelector(`[data-mode="${currentMode}"]`);
    if (modeCard) {
        modeCard.classList.add('active');
    }
    document.getElementById('currentMode').textContent = currentMode.toUpperCase();

    // Aggiorna campi form
    document.getElementById('webUrl').value = currentConfig.web_url || '';
    document.getElementById('chromecastName').value = currentConfig.chromecast_name || '';
    document.getElementById('youtubeId').value = currentConfig.youtube_video_id || '';

    // Aggiorna indicatori di parametri richiesti
    updateRequiredFieldIndicators(currentMode);

    // Aggiorna last update
    if (currentConfig.last_updated) {
        const lastUpdate = new Date(currentConfig.last_updated);
        document.getElementById('lastUpdate').textContent = lastUpdate.toLocaleString('it-IT');
    }
}

function updateRequiredFieldIndicators(currentMode) {
    // Rimuovi tutti gli indicatori richiesti esistenti
    document.querySelectorAll('.required-indicator').forEach(el => el.remove());
    
    // Aggiungi indicatori per la modalità corrente
    if (currentMode === 'web') {
        addRequiredIndicator('webUrl', 'Richiesto per modalità web');
    } else if (currentMode === 'chromecast') {
        addRequiredIndicator('chromecastName', 'Richiesto per modalità chromecast');
    }
}

function addRequiredIndicator(fieldId, tooltip) {
    const field = document.getElementById(fieldId);
    if (field) {
        const indicator = document.createElement('span');
        indicator.className = 'required-indicator';
        indicator.textContent = ' *';
        indicator.style.color = '#dc3545';
        indicator.title = tooltip;
        
        const label = field.closest('.form-group')?.querySelector('label');
        if (label && !label.querySelector('.required-indicator')) {
            label.appendChild(indicator);
        }
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