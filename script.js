const lostDiv = document.getElementById("lostItems");
const foundDiv = document.getElementById("foundItems");

// Fetch Lost Items
async function fetchLost() {
  const res = await fetch("http://localhost:3000/lost");
  const lostItems = await res.json();

  lostDiv.innerHTML = lostItems.map((item, index) => `
    <div style="border:1px solid #ccc; padding:10px; margin:5px;">
      <strong>Item:</strong> ${item.item} <br>
      <strong>Color:</strong> ${item.color || "-"} <br>
      <strong>Details:</strong> ${item.details || "-"} <br>
      <strong>Location:</strong> ${item.location || "-"} <br>
      <strong>Status:</strong> ${item.status || "pending"} <br>
      <button onclick="approveLost(${index})">Approve</button>
      <button onclick="rejectLost(${index})">Reject</button>
    </div>
  `).join("");
}

// Fetch Found Items
async function fetchFound() {
  const res = await fetch("http://localhost:3000/found");
  const foundItems = await res.json();

  foundDiv.innerHTML = foundItems.map((item, index) => `
    <div style="border:1px solid #ccc; padding:10px; margin:5px;">
      <strong>Item:</strong> ${item.item} <br>
      <strong>Location:</strong> ${item.location || "-"} <br>
      <strong>Picture:</strong> ${item.picture || "-"} <br>
      <strong>Status:</strong> ${item.status || "pending"} <br>
      <button onclick="acceptFound(${index})">Accept</button>
    </div>
  `).join("");
}

// --------------------
// Action Functions
// --------------------

async function approveLost(index) {
  const res = await fetch("http://localhost:3000/admin/lost/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index })
  });
  const result = await res.json();
  alert(result.message);
  fetchLost(); // refresh list
}

async function rejectLost(index) {
  const res = await fetch("http://localhost:3000/admin/lost/reject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index })
  });
  const result = await res.json();
  alert(result.message);
  fetchLost(); // refresh list
}

async function acceptFound(index) {
  const res = await fetch("http://localhost:3000/admin/found/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index })
  });
  const result = await res.json();
  alert(result.message);
  fetchFound(); // refresh list
}

// Initial fetch
fetchLost();
fetchFound();
