# Cricket Darts Scorer

A Progressive Web App for tracking cricket darts games on iPad (or any device with a browser).

## Features

- **Player Management**: Add, edit, and delete players
- **Live Scoring**: Track cricket games in real-time with visual scoreboard
- **Match History**: View all past matches with detailed statistics
- **Player Statistics**: Track wins, losses, average marks, and hit breakdowns per player
- **Offline Storage**: All data stored locally in your browser using IndexedDB
- **Export/Import**: Backup and restore your data as JSON files
- **Touch-Optimized**: Large buttons and clean interface designed for iPad use

## Setup Instructions

### IMPORTANT: Download Dexie.js First!

Before using this app, you need to download the Dexie.js library:

1. Go to: https://unpkg.com/dexie@3.2.4/dist/dexie.min.js
2. Save the file as `dexie.js` in the same folder as these files
3. Make sure the filename is exactly `dexie.js` (lowercase)

### Installation

1. Download and unzip all files to a folder
2. Download `dexie.js` as described above and place it in the same folder
3. On your iPad:
   - Transfer the folder to the Files app
   - Open `index.html` in Safari
   - Tap the Share button and select "Add to Home Screen"
   - The app will now work like a native app!

## How to Use

### Adding Players
1. Go to the "Players" tab
2. Click "Add New Player"
3. Enter the player's name and save

### Starting a Game
1. Go to the "New Game" tab
2. Select at least 2 players
3. Click "Start Game"

### Playing Cricket
- The goal is to close all numbers (20, 19, 18, 17, 16, 15, and Bull) AND have the highest points
- Tap the number you hit
- Select whether it was a Single, Double, or Triple
- Each number needs 3 marks to close (/, X, Ⓧ)
- After closing a number, additional hits score points (if opponents haven't closed it)
- Points = target value × marks (Bull = 25 points)
- First player to close all numbers with equal/more points wins!
- Tap "Miss / Next Player" if you miss
- The game automatically detects when someone wins

### Viewing Statistics
- Go to the "Statistics" tab to see each player's:
  - Games played, wins, and losses
  - Win percentage
  - Average marks per game
  - Hit breakdown by number

### Backing Up Data
1. Go to the "Data" tab
2. Click "Export Data" to download a backup JSON file
3. Save this file somewhere safe (iCloud, email to yourself, etc.)
4. To restore, click "Import Data" and select your backup file

## Technical Details

- **Storage**: Uses IndexedDB via Dexie.js for local data storage
- **Capacity**: Can store thousands of matches without issue
- **Offline**: Works completely offline once loaded
- **Compatible**: Works on any modern browser (Safari, Chrome, Firefox, Edge)

## File Structure

```
cricket-darts/
├── index.html          Main HTML file (open this)
├── styles.css          All styling
├── app.js              Main application logic
├── db.js               Database configuration
├── dexie.js           Dexie library (you need to download this)
└── README.md          This file
```

## Sharing with Friends

1. Zip the entire folder (including dexie.js)
2. Send via text, email, AirDrop, etc.
3. Friends unzip and follow the setup instructions above

## Troubleshooting

**App won't load?**
- Make sure `dexie.js` is in the same folder as `index.html`
- Check that the file is named exactly `dexie.js` (not `dexie.min.js` or `dexie.js.txt`)
- Try opening in Safari if using another browser

**Data disappeared?**
- Check if you cleared browser data/cache
- Restore from a backup export if you have one
- In the future, export regularly!

**Game not working properly?**
- Refresh the page (swipe down from top in Safari)
- Make sure you're using Safari on iPad (works best)

## Cricket Rules Reminder

**Numbers to close**: 20, 19, 18, 17, 16, 15, and Bull

**Marks needed**: 3 marks per number
- 1 mark = /
- 2 marks = X
- 3 marks = Ⓧ (closed)

**Hit types**:
- Single = 1 mark
- Double = 2 marks
- Triple = 3 marks

**Scoring Points**:
- After closing a number (reaching 3 marks), additional hits on that number score points
- Points only count if at least one opponent hasn't closed that number yet
- Points scored = target value × marks beyond 3
  - Example: You've closed 20s (3 marks), opponent hasn't. You hit a triple 20 = 60 points (20 × 3)
  - Bull is worth 25 points per mark

**Winning**: 
1. Close all 7 numbers (20, 19, 18, 17, 16, 15, Bull)
2. Have equal or more points than all opponents

This means you can't win by just closing numbers quickly - you must also match or beat your opponents' point totals!

## Version

Version 1.0 - December 2024

## License

Free to use and modify for personal use. Share with friends!
