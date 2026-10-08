import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Firebase Projek Kamu
const firebaseConfig = {
  apiKey: "AIzaSyAOExLidtV2W7-Wnr2kygospjdbHidjGtQ",
  authDomain: "lostfounda-campus.firebaseapp.com",
  projectId: "lostfounda-campus",
  storageBucket: "lostfounda-campus.firebasestorage.app",
  messagingSenderId: "895161227929",
  appId: "1:895161227929:web:06fb40dc83f6675ceeb608"
};

// Inisialisasi Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const itemsCollection = collection(db, "items");
const claimsCollection = collection(db, "claims");

// DOM Elements
const reportForm = document.getElementById("reportForm");
const itemsGrid = document.getElementById("itemsGrid");
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const claimModal = document.getElementById("claimModal");
const closeModal = document.getElementById("closeModal");
const claimForm = document.getElementById("claimForm");

let allItems = [];

// 1. Submit Laporan Baru
reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newItem = {
    title: document.getElementById("title").value,
    type: document.getElementById("type").value,
    location: document.getElementById("location").value,
    description: document.getElementById("description").value,
    contact: document.getElementById("contact").value,
    claimQuestion: document.getElementById("claimQuestion").value || "-",
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(itemsCollection, newItem);
    reportForm.reset();
    alert("Laporan berhasil dikirim!");
  } catch (err) {
    console.error("Gagal menambah data: ", err);
    alert("Terjadi kesalahan saat mengirim laporan.");
  }
});

// 2. Baca Data Real-time dari Firebase
const q = query(itemsCollection, orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
  allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderItems(allItems);
});

// 3. Render Kartu Laporan ke HTML
function renderItems(items) {
  itemsGrid.innerHTML = "";
  
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = `item-card ${item.type}`;

    let claimBtnHTML = "";
    if (item.type === "Found") {
      claimBtnHTML = `<button class="claim-btn" onclick="openClaimModal('${item.id}', '${item.claimQuestion}')">Klaim Barang Ini</button>`;
    }

    card.innerHTML = `
      <div>
        <span class="badge ${item.type}">${item.type.toUpperCase()}</span>
        <div class="item-title">${item.title}</div>
        <div class="item-info">📍 ${item.location}</div>
        <p>${item.description}</p>
        <br>
        <small class="item-info">Kontak: ${item.contact}</small>
      </div>
      ${claimBtnHTML}
    `;

    itemsGrid.appendChild(card);
  });
}

// 4. Pencarian & Filter
function filterData() {
  const keyword = searchInput.value.toLowerCase();
  const selectedType = filterType.value;

  const filtered = allItems.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(keyword) || item.location.toLowerCase().includes(keyword);
    const matchType = selectedType === "All" || item.type === selectedType;
    return matchSearch && matchType;
  });

  renderItems(filtered);
}

searchInput.addEventListener("input", filterData);
filterType.addEventListener("change", filterData);

// 5. Fitur Modal Klaim Barang
window.openClaimModal = function(id, question) {
  document.getElementById("claimItemId").value = id;
  document.getElementById("modalQuestionText").innerText = 
    question !== "-" ? `Pertanyaan Verifikasi: "${question}"` : "Tidak ada pertanyaan verifikasi spesifik. Jelaskan ciri barang secara detail.";
  claimModal.style.display = "flex";
};

closeModal.onclick = () => claimModal.style.display = "none";
window.onclick = (e) => { if (e.target === claimModal) claimModal.style.display = "none"; };

// 6. Submit Form Klaim ke Firebase
claimForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newClaim = {
    itemId: document.getElementById("claimItemId").value,
    claimerName: document.getElementById("claimerName").value,
    claimerContact: document.getElementById("claimerContact").value,
    answer: document.getElementById("claimAnswer").value,
    status: "Pending",
    submittedAt: serverTimestamp()
  };

  try {
    await addDoc(claimsCollection, newClaim);
    claimForm.reset();
    claimModal.style.display = "none";
    alert("Pengajuan klaim berhasil dikirim! Penemu akan memeriksa jawaban kamu.");
  } catch (err) {
    console.error("Gagal mengajukan klaim: ", err);
    alert("Gagal mengirim klaim.");
  }
});