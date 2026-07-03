import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

function updateMediaSession(videoId, title = "CleanPlayer Audio") {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: 'Streaming Mode',
            album: 'No Ads Streamer',
            artwork: [{ src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play', () => { if(window.player) window.player.playVideo(); });
        navigator.mediaSession.setActionHandler('pause', () => { if(window.player) window.player.pauseVideo(); });
    }
}

// Fungsi utama untuk memicu pemutaran lagu & simpan ke database
function playAndSave(videoId, titleText) {
    if (window.player && typeof window.player.loadVideoById === 'function') {
        window.player.loadVideoById(videoId);
        window.currentVideoId = videoId;
        updateMediaSession(videoId, titleText);
    }

    // Push riwayat baru ke Firebase
    const newHistoryRef = push(historyRef);
    set(newHistoryRef, {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoId: videoId,
        title: titleText || `ID Video: ${videoId}`,
        timestamp: Date.now()
    });
}

// Handler Tombol Cari / Putar
document.getElementById('playBtn').addEventListener('click', async () => {
    const queryInput = document.getElementById('videoUrl').value.trim();
    if (!queryInput) return alert('Bro, ketik dulu judul lagu atau paste linknya!');

    const directId = extractVideoId(queryInput);

    if (directId) {
        // Jika input berupa LINK, langsung putar
        document.getElementById('searchResultsSection').style.display = 'none';
        playAndSave(directId, "Video Pilihan Kamu");
        document.getElementById('videoUrl').value = '';
    } else {
        // Jika input berupa KATA KUNCI, jalankan pencarian lagu
        const searchList = document.getElementById('searchResultsList');
        searchList.innerHTML = '<li style="color:#94a3b8; font-size:0.85rem;">Mencari lagu terbaik untukmu...</li>';
        document.getElementById('searchResultsSection').style.display = 'block';

        try {
            // Memakai public API provider Invidious untuk mencari track list YouTube
            const response = await fetch(`https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(queryInput)}&type=video`);
            const results = await response.json();
            
            searchList.innerHTML = '';
            if (results && results.length > 0) {
                results.slice(0, 5).forEach(track => {
                    const li = document.createElement('li');
                    li.className = 'search-item';
                    li.innerHTML = `🎵 <strong>${track.title}</strong> - <span>${track.author}</span>`;
                    
                    // Kalau salah satu lagu hasil cari diklik, langsung set ke player!
                    li.addEventListener('click', () => {
                        playAndSave(track.videoId, track.title);
                        document.getElementById('searchResultsSection').style.display = 'none';
                        document.getElementById('videoUrl').value = '';
                    });
                    searchList.appendChild(li);
                });
            } else {
                searchList.innerHTML = '<li style="color:#ef4444; font-size:0.85rem;">Lagu tidak ditemukan, coba kata kunci lain bro.</li>';
            }
        } catch (error) {
            console.error(error);
            searchList.innerHTML = '<li style="color:#ef4444; font-size:0.85rem;">Gagal memuat pencarian. Coba ketik ulang.</li>';
        }
    }
});

// Listener Sinkronisasi Data Real-time dari Firebase
onValue(historyRef, (snapshot) => {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    const data = snapshot.val();
    if (data) {
        const items = Object.keys(data).map(key => data[key]).reverse();
        items.slice(0, 15).forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            const formattedTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Tampilkan judul lagu asli jika ada di DB, kalau tidak tampilkan ID-nya
            const displayTitle = item.title ? item.title : `ID Video: ${item.videoId}`;

            li.innerHTML = `
                <span class="video-id-text" title="${displayTitle}">▶️ <strong>${displayTitle}</strong></span>
                <span class="time-stamp">${formattedTime}</span>
            `;
            
            li.addEventListener('click', () => {
                if (window.player && typeof window.player.loadVideoById === 'function') {
                    window.player.loadVideoById(item.videoId);
                    window.currentVideoId = item.videoId;
                    updateMediaSession(item.videoId, displayTitle);
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
    btn.innerHTML = container.classList.contains('music-mode') ? "📺 Mode Video Player" : "🎵 Mode Musik Saja";
});

// Tombol Drive
document.getElementById('downloadMp3Btn').addEventListener('click', () => {
    const id = window.currentVideoId;
    if (!id) return alert("Belum ada video yang dimuat, bro.");
    window.open(`https://www.savetodrive.net/?url=https://www.youtube.com/watch?v=${id}`, '_blank');
});

document.getElementById('downloadMp4Btn').addEventListener('click', () => {
    const id = window.currentVideoId;
    if (!id) return alert("Belum ada video yang dimuat, bro.");
    window.open(`https://www.savetodrive.net/?url=https://www.youtube.com/watch?v=${id}`, '_blank');
});

// PWA Instalasi Prompt
let deferredPrompt;
const installBtn = document.getElementById('installAppBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if(installBtn) installBtn.style.display = 'block';
});

if(installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });
          }
