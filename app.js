const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const processButton = document.getElementById("processButton");
const resetButton = document.getElementById("resetButton");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const fileNameEl = document.getElementById("fileName");
const rowCountEl = document.getElementById("rowCount");
const taskCountEl = document.getElementById("taskCount");
const dealerCountEl = document.getElementById("dealerCount");

let selectedFile = null;

const TASK_COL_INDEX = 18; // S column, zero-based
const DEALER_COL_INDEX = 1; // B column, zero-based

function text(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function normalizeFileName(name) {
  return name.replace(/\.(xlsx|xls)$/i, "");
}

function extractTaskId(value) {
  const source = text(value);
  if (!source) return "";

  const patterns = [
    /(?:^|[^A-Za-z])taskId[^0-9]{0,30}([0-9]{7})/i,
    /(?:^|[^A-Za-z])task_id[^0-9]{0,30}([0-9]{7})/i
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return match[1];
  }
  return "";
}

function extractDealerName(value) {
  const source = text(value);
  if (!source) return "";

  const nullPattern = /dealer\s*name\s*[-_:：]?\s*null/i;
  if (nullPattern.test(source) || /dealername\s*[-_:：]?\s*null/i.test(source)) return "";

  const patterns = [
    /dealer\s*name\s*[-_:：]\s*([^,，;；]+)/i,
    /dealername\s*[-_:：]\s*([^,，;；]+)/i,
    /"dealerName"\s*:\s*"([^"]*)"/i,
    /'dealerName'\s*:\s*'([^']*)'/i
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (!match) continue;
    const dealer = text(match[1]);
    if (!dealer || dealer.toLowerCase() === "null") return "";
    return dealer;
  }
  return "";
}

function updateSelectedFile(file) {
  selectedFile = file;
  processButton.disabled = !file;
  resetButton.disabled = !file;
  summaryEl.hidden = true;

  if (file) {
    setStatus(`已选择：${file.name}`);
  } else {
    setStatus("等待上传文件");
  }
}

function appendColumns(rows) {
  if (!rows.length) return { rows, rowCount: 0, taskCount: 0, dealerCount: 0 };

  const output = rows.map((row) => Array.isArray(row) ? row.slice() : []);
  const width = output.reduce((max, row) => Math.max(max, row.length), 0);
  const taskCol = width;
  const dealerCol = width + 1;
  let taskCount = 0;
  let dealerCount = 0;

  output.forEach((row) => {
    while (row.length < width) row.push("");
  });

  output[0][taskCol] = "任务号";
  output[0][dealerCol] = "问到的门店";

  for (let i = 1; i < output.length; i += 1) {
    const taskId = extractTaskId(output[i][TASK_COL_INDEX]);
    const dealerName = extractDealerName(output[i][DEALER_COL_INDEX]);
    output[i][taskCol] = taskId;
    output[i][dealerCol] = dealerName;
    if (taskId) taskCount += 1;
    if (dealerName) dealerCount += 1;
  }

  return {
    rows: output,
    rowCount: Math.max(output.length - 1, 0),
    taskCount,
    dealerCount
  };
}

function saveWorkbook(workbook, fileName) {
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${normalizeFileName(fileName)}_已提取.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function processFile() {
  if (!selectedFile) return;

  try {
    setStatus("正在处理...");
    processButton.disabled = true;

    const data = await selectedFile.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array", cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false
    });

    const result = appendColumns(rows);
    workbook.Sheets[firstSheetName] = XLSX.utils.aoa_to_sheet(result.rows);
    saveWorkbook(workbook, selectedFile.name);

    fileNameEl.textContent = selectedFile.name;
    rowCountEl.textContent = result.rowCount;
    taskCountEl.textContent = result.taskCount;
    dealerCountEl.textContent = result.dealerCount;
    summaryEl.hidden = false;
    setStatus("处理完成，已开始下载。", "done");
  } catch (error) {
    console.error(error);
    setStatus("处理失败，请确认上传的是 Excel 文件。", "error");
  } finally {
    processButton.disabled = !selectedFile;
  }
}

fileInput.addEventListener("change", () => {
  updateSelectedFile(fileInput.files[0] || null);
});

processButton.addEventListener("click", processFile);

resetButton.addEventListener("click", () => {
  fileInput.value = "";
  updateSelectedFile(null);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
});

dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (!file) return;
  fileInput.files = event.dataTransfer.files;
  updateSelectedFile(file);
});
