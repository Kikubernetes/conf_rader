async function loadConfs() {
  const res = await fetch("./assets/data/conferences.json");
  return await res.json();
}

function linkCell(name, url) {
  if (!url) return name;
  const a = document.createElement("a");
  a.href = url;
  a.textContent = name;
  a.target = "_blank";
  a.rel = "noopener";
  return a.outerHTML;
}

function parseISODate(s) {
  if (!s || typeof s !== "string") return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadConfs();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let showPast = document.getElementById("showPast")?.checked ?? true;

  // DataTables 行フィルタ（期限切れ表示切替）
  DataTable.ext.search.push((settings, searchData, index, rowData) => {
    if (showPast) return true;
    const sort = rowData?.deadline?.sort ?? null;
    const d = parseISODate(sort);
    if (!d) return true;      // sortなし（不明・未発表）は表示
    return d >= today;        // 過去は除外
  });

  const table = new DataTable("#confTable", {
    data,
    columns: [
      { data: null, render: (d) => linkCell(d.name, d.url) },
      { data: "area" },
      { data: "location" },
      { data: "start" },
      { data: "end" },
      { data: "deadline.text", defaultContent: "" },
      { data: "tags", render: (t) => (t || []).join(", ") },
    ],
    columnDefs: [
      {
        targets: 5, // Deadline列
        render: (data, type, row) => {
          if (type === "sort" || type === "type") {
            return row?.deadline?.sort ?? "9999-12-31";
          }
          return row?.deadline?.text ?? "";
        },
      },
    ],
    order: [[5, "asc"]],
    pageLength: 50,
  });

  // Area filter
  const area = document.getElementById("areaFilter");
  if (area) {
    area.addEventListener("change", () => {
      const v = area.value;
      table.column(1).search(v ? `^${v}$` : "", true, false).draw();
    });
  }

  // Show past toggle
  const showPastEl = document.getElementById("showPast");
  if (showPastEl) {
    showPastEl.addEventListener("change", () => {
      showPast = showPastEl.checked;
      table.draw();
    });
  }
});