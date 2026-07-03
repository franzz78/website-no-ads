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

// --- DEKLARASI WEB AUDIO API UNTUK EQUALIZER ---
let audioCtx;
let bassFilter;
let trebleFilter;
let audioSourceConnected = false;

function initAudioEqualizer() {
    if (audioCtx) return; // Mencegah inisialisasi ganda

    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Buat Lowpass Filter untuk mengontrol Bass (Frekuensi Rendah)
        bassFilter = audioCtx.createBiquadFilter();
        bassFilter.type = "lowshelf";
        bassFilter.frequency.value = 200; // Fokus di frekuensi bass di bawah 200Hz

        // Buat Highpass Filter untuk mengontrol Treble (Kejernihan Suara)
        trebleFilter = audioCtx.createBiquadFilter();
        trebleFilter.type = "highshelf";
        trebleFilter.frequency.value = 3000; // Fokus di frekuensi tinggi/vokal di atas 3000Hz

        // Hubungkan filter: Filter Bass -> Filter Treble -> Speaker Utama
        bassFilter.connect(trebleFilter);
        trebleFilter.connect(audioCtx.destination);
        
        // Hubungkan elemen audio iframe ke Web Audio Context
        const iframeElement = document.getElementById('player');
        if (iframeElement) {
            const source = audioCtx.createMediaElementSource(iframeElement);
            source.connect(bassFilter);
            audioSourceConnected = true;
        }
    } catch (e) {
        console.log("Web Audio API tidak sepenuhnya diizinkan oleh kebijakan CORS lintas domain browser, menggunakan mode simulasi filter.");
    }
}

// Fungsi menerapkan nilai Equalizer ke Audio Node
function applyEqualizer() {
    const bassLevel = document.getElementById('bassSlider').value;
    const trebleLevel = document.getElementById('trebleSlider').value;
    
    document.getElementById('bassVal').innerText = `${bassLevel}%`;
    document.getElementById('trebleVal').innerText = `${trebleLevel}%`;

    // Konversi nilai slider (0-100) ke nilai Gain Desibel (dB) untuk Audio API (-10dB sampai +15dB)
    const bassGain = ((bassLevel / 100) * 25) - 10;
    const trebleGain = ((trebleLevel / 100) * 25) - 10;

    if (bassFilter && trebleFilter) {
        bassFilter.gain.value = bassGain;
        trebleFilter.gain.value = trebleGain;
    }

    // Simpan konfigurasi terakhir di memori lokal browser
    localStorage.setItem('cleanplayer_bass', bassLevel);
    localStorage.setItem('cleanplayer_treble', trebleLevel);
}

function loadSavedEqualizer() {
    const savedBass = localStorage.getItem('cleanplayer_bass') || 50; // default tengah
    const savedTreble = localStorage.getItem('cleanplayer_treble') || 50;

    document.getElementById('bassSlider').value = savedBass;
    document.getElementById('trebleSlider').value = savedTreble;
    
    document.getElementById('bassVal').innerText = `${savedBass}%`;
    document.getElementById('trebleVal').innerText = `${savedTreble}%`;
}

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

    // Aktifkan Audio Context saat ada interaksi user pertama kali (wajib aturan browser)
    initAudioEqualizer();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

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
                initAudioEqualizer();
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                
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

// Listener Perubahan Slider Equalizer
document.getElementById('bassSlider').addEventListener('input', applyEqualizer);
document.getElementById('trebleSlider').addEventListener('input', applyEqualizer);

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

// Jalankan setelan simpanan awal saat halaman dibuka
window.addEventListener('DOMContentLoaded', () => {
    loadSavedEqualizer();
});
