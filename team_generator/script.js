document.addEventListener('DOMContentLoaded', function () {
    let numParticipants = 0;
    let participants = [];
    let redTeam = [];
    let blueTeam = [];
	let ricalcoliCount = 0;

    const numParticipantsInput = document.getElementById('numParticipants');
    const participantsInputSection = document.getElementById('participantsInputSection');
    const generaBtn = document.getElementById('generaBtn');
    const azzeraBtn = document.getElementById('azzeraBtn');
    const rigeneraBtn = document.getElementById('rigeneraBtn');
    const azzeraAllBtn = document.getElementById('azzeraAllBtn');
    const impostaBtn = document.getElementById('impostaBtn');
    const participantsLabel = document.getElementById('participantsLabel');
    const teamsSection = document.getElementById('teamsSection');
    const redTeamList = document.getElementById('redTeam');
    const blueTeamList = document.getElementById('blueTeam');
    const participantsTab = document.getElementById('participantsTab');
    const loadingSpinner = document.getElementById('loadingSpinner'); // Rotellina di caricamento
	const ricalcoliValue = document.getElementById('ricalcoliValue');
	const ricalcoliCounter = document.getElementById('ricalcoliCounter');
	
    impostaBtn.addEventListener('click', setParticipants);
    generaBtn.addEventListener('click', generateTeams);
    azzeraBtn.addEventListener('click', resetTeams);
    rigeneraBtn.addEventListener('click', regenerateTeams);
    azzeraAllBtn.addEventListener('click', resetAllParticipants);

    function setParticipants() {
        numParticipants = parseInt(numParticipantsInput.value);

        if (numParticipants < 2 || numParticipants > 20) {
            alert('Il numero dei partecipanti deve essere tra 2 e 20.');
            return;
        }

        participants = [];
        
        participantsLabel.classList.add('hidden');
        numParticipantsInput.classList.add('hidden');
        impostaBtn.classList.add('hidden');
        
        participantsInputSection.innerHTML = '<h2>Inserisci i nomi dei partecipanti</h2>';

        for (let i = 0; i < numParticipants; i++) {
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.placeholder = `Partecipante ${i + 1}`;
            inputField.id = `participant${i}`;
            participantsInputSection.appendChild(inputField);
        }

        participantsInputSection.classList.remove('hidden');
        teamsSection.classList.add('hidden');
        participantsTab.classList.add('hidden');
        generaBtn.classList.remove('hidden');
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
            alert('Devi inserire almeno 2 partecipanti.');
            return;
        }

        loadingSpinner.classList.remove('hidden'); // Mostra la rotellina

        setTimeout(() => {
            const shuffledParticipants = shuffle(participants);
            redTeam = shuffledParticipants.slice(0, Math.ceil(shuffledParticipants.length / 2));
            blueTeam = shuffledParticipants.slice(Math.ceil(shuffledParticipants.length / 2));

            displayTeams();

            participantsInputSection.classList.add('hidden');
            participantsTab.classList.remove('hidden');
            teamsSection.classList.remove('hidden');
            generaBtn.classList.add('hidden');
            rigeneraBtn.classList.remove('hidden');
            azzeraBtn.classList.remove('hidden');

            loadingSpinner.classList.add('hidden'); // Nascondi la rotellina
        }, 2000); // 2 secondi di caricamento
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

  // Mostra la Squadra Rossa
  redTeam.forEach((member, index) => {
    const li = document.createElement('li');
    if (index === 0) {
      li.classList.add('first');
    }
    li.innerHTML = `${member} ${index === 0 ? '<span class="captain">C</span>' : ''}`;
    li.style.backgroundColor = "#E74C3C"; // Colore Rosso per la squadra Rossa
    li.style.color = "white"; // Colore del testo bianco
    redTeamList.appendChild(li);

    // Aggiungi la classe 'show' con ritardo
    setTimeout(() => {
      li.classList.add('show'); // Applica la classe 'show' per farlo apparire
    }, index * 1000); // Ritardo di 1 secondo per ogni elemento
  });

  // Mostra la Squadra Blu
  blueTeam.forEach((member, index) => {
    const li = document.createElement('li');
    if (index === 0) {
      li.classList.add('first');
    }
    li.innerHTML = `${member} ${index === 0 ? '<span class="captain">C</span>' : ''}`;
    li.style.backgroundColor = "#3498DB"; // Colore Blu per la squadra Blu
    li.style.color = "white"; // Colore del testo bianco
    blueTeamList.appendChild(li);

    // Aggiungi la classe 'show' con ritardo
    setTimeout(() => {
      li.classList.add('show'); // Applica la classe 'show' per farlo apparire
    }, index * 1000); // Ritardo di 1 secondo per ogni elemento
  });
}




	function regenerateTeams() {
		loadingSpinner.classList.remove('hidden'); // Mostra la rotellina

		setTimeout(() => {
			const shuffledParticipants = shuffle(participants);
			redTeam = shuffledParticipants.slice(0, Math.ceil(shuffledParticipants.length / 2));
			blueTeam = shuffledParticipants.slice(Math.ceil(shuffledParticipants.length / 2));

			displayTeams();

			// Incrementa il contatore dei ricalcoli
			ricalcoliCount++;
			ricalcoliValue.textContent = ricalcoliCount;
			ricalcoliCounter.classList.remove('hidden'); // Mostra il contatore

			loadingSpinner.classList.add('hidden'); // Nascondi la rotellina
		}, 2000); // 2 secondi di caricamento
	}


	function resetTeams() {
		redTeam = [];
		blueTeam = [];
		participants = [];
		
		participantsInputSection.classList.add('hidden');
		numParticipantsInput.classList.remove('hidden');
		participantsTab.classList.remove('hidden');
		participantsLabel.classList.remove('hidden');
		impostaBtn.classList.remove('hidden');
		generaBtn.classList.add('hidden');
		azzeraBtn.classList.add('hidden');
		rigeneraBtn.classList.add('hidden');
		teamsSection.classList.add('hidden');

		// Resetta il contatore dei ricalcoli
		ricalcoliCount = 0;
		ricalcoliValue.textContent = ricalcoliCount;
		ricalcoliCounter.classList.add('hidden'); // Nascondi il contatore
	}
	function resetTeams() {
		redTeam = [];
		blueTeam = [];
		participants = [];
		
		participantsInputSection.classList.add('hidden');
		numParticipantsInput.classList.remove('hidden');
		participantsTab.classList.remove('hidden');
		participantsLabel.classList.remove('hidden');
		impostaBtn.classList.remove('hidden');
		generaBtn.classList.add('hidden');
		azzeraBtn.classList.add('hidden');
		rigeneraBtn.classList.add('hidden');
		teamsSection.classList.add('hidden');

		// Resetta il contatore dei ricalcoli
		ricalcoliCount = 0;
		ricalcoliValue.textContent = ricalcoliCount;
		ricalcoliCounter.classList.add('hidden'); // Nascondi il contatore
	}


	function resetAllParticipants() {
		participants = [];
		redTeam = [];
		blueTeam = [];

		participantsInputSection.innerHTML = '';
		participantsTab.classList.remove('hidden');
		numParticipantsInput.classList.remove('hidden');
		participantsInputSection.classList.add('hidden');
		impostaBtn.classList.remove('hidden');
		generaBtn.classList.add('hidden');
		azzeraBtn.classList.add('hidden');
		rigeneraBtn.classList.add('hidden');
		teamsSection.classList.add('hidden');

		// Resetta il contatore dei ricalcoli
		ricalcoliCount = 0;
		ricalcoliValue.textContent = ricalcoliCount;
		ricalcoliCounter.classList.add('hidden'); // Nascondi il contatore
	}

});
