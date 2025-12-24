// Application State
const App = {
    currentScreen: 'players',
    currentMatch: null,
    currentMatchPlayers: [],
    currentPlayerIndex: 0,
    currentDart: 1,
    maxDartsPerTurn: 3,
    undoHistory: [],
    
    init() {
        this.setupNavigation();
        this.loadPlayersScreen();
        this.loadNewGameScreen();
        this.loadHistoryScreen();
        this.loadStatsScreen();
        this.loadDataScreen();
        this.showScreen('players');
    },
    
    setupNavigation() {
        const navButtons = document.querySelectorAll('nav button');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const screen = btn.dataset.screen;
                this.showScreen(screen);
            });
        });
    },
    
    showScreen(screenName) {
        // Update nav buttons
        document.querySelectorAll('nav button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === screenName) {
                btn.classList.add('active');
            }
        });
        
        // Update screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(`${screenName}-screen`).classList.add('active');
        
        // Hide header during game to save space
        const header = document.querySelector('header');
        if (screenName === 'game') {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
        
        this.currentScreen = screenName;
        
        // Refresh data when switching to certain screens
        if (screenName === 'players') {
            this.refreshPlayerList();
        } else if (screenName === 'new-game') {
            this.refreshPlayerSelection();
        } else if (screenName === 'history') {
            this.refreshMatchHistory();
        } else if (screenName === 'stats') {
            this.refreshStats();
        }
    },
    
    // Player Management
    loadPlayersScreen() {
        const addBtn = document.getElementById('add-player-btn');
        addBtn.addEventListener('click', () => this.showAddPlayerModal());
        
        this.refreshPlayerList();
    },
    
    async refreshPlayerList() {
        const players = await DB.getAllPlayers();
        const container = document.getElementById('player-list');
        
        if (players.length === 0) {
            container.innerHTML = '<p class="text-center">No players yet. Add your first player to get started!</p>';
            return;
        }
        
        container.innerHTML = players.map(player => `
            <div class="player-card">
                <h3>${this.escapeHtml(player.name)}</h3>
                <p>Joined: ${new Date(player.createdDate).toLocaleDateString()}</p>
                <div class="actions">
                    <button class="btn-secondary" onclick="App.editPlayer(${player.id})">Edit</button>
                    <button class="btn-danger" onclick="App.deletePlayer(${player.id})">Delete</button>
                </div>
            </div>
        `).join('');
    },
    
    showAddPlayerModal() {
        const modal = document.getElementById('player-modal');
        const input = document.getElementById('player-name-input');
        const title = document.getElementById('player-modal-title');
        const saveBtn = document.getElementById('save-player-btn');
        
        title.textContent = 'Add New Player';
        input.value = '';
        modal.classList.add('active');
        
        saveBtn.onclick = async () => {
            const name = input.value.trim();
            if (name) {
                await DB.addPlayer(name);
                modal.classList.remove('active');
                this.refreshPlayerList();
                this.refreshPlayerSelection();
            }
        };
    },
    
    async editPlayer(playerId) {
        const player = await DB.getPlayer(playerId);
        const modal = document.getElementById('player-modal');
        const input = document.getElementById('player-name-input');
        const title = document.getElementById('player-modal-title');
        const saveBtn = document.getElementById('save-player-btn');
        
        title.textContent = 'Edit Player';
        input.value = player.name;
        modal.classList.add('active');
        
        saveBtn.onclick = async () => {
            const name = input.value.trim();
            if (name) {
                await DB.updatePlayer(playerId, { name: name });
                modal.classList.remove('active');
                this.refreshPlayerList();
                this.refreshPlayerSelection();
            }
        };
    },
    
    async deletePlayer(playerId) {
        if (confirm('Are you sure you want to delete this player? This will also delete their match history.')) {
            await DB.deletePlayer(playerId);
            this.refreshPlayerList();
            this.refreshPlayerSelection();
        }
    },
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },
    
    // New Game
    loadNewGameScreen() {
        const startBtn = document.getElementById('start-game-btn');
        startBtn.addEventListener('click', () => this.startNewGame());
        
        this.refreshPlayerSelection();
    },
    
    async refreshPlayerSelection() {
        const players = await DB.getAllPlayers();
        const container = document.getElementById('player-selection');
        
        if (players.length === 0) {
            container.innerHTML = '<p class="text-center">No players available. Add some players first!</p>';
            document.getElementById('start-game-btn').disabled = true;
            return;
        }
        
        document.getElementById('start-game-btn').disabled = false;
        
        container.innerHTML = players.map(player => `
            <label class="player-checkbox" for="player-${player.id}">
                <input type="checkbox" id="player-${player.id}" value="${player.id}">
                <span>${this.escapeHtml(player.name)}</span>
            </label>
        `).join('');
        
        // Add change listener to update checkbox styling
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const parent = e.target.closest('.player-checkbox');
                if (e.target.checked) {
                    parent.classList.add('selected');
                } else {
                    parent.classList.remove('selected');
                }
            });
        });
    },
    
    async startNewGame() {
        const selectedCheckboxes = document.querySelectorAll('#player-selection input[type="checkbox"]:checked');
        const playerIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
        
        if (playerIds.length < 2) {
            alert('Please select at least 2 players to start a game.');
            return;
        }
        
        // Create new match
        this.currentMatch = await DB.createMatch(playerIds);
        this.currentMatchPlayers = await DB.getMatchPlayers(this.currentMatch);
        this.currentPlayerIndex = 0;
        this.currentDart = 1;
        this.undoHistory = [];
        
        // Show game screen
        await this.setupGameScreen();
        this.showScreen('game');
    },
    
    // Game Screen
    async setupGameScreen() {
        const players = await Promise.all(
            this.currentMatchPlayers.map(mp => DB.getPlayer(mp.playerId))
        );
        
        const numPlayers = this.currentMatchPlayers.length;
        
        // Setup scoreboard with side-by-side layout
        const scoreboard = document.getElementById('scoreboard');
        const targets = [20, 19, 18, 17, 16, 15, 'bull'];
        
        // Create header row - spread players on left and right with center column for target labels
        let headerHtml = '<div class="score-grid-header" style="grid-template-columns: ';
        
        // For 2 players: 1fr 60px 1fr (player, number, player)
        // For 3+ players: repeat(n/2, 1fr) 60px repeat(n - n/2, 1fr)
        const leftPlayers = Math.floor(numPlayers / 2);
        const rightPlayers = numPlayers - leftPlayers;
        
        headerHtml += `repeat(${leftPlayers}, 1fr) 60px repeat(${rightPlayers}, 1fr);">`;
        
        // Add left side players
        for (let i = 0; i < leftPlayers; i++) {
            const mp = this.currentMatchPlayers[i];
            const player = players[i];
            headerHtml += `
                <div class="player-column ${i === 0 ? 'active' : ''}" id="player-column-${mp.id}">
                    <h2>${this.escapeHtml(player.name)}</h2>
                    <div class="points-display">Points: <span id="points-${mp.id}">0</span></div>
                </div>
            `;
        }
        
        // Empty space for target labels header
        headerHtml += '<div></div>';
        
        // Add right side players
        for (let i = leftPlayers; i < numPlayers; i++) {
            const mp = this.currentMatchPlayers[i];
            const player = players[i];
            headerHtml += `
                <div class="player-column ${i === 0 ? 'active' : ''}" id="player-column-${mp.id}">
                    <h2>${this.escapeHtml(player.name)}</h2>
                    <div class="points-display">Points: <span id="points-${mp.id}">0</span></div>
                </div>
            `;
        }
        headerHtml += '</div>';
        
        // Create rows for each target
        let rowsHtml = '<div class="score-grid-rows">';
        targets.forEach(target => {
            rowsHtml += `<div class="target-row" style="grid-template-columns: repeat(${leftPlayers}, 1fr) 60px repeat(${rightPlayers}, 1fr);">`;
            
            // Left side player cells
            for (let i = 0; i < leftPlayers; i++) {
                const mp = this.currentMatchPlayers[i];
                const marks = mp.marks[target] || 0;
                rowsHtml += `
                    <div class="target-cell" id="cell-${mp.id}-${target}">
                        <button class="hit-btn hit-single ${marks >= 1 ? 'hit' : ''}" 
                                onclick="App.recordHitDirect('${target}', 1, ${mp.id})" 
                                data-marks="1"
                                data-mark-label="I"></button>
                        <button class="hit-btn hit-double ${marks >= 2 ? 'hit' : ''}" 
                                onclick="App.recordHitDirect('${target}', 2, ${mp.id})" 
                                data-marks="2"
                                data-mark-label="II"></button>
                        <button class="hit-btn hit-triple ${marks >= 3 ? 'hit' : ''}" 
                                onclick="App.recordHitDirect('${target}', 3, ${mp.id})" 
                                data-marks="3"
                                data-mark-label="III"></button>
                    </div>
                `;
            }
            
            // Target label in center
            rowsHtml += `<div class="target-label">${target === 'bull' ? 'Bull' : target}</div>`;
            
            // Right side player cells
            for (let i = leftPlayers; i < numPlayers; i++) {
                const mp = this.currentMatchPlayers[i];
                const marks = mp.marks[target] || 0;
                rowsHtml += `
                    <div class="target-cell" id="cell-${mp.id}-${target}">
                        <button class="hit-btn hit-single ${marks >= 1 ? 'hit' : ''}" 
                                onclick="App.recordHitDirect('${target}', 1, ${mp.id})" 
                                data-marks="1"
                                data-mark-label="I"></button>
                        <button class="hit-btn hit-double ${marks >= 2 ? 'hit' : ''}" 
                                onclick="App.recordHitDirect('${target}', 2, ${mp.id})" 
                                data-marks="2"
                                data-mark-label="II"></button>
                        <button class="hit-btn hit-triple ${marks >= 3 ? 'hit' : ''}" 
                                onclick="App.recordHitDirect('${target}', 3, ${mp.id})" 
                                data-marks="3"
                                data-mark-label="III"></button>
                    </div>
                `;
            }
            
            rowsHtml += '</div>';
        });
        rowsHtml += '</div>';
        
        scoreboard.innerHTML = headerHtml + rowsHtml;
        
        this.updateCurrentPlayerDisplay();
        this.updateDartCounter();
        this.updateUndoButton();
    },
    
    renderCricketBoard(marks) {
        const targets = [20, 19, 18, 17, 16, 15, 'bull'];
        return targets.map(target => {
            const count = marks[target] || 0;
            const marksDisplay = this.getMarksDisplay(count);
            const closed = count >= 3 ? 'closed' : '';
            
            return `
                <div class="cricket-number ${closed}">
                    <span class="number">${target === 'bull' ? 'B' : target}</span>
                    <span class="marks">${marksDisplay}</span>
                </div>
            `;
        }).join('');
    },
    
    getMarksDisplay(count) {
        if (count === 0) return '';
        if (count === 1) return '/';
        if (count === 2) return 'X';
        if (count >= 3) return 'Ⓧ';
        return '';
    },
    
    setupDartInput() {
        const targets = [20, 19, 18, 17, 16, 15, 'bull'];
        const container = document.getElementById('target-buttons');
        
        container.innerHTML = targets.map(target => `
            <button class="target-btn" onclick="App.showMultiplierModal('${target}')">${target === 'bull' ? 'Bull' : target}</button>
        `).join('');
        
        document.getElementById('miss-btn').onclick = () => this.advanceDart();
        document.getElementById('end-game-btn').onclick = () => this.endGame();
    },
    
    updateCurrentPlayerDisplay() {
        const currentMp = this.currentMatchPlayers[this.currentPlayerIndex];
        
        // Update active player highlight
        document.querySelectorAll('.player-column').forEach(ps => ps.classList.remove('active'));
        const activeColumn = document.getElementById(`player-column-${currentMp.id}`);
        if (activeColumn) {
            activeColumn.classList.add('active');
        }
    },
    
    advanceDart() {
        this.currentDart++;
        
        if (this.currentDart > this.maxDartsPerTurn) {
            // Move to next player
            this.currentDart = 1;
            this.nextPlayer();
        }
        
        this.updateDartCounter();
        this.updateUndoButton();
    },
    
    updateDartCounter() {
        const counter = document.getElementById('dart-counter');
        if (counter) {
            counter.textContent = `Dart ${this.currentDart} of ${this.maxDartsPerTurn}`;
        }
    },
    
    updateUndoButton() {
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.disabled = this.undoHistory.length === 0;
        }
    },
    
    async undoLastAction() {
        if (this.undoHistory.length === 0) return;
        
        const lastAction = this.undoHistory.pop();
        
        // Find the player
        const mp = this.currentMatchPlayers.find(p => p.id === lastAction.playerId);
        if (!mp) return;
        
        // Restore state
        mp.marks = lastAction.oldMarks;
        mp.points = lastAction.oldPoints;
        
        // Update database
        await DB.updateMatchPlayer(mp.id, {
            marks: mp.marks,
            points: mp.points
        });
        
        // Restore player and dart position
        this.currentPlayerIndex = lastAction.playerIndex;
        this.currentDart = lastAction.dart;
        
        // Update UI
        this.updateGridCell(mp, lastAction.target);
        this.updatePointsDisplay(mp);
        this.updateCurrentPlayerDisplay();
        this.updateDartCounter();
        this.updateUndoButton();
    },
    
    showMultiplierModal(target) {
        this.currentTarget = target;
        const modal = document.getElementById('multiplier-modal');
        document.getElementById('multiplier-target').textContent = target === 'bull' ? 'Bull' : target;
        modal.classList.add('active');
    },
    
    async recordHitDirect(target, multiplier, clickedPlayerId) {
        // Only allow the current player to score
        const currentMp = this.currentMatchPlayers[this.currentPlayerIndex];
        if (currentMp.id !== clickedPlayerId) {
            return; // Ignore clicks on other players' buttons
        }
        
        await this.recordHit(target, multiplier);
    },
    
    async recordHit(target, multiplier) {
        const currentMp = this.currentMatchPlayers[this.currentPlayerIndex];
        
        // Save state for undo
        this.undoHistory.push({
            playerId: currentMp.id,
            playerIndex: this.currentPlayerIndex,
            dart: this.currentDart,
            target: target,
            oldMarks: {...currentMp.marks},
            oldPoints: currentMp.points
        });
        
        // Add marks based on multiplier
        const marksToAdd = multiplier;
        const currentMarks = currentMp.marks[target] || 0;
        const newMarks = currentMarks + marksToAdd;
        
        // Calculate how many marks actually count toward closing (max 3)
        const marksForClosing = Math.min(newMarks, 3);
        const excessMarks = Math.max(0, newMarks - 3);
        
        // Update marks
        currentMp.marks[target] = marksForClosing;
        
        // Calculate points if this number is closed and opponents haven't closed it
        let pointsEarned = 0;
        if (currentMarks >= 3 || (currentMarks < 3 && newMarks >= 3)) {
            // Check if any opponent hasn't closed this number
            const opponentsOpen = this.currentMatchPlayers.some(mp => {
                return mp.id !== currentMp.id && (mp.marks[target] || 0) < 3;
            });
            
            if (opponentsOpen) {
                // Score points for excess marks
                const targetValue = target === 'bull' ? 25 : parseInt(target);
                pointsEarned = excessMarks * targetValue;
            }
        } else if (currentMarks < 3 && newMarks < 3) {
            // Still working on closing, no points yet
            pointsEarned = 0;
        }
        
        // Update points
        currentMp.points = (currentMp.points || 0) + pointsEarned;
        
        // Update database
        await DB.updateMatchPlayer(currentMp.id, {
            marks: currentMp.marks,
            points: currentMp.points
        });
        
        // Update display
        this.updateGridCell(currentMp, target);
        this.updatePointsDisplay(currentMp);
        
        // Check for winner
        if (this.checkWinner(currentMp)) {
            await this.declareWinner(currentMp);
        } else {
            this.advanceDart();
        }
    },
    
    updatePointsDisplay(matchPlayer) {
        const pointsElement = document.getElementById(`points-${matchPlayer.id}`);
        if (pointsElement) {
            pointsElement.textContent = matchPlayer.points || 0;
        }
    },
    
    updateScoreboard(matchPlayer) {
        const board = document.getElementById(`cricket-board-${matchPlayer.id}`);
        board.innerHTML = this.renderCricketBoard(matchPlayer.marks);
    },
    
    updateGridCell(matchPlayer, target) {
        const cell = document.getElementById(`cell-${matchPlayer.id}-${target}`);
        if (!cell) return;
        
        const marks = matchPlayer.marks[target] || 0;
        const buttons = cell.querySelectorAll('.hit-btn');
        
        buttons.forEach((btn, index) => {
            if (marks >= (index + 1)) {
                btn.classList.add('hit');
            } else {
                btn.classList.remove('hit');
            }
        });
    },
    
    checkWinner(matchPlayer) {
        // Winner must close all numbers (have 3 marks on each)
        const targets = [20, 19, 18, 17, 16, 15, 'bull'];
        const allClosed = targets.every(target => matchPlayer.marks[target] >= 3);
        
        if (!allClosed) return false;
        
        // Also must have equal or more points than all opponents
        const currentPoints = matchPlayer.points || 0;
        const hasEnoughPoints = this.currentMatchPlayers.every(mp => {
            if (mp.id === matchPlayer.id) return true;
            return currentPoints >= (mp.points || 0);
        });
        
        return hasEnoughPoints;
    },
    
    async declareWinner(matchPlayer) {
        const player = await DB.getPlayer(matchPlayer.playerId);
        
        // Complete the match
        await DB.completeMatch(this.currentMatch, matchPlayer.playerId);
        
        // Show winner message
        if (confirm(`🎉 ${player.name} wins! Play another game?`)) {
            // Reset selections
            document.querySelectorAll('#player-selection input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
                cb.closest('.player-checkbox').classList.remove('selected');
            });
            this.showScreen('new-game');
        } else {
            this.showScreen('history');
        }
    },
    
    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.currentMatchPlayers.length;
        this.updateCurrentPlayerDisplay();
        this.updateDartCounter();
    },
    
    async endGame() {
        if (confirm('Are you sure you want to end this game? The match will be saved as incomplete.')) {
            // Don't mark as completed, just go back
            this.showScreen('new-game');
        }
    },
    
    // Match History
    loadHistoryScreen() {
        this.refreshMatchHistory();
    },
    
    async refreshMatchHistory() {
        const matches = await DB.getAllMatches();
        const container = document.getElementById('match-list');
        
        if (matches.length === 0) {
            container.innerHTML = '<p class="text-center">No matches played yet. Start a new game!</p>';
            return;
        }
        
        const matchCards = await Promise.all(matches.map(async match => {
            const matchPlayers = await DB.getMatchPlayers(match.id);
            const players = await Promise.all(
                matchPlayers.map(mp => DB.getPlayer(mp.playerId))
            );
            
            const playerNames = players.map(p => p.name).join(', ');
            let winnerText = '';
            
            if (match.completed && match.winnerId) {
                const winner = await DB.getPlayer(match.winnerId);
                winnerText = `<div class="match-winner">Winner: ${this.escapeHtml(winner.name)}</div>`;
            } else {
                winnerText = `
                    <div style="color: #6c757d; margin-bottom: 10px;">Incomplete</div>
                    <button class="btn-resume-match" onclick="event.stopPropagation(); App.resumeMatch(${match.id})">Resume</button>
                `;
            }
            
            return `
                <div class="match-card">
                    <div class="match-card-content" onclick="App.showMatchDetail(${match.id})">
                        <div class="match-date">${new Date(match.date).toLocaleString()}</div>
                        <div class="match-players">${this.escapeHtml(playerNames)}</div>
                        ${winnerText}
                    </div>
                    <button class="btn-delete-match" onclick="event.stopPropagation(); App.deleteMatch(${match.id})">Delete</button>
                </div>
            `;
        }));
        
        container.innerHTML = matchCards.join('');
    },
    
    async showMatchDetail(matchId) {
        const match = await DB.getMatch(matchId);
        const matchPlayers = await DB.getMatchPlayers(matchId);
        const players = await Promise.all(
            matchPlayers.map(mp => DB.getPlayer(mp.playerId))
        );
        
        let detailHtml = `
            <h2>Match Details</h2>
            <p><strong>Date:</strong> ${new Date(match.date).toLocaleString()}</p>
            <h3>Players & Scores</h3>
        `;
        
        for (let i = 0; i < matchPlayers.length; i++) {
            const mp = matchPlayers[i];
            const player = players[i];
            const isWinner = match.winnerId === player.id;
            
            detailHtml += `
                <div class="stat-card">
                    <h3>${this.escapeHtml(player.name)} ${isWinner ? '🏆' : ''}</h3>
                    <p><strong>Points:</strong> ${mp.points || 0}</p>
                    <div class="hit-breakdown">
                        ${Object.entries(mp.marks).map(([target, count]) => `
                            <div class="hit-item">
                                <div class="hit-target">${target === 'bull' ? 'Bull' : target}</div>
                                <div class="hit-count">${this.getMarksDisplay(count)} (${count})</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        const modal = document.getElementById('match-detail-modal');
        document.getElementById('match-detail-content').innerHTML = detailHtml;
        modal.classList.add('active');
    },
    
    async deleteMatch(matchId) {
        if (confirm('Are you sure you want to delete this match? This cannot be undone.')) {
            await DB.deleteMatch(matchId);
            this.refreshMatchHistory();
            this.refreshStats();
        }
    },
    
    async resumeMatch(matchId) {
        // Load the match data
        this.currentMatch = matchId;
        this.currentMatchPlayers = await DB.getMatchPlayers(matchId);
        this.currentPlayerIndex = 0;
        this.currentDart = 1;
        this.undoHistory = [];
        
        // Show game screen
        await this.setupGameScreen();
        this.showScreen('game');
    },
    
    // Statistics
    loadStatsScreen() {
        this.refreshStats();
    },
    
    async refreshStats() {
        const players = await DB.getAllPlayers();
        const container = document.getElementById('stats-container');
        const filterDropdown = document.getElementById('stats-player-filter');
        
        if (players.length === 0) {
            container.innerHTML = '<p class="text-center">No players yet. Add some players to see statistics!</p>';
            return;
        }
        
        // Update dropdown
        if (filterDropdown) {
            const currentValue = filterDropdown.value;
            filterDropdown.innerHTML = '<option value="all">All Players</option>' + 
                players.map(p => `<option value="${p.id}">${this.escapeHtml(p.name)}</option>`).join('');
            filterDropdown.value = currentValue;
            
            // Add change listener if not already added
            if (!filterDropdown.dataset.listenerAdded) {
                filterDropdown.addEventListener('change', () => this.refreshStats());
                filterDropdown.dataset.listenerAdded = 'true';
            }
        }
        
        // Filter players based on dropdown selection
        const selectedPlayerId = filterDropdown ? filterDropdown.value : 'all';
        const filteredPlayers = selectedPlayerId === 'all' 
            ? players 
            : players.filter(p => p.id === parseInt(selectedPlayerId));
        
        const statsCards = await Promise.all(filteredPlayers.map(async player => {
            const stats = await DB.getPlayerStats(player.id);
            
            if (stats.gamesPlayed === 0) {
                return `
                    <div class="stat-card">
                        <h3>${this.escapeHtml(player.name)}</h3>
                        <p>No games played yet.</p>
                    </div>
                `;
            }
            
            return `
                <div class="stat-card">
                    <h3>${this.escapeHtml(player.name)}</h3>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-value">${stats.gamesPlayed}</div>
                            <div class="stat-label">Games Played</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.wins}</div>
                            <div class="stat-label">Wins</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.losses}</div>
                            <div class="stat-label">Losses</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.winPercentage}%</div>
                            <div class="stat-label">Win Rate</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.averageMarksPerGame}</div>
                            <div class="stat-label">Avg Marks/Game</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.totalMarks}</div>
                            <div class="stat-label">Total Marks</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.averagePointsPerGame}</div>
                            <div class="stat-label">Avg Points/Game</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.totalPoints}</div>
                            <div class="stat-label">Total Points</div>
                        </div>
                    </div>
                    <h4 style="margin-top: 20px; margin-bottom: 10px;">Marks Breakdown</h4>
                    <div class="hit-breakdown">
                        ${Object.entries(stats.markBreakdown).map(([target, count]) => `
                            <div class="hit-item">
                                <div class="hit-target">${target === 'bull' ? 'Bull' : target}</div>
                                <div class="hit-count">${count}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }));
        
        container.innerHTML = statsCards.join('');
    },
    
    // Data Management
    loadDataScreen() {
        document.getElementById('export-data-btn').onclick = () => this.exportData();
        document.getElementById('import-data-btn').onclick = () => {
            document.getElementById('import-file-input').click();
        };
        document.getElementById('import-file-input').onchange = (e) => this.importData(e);
        document.getElementById('clear-data-btn').onclick = () => this.clearAllData();
    },
    
    async exportData() {
        const data = await DB.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `cricket-darts-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        alert('Data exported successfully!');
    },
    
    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await DB.importData(data);
                alert('Data imported successfully!');
                this.refreshPlayerList();
                this.refreshPlayerSelection();
                this.refreshMatchHistory();
                this.refreshStats();
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    },
    
    async clearAllData() {
        if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
            if (confirm('Really? This will delete all players, matches, and statistics permanently!')) {
                await db.players.clear();
                await db.matches.clear();
                await db.matchPlayers.clear();
                alert('All data cleared.');
                this.refreshPlayerList();
                this.refreshPlayerSelection();
                this.refreshMatchHistory();
                this.refreshStats();
            }
        }
    },
    
    // Utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});