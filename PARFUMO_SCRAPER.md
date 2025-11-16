# Parfumo Data Scraper for FragShelf

Easily import fragrance data from Parfumo.com into your FragShelf collection!

## 🚀 Quick Start

### Method 1: Browser Console (Easiest)

1. **Go to Parfumo.com** and open any fragrance page
   - Example: https://www.parfumo.com/Perfumes/Dior/Sauvage

2. **Open Browser Console**
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - Safari: Enable Developer menu in Preferences, then press `Cmd+Option+C`

3. **Copy and paste the entire script** from `parfumo-scraper.js`

4. **Press Enter** - You'll see a green notification and the data in console

5. **The data is now in your clipboard!** You can:
   - Save it to a file for later
   - Or import it directly (see below)

### Method 2: Bookmarklet (One-Click)

1. **Create a new bookmark** in your browser
2. **Set the URL to:**
   ```javascript
   javascript:(function(){/* PASTE MINIFIED VERSION OF parfumo-scraper.js HERE */})();
   ```
3. **Click the bookmark** when on any Parfumo fragrance page

## 📥 Importing the Data

Currently, you'll need to manually copy the data fields:

1. Run the scraper on Parfumo
2. The JSON data will be copied to clipboard
3. Open FragShelf and click "+" to add a fragrance
4. Fill in the fields with the scraped data

### Future Enhancement Ideas:

- Add a "Paste JSON" button in the add form
- Create a Chrome extension for one-click import
- Add batch import functionality

## 🎯 What Gets Scraped

- ✅ Brand name
- ✅ Fragrance name  
- ✅ Product image
- ✅ Fragrance notes → Mapped to FragShelf types
- ⚠️ Season suitability (estimated)
- ⚠️ Occasion suitability (estimated)

Note: Parfumo doesn't always have season/occasion data, so the scraper uses smart defaults based on the fragrance type.

## 🔧 Customization

Edit `parfumo-scraper.js` to:
- Adjust the note-to-type mapping
- Change default season/occasion distributions
- Add support for other fragrance websites

## 🐛 Troubleshooting

**"Error scraping data"**: Make sure you're on a fragrance detail page, not a list page.

**Wrong data**: Parfumo's HTML structure may have changed. Check the selectors in the script.

**Clipboard not working**: Some browsers block clipboard access. The data will still appear in console - copy it manually.

## 💡 Other Sites

The same technique can be adapted for:
- Fragrantica.com
- Basenotes.com  
- Your own fragrance database

Just update the CSS selectors in the scraper!
