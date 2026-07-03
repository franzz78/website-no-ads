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

let audioCtx;
let bassFilter;
let trebleFilter;

function initAudioEqualizer() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        bassFilter = audioCtx.createBiquadFilter();
        bassFilter.type = "lowshelf";
        bassFilter.frequency.value = 200;

        trebleFilter = audioCtx.createBiquadFilter();
        trebleFilter.type = "highshelf";
        trebleFilter.frequency.value = 3000;

        bassFilter.connect(trebleFilter);
        trebleFilter.connect(audioCtx.destination);
        
        const iframeElement = document.getElementById('player');
        if (iframeElement) {
            const source = audioCtx.createMediaElementSource(iframeElement);
            source.connect(bassFilter);
        }
    } catch (e) {
        console.log("Web Audio API menggunakan mode simulasi filter.");
    }
}

function applyEqualizer() {
    const bassLevel = document.getElementById('bassSlider').value;
    const trebleLevel = document.getElementById('trebleSlider').value;
    
    document.getElementById('bassVal').innerText = `${bassLevel}%`;
    document.getElementById('trebleVal').innerText = `${trebleLevel}%`;

    const bassGain = ((bassLevel / 100) * 25) - 10;
    const trebleGain = ((trebleLevel / 100) * 25) - 10;

    if (bassFilter && trebleFilter) {
        bassFilter.gain.value = bassGain;
        trebleFilter.gain.value = trebleGain;
    }

    localStorage.setItem('cleanplayer_bass', bassLevel);
    localStorage.setItem('cleanplayer_treble', trebleLevel);
}

function loadSavedEqualizer() {
    const savedBass = localStorage.getItem('cleanplayer_bass') || 50;
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
    if (!urlInput) {
        Swal.fire({ icon: 'warning', title: 'Kolom Kosong', text: 'Isi dulu kolom link YouTube atau ID video!' });
        return;
    }

    initAudioEqualizer();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

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
        Swal.fire({ icon: 'error', title: 'Format Salah', text: 'Format tautan salah atau tidak dikenali!' });
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

        document.getElementById('totalLogsVal').innerText = `${items.length} Item`;

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
                
                // SweetAlert2 Konfirmasi Hapus Satuan
                Swal.fire({
                    title: 'Hapus Item?',
                    text: 'Hapus lagu ini dari riwayat database?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Ya, Hapus',
                    cancelButtonText: 'Batal'
                }).then((result) => {
                    if (result.isConfirmed) {
                        const itemRef = ref(db, `player_history/${item.id}`);
                        remove(itemRef).catch(err => console.error(err));
                    }
                });
            });

            historyList.appendChild(li);
        });
    } else {
        historyList.innerHTML = '<li class="loading-state">Belum ada riwayat pemutaran.</li>';
        document.getElementById('totalLogsVal').innerText = '0 Item';
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

// LOGIKA NAVIGASI PAGE UTAMA, SETTINGS, DAN ADMIN
const mainPage = document.getElementById('mainPage');
const settingsPage = document.getElementById('settingsPage');
const adminPage = document.getElementById('adminPage');

document.getElementById('toggleSettingsBtn').addEventListener('click', () => {
    mainPage.style.display = 'none';
    adminPage.style.display = 'none';
    settingsPage.style.display = 'block';
});

document.getElementById('backToMainBtn').addEventListener('click', () => {
    settingsPage.style.display = 'none';
    mainPage.style.display = 'block';
});

// SweetAlert2 Prompt Input Password Admin
document.getElementById('toggleAdminBtn').addEventListener('click', () => {
    Swal.fire({
        title: 'Akses Admin',
        text: 'Masukkan kata sandi akses Admin:',
        input: 'password',
        inputPlaceholder: 'Kata sandi...',
        showCancelButton: true,
        confirmButtonText: 'Masuk',
        cancelButtonText: 'Batal',
        inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off'
        }
    }).then((result) => {
        if (result.isDismissed) return;
        
        if (result.value === "PREMIUMYTPRO##") {
            mainPage.style.display = 'none';
            settingsPage.style.display = 'none';
            adminPage.style.display = 'block';
        } else {
            Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Kata sandi salah.' });
        }
    });
});

document.getElementById('backToMainFromAdminBtn').addEventListener('click', () => {
    adminPage.style.display = 'none';
    mainPage.style.display = 'block';
});

// SweetAlert2 Konfirmasi Reset Semua Database
document.getElementById('clearAllHistoryBtn').addEventListener('click', () => {
    Swal.fire({
        title: 'Reset Database?',
        text: 'Apakah Anda yakin ingin menghapus SELURUH riwayat database secara permanen?',
        icon: 'danger',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Kosongkan',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            remove(historyRef)
            .then(() => {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Seluruh riwayat database telah dibersihkan!' });
            })
            .catch((err) => {
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengosongkan database.' });
                console.error(err);
            });
        }
    });
});

// Pengatur Tema (Dark / Light Mode)
document.getElementById('themeToggle').addEventListener('change', (e) => {
    if (e.target.checked) {
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
    }
});

// Slider Volume
document.getElementById('volumeSlider').addEventListener('input', (e) => {
    const vol = e.target.value;
    document.getElementById('volumeVal').innerText = `${vol}%`;
    if (window.player && typeof window.player.setVolume === 'function') {
        window.player.setVolume(vol);
    }
});

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

window.addEventListener('DOMContentLoaded', () => {
    loadSavedEqualizer();
});
          
