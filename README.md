# PurposeMobile Field Tools

**Professional construction QC calculator for sewer and water pipeline projects**

## 🎯 What It Does

Field engineers use this mobile web app to:
- Calculate pipe level deviations (HIGH/LOW)
- Convert laser grades (ratio ↔ percentage)
- Calculate regrade requirements
- Verify grade compliance
- Calculate invert levels at any chainage
- Document field observations

All tools generate standardized, client-ready text reports that can be immediately sent via SMS/WhatsApp/email.

## ✨ Features

- **6 Specialized Tools**: Each designed for specific QC calculations
- **Unified Reporting**: All tools feed into one comprehensive field report
- **Mobile-First**: Optimized for phone use at construction sites
- **Offline Capable**: Works without internet (once loaded)
- **Dark Mode**: For low-light field conditions
- **High Precision**: Maintains surveying-grade calculation accuracy
- **Professional Output**: Industry-standard formatting

## 🚀 Quick Start

### For Users
1. Open https://[your-username].github.io/purposemobile-field-tools
2. Enter project name and stage
3. Use any tool tab to perform calculations
4. Copy the unified report and send to client

### For Developers

```bash
# Clone repository
git clone https://github.com/[username]/purposemobile-field-tools.git
cd purposemobile-field-tools

# Open in browser (use local server)
python -m http.server 8000
# Navigate to http://localhost:8000
```

## 📁 Project Structure

```
purposemobile-field-tools/
├── index.html                    # Main HTML shell
├── css/
│   ├── variables.css            # Design tokens & themes
│   ├── base.css                 # Foundation styles
│   └── components.css           # UI components
└── js/
    ├── app.js                   # Application initialization
    ├── state.js                 # State management
    ├── ui.js                    # UI utilities
    ├── message-generator.js     # Report generation
    └── tools/
        ├── pipe-level-check.js  # Pipe level verification
        ├── laser-converter.js   # Grade conversions
        ├── regrade.js           # Regrade calculations
        ├── grade-check.js       # Grade verification
        ├── chainage-il.js       # Chainage calculations
        └── general-notes.js     # Field notes
```

## 🛠️ Development

### Current Status

**Refactoring Progress: 50%**
- ✅ CSS fully modularized (3/3 files)
- ✅ Core JavaScript (4/4 files)
- ✅ One tool complete (pipe-level-check.js)
- ⏳ 5 tools remaining
- ⏳ Integration pending

See [REFACTORING.md](REFACTORING.md) for detailed progress.

### Tech Stack
- **HTML5**: Semantic structure
- **CSS3**: Custom properties, Grid, Flexbox
- **JavaScript ES6**: Modules, arrow functions
- **No Framework**: Vanilla JS for simplicity and performance

### Code Standards
- **Precision**: Full precision in calculations, round only display
- **Format**: Strict message format compliance
- **Modularity**: Each tool is independent
- **Accessibility**: WCAG AA compliant

## 📱 The Six Tools

### 1. Pipe Level Check
Verifies installed pipe levels against design specifications.
- Calculates HIGH/LOW deviations
- Supports percentage and ratio input
- Extra distance feature for adjustments

### 2. Laser Converter
Converts between grade ratios and laser percentages.
- Bidirectional conversion
- 4-decimal precision for laser setup
- Quick reference tables

### 3. Regrade Tool
Calculates new grades when adjustments are needed.
- Determines required grade change
- Shows 6m pipe adjustment
- Includes chainage tracking

### 4. Grade Check
Verifies as-constructed grades against design.
- Percentage and rise/fall comparison
- Compliance verification
- Detailed deviation reporting

### 5. Chainage IL
Calculates invert level at any chainage point.
- Essential for intermediate set-out
- Grade-based interpolation
- Design implementation verification

### 6. General Notes
Documents field observations and issues.
- Free-form text entry
- Integrated into unified report
- Supports multiple note sections

## 📋 Message Format Standard

All tools generate reports following this strict format:

```
Project Name Stage

Section ID

CH - 25.00
DES - 179.528
AS CON - 179.730
HIGH - 0.045

- Additional notes
```

**Key Rules:**
- Plain text only (no formatting)
- 2-4 decimal precision (depending on field)
- ONE blank line between sections
- Periods after value lines
- ALL CAPS field labels

## 🔬 Testing

### Calculation Verification
Each tool has been tested against known values:
- Pipe Level: ±0.001m accuracy
- Laser: ±0.0001% precision
- Regrade: Verified against manual calculations
- Grade Check: Cross-referenced with design documents
- Chainage IL: Tested with surveyed points

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

## 🚢 Deployment

### GitHub Pages (Recommended)
```bash
git push origin main
# Enable in Settings → Pages → Source: main branch
# Site live at: https://[username].github.io/[repo]
```

### Netlify
1. Connect GitHub repository
2. Build settings: None needed (static site)
3. Deploy

### Self-Hosted
Upload all files to any web server. No build process required.

## 🤝 Contributing

### Found a Bug?
1. Check [Issues](https://github.com/[username]/[repo]/issues)
2. Create new issue with:
   - Description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Want to Add a Feature?
1. Open an issue to discuss
2. Fork repository
3. Create feature branch: `feature/your-feature-name`
4. Commit changes
5. Push and create Pull Request

### Code Style
- Use ES6 modules
- Comment complex calculations
- Follow existing naming conventions
- Test thoroughly before PR

## 📄 License

MIT License - See [LICENSE](LICENSE) file

## 👥 Credits

**Original Developer**: [Your Name]
**Purpose**: Construction quality control for pipeline installation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/[username]/[repo]/issues)
- **Documentation**: See [REFACTORING.md](REFACTORING.md)
- **Email**: [your-email]

## 🗺️ Roadmap

### v2.0 (Planned)
- [ ] Data persistence (localStorage)
- [ ] PDF export
- [ ] Custom templates
- [ ] Undo/redo
- [ ] Keyboard shortcuts

### v3.0 (Future)
- [ ] Progressive Web App
- [ ] Offline sync
- [ ] Multi-user collaboration
- [ ] Cloud backup

---

**Built for field engineers, by field engineers** 🏗️
