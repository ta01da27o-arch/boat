async function loadData() {
  const res = await fetch("/data");
  const data = await res.json();
  document.getElementById("dataView").textContent = JSON.stringify(data, null, 2);
}

document.getElementById("refreshBtn").addEventListener("click", loadData);
loadData();
