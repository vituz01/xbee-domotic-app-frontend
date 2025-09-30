
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : `http://${window.location.hostname}:3000`;

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

    if (mode === 'ppt') {
        config.ppt_email = document.getElementById('email').value || currentConfig.ppt_email;
        config.ppt_link = document.getElementById('pptLink')?.value || currentConfig.ppt_link;
        if (!config.ppt_email) {
            showAlert('Email richiesta per la modalità PowerPoint', 'error');
            return;
        }
        // ppt_link is optional; if provided, validate URL format
        if (config.ppt_link && !isValidHttpUrl(config.ppt_link)) {
            showAlert('Link PPT non valido. Inserire un URL valido (https://...)', 'error');
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

    // Invia al server per led/chromecast/ppt
    fetch(`${API_BASE_URL}/api/config`, {
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
        case 'ppt':
            const pptEmail = currentConfig.ppt_email || document.getElementById('email').value;
            const pptLink = currentConfig.ppt_link || document.getElementById('pptLink')?.value;
            if (!pptEmail || pptEmail.trim() === '') {
                return {
                    isValid: false,
                    message: 'Email richiesta per la modalità PowerPoint. Compilare il campo nella configurazione.'
                };
            }
            // pptLink is optional; if provided, validate URL format
            if (pptLink && pptLink.trim() !== '' && !isValidHttpUrl(pptLink)) {
                return {
                    isValid: false,
                    message: 'Link PPT non valido. Inserire un URL valido (https://...)'
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
            // Nessun parametro richiesto
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
    fetch(`${API_BASE_URL}/api/config`)
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

function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
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

    fetch(`${API_BASE_URL}/api/config`, {
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
            case 'ppt':
                    if (!config.ppt_email || config.ppt_email.trim() === '') {
                        return {
                            isValid: false,
                            message: 'Email richiesta per la modalità PowerPoint corrente'
                        };
                    }
                    // ppt_link optional; if provided validate format
                    if (config.ppt_link && config.ppt_link.trim() !== '' && !isValidHttpUrl(config.ppt_link)) {
                        return {
                            isValid: false,
                            message: 'Link PPT non valido. Inserire un URL valido (https://...)'
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
        fetch(`${API_BASE_URL}/api/status`)
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
        document.getElementById('email').value = currentConfig.ppt_email || '';
        const pptInput = document.getElementById('pptLink');
        if (pptInput) pptInput.value = currentConfig.ppt_link || '';
        document.getElementById('chromecastName').value = currentConfig.chromecast_name || '';
        document.getElementById('youtubeId').value = currentConfig.youtube_video_id || '';

        // Aggiorna indicatori di parametri richiesti
        updateRequiredFieldIndicators(currentMode);

        // Aggiorna last update
        if (currentConfig.last_updated) {
            const lastUpdate = new Date(currentConfig.last_updated);
            document.getElementById('lastUpdate').textContent = lastUpdate.toLocaleString('it-IT');
        }

        // Mostra link PPT se presente
        const pptContainer = document.getElementById('pptLinkContainer');
        const currentPptLink = document.getElementById('currentPptLink');
        if (currentConfig.ppt_link) {
            if (pptContainer) pptContainer.style.display = 'block';
            if (currentPptLink) {
                currentPptLink.href = currentConfig.ppt_link;
                currentPptLink.textContent = currentConfig.ppt_link;
            }
        } else {
            if (pptContainer) pptContainer.style.display = 'none';
        }
    }

    function updateRequiredFieldIndicators(currentMode) {
        // Rimuovi tutti gli indicatori richiesti esistenti
        document.querySelectorAll('.required-indicator').forEach(el => el.remove());

        // Aggiungi indicatori per la modalità corrente
        if (currentMode === 'ppt') {
            addRequiredIndicator('email', 'Richiesto per modalità PowerPoint');
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