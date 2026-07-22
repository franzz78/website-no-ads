// ==========================================
// 1. KONFIGURASI FIREBASE REALTIME DATABASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyD9BmV4XKXuMWa4PZHpb7Bbt-rHs61m3lE",
  databaseURL: "https://absensi-polri-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "absensi-polri",
  storageBucket: "absensi-polri.firebasestorage.app",
  messagingSenderId: "19006760644",
  appId: "1:19006760644:web:b980f54aea123e92ed4b91"
};

// Inisialisasi Firebase jika SDK Firebase dipasang di HTML
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ==========================================
// 2. KONFIGURASI YOUTUBE DATA API V3
// ==========================================
const YOUTUBE_API_KEY = "AIzaSyBLSvFaEKv0TGmsslfknoHhlBCrSJzmtC4";

// ==========================================
// 3. GLOBAL CONFIGURATION & APP STATE
// ==========================================
const ADMIN_PASS = "ADMINWEBSITE2026##";
let isMusicActiveGlobal = true;

// REGISTER SERVICE WORKER (PWA READY)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('PWA Service Worker Online!'))
            .catch(err => console.log('SW Registration Error:', err));
    });
}

// ==========================================
// 4. INITIALIZATION & SPLASH ENGINE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Jalankan pencarian video terpopuler secara default saat pertama dibuka
    fetchYouTubeVideos("musik indonesia terbaru");

    // Connect Realtime Visitor Engine
    initRealtimeDatabase();

    // Splash Loader Engine
    let fill = document.getElementById("progress-bar-fill");
    let counter = document.getElementById("splash-counter");
    let statusLog = document.getElementById("render-status-log");
    let pct = 0;

    const renderLogs = [
        { limit: 20, text: "🤖 Loading Kernel Core..." },
        { limit: 40, text: "📡 Connecting Realtime DB..." },
        { limit: 65, text: "⚙️ Syncing YouTube API v3..." },
        { limit: 85, text: "💎 Injecting Glassmorphism UI..." },
        { limit: 100, text: "✨ System Ready!" }
    ];

    let timer = setInterval(() => {
        pct += Math.floor(Math.random() * 3) + 1;
        if (pct > 100) pct = 100;
        
        if (fill) fill.style.width = pct + "%";
        if (counter) counter.innerText = pct + "%";

        for (let log of renderLogs) {
            if (pct <= log.limit) {
                if (statusLog) statusLog.innerText = log.text;
                break;
            }
        }

        if (pct >= 100) {
            clearInterval(timer);
            let loader = document.getElementById("splash-screen");
            if (loader) {
                loader.style.opacity = "0";
                loader.style.transform = "scale(1.05)";
                setTimeout(() => {
                    loader.style.display = "none";
                    document.getElementById("main-gate-screen").style.display = "flex";
                }, 600);
            }
        }
    }, 40);

    // Audio Controller Setup
    initAudioController();
});

// ==========================================
// 5. REAL-TIME DB VISITOR ENGINE
// ==========================================
function initRealtimeDatabase() {
    if (typeof firebase !== 'undefined' && firebase.database) {
        const dbRef = firebase.database().ref('site_stats/visitors');
        dbRef.on('value', (snapshot) => {
            const count = snapshot.val() || 100000;
            updateVisitorUI(count);
        });
        dbRef.transaction((current) => (current || 100000) + 1);
    } else {
        // Fallback Simulasi jika SDK Offline
        let currentVisitors = 100245; 
        setInterval(() => {
            currentVisitors += Math.floor(Math.random() * 2);
            updateVisitorUI(currentVisitors);
        }, 5000);
    }
}

function updateVisitorUI(total) {
    const visitorElement = document.getElementById("visitor-count-num");
    if (visitorElement) {
        let formatted = total >= 1000 ? (total / 1000).toFixed(1) + "K+" : total;
        visitorElement.innerText = formatted;
    }
}

// ==========================================
// 6. YOUTUBE API V3 FETCH ENGINE & SEARCH
// ==========================================
async function fetchYouTubeVideos(query) {
    const grid = document.getElementById("video-feed-grid");
    if (!grid) return;

    // Render Skeleton Loader saat fetching
    grid.innerHTML = `
        <div class="skeleton-loader-container w-full col-span-full">
            ${Array(3).fill().map(() => `
                <div class="skeleton-card mb-3">
                    <div class="skeleton-thumb"></div>
                    <div class="skeleton-info">
                        <div class="skeleton-text-title"></div>
                        <div class="skeleton-text-channel"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            grid.innerHTML = data.items.map(item => `
                <div onclick="playVideoDemo('${item.id.videoId}', '${item.snippet.title.replace(/'/g, "\\'")}')" 
                     class="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-cyan-400 transition">
                    <img src="${item.snippet.thumbnails.default.url}" class="w-20 h-12 object-cover rounded-lg" alt="Thumb">
                    <div class="overflow-hidden">
                        <h4 class="font-bold text-xs text-white truncate">${item.snippet.title}</h4>
                        <span class="text-[10px] text-slate-400">${item.snippet.channelTitle}</span>
                    </div>
                </div>
            `).join('');
        } else {
            grid.innerHTML = `<p class="text-xs text-slate-400 col-span-full text-center py-4">Tidak ada video ditemukan.</p>`;
        }
    } catch (error) {
        console.error("Error YouTube API:", error);
        // Fallback UI jika kuota/API mengalami kendala
        grid.innerHTML = `
            <div onclick="playVideoDemo('dQw4w9WgXcQ', 'Cyberpunk Music 2026')" class="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-cyan-400 transition">
                <div class="w-20 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400"><i class="fas fa-play"></i></div>
                <div>
                    <h4 class="font-bold text-xs text-white">Cyberpunk Music Video 2026</h4>
                    <span class="text-[10px] text-slate-400">Garuda Sound System • Live</span>
                </div>
            </div>
        `;
    }
}

// [FITUR TAMBAHAN] HANDLER PENCARIAN REAL-TIME UNTUK SEARCH BAR & CATEGORY CHIPS
function executeVideoSearch() {
    const input = document.getElementById("youtube-search-input");
    if (!input) return;
    
    const query = input.value.trim();
    if (query !== "") {
        const titleLabel = document.getElementById("feed-title-label");
        if (titleLabel) titleLabel.innerText = `Hasil Pencarian: "${query}"`;
        fetchYouTubeVideos(query);
    }
}

function handleSearchKeyPress(event) {
    if (event.key === 'Enter') {
        executeVideoSearch();
    }
}

function filterByCategory(categoryName, element) {
    if (element) {
        document.querySelectorAll('.category-chip').forEach(chip => chip.classList.remove('active'));
        element.classList.add('active');
    }
    
    const input = document.getElementById('youtube-search-input');
    if (input) {
        input.value = categoryName;
    }
    
    const titleLabel = document.getElementById("feed-title-label");
    if (titleLabel) titleLabel.innerText = `Kategori: ${categoryName}`;
    
    fetchYouTubeVideos(categoryName);
}

// ==========================================
// 7. GATEWAY & AUTH LOGIC
// ==========================================
function enterAppWithoutAccount() {
    document.getElementById("main-gate-screen").style.display = "none";
    document.getElementById("main-app-dashboard").style.display = "block";
}

function openLoginModal() {
    Swal.fire({
        title: 'AUTHENTICATION',
        input: 'password',
        inputPlaceholder: 'Masukkan Kode Akses Admin',
        background: '#090d22',
        color: '#fff',
        confirmButtonColor: '#00f2fe',
        showCancelButton: true
    }).then((result) => {
        if (result.value === ADMIN_PASS) {
            Swal.fire({ icon: 'success', title: 'Akses Diterima', background: '#090d22', color: '#fff', timer: 1200, showConfirmButton: false });
            enterAppWithoutAccount();
        } else if (result.value) {
            Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Password Salah!', background: '#090d22', color: '#fff' });
        }
    });
}

// ==========================================
// 8. AMBIENT GLOW PLAYER ENGINE
// ==========================================
function playVideoDemo(videoId, title) {
    const playerContainer = document.getElementById("mainPlayerContainer");
    const playerDisplay = document.getElementById("player-display");

    playerDisplay.innerHTML = `
        <iframe class="w-full h-full rounded-xl" 
            src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;

    // Ambient Glow FX
    const colors = ['rgba(0,242,254,0.4)', 'rgba(255,0,127,0.4)', 'rgba(168,85,247,0.4)'];
    const selectedColor = colors[Math.floor(Math.random() * colors.length)];
    playerContainer.style.setProperty('--ambient-color', selectedColor);
    playerContainer.classList.add('media-playing');
    
    // Auto scroll ke player saat video diputar
    playerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ==========================================
// 9. AUDIO & VINYL CONTROLLER
// ==========================================
function initAudioController() {
    const audio = document.getElementById('bg-music');
    const vinyl = document.getElementById('vinyl-disc');
    const musicWidget = document.getElementById('music-floating-widget');
    const equalizer = document.getElementById('miniEqualizer');

    if (!audio) return;
    audio.volume = 0.3;

    const handleFirstTouch = () => {
        if (isMusicActiveGlobal && audio.paused) {
            audio.play().then(() => {
                if (vinyl) vinyl.classList.remove('paused');
                if (equalizer) equalizer.classList.add('playing');
            }).catch(() => {});
        }
        document.body.removeEventListener('click', handleFirstTouch);
        document.body.removeEventListener('touchstart', handleFirstTouch);
    };

    document.body.addEventListener('click', handleFirstTouch);
    document.body.addEventListener('touchstart', handleFirstTouch);

    setInterval(() => {
        if (musicWidget) musicWidget.classList.toggle('hide-widget');
    }, 15000);
}

function toggleAudioPlayback() {
    const audio = document.getElementById('bg-music');
    const vinyl = document.getElementById('vinyl-disc');
    const equalizer = document.getElementById('miniEqualizer');

    if (audio.paused) {
        audio.play();
        vinyl.classList.remove('paused');
        equalizer.classList.add('playing');
    } else {
        audio.pause();
        vinyl.classList.add('paused');
        equalizer.classList.remove('playing');
    }
}

// ==========================================
// 10. OWNER PROFILE MODAL
// ==========================================
function showOwnerProfileAlert() {
    Swal.fire({
        title: '✨ OWNER PROFILE ✨',
        html: `
            <div style="padding: 10px 0; text-align: center;">
                <div style="width: 70px; height: 70px; margin: 0 auto 12px; background: #090d22; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px; border: 2px solid var(--primary-theme); box-shadow: 0 0 15px var(--primary-theme);">H79</div>
                <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin: 0;">HARUUKII79</h3>
                <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Developer & Owner</span>
                <div style="margin-top: 15px;">
                    <a href="https://instagram.com/USERNAME_KAMU_DISINI" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; background: linear-gradient(45deg, #f09433, #dc2743, #bc1888); color: #fff; font-size: 12px; font-weight: 700; border-radius: 20px; text-decoration: none; box-shadow: 0 4px 15px rgba(220, 39, 67, 0.4);">
                        <i class="fab fa-instagram"></i> Follow Instagram
                    </a>
                </div>
            </div>
        `,
        background: '#090d22',
        width: '320px',
        showConfirmButton: false,
        showCloseButton: true
    });
    }

  // Contoh fungsi di script.js yang menerima pencarian
function handleSearch() {
    const query = document.getElementById('searchInput').value;
    // Jalankan fetch ke YouTube API v3 menggunakan API Key kamu
    // render hasilnya ke element dengan id "video-feed-grid"
}

