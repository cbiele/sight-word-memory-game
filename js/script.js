// Global Variables for Game State
let firstCardId = null; 
let lockBoard = false;
let moves = 0;
let matchesFound = 0;
let time = 0;
let timerInterval;
let matchMap = {};

// --- UTILITY FUNCTIONS ---

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); 
        [array[i], array[j]] = [array[j], array[i]]; 
    }
    return array;
}

function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card'); 
    cardElement.id = card.id; 

    const frontFace = document.createElement('div');
    frontFace.classList.add('card-face', 'card-face-front');

    const backFace = document.createElement('div');
    backFace.classList.add('card-face', 'card-face-back');
    backFace.textContent = card.word; 

    cardElement.appendChild(frontFace);
    cardElement.appendChild(backFace);
    
    return cardElement;
}

function startTimer() {
    const timerDisplay = document.getElementById('clockID'); 
    if (timerInterval) return; 
    timerInterval = setInterval(() => {
        time++; 
        timerDisplay.textContent = `${time}s`; 
    }, 1000); 
}

function toggleAllCards() {
    const allCards = document.querySelectorAll('.card');
    allCards.forEach(card => {
        card.classList.toggle('is-flipped');
    });
}

function restartGame() {
    const modal = document.getElementById('final-message');
    const hsModal = document.getElementById('final-message-high-scores'); 
    if (modal) modal.remove(); 
    if (hsModal) hsModal.remove(); 
    
    moves = 0;
    matchesFound = 0;
    time = 0;
    firstCardId = null;
    
    document.getElementById('moves-display').textContent = 0;
    document.getElementById('clockID').textContent = '0s';

    window.location.reload(); 
}

// --- HIGH SCORE PERSISTENCE FUNCTIONS ---

function getHighScores() {
    const scoresJSON = localStorage.getItem('highScores');
    return scoresJSON ? JSON.parse(scoresJSON) : [];
}

function renderHighScores(scores) {
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Moves</th>
                    <th>Time (s)</th>
                </tr>
            </thead>
            <tbody>
    `;

    scores.forEach((score, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${score.name}</td>
                <td>${score.moves}</td>
                <td>${score.time}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    return html;
}

function saveHighScore(score) {
    const highScores = getHighScores(); 
    highScores.push(score);

    highScores.sort((a, b) => {
        if (a.moves === b.moves) {
            return a.time - b.time; 
        }
        return a.moves - b.moves; 
    });

    const topTenScores = highScores.slice(0, 10);
    localStorage.setItem('highScores', JSON.stringify(topTenScores));
}

function showHighScoresModal() {
    const highScores = getHighScores();

    const modal = document.createElement('div');
    modal.id = 'final-message-high-scores'; 

    modal.innerHTML = `
        <div class="message-content">
            <button id="close-modal-btn">X</button> 
            
            <h3>🏆 Current High Scores (Top 10)</h3>
            
            <div id="high-score-list">
                ${renderHighScores(highScores)}
            </div>

            <button id="restart-btn">Restart Game</button> 
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        modal.remove(); 
    });
    
    document.getElementById('restart-btn').addEventListener('click', restartGame);
}


// --- CORE GAME LOGIC ---

function initializeGame(wordList) {
    const leftGrid = document.getElementById('left-grid');
    const rightGrid = document.getElementById('right-grid');
    
    leftGrid.innerHTML = '';
    rightGrid.innerHTML = '';
    
    // Using 12 words (pairs) as per the revised requirement (3x4 grid)
    const GAME_WORD_COUNT = 12; 
    const gameWords = wordList.slice(0, GAME_WORD_COUNT); 
    const leftCardObjects = [];
    const rightCardObjects = [];

    gameWords.forEach((word, index) => {
        const uniqueWordId = `${word}-${index}`; 
        
        const leftId = `${uniqueWordId}-L`;
        leftCardObjects.push({ word, id: leftId });

        const rightId = `${uniqueWordId}-R`;
        rightCardObjects.push({ word, id: rightId });

        matchMap[leftId] = rightId;
        matchMap[rightId] = leftId;
    });

    const shuffledRightObjects = shuffle(rightCardObjects);
    const shuffledLeftObjects = shuffle(leftCardObjects); 

    shuffledLeftObjects.forEach(card => {
        leftGrid.appendChild(createCardElement(card));
    });
    
    shuffledRightObjects.forEach(card => {
        rightGrid.appendChild(createCardElement(card));
    });

    const delegateClick = (event) => {
        const cardElement = event.target.closest('.card'); 

        if (cardElement) {
            handleCardClick(cardElement.id);
        }
    };
    
    leftGrid.addEventListener('click', delegateClick);
    rightGrid.addEventListener('click', delegateClick);
}

function handleCardClick(cardId) {
    const clickedCard = document.getElementById(cardId);
    
    if (lockBoard || clickedCard.classList.contains('matched') || clickedCard.classList.contains('is-flipped')) {
        return;
    }
    
    clickedCard.classList.add('is-flipped'); 
    
    if (firstCardId === null) {
        if (moves === 0) { 
            startTimer();
        }
        firstCardId = cardId;
        return; 
    } 
    
    else {
        moves++;
        document.getElementById('moves-display').textContent = moves;

        checkMatch(firstCardId, cardId);
        firstCardId = null; 
    }
}

function checkMatch(id1, id2) {
    const card1 = document.getElementById(id1);
    const card2 = document.getElementById(id2);
    
    if (matchMap[id1] === id2) {
        
        card1.style.pointerEvents = 'none';
        card2.style.pointerEvents = 'none';

        // FINAL FIX: Delay allows visual confirmation. Removing 'is-flipped' ensures 
        // the card is in the correct state (face-down) before 'matched' makes it disappear.
        setTimeout(() => {
            card1.classList.remove('is-flipped');
            card2.classList.remove('is-flipped');
            
            card1.classList.add('matched');
            card2.classList.add('matched');

            matchesFound++; 
            if (matchesFound === 12) {
                endGame(); 
            }
        }, 500); // 500ms delay for visual confirmation

    } else {
        lockBoard = true; 
        // UX IMPROVEMENT: Increased flip-back time for children.
        setTimeout(() => {
            card1.classList.remove('is-flipped');
            card2.classList.remove('is-flipped');
            lockBoard = false; 
        }, 1800); 
    }
}

function endGame() {
    clearInterval(timerInterval); 
    timerInterval = null;

    const highScores = getHighScores(); 
    const tenthPlaceMoves = highScores.length < 10 ? Infinity : highScores[9].moves;

    if (moves <= tenthPlaceMoves) {
        let playerName = prompt("New High Score! Enter your name (max 10 chars):", "Player");
        
        if (playerName) {
            playerName = playerName.trim().slice(0, 10);
        } else {
            playerName = "Anonymous";
        }
        
        const newScore = { name: playerName, moves, time };
        saveHighScore(newScore); 
    }
    
    const finalHighScores = getHighScores(); 

    const modal = document.createElement('div');
    modal.id = 'final-message';
    modal.innerHTML = `
        <div class="message-content">
            <button id="close-modal-btn">X</button> 
            
            <h2>🎉 Congratulations!</h2>
            <p>You solved all 12 pairs of sight words!</p>
            <p>Your Score: <strong>${moves}</strong> moves in <strong>${time}</strong> seconds</p>
            
            <hr>
            
            <h3>🏆 Top 10 Scores (Moves)</h3>
            <div id="high-score-list">
                ${renderHighScores(finalHighScores)} 
            </div>

            <button id="restart-btn">Restart Game</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('restart-btn').addEventListener('click', restartGame); 
    
    // FIX: Add listener for the standard close button ID
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        modal.remove();
    });
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Core game button listeners
    document.getElementById('toggle-reveal-btn').addEventListener('click', toggleAllCards);
    document.getElementById('high-scores-btn').addEventListener('click', showHighScoresModal);

    // 2. Load game words
    fetch('../data/words.JSON')
        .then(response => response.json())
        .then(wordList => {
            initializeGame(wordList);
        })
        .catch(error => console.error('Error loading words:', error));
});