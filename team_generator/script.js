document.addEventListener('DOMContentLoaded', function () {
    let numParticipants = 0;
    let participants = [];
    let redTeam = [];
    let blueTeam = [];
    let ricalcoliCount = 0;

    const numParticipantsInput = document.getElementById('numParticipants');
    const participantsInputSection = document.getElementById('participantsInputSection');
    const namesGrid = document.getElementById('namesGrid');
    const generaBtn = document.getElementById('generaBtn');
    const azzeraBtn = document.getElementById('azzeraBtn');
    const rigeneraBtn = document.getElementById('rigeneraBtn');
    const impostaBtn = document.getElementById('impostaBtn');
    const teamsSection = document.getElementById('teamsSection');
    const loadingSection = document.getElementById('loadingSection');
    const redTeamList = document.getElementById('redTeam');
    const blueTeamList = document.getElementById('blueTeam');
    const participantsTab = document.getElementById('participantsTab');
    const ricalcoliValue = document.getElementById('ricalcoliValue');
    const totalPlayersEl = document.getElementById('totalPlayers');
    const redCountEl = document.getElementById('redCount');
    const blueCountEl = document.getElementById('blueCount');

    impostaBtn.addEventListener('click', setParticipants);
    generaBtn.addEventListener('click', generateTeams);
    azzeraBtn.addEventListener('click', resetTeams);
    rigeneraBtn.addEventListener('click', regenerateTeams);

    numParticipantsInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            setParticipants();
        }
    });

    function setParticipants() {
        numParticipants = parseInt(numParticipantsInput.value);

        if (isNaN(numParticipants) || numParticipants < 2 || numParticipants > 20) {
            showNotification('⚠️ Inserisci un numero tra 2 e 20', 'error');
            numParticipantsInput.focus();
            return;
        }

        participants = [];
        namesGrid.innerHTML = '';

        for (let i = 0; i < numParticipants; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'name-input-wrapper';
            
            const numberLabel = document.createElement('span');
            numberLabel.className = 'name-number';
            numberLabel.textContent = `#${i + 1}`;
            
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.placeholder = `Giocatore ${i + 1}`;
            inputField.id = `participant${i}`;
            inputField.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const nextInput = document.getElementById(`participant${i + 1}`);
                    if (nextInput) {
                        nextInput.focus();
                    } else {
                        generateTeams();
                    }
                }
            });
            
            wrapper.appendChild(numberLabel);
            wrapper.appendChild(inputField);
            namesGrid.appendChild(wrapper);
        }

        participantsTab.classList.add('hidden');
        participantsInputSection.classList.remove('hidden');
        
        setTimeout(() => {
            document.getElementById('participant0').focus();
        }, 100);
    }

    function generateTeams() {
        participants = [];
        for (let i = 0; i < numParticipants; i++) {
            const participantName = document.getElementById(`participant${i}`).value.trim();
            if (participantName) {
                participants.push(participantName);
            }
        }

        if (participants.length < 2) {
            showNotification('⚠️ Inserisci almeno 2 nomi', 'error');
            return;
        }

        participantsInputSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');

        setTimeout(() => {
            const shuffledParticipants = shuffle(participants);
            redTeam = shuffledParticipants.slice(0, Math.ceil(shuffledParticipants.length / 2));
            blueTeam = shuffledParticipants.slice(Math.ceil(shuffledParticipants.length / 2));

            displayTeams();

            loadingSection.classList.add('hidden');
            teamsSection.classList.remove('hidden');
            
            updateStats();
        }, 1500);
    }

    function shuffle(array) {
        let shuffledArray = array.slice();
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }

    function displayTeams() {
        redTeamList.innerHTML = '';
        blueTeamList.innerHTML = '';

        redTeam.forEach((member, index) => {
            const li = document.createElement('li');
            li.style.animationDelay = `${index * 0.1}s`;
            
            if (index === 0) {
                li.classList.add('captain-item');
                li.innerHTML = `
                    <span>${member}</span>
                    <span class="captain-badge">
                        <span>👑</span>
                        <span>Captain</span>
                    </span>
                `;
            } else {
                li.innerHTML = `<span>${member}</span>`;
            }
            
            redTeamList.appendChild(li);
        });

        blueTeam.forEach((member, index) => {
            const li = document.createElement('li');
            li.style.animationDelay = `${index * 0.1}s`;
            
            if (index === 0) {
                li.classList.add('captain-item');
                li.innerHTML = `
                    <span>${member}</span>
                    <span class="captain-badge">
                        <span>👑</span>
                        <span>Captain</span>
                    </span>
                `;
            } else {
                li.innerHTML = `<span>${member}</span>`;
            }
            
            blueTeamList.appendChild(li);
        });
    }

    function updateStats() {
        totalPlayersEl.textContent = participants.length;
        redCountEl.textContent = redTeam.length;
        blueCountEl.textContent = blueTeam.length;
        ricalcoliValue.textContent = ricalcoliCount;
    }




    function regenerateTeams() {
        teamsSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');

        setTimeout(() => {
            const shuffledParticipants = shuffle(participants);
            redTeam = shuffledParticipants.slice(0, Math.ceil(shuffledParticipants.length / 2));
            blueTeam = shuffledParticipants.slice(Math.ceil(shuffledParticipants.length / 2));

            displayTeams();
            
            ricalcoliCount++;
            updateStats();

            loadingSection.classList.add('hidden');
            teamsSection.classList.remove('hidden');
            
            showNotification('✅ Squadre rigenerate!', 'success');
        }, 1500);
    }

    function resetTeams() {
        redTeam = [];
        blueTeam = [];
        participants = [];
        ricalcoliCount = 0;
        
        teamsSection.classList.add('hidden');
        participantsTab.classList.remove('hidden');
        
        numParticipantsInput.value = '';
        numParticipantsInput.focus();
        
        showNotification('🔄 Reset completato', 'success');
    }

    function showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const styles = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.875rem;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        
        notification.style.cssText = styles;
        
        if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            notification.style.color = 'white';
        } else if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            notification.style.color = 'white';
        } else {
            notification.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
            notification.style.color = 'white';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
