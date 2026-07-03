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

// Play button handler
document.getElementById('playBtn').addEventListener('click', () => {
    const urlInput = document.getElementById('videoUrl').value.trim();
    if (!urlInput) return alert('Bro, isi dulu kolom link YouTube-nya!');

    const videoId = extractVideoId(urlInput);

    if (videoId) {
        if (window.player && typeof window.player.loadVideoById === 'function') {
            window.player.loadVideoById(videoId);
            window.currentVideoId = videoId; // Update global state id yang aktif
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
                    window.currentVideoId = item.videoId; // Update id aktif saat riwayat diklik
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

// --- LOGIKA BARU: TOMBOL DOWNLOAD MP3 & MP4 (STABIL & ANTI-DOWN) ---
// Mengarahkan langsung ke halaman generator download universal berdasarkan ID video yang aktif

document.getElementById('downloadMp3Btn').addEventListener('click', () => {
    const id = window.currentVideoId;
    if (!id) return alert("Belum ada video yang dimuat, bro.");
    
    // Menggunakan skema direct-query ke y2mate (fokus konversi audio/mp3)
    const downloadUrl = `https://www.y2mate.com/mates/en/convert-youtube?url=https://www.youtube.com/watch?v=${id}`;
    window.open(downloadUrl, '_blank');
});

document.getElementById('downloadMp4Btn').addEventListener('click', () => {
    const id = window.currentVideoId;
    if (!id) return alert("Belum ada video yang dimuat, bro.");
    
    // Menggunakan alternatif SaveFrom dengan trik prefix "ss" untuk langsung ke halaman unduh video (mp4)
    const downloadUrl = `https://ssyoutube.com/watch?v=${id}`;
    window.open(downloadUrl, '_blank');
});
