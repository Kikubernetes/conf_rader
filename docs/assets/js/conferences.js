async function loadConfs() {
  const base = new URL("..", window.location.href); // /conferences/ → /conf_rader/
  const url = new URL("assets/data/conferences.json", base);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
  return await res.json();
}

function linkCell(name, url) {
  if (!url) return name;
  return `<a href="${url}" target="_blank" rel="noopener">${name}</a>`;
}

function parseISODate(s) {
  if (!s || typeof s !== "string") return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

async function initConferenceTable() {
  const tableEl = document.querySelector("#confTable");
  if (!tableEl) return;

  // DataTables がロードされていない場合は何もしない（原因切り分け用）
  if (typeof DataTable === "undefined") {
    console.error("DataTable is undefined: DataTables library not loaded.");
    return;
  }

  // 二重初期化防止（ページ遷移で複数回呼ばれるため）
  if (tableEl.dataset.dtInitialized === "1") return;
  tableEl.dataset.dtInitialized = "1";

  const data = await loadConfs();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let showPast = document.getElementById("showPast")?.checked ?? true;

  // 期限切れ表示切替
  DataTable.ext.search.push((settings, searchData, index, rowData) => {
    if (showPast) return true;
    const sort = rowData?.deadline?.sort ?? null;
    const d = parseISODate(sort);
    if (!d) return true; // sortなし（未発表等）は表示
    return d >= today;
  });

  const dt = new DataTable("#confTable", {
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
  //   columnDefs: [
  //     {
  //       targets: 5, // Deadline列
  //       render: (data, type, row) => {
  //         if (type === "sort" || type === "type") {
  //           return row?.deadline?.sort ?? "9999-12-31";
  //         }
  //         return row?.deadline?.text ?? "";
  //       },
  //     },
  //   ],
  //   order: [[5, "asc"]],
  //   pageLength: 50,
  // });
    columnDefs: [
    { targets: 0, width: "20%" },
    { targets: 1, width: "10%" },
    { targets: 3, width: "13%" },
    { targets: 4, width: "10%" },
    {
      targets: 5,
      render: (data, type, row) => {
        if (type === "sort" || type === "type") {
          return row?.deadline?.sort ?? "9999-12-31";
        }
        return row?.deadline?.text ?? "";
      },
    },
    { targets: 6, width: "15%" },
  ],

  autoWidth: false,
  order: [[5, "asc"]],
  pageLength: 50,
});

  // Area filter
  document.getElementById("areaFilter")?.addEventListener("change", (e) => {
    const v = e.target.value;
    dt.column(1).search(v ? `^${v}$` : "", true, false).draw();
  });

  // Show past toggle
  document.getElementById("showPast")?.addEventListener("change", (e) => {
    showPast = e.target.checked;
    dt.draw();
  });
}

// Material for MkDocs の instant navigation 対応
if (typeof document$ !== "undefined" && document$?.subscribe) {
  document$.subscribe(() => {
    initConferenceTable().catch(console.error);
  });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    initConferenceTable().catch(console.error);
  });
}