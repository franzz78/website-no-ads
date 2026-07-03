import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, remove, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD9BmV4XKXuMWa4PZHpb7Bbt-rHs61m3lE",
  databaseURL: "https://absensi-polri-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "absensi-polri",
  storageBucket: "absensi-polri.firebasestorage.app",
  messagingSenderId: "19006760644",
  appId: "1:19006760644:web:b980f54aea123e92ed4b91"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const historyRef = ref(db, 'player_history');

function extractVideoId(url) {
    if (url.length === 11) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function updateMediaSession(videoId) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: `CleanPlayer Track - ${videoId}`,
            artist: 'Playing Mode',
            album: 'No Ads Streamer',
            artwork: [{ src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play', () => { if(window.player) window.player.playVideo(); });
        navigator.mediaSession.setActionHandler('pause', () => { if(window.player) window.player.pauseVideo(); });
    }
}

// Handler klik tombol Putar
document.getElementById('playBtn').addEventListener('click', () => {
    const urlInput = document.getElementById('videoUrl').value.trim();
    if (!urlInput) return alert('Isi dulu kolom link YouTube atau ID video!');

    const videoId = extractVideoId(urlInput);

    if (videoId) {
        if (window.player && typeof window.player.loadVideoById === 'function') {
            window.player.loadVideoById(videoId);
            window.currentVideoId = videoId;
            updateMediaSession(videoId);
        }

        const newHistoryRef = push(historyRef);
        set(newHistoryRef, {
            url: urlInput,
            videoId: videoId,
            timestamp: Date.now()
        });

        document.getElementById('videoUrl').value = '';
    } else {
        alert('Format tautan salah!');
    }
});

// Real-time Database Listener
onValue(historyRef, (snapshot) => {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    const data = snapshot.val();
    
    if (data) {
        const items = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })).reverse();

        items.slice(0, 15).forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            const formattedTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            li.innerHTML = `
                <div class="history-clickable">
                    <span class="video-id-text">ID Video: <strong>${item.videoId}</strong></span>
                    <span class="time-stamp">${formattedTime}</span>
                </div>
                <button class="btn-delete-item" title="Hapus dari riwayat">X</button>
            `;
            
            li.querySelector('.history-clickable').addEventListener('click', () => {
                if (window.player && typeof window.player.loadVideoById === 'function') {
                    window.player.loadVideoById(item.videoId);
                    window.currentVideoId = item.videoId;
                    updateMediaSession(item.videoId);
                }
            });

            li.querySelector('.btn-delete-item').addEventListener('click', (e) => {
                e.stopPropagation(); 
                if(confirm("Hapus lagu ini dari riwayat database?")) {
                    const itemRef = ref(db, `player_history/${item.id}`);
                    remove(itemRef).catch(err => console.error(err));
                }
            });

            historyList.appendChild(li);
        });
    } else {
        historyList.innerHTML = '<li class="loading-state">Belum ada riwayat pemutaran.</li>';
    }
});

// Mode musik toggle
document.getElementById('musicModeBtn').addEventListener('click', () => {
    const container = document.getElementById('playerContainer');
    const btn = document.getElementById('musicModeBtn');
    container.classList.toggle('music-mode');
    btn.classList.toggle('active');
    btn.innerHTML = container.classList.contains('music-mode') ? "Mode Video Player" : "Mode Musik Saja";
});

// LOGIKA NAVIGASI HALAMAN SETTINGS
const mainPage = document.getElementById('mainPage');
const settingsPage = document.getElementById('settingsPage');

document.getElementById('toggleSettingsBtn').addEventListener('click', () => {
    mainPage.style.display = 'none';
    settingsPage.style.display = 'block';
});

document.getElementById('backToMainBtn').addEventListener('click', () => {
    settingsPage.style.display = 'none';
    mainPage.style.display = 'block';
});

// 1. Logika Pengatur Tema (Dark / Light Mode)
document.getElementById('themeToggle').addEventListener('change', (e) => {
    if (e.target.checked) {
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
    }
});

// 2. Logika Slider Volume (0 - 100%)
document.getElementById('volumeSlider').addEventListener('input', (e) => {
    const vol = e.target.value;
    document.getElementById('volumeVal').innerText = `${vol}%`;
    if (window.player && typeof window.player.setVolume === 'function') {
        window.player.setVolume(vol);
    }
});

// 3. Logika Slider Bass Boost (Simulasi Visual Parameter)
document.getElementById('bassSlider').addEventListener('input', (e) => {
    const bass = e.target.value;
    document.getElementById('bassVal').innerText = `${bass}%`;
    console.log(`Bass level diatur ke: ${bass}%`);
});

// 4. Logika Toggle Stereo (Simulasi Parameter Audio)
document.getElementById('stereoToggle').addEventListener('change', (e) => {
    console.log(`Efek audio stereo diaktifkan: ${e.target.checked}`);
});

// PWA prompt
let deferredPrompt;
const installBtn = document.getElementById('installAppBtn');
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    if(installBtn) installBtn.style.display = 'block';
});
if(installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });
}
