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

function playAndSave(videoId) {
    if (window.player && typeof window.player.loadVideoById === 'function') {
        window.player.loadVideoById(videoId);
        window.currentVideoId = videoId;
        updateMediaSession(videoId);
    }

    const newHistoryRef = push(historyRef);
    set(newHistoryRef, {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoId: videoId,
        timestamp: Date.now()
    });
}

// Logic Pencarian Baru - Menggunakan metode embed youtube search
document.getElementById('playBtn').addEventListener('click', () => {
    const queryInput = document.getElementById('videoUrl').value.trim();
    if (!queryInput) return alert('Bro, isi teks pencariannya dulu!');

    const directId = extractVideoId(queryInput);

    if (directId) {
        // Jika yang di-paste adalah Link / ID langsung, mainkan segera
        document.getElementById('searchResultsSection').style.display = 'none';
        playAndSave(directId);
        document.getElementById('videoUrl').value = '';
    } else {
        // Jika yang diketik kata kunci, tampilkan daftar hasil dari embed aman youtube
        const searchSection = document.getElementById('searchResultsSection');
        const searchIframe = document.getElementById('searchIframe');
        
        // Memanfaatkan engine pemutar playlist/pencarian terintegrasi YouTube resmi
        const searchEmbedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(queryInput)}&modestbranding=1`;
        
        searchIframe.src = searchEmbedUrl;
        searchSection.style.display = 'block';
        
        // Simpan log pencarian kata kunci ke DB (opsional buat record kamu)
        const newHistoryRef = push(historyRef);
        set(newHistoryRef, {
            url: `Pencarian Kata Kunci: ${queryInput}`,
            videoId: `Cari: "${queryInput}"`,
            timestamp: Date.now()
        });
    }
});

// Real-time Database Listener untuk History
onValue(historyRef, (snapshot) => {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    const data = snapshot.val();
    if (data) {
        const items = Object.keys(data).map(key => data[key]).reverse();
        items.slice(0, 15).forEach(item => {
            if(!item.videoId) return;
            const li = document.createElement('li');
            li.className = 'history-item';
            const formattedTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            li.innerHTML = `
                <span class="video-id-text">▶️ <strong>${item.videoId}</strong></span>
                <span class="time-stamp">${formattedTime}</span>
            `;
            
            li.addEventListener('click', () => {
                // Jangan eksekusi jika itu hanya log teks pencarian biasa
                if(item.videoId.startsWith('Cari:')) {
                    document.getElementById('videoUrl').value = item.videoId.replace('Cari: "', '').slice(0, -1);
                    document.getElementById('playBtn').click();
                } else {
                    if (window.player && typeof window.player.loadVideoById === 'function') {
                        window.player.loadVideoById(item.videoId);
                        window.currentVideoId = item.videoId;
                        updateMediaSession(item.videoId);
                    }
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
