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

// --- FITUR BACKGROUND PLAYBACK VIA MEDIA SESSION API ---
function updateMediaSession(videoId) {
    if ('mediaSession' in navigator) {
        // Mendaftarkan metadata audio ke sistem operasi Android/iOS/Windows
        navigator.mediaSession.metadata = new MediaMetadata({
            title: `CleanPlayer Audio - ${videoId}`,
            artist: 'Streaming Mode',
            album: 'No Ads Streamer',
            artwork: [
                { src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' }
            ]
        });

        // Hubungkan tombol kontrol di panel notifikasi HP ke player YouTube
        navigator.mediaSession.setActionHandler('play', () => {
            if(window.player) window.player.playVideo();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            if(window.player) window.player.pauseVideo();
        });
    }
}

// Play button handler
document.getElementById('playBtn').addEventListener('click', () => {
    const urlInput = document.getElementById('videoUrl').value.trim();
    if (!urlInput) return alert('Bro, isi dulu kolom link YouTube-nya!');

    const videoId = extractVideoId(urlInput);

    if (videoId) {
        if (window.player && typeof window.player.loadVideoById === 'function') {
            window.player.loadVideoById(videoId);
            window.currentVideoId = videoId;
            updateMediaSession(videoId); // Pemicu kontrol background
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
        const items = Object.keys(data).map(key => data[key]).reverse();
        items.slice(0, 15).forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            const formattedTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            li.innerHTML = `
                <span class="video-id-text">▶️ ID Video: <strong>${item.videoId}</strong></span>
                <span class="time-stamp">${formattedTime}</span>
            `;
            
            li.addEventListener('click', () => {
                if (window.player && typeof window.player.loadVideoById === 'function') {
                    window.player.loadVideoById(item.videoId);
                    window.currentVideoId = item.videoId;
                    updateMediaSession(item.videoId); // Pemicu kontrol background saat klik history
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

// --- LOGIKA OTOMATIS POP-UP ADD TO HOME SCREEN ---
let deferredPrompt;
const installBtn = document.getElementById('installAppBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Cegah Chrome memunculkan mini-bar bawaan lama
    e.preventDefault();
    // Simpan event-nya agar bisa dieksekusi nanti
    deferredPrompt = e;
    // Tampilkan tombol instalasi rahasia kita di dalam web
    if(installBtn) installBtn.style.display = 'block';
});

if(installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        // Munculkan prompt instalasi bawaan OS (Android/Windows)
        deferredPrompt.prompt();
        // Tunggu respon user (setuju instal atau menolak)
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User memilih instalasi: ${outcome}`);
        // Reset prompt karena hanya bisa dipakai sekali
        deferredPrompt = null;
        // Sembunyikan tombol lagi
        installBtn.style.display = 'none';
    });
}

window.addEventListener('appinstalled', () => {
    console.log('Aplikasi CleanPlayer sukses di-install di perangkat kamu!');
    if(installBtn) installBtn.style.display = 'none';
});
