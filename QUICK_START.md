# Quick Start Guide

## Get Running in 60 Seconds

### Step 1: Test Locally (30 seconds)

```bash
# Open terminal in the purposemobile-refactored folder
python -m http.server 8000
```

Then open: **http://localhost:8000**

### Step 2: Verify It Works (30 seconds)

1. Click theme toggle (moon/sun icon) - should switch dark/light
2. Enter "Test Project" and "Stage 1" at top
3. Click "Pipe Level" tab
4. Scroll down to "Pipe Level Check Calculations" - click to expand
5. You should see one reading form already there
6. Scroll to bottom - you should see "Unified Report Message"
7. Click to expand - should show your project name

**If all above works â†’ SUCCESS! Your app is ready!**

---

## Full Testing (10 minutes)

### Test Pipe Level Check
1. In the form, enter:
   - Section ID: MH05 to MH06
   - Keep "Percentage (%)" selected
   - Slope: 1.111
   - Distance: 25
   - Start Height: 179.250
   - Measured Height: 179.730

2. **Expected Result**: Should show "HIGH +0.045"

3. Scroll to bottom "Unified Report Message"
4. Should show:
```
Test Project Stage 1

PIPE LEVEL CHECKS

MH05 to MH06

CH - 25.00
DES - 179.528
AS CON - 179.730
HIGH - 0.045
```

### Test Copy Function
1. Click "Copy Report" button
2. Open Notes app or messaging app
3. Paste (Ctrl+V or Cmd+V)
4. Should see the full report

**If this works â†’ Your app is 100% functional!**

---

## Deploy to GitHub Pages (5 minutes)

```bash
# 1. Create GitHub repo (do this on github.com first)
# Name it: purposemobile-field-tools

# 2. In terminal:
cd purposemobile-refactored
git init
git add .
git commit -m "Professional modular field tools app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/purposemobile-field-tools.git
git push -u origin main

# 3. On GitHub:
# Go to Settings â†’ Pages
# Source: Deploy from main branch
# Wait 2 minutes

# 4. Your app is live at:
# https://YOUR-USERNAME.github.io/purposemobile-field-tools
```

---

## Test on Phone (2 minutes)

1. Open the URL on your phone
2. Add to home screen (Safari: Share â†’ Add to Home Screen)
3. Test one calculation
4. Try copying the report
5. Paste into WhatsApp or Messages

**If copy works on phone â†’ PERFECT!**

---

## Common Issues

### "Cannot use import statement"
- Use `python -m http.server` not double-clicking HTML
- Must serve via HTTP, not file://

### "Module not found"
- Check you're in the right folder
- Check file paths are correct
- Use local server

### Theme doesn't switch
- Check browser console (F12) for errors
- localStorage might be disabled

---

## File Structure Quick Reference

```
purposemobile-refactored/
â”œâ”€â”€ index.html          â† Open this in browser
â”œâ”€â”€ css/                â† Styles (don't need to touch)
â””â”€â”€ js/
    â”œâ”€â”€ app.js          â† Main initialization
    â”œâ”€â”€ tools/          â† Individual tool modules
    â””â”€â”€ ...             â† Utilities
```

---

## Most Important Files

1. **index.html** - The main file to open
2. **README.md** - Full documentation
3. **FINAL_SUMMARY.md** - Complete guide
4. **REFACTORING.md** - Architecture details

---

## Need Help?

1. Check **FINAL_SUMMARY.md** for troubleshooting
2. Check browser console (F12) for errors
3. Check **README.md** for detailed docs
4. All functions have code comments

---

## You're Done!

Your professional field tools application is:
- âœ… Fully functional
- âœ… Mobile-optimized
- âœ… Ready to deploy
- âœ… Easy to maintain

**Go test it and enjoy!** ðŸŽ‰
