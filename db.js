// Database configuration using Dexie.js
const db = new Dexie('CricketDartsDB');

// Define the database schema
db.version(1).stores({
    players: '++id, name, createdDate',
    matches: '++id, date, *playerIds, winnerId',
    matchPlayers: '++id, matchId, playerId, marks, points'
});

// Player object structure:
// {
//   id: auto-increment,
//   name: string,
//   createdDate: Date
// }

// Match object structure:
// {
//   id: auto-increment,
//   date: Date,
//   playerIds: [id1, id2, ...],
//   winnerId: id,
//   completed: boolean
// }

// MatchPlayer object structure (stores individual player performance in a match):
// {
//   id: auto-increment,
//   matchId: id,
//   playerId: id,
//   marks: { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, bull: 0 } (marks on each number, max 3),
//   points: number (total points scored)
// }

// Database helper functions
const DB = {
    // Player functions
    async addPlayer(name) {
        return await db.players.add({
            name: name,
            createdDate: new Date()
        });
    },

    async getAllPlayers() {
        return await db.players.toArray();
    },

    async getPlayer(id) {
        return await db.players.get(id);
    },

    async updatePlayer(id, updates) {
        return await db.players.update(id, updates);
    },

    async deletePlayer(id) {
        // Also delete all match records for this player
        const matchPlayers = await db.matchPlayers.where('playerId').equals(id).toArray();
        const matchIds = [...new Set(matchPlayers.map(mp => mp.matchId))];
        
        // Delete the player's match records
        await db.matchPlayers.where('playerId').equals(id).delete();
        
        // Delete matches where this player was involved
        for (const matchId of matchIds) {
            const remainingPlayers = await db.matchPlayers.where('matchId').equals(matchId).count();
            if (remainingPlayers === 0) {
                await db.matches.delete(matchId);
            }
        }
        
        return await db.players.delete(id);
    },

    // Match functions
    async createMatch(playerIds) {
        const matchId = await db.matches.add({
            date: new Date(),
            playerIds: playerIds,
            winnerId: null,
            completed: false
        });

        // Initialize match player records
        for (const playerId of playerIds) {
            await db.matchPlayers.add({
                matchId: matchId,
                playerId: playerId,
                marks: { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, bull: 0 },
                points: 0
            });
        }

        return matchId;
    },

    async getMatch(matchId) {
        return await db.matches.get(matchId);
    },

    async getAllMatches() {
        return await db.matches.orderBy('date').reverse().toArray();
    },

    async getMatchPlayers(matchId) {
        return await db.matchPlayers.where('matchId').equals(matchId).toArray();
    },

    async updateMatchPlayer(id, updates) {
        return await db.matchPlayers.update(id, updates);
    },

    async completeMatch(matchId, winnerId) {
        return await db.matches.update(matchId, {
            winnerId: winnerId,
            completed: true
        });
    },

    async deleteMatch(matchId) {
        await db.matchPlayers.where('matchId').equals(matchId).delete();
        return await db.matches.delete(matchId);
    },

    // Statistics functions
    async getPlayerStats(playerId) {
        const matchPlayers = await db.matchPlayers.where('playerId').equals(playerId).toArray();
        const matches = await db.matches.where('playerIds').equals(playerId).toArray();
        
        const completedMatches = matches.filter(m => m.completed);
        const wins = completedMatches.filter(m => m.winnerId === playerId).length;
        const losses = completedMatches.length - wins;
        
        let totalMarks = 0;
        let totalPoints = 0;
        const markBreakdown = { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, bull: 0 };
        
        for (const mp of matchPlayers) {
            totalPoints += mp.points || 0;
            for (const [target, count] of Object.entries(mp.marks)) {
                markBreakdown[target] += count;
                totalMarks += count;
            }
        }
        
        return {
            playerId: playerId,
            gamesPlayed: completedMatches.length,
            wins: wins,
            losses: losses,
            winPercentage: completedMatches.length > 0 ? (wins / completedMatches.length * 100).toFixed(1) : 0,
            totalMarks: totalMarks,
            totalPoints: totalPoints,
            averageMarksPerGame: completedMatches.length > 0 ? (totalMarks / completedMatches.length).toFixed(1) : 0,
            averagePointsPerGame: completedMatches.length > 0 ? (totalPoints / completedMatches.length).toFixed(1) : 0,
            markBreakdown: markBreakdown
        };
    },

    // Export/Import functions
    async exportData() {
        const players = await db.players.toArray();
        const matches = await db.matches.toArray();
        const matchPlayers = await db.matchPlayers.toArray();
        
        return {
            exportDate: new Date().toISOString(),
            version: 1,
            players: players,
            matches: matches,
            matchPlayers: matchPlayers
        };
    },

    async importData(data) {
        if (!data.version || !data.players || !data.matches || !data.matchPlayers) {
            throw new Error('Invalid backup file format');
        }

        // Clear existing data
        await db.players.clear();
        await db.matches.clear();
        await db.matchPlayers.clear();

        // Import new data
        await db.players.bulkAdd(data.players);
        await db.matches.bulkAdd(data.matches);
        await db.matchPlayers.bulkAdd(data.matchPlayers);

        return true;
    }
};
