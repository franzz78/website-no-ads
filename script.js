// ==========================================
// 1. KONFIGURASI FIREBASE (TETAP DIPERTAHANKAN)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyD9BmV4XKXuMWa4PZHpb7Bbt-rHs61m3lE",
  databaseURL: "https://absensi-polri-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "absensi-polri",
  storageBucket: "absensi-polri.firebasestorage.app",
  messagingSenderId: "19006760644",
  appId: "1:19006760644:web:b980f54aea123e92ed4b91"
};

// Catatan: Jika kamu menggunakan Firebase SDK, pastikan inisialisasi di bawah ini tetap aktif
// firebase.initializeApp(firebaseConfig);


// ==========================================
// 2. KONFIGURASI YOUTUBE DATA API V3
// ==========================================
const YOUTUBE_API_KEY = "AIzaSyBLSvFaEKv0TGmsslfknoHhlBCrSJzmtC4";

document.addEventListener("DOMContentLoaded", () => {
    // Jalankan pencarian video terpopuler secara default saat pertama dibuka
    fetchYouTubeVideos("musik indonesia terbaru");

    // Tangani klik tombol Cari
    const searchBtn = document.querySelector(".search-btn");
    const searchInput = document.getElementById("search-input");

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", () => {
            const query = searchInput.value.trim();
            if (query) {
                fetchYouTubeVideos(query);
            }
        });

        // Tangani tombol enter saat mengetik di pencarian
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                const query = searchInput.value.trim();
                if (query) {
                    fetchYouTubeVideos(query);
                }
            }
        });
    }

    // Tangani klik pada Tag Kategori cepat
    const tags = document.querySelectorAll(".tag");
    tags.forEach(tag => {
        tag.addEventListener("click", () => {
            const activeTag = document.querySelector(".tag.active");
            if (activeTag) activeTag.classList.remove("active");
            tag.classList.add("active");
            fetchYouTubeVideos(tag.innerText);
        });
    });
});

// Fungsi Fetch mengambil data dari server YouTube API v3
async function fetchYouTubeVideos(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=16&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items) {
            displayVideos(data.items);
        }
    } catch (error) {
        console.error("Gagal mengambil data dari YouTube API:", error);
    }
}

// Menampilkan daftar video ke dalam layout grid
function displayVideos(videos) {
    const videoGrid = document.querySelector(".video-grid");
    if (!videoGrid) return;
    
    videoGrid.innerHTML = ""; 

    videos.forEach(item => {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const channelName = item.snippet.channelTitle;
        const thumbnail = item.snippet.thumbnails.medium.url;

        const videoCard = document.createElement("div");
        videoCard.className = "video-card";
        
        // Memasang trigger klik dinamis agar video bisa langsung dimainkan di player atas
        videoCard.setAttribute("onclick", `playVideo('${videoId}', \`${title.replace(/'/g, "\\'")}\`, '${channelName.replace(/'/g, "\\'")}')`);

        videoCard.innerHTML = `
            <div class="thumbnail-container">
                <img class="thumbnail" src="${thumbnail}" alt="${title}">
                <span class="duration">HD Stream</span>
            </div>
            <div class="video-details">
                <div class="video-text">
                    <h3 class="video-title">${title}</h3>
                    <p class="channel-name">${channelName} <i class="fas fa-check-circle"></i></p>
                    <p class="video-stats">Bebas Iklan Komersial</p>
                </div>
            </div>
        `;
        videoGrid.appendChild(videoCard);
    });
}
