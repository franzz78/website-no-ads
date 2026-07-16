# ☀️ StreamPlay - Premium Web Player & Native PiP

StreamPlay is a modern, ad-free web streaming platform designed using a lightweight, modular **Vanilla JavaScript** architecture. It is fully optimized for mobile devices, featuring a responsive interface, smooth transitions, and advanced media playback capabilities.

## ✨ Key Features

*   **Ad-Free Premium Stream:** Enjoy smooth video streaming without intrusive mid-roll interruptions.
*   **Audio Mode (Data Saver):** Stream background audio/music with optimized data compression to minimize bandwidth consumption.
*   **Native Picture-in-Picture (PiP):** Bypasses iframe restrictions by extracting direct stream links. Users can trigger a native floating video window, allowing them to browse other apps (like WhatsApp) while the video stays on screen.
*   **Dynamic Search Engine:** Instantly search and update the video feed grid without disrupting currently active media playback.

## 🚀 Core Technology Stack

*   **Front-End Core:** HTML5, CSS3, Vanilla JavaScript (ES6+)
*   **UI Framework:** Tailwind CSS & Font Awesome v6.4
*   **Alerts & Modals:** SweetAlert2
*   **Data Stream Engine:** Public Invidious API Proxy Nodes

---

## 🛠️ Implementation Steps for Native PiP Fitment

This project follows a modular file structure. To safely integrate the **Native PiP Player** update without breaking existing code, follow these sequential steps:

### Step 1: Verify Pre-requisite HTML Elements
Ensure that your main `index.html` file contains the following wrapper IDs so that the updated script can properly bind to the DOM components:
*   `video-player-section` (The main container block for the media viewport)
*   `player-media-viewport` (The specific target div where the `<video>` or `<iframe>` tags are injected)
*   `pip-action-row` (The button wrapper that initiates the floating screen action)
*   `floating-mini-player` (The custom fallback floating controller widget)

### Step 2: Append the CSS Utilities
Open your `style.css` file, scroll to the absolute bottom, and paste the layout utility styles (such as aspect-ratio locks, smooth loading spinner keyframes, and multiline text truncators).

### Step 3: Append the JavaScript Engine Logic
Open your `script.js` file, go to the very end of the file, and paste the core extraction engine methods (`playSelectedMedia`, `triggerNativePiP`, `setupPiPListeners`, and `closeFloatingMini`).

### Step 4: Map the Click Events on the Feed Grid
Ensure that your dynamic video card rendering function assigns the new handler to the card wrapper's `onclick` attribute using this exact parameter signature:
```html
<div onclick="playSelectedMedia('VIDEO_ID', 'VIDEO_TITLE', 'CHANNEL_NAME')"> ... </div>
