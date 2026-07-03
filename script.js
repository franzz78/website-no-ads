// Import Firebase SDK v10 Modern Web API
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Konfigurasi Database Milikmu
const firebaseConfig = {
  apiKey: "AIzaSyD9BmV4XKXuMWa4PZHpb7Bbt-rHs61m3lE",
  databaseURL: "https://absensi-polri-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "absensi-polri",
  storageBucket: "absensi-polri.firebasestorage.app",
  messagingSenderId: "19006760644",
  appId: "1:19006760644:web:b980f54aea123e92ed4b91"
};

// Inisialisasi Firebase Core & Realtime DB
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const historyRef = ref(db, 'player_history');

/**
 * Regex Ekstraksi ID Video YouTube yang Komprehensif
 * Mendukung format: desktop web, mobile web, youtube shorts, embed link, dan raw ID
 */
function extractVideoId(url) {
    if (url.length === 11) return url; // Jika user langsung memasukkan 11 karakter ID Video
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Handler utama saat memutar video baru
document.getElementById('playBtn').addEventListener('click', () => {
    const urlInput = document.getElementById('videoUrl').value.trim();
    if (!urlInput) {
        alert('Bro, isi dulu kolom link YouTube-nya!');
        return;
    }

    const videoId = extractVideoId(urlInput);

    if (videoId) {
        // 1. Perintah pemutar Iframe YouTube untuk memuat video baru
        if (window.player && typeof window.player.loadVideoById === 'function') {
            window.player.loadVideoById(videoId);
        } else {
            alert('Pemutar video belum siap. Mohon tunggu beberapa detik.');
            return;
        }

        // 2. Kirim record baru ke Firebase Realtime Database
        const newHistoryRef = push(historyRef);
        set(newHistoryRef, {
            url: urlInput,
            videoId: videoId,
            timestamp: Date.now()
        }).catch(err => console.error("Gagal menyimpan ke Firebase:", err));

        // Bersihkan form input agar siap dipakai lagi
        document.getElementById('videoUrl').value = '';
    } else {
        alert('Format tautan salah! Pastikan itu link video, shorts, atau musik YouTube yang valid.');
    }
});

// Listener Sinkronisasi Data Real-time dari Firebase
onValue(historyRef, (snapshot) => {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = ''; // Kosongkan placeholder status loading

    const data = snapshot.val();
    if (data) {
        // Balik array item agar entry terbaru langsung muncul paling atas
        const items = Object.keys(data).map(key => data[key]).reverse();
        
        // Batasi hanya menampilkan maksimal 15 riwayat terakhir agar performa stabil
        const limitedItems = items.slice(0, 15);

        limitedItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            
            // Format waktu jam:menit
            const formattedTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            li.innerHTML = `
                <span class="video-id-text">▶️ ID Video: <strong>${item.videoId}</strong></span>
                <span class="time-stamp">${formattedTime}</span>
            `;
            
            // Klik item riwayat langsung memutar videonya kembali
            li.addEventListener('click', () => {
                if (window.player && typeof window.player.loadVideoById === 'function') {
                    window.player.loadVideoById(item.videoId);
                }
            });
            
            historyList.appendChild(li);
        });
    } else {
        historyList.innerHTML = '<li class="loading-state">Belum ada riwayat pemutaran. Mulai putar lagu sekarang!</li>';
    }
});

// Fitur Interaksi Mode Musik Saja (Mengecilkan layar video)
document.getElementById('musicModeBtn').addEventListener('click', () => {
    const container = document.getElementById('playerContainer');
    const btn = document.getElementById('musicModeBtn');
    
    container.classList.toggle('music-mode');
    
    if (container.classList.contains('music-mode')) {
        btn.classList.add('active');
        btn.innerHTML = "📺 Mode Video Player";
    } else {
        btn.classList.remove('active');
        btn.innerHTML = "🎵 Mode Musik Saja";
    }
});
            
