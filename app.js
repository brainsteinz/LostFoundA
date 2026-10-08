import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// KREDENSIAL FIREBASE MILIKMU
const firebaseConfig = {
  apiKey: "AIzaSyAOExLidtV2W7-Wnr2kygospjdbHidjGtQ",
  authDomain: "lostfounda-campus.firebaseapp.com",
  projectId: "lostfounda-campus",
  storageBucket: "lostfounda-campus.firebasestorage.app",
  messagingSenderId: "895161227929",
  appId: "1:895161227929:web:06fb40dc83f6675ceeb608"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const itemsCollection = collection(db, "items");

const reportForm = document.getElementById("reportForm");
const lostList = document.getElementById("lostList");
const foundList = document.getElementById("foundList");
const completedList = document.getElementById("completedList");
const searchInput = document.getElementById("searchInput");

let allItems = [];

// 1. Submit Laporan
reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const typeVal = document.getElementById("type").value;
  const contactPlatformVal = document.getElementById("contactPlatform").value;
  const contactDetailVal = document.getElementById("contactDetail").value;

  const newItem = {
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    type: typeVal,
    date: document.getElementById("date").value,
    location: document.getElementById("location").value,
    contactPlatform: contactPlatformVal,
    contactDetail: contactDetailVal,
    description: document.getElementById("description").value,
    status: "Active", // Status awal: Active
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(itemsCollection, newItem);
    reportForm.reset();
    alert("Laporan berhasil dikirim!");
  } catch (err) {
    console.error("Gagal menambah data: ", err);
    alert("Terjadi kesalahan.");
  }
});

// 2. Ambil Data Real-time
const q = query(itemsCollection, orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
  allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderDashboard(allItems);
});

// 3. Render Dashboard 3 Kolom
function renderDashboard(items) {
  lostList.innerHTML = "";
  foundList.innerHTML = "";
  completedList.innerHTML = "";

  const keyword = searchInput.value.toLowerCase();
  const filtered = items.filter(item => 
    item.title.toLowerCase().includes(keyword) ||
    item.category.toLowerCase().includes(keyword) ||
    item.location.toLowerCase().includes(keyword)
  );

  // Pisahkan Data Berdasarkan Kategori Tampilan
  const lostItems = filtered.filter(i => i.type === "Lost" && i.status === "Active");
  const foundItems = filtered.filter(i => i.type === "Found" && i.status === "Active");
  const completedItems = filtered.filter(i => i.status === "Completed");

  // Render per Kolom
  renderColumn(lostList, lostItems, "Lost");
  renderColumn(foundList, foundItems, "Found");
  renderColumn(completedList, completedItems, "Completed");
}

// Function Pembantu untuk Mengelompokkan Data Berdasarkan Tanggal
function groupItemsByDate(items) {
  return items.reduce((groups, item) => {
    const date = item.date || "Tanpa Tanggal";
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});
}

// Function Render Isi Kolom
function renderColumn(container, items, columnType) {
  if (items.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#94a3b8; font-size:0.85rem; padding:1rem;">Tidak ada laporan</p>`;
    return;
  }

  const grouped = groupItemsByDate(items);

  for (const [date, dateItems] of Object.entries(grouped)) {
    const dateGroup = document.createElement("div");
    dateGroup.className = "date-group";
    dateGroup.innerHTML = `<div class="date-divider">📅 Tanggal: ${date}</div>`;

    dateItems.forEach(item => {
      const card = document.createElement("div");
      card.className = "item-card";

      const contactLabel = item.type === "Lost" ? "Kontak Pemilik" : "Kontak Penemu";
      
      let actionHTML = "";
      if (columnType !== "Completed") {
        actionHTML = `<button class="action-btn btn-complete" onclick="markAsCompleted('${item.id}')">Tandai Selesai</button>`;
      } else {
        const completedText = item.type === "Lost" ? "Hilang Selesai" : "Ditemukan Selesai";
        actionHTML = `<div class="status-completed-text">✓ ${completedText}</div>`;
      }

      card.innerHTML = `
        <div class="item-title">${item.title}</div>
        <span class="category-tag">${item.category}</span>
        <div class="item-info">📍 ${item.location}</div>
        <div class="item-info">📱 ${contactLabel}: <strong>${item.contactPlatform}</strong> (${item.contactDetail})</div>
        <p style="font-size:0.85rem; margin-top:0.4rem; color:#475569;">${item.description}</p>
        ${actionHTML}
      `;

      dateGroup.appendChild(card);
    });

    container.appendChild(dateGroup);
  }
}

// 4. Ubah Status Laporan Menjadi Selesai
window.markAsCompleted = async function(id) {
  if (confirm("Apakah kasus barang ini sudah selesai/ditemukan kembali?")) {
    try {
      const itemRef = doc(db, "items", id);
      await updateDoc(itemRef, { status: "Completed" });
    } catch (err) {
      console.error("Gagal mengupdate status: ", err);
    }
  }
};

// Filter Real-time
searchInput.addEventListener("input", () => renderDashboard(allItems));
