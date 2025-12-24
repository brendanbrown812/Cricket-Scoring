# IMPORTANT: Download Dexie.js Library

## Before you can use the Cricket Darts app, you MUST download the Dexie.js library!

### Quick Method (Easiest)

1. **On your computer or iPad, open a web browser**

2. **Visit one of these URLs** (they both have the same file):
   - https://unpkg.com/dexie@3.2.4/dist/dexie.min.js
   - https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js

3. **The page will show a lot of JavaScript code**
   - Don't panic! This is normal.

4. **Save the page:**
   - **On Windows/Mac**: Press `Ctrl+S` (or `Cmd+S` on Mac)
   - **On iPad**: 
     - Tap and hold the page
     - Select "Save As" or take a screenshot, or
     - Copy all the text, paste into Notes, then save as a file

5. **IMPORTANT: Save the file as exactly `dexie.js`**
   - Not `dexie.min.js`
   - Not `dexie.js.txt`
   - Just `dexie.js`

6. **Place the file in the same folder as `index.html`**

### Alternative Method (If you have curl or wget)

If you're comfortable with command line:

```bash
# Using curl
curl -o dexie.js https://unpkg.com/dexie@3.2.4/dist/dexie.min.js

# Using wget
wget -O dexie.js https://unpkg.com/dexie@3.2.4/dist/dexie.min.js
```

### Verification

After downloading, your folder should look like this:

```
cricket-darts/
├── index.html
├── styles.css
├── app.js
├── db.js
├── dexie.js          ← This should be about 95KB
├── README.md
└── DOWNLOAD_DEXIE.md
```

The `dexie.js` file should be around 95-100 KB in size. If it's only a few KB, you probably saved the wrong thing.

### Testing

1. Open `index.html` in your browser (Safari on iPad)
2. If you see an alert that says "ERROR: Dexie.js library not installed!", the download didn't work
3. If the app loads normally and you can add players, it worked! 🎉

### Why Do I Need This?

Dexie.js is a library that makes it easy to store data in your browser's IndexedDB. It's what allows the app to remember your players, games, and statistics even after you close the browser. It's free, open-source, and safe to use.

We can't include it directly in the zip file because:
- It keeps the download smaller
- You always get the latest stable version
- It's a standard web development practice

### Still Having Trouble?

If you can't get it to work:

1. Try a different browser (Chrome, Firefox, Safari)
2. Make sure you're saving the raw JavaScript code, not the HTML of the page
3. Check the file size - it should be around 95KB
4. Make sure the filename is exactly `dexie.js` with no extra extensions

### Questions?

The Dexie.js library is created and maintained by:
- Website: https://dexie.org/
- GitHub: https://github.com/dexie/Dexie.js

It's a popular, well-maintained library used by thousands of web applications.
