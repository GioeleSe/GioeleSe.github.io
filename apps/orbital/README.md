# ORBITAL - DIY Vertical Mouse with ESP32 & Circular OLED

This repository contains the source code for the **ORBITAL DIY Vertical Ergonomic Mouse with ESP32 & Circular OLED** concept presentation, hardware roadmap, and community survey website.

The project explores upgrading classical cabled vertical mouse hardware with an ESP32 microcontroller, adding Bluetooth LE/Wi-Fi connectivity, and embedding a generic round OLED display into a custom PLA 3D-printed chassis.

## Directory Structure
```
.
├── index.html                  # Main concept & research presentation page
├── index.js                    # Node.js local web server with /api/survey recording
├── survey.html                 # Hardware validation & requirements survey (with direct email delivery)
├── css/
│   ├── input.css               # Tailwind CSS input styles
│   └── style.css               # Compiled styling rules
├── js/
│   ├── main.js                 # Three.js 3D rendering & smooth GSAP ScrollTrigger logic
│   └── share.js                # QR code generator & quick multi-app sharing
├── static/
│   └── models/
│       └── mouse_model/
│           └── mouse.glb       # 3D compressed GLB model (Draco + WebP)
└── .github/
    └── workflows/
        └── deploy.yml          # Automated CI/CD GitHub Pages deployment workflow
```

## How to Serve & Test Locally
1. Start the Node.js server:
   ```bash
   npm start
   ```
2. Open `http://localhost:3000` in your browser.
3. The 3D compressed model `static/models/mouse_model/mouse.glb` renders smoothly with scroll-driven choreography and dynamic on-screen OLED telemetry/mini-game animation. If the model file is ever missing, the site automatically falls back to an animated procedural 3D mouse model.

## Survey Email Delivery Configuration
In [`survey.html`](survey.html), locate `SURVEY_RECIPIENT_EMAIL`:
```javascript
const SURVEY_RECIPIENT_EMAIL = "87376700+GioeleSe@users.noreply.github.com";
```
Set this to your preferred email address. When a user submits the survey:
1. An automated email is dispatched via FormSubmit directly to your inbox.
2. If running locally via `npm start`, responses are also automatically recorded in `survey_responses.json`.
3. If offline, a one-click `mailto:` backup is provided so no response is lost.

## GitHub Pages Deployment
1. Push this code to the `main` branch of your GitHub repository.
2. In GitHub under **Settings > Pages**, set **Source** to **GitHub Actions**.
3. The `.github/workflows/deploy.yml` pipeline will automatically build and publish your site!
