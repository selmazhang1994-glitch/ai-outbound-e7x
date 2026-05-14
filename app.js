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
const cityCountEl = document.getElementById("cityCount");
const areaCountEl = document.getElementById("areaCount");
const intentCountEl = document.getElementById("intentCount");
const purchaseTimeCountEl = document.getElementById("purchaseTimeCount");
const carModelCountEl = document.getElementById("carModelCount");
const defeatReasonCountEl = document.getElementById("defeatReasonCount");

let selectedFile = null;

const TASK_COL_INDEX = 18; // S column, zero-based
const DEALER_COL_INDEX = 1; // B column, zero-based
const CALL_RECORD_COL_INDEX = 17; // R column, zero-based
const DIRECT_CITIES = new Set(["北京市", "上海市", "天津市", "重庆市"]);
const AREA_SUFFIXES = ["自治县", "自治旗", "新区", "城区", "林区", "地区", "区", "县", "市", "旗", "镇", "乡"];
const CITY_QUESTION_WORDS = ["哪个城市", "哪座城市", "在哪个市", "在哪个城市", "哪个市", "什么城市"];
const AREA_QUESTION_WORDS = ["哪个区", "哪个县", "哪个区域", "哪一区", "什么区", "什么县"];
const FALSE_AREA_WORDS = new Set(["奔驰", "如果是", "用不着嘞", "济南河南", "苏州"]);
const NON_LOCATION_CITY_FOLLOWERS = ["车展", "国际车展", "展会", "发布会", "车展上", "车展期间", "车展现场", "亮相", "区", "县", "镇", "乡", "街道"];
const NON_LOCATION_CITY_CONTEXTS = ["生产基地位于", "基地位于", "工厂位于", "总部位于", "位于广州", "宁德时代"];
const CITY_ALIASES = [
  "北京", "上海", "天津", "重庆", "石家庄", "唐山", "秦皇岛", "邯郸", "邢台", "保定", "张家口", "承德", "沧州", "廊坊", "衡水",
  "太原", "大同", "阳泉", "长治", "晋城", "朔州", "晋中", "运城", "忻州", "临汾", "吕梁", "呼和浩特", "包头", "乌海", "赤峰",
  "通辽", "鄂尔多斯", "呼伦贝尔", "巴彦淖尔", "乌兰察布", "沈阳", "大连", "鞍山", "抚顺", "本溪", "丹东", "锦州", "营口",
  "阜新", "辽阳", "盘锦", "铁岭", "朝阳", "葫芦岛", "长春", "吉林", "四平", "辽源", "通化", "白山", "松原", "白城",
  "哈尔滨", "齐齐哈尔", "鸡西", "鹤岗", "双鸭山", "大庆", "伊春", "佳木斯", "七台河", "牡丹江", "黑河", "绥化", "南京",
  "无锡", "徐州", "常州", "苏州", "南通", "连云港", "淮安", "盐城", "扬州", "镇江", "泰州", "宿迁", "杭州", "宁波",
  "温州", "嘉兴", "湖州", "绍兴", "金华", "衢州", "舟山", "台州", "丽水", "合肥", "芜湖", "蚌埠", "淮南", "马鞍山",
  "淮北", "铜陵", "安庆", "黄山", "滁州", "阜阳", "宿州", "六安", "亳州", "池州", "宣城", "福州", "厦门", "莆田",
  "三明", "泉州", "漳州", "南平", "龙岩", "宁德", "南昌", "景德镇", "萍乡", "九江", "新余", "鹰潭", "赣州", "吉安",
  "宜春", "抚州", "上饶", "济南", "青岛", "淄博", "枣庄", "东营", "烟台", "潍坊", "济宁", "泰安", "威海", "日照",
  "临沂", "德州", "聊城", "滨州", "菏泽", "郑州", "开封", "洛阳", "平顶山", "安阳", "鹤壁", "新乡", "焦作", "濮阳",
  "许昌", "漯河", "三门峡", "南阳", "商丘", "信阳", "周口", "驻马店", "武汉", "黄石", "十堰", "宜昌", "襄阳", "鄂州",
  "荆门", "孝感", "荆州", "黄冈", "咸宁", "随州", "长沙", "株洲", "湘潭", "衡阳", "邵阳", "岳阳", "常德", "张家界",
  "益阳", "郴州", "永州", "怀化", "娄底", "广州", "韶关", "深圳", "珠海", "汕头", "佛山", "江门", "湛江", "茂名",
  "肇庆", "惠州", "梅州", "汕尾", "河源", "阳江", "清远", "东莞", "中山", "潮州", "揭阳", "云浮", "南宁", "柳州",
  "桂林", "梧州", "北海", "防城港", "钦州", "贵港", "玉林", "百色", "贺州", "河池", "来宾", "崇左", "海口", "三亚",
  "三沙", "儋州", "成都", "自贡", "攀枝花", "泸州", "德阳", "绵阳", "广元", "遂宁", "内江", "乐山", "南充", "眉山",
  "宜宾", "广安", "达州", "雅安", "巴中", "资阳", "贵阳", "六盘水", "遵义", "安顺", "毕节", "铜仁", "昆明", "曲靖",
  "玉溪", "保山", "昭通", "丽江", "普洱", "临沧", "拉萨", "日喀则", "昌都", "林芝", "山南", "那曲", "西安", "铜川",
  "宝鸡", "咸阳", "渭南", "延安", "汉中", "榆林", "安康", "商洛", "兰州", "嘉峪关", "金昌", "白银", "天水", "武威",
  "张掖", "平凉", "酒泉", "庆阳", "定西", "陇南", "西宁", "海东", "银川", "石嘴山", "吴忠", "固原", "中卫", "乌鲁木齐",
  "克拉玛依", "吐鲁番", "哈密"
].sort((a, b) => b.length - a.length);
const AREA_CORRECTIONS = new Map([
  ["仁泽区", "任泽区"],
  ["仁泽", "任泽区"],
  ["重新区", "崇川区"],
  ["重新", "崇川区"]
]);

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

function splitRuleTags(value) {
  return text(value)
    .split(/[;,，；]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractRuleTag(value, label) {
  const prefix = `${label}_`;
  const tag = splitRuleTags(value).find((item) => item.startsWith(prefix));
  return tag ? text(tag.slice(prefix.length)) : "";
}

function extractIntentCarFromVariables(value) {
  const source = text(value);
  if (!source) return "";

  const quoted = source.match(/"intentionalCarSeries"\s*:\s*"([^"]+)"/i);
  if (quoted) return text(quoted[1]);

  const plain = source.match(/intentionalCarSeries\s*[:：]\s*([^,，;；}]+)/i);
  return plain ? text(plain[1]).replace(/^["']|["']$/g, "") : "";
}

function extractLeadFields(ruleTags, customerVariables) {
  return {
    intent: extractRuleTag(ruleTags, "意向"),
    purchaseTime: extractRuleTag(ruleTags, "购车时间"),
    carModel: extractRuleTag(ruleTags, "意向车") || extractIntentCarFromVariables(customerVariables),
    defeatReason: extractRuleTag(ruleTags, "战败原因")
  };
}

function normalizeForSearch(value) {
  return text(value).replace(/\s+/g, "");
}

function findLocationCityAlias(value) {
  const source = normalizeForSearch(value)
    .replace(/[，。,.；;！!？?]/g, "")
    .replace(/^(我在|现在在|目前在|在|是|啊|嗯|呃|哦)/, "");

  if (NON_LOCATION_CITY_CONTEXTS.some((word) => source.includes(word))) return "";

  for (const name of CITY_ALIASES) {
    const index = source.indexOf(name);
    if (index === -1) continue;
    const after = source.slice(index + name.length, index + name.length + 6);
    if (NON_LOCATION_CITY_FOLLOWERS.some((word) => after.startsWith(word))) continue;
    return name;
  }

  return "";
}

function parseTurns(callRecord) {
  const source = text(callRecord);
  const turns = [];
  const pattern = /([QA])\s*:\s*"([^"]*)"/g;
  let match;
  while ((match = pattern.exec(source))) {
    turns.push({
      role: match[1],
      content: normalizeForSearch(match[2]),
      start: match.index,
      end: pattern.lastIndex
    });
  }
  return turns;
}

function hasAny(source, words) {
  return words.some((word) => source.includes(word));
}

function normalizeCityName(value) {
  const hit = findLocationCityAlias(value);
  if (!hit) return "";
  return DIRECT_CITIES.has(`${hit}市`) ? `${hit}市` : `${hit}市`;
}

function extractCity(callRecord, dealerName) {
  const turns = parseTurns(callRecord);
  const candidates = [];

  for (let i = 0; i < turns.length; i += 1) {
    const turn = turns[i];
    const city = normalizeCityName(turn.content);
    if (!city) continue;
    let score = 1;
    if (turn.role === "A") score += 3;
    if (turn.role === "Q" && /查到|目前|是在|在/.test(turn.content)) score += 2;
    const prev = turns[i - 1];
    if (prev && prev.role === "Q" && hasAny(prev.content, CITY_QUESTION_WORDS)) score += 10;
    if (prev && prev.role === "Q" && hasAny(prev.content, AREA_QUESTION_WORDS)) score += 2;
    if (/用户中心|地址/.test(turn.content)) score -= 2;
    candidates.push({ city, score });
  }

  const dealerCity = normalizeCityName(dealerName);
  if (dealerCity) candidates.push({ city: dealerCity, score: 1 });
  if (!candidates.length) return "";

  const bestByCity = new Map();
  candidates.forEach((candidate) => {
    const previous = bestByCity.get(candidate.city);
    if (!previous || candidate.score > previous.score) bestByCity.set(candidate.city, candidate);
  });
  return [...bestByCity.values()].sort((a, b) => b.score - a.score)[0].city;
}

function cleanAreaCandidate(value) {
  let area = normalizeForSearch(value)
    .replace(/[，。,.；;！!？?]/g, "")
    .replace(/^(我在|现在在|目前在|就在|在|这|是|啊|嗯|呃|哦)/, "")
    .replace(/这边.*$/, "");
  for (const [wrong, right] of AREA_CORRECTIONS.entries()) {
    if (area.includes(wrong)) return right;
  }
  const match = area.match(/([\u4e00-\u9fa5]{2,8}(?:自治县|自治旗|新区|城区|林区|区|县|市|旗|镇|乡))/);
  if (match) area = match[1];
  if (!area || area.length > 8 || FALSE_AREA_WORDS.has(area)) return "";
  if (AREA_SUFFIXES.some((suffix) => area.endsWith(suffix))) return area;
  return "";
}

function extractLiteralAreaFromAnswer(turns) {
  for (let i = 1; i < turns.length; i += 1) {
    const prev = turns[i - 1];
    const turn = turns[i];
    if (!prev || prev.role !== "Q" || turn.role !== "A") continue;
    if (!hasAny(prev.content, AREA_QUESTION_WORDS)) continue;
    const answer = cleanAreaCandidate(turn.content);
    if (answer) return answer;
  }
  return "";
}

function extractArea(callRecord, cityName, dealerName) {
  if (!cityName) return "";
  const turns = parseTurns(callRecord);
  const fromAnswer = extractLiteralAreaFromAnswer(turns);
  if (fromAnswer) return fromAnswer;

  const cityShort = cityName.replace(/市$/, "");
  for (const turn of turns) {
    const content = turn.content.replace(cityName, cityShort);
    const afterCity = content.includes(cityShort) ? content.slice(content.indexOf(cityShort) + cityShort.length) : content;
    if (turn.role === "Q" && /查到|您在|最近|门店|地址|这边|用户中心|有一家/.test(turn.content)) {
      const area = cleanAreaCandidate(afterCity);
      if (area) return area;
    }
  }

  return cleanAreaCandidate(dealerName);
}

function findColumn(headers, names, fallbackIndex = -1) {
  const normalized = headers.map((header) => text(header));
  for (const name of names) {
    const index = normalized.indexOf(name);
    if (index !== -1) return index;
  }
  return fallbackIndex;
}

function ensureColumn(output, name, afterIndex = -1, aliases = []) {
  const headers = output[0].map((header) => text(header));
  let index = headers.indexOf(name);
  if (index === -1) {
    for (const alias of aliases) {
      index = headers.indexOf(alias);
      if (index !== -1) {
        output[0][index] = name;
        return index;
      }
    }
  }
  if (index !== -1) return index;

  const insertAt = afterIndex >= 0 ? afterIndex + 1 : output[0].length;
  output.forEach((row) => row.splice(insertAt, 0, ""));
  output[0][insertAt] = name;
  return insertAt;
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
  if (!rows.length) {
    return {
      rows,
      rowCount: 0,
      taskCount: 0,
      dealerCount: 0,
      cityCount: 0,
      areaCount: 0,
      intentCount: 0,
      purchaseTimeCount: 0,
      carModelCount: 0,
      defeatReasonCount: 0
    };
  }

  const output = rows.map((row) => Array.isArray(row) ? row.slice() : []);
  const width = output.reduce((max, row) => Math.max(max, row.length), 0);
  let taskCount = 0;
  let dealerCount = 0;
  let cityCount = 0;
  let areaCount = 0;
  let intentCount = 0;
  let purchaseTimeCount = 0;
  let carModelCount = 0;
  let defeatReasonCount = 0;

  output.forEach((row) => {
    while (row.length < width) row.push("");
  });

  let taskCol = ensureColumn(output, "任务号");
  let dealerCol = ensureColumn(output, "问到的门店", taskCol);
  let cityCol = ensureColumn(output, "客户所在的城市", dealerCol);
  let areaCol = ensureColumn(output, "客户所在的区域", cityCol, ["客户所在的区县"]);
  let intentCol = ensureColumn(output, "客户的意向", areaCol);
  let purchaseTimeCol = ensureColumn(output, "购车时间", intentCol);
  let carModelCol = ensureColumn(output, "意向车", purchaseTimeCol);
  let defeatReasonCol = ensureColumn(output, "战败原因", carModelCol);

  const sourceTaskCol = findColumn(output[0], ["客户变量"], TASK_COL_INDEX);
  const sourceRuleCol = findColumn(output[0], ["规则标签"], DEALER_COL_INDEX);
  const sourceCallRecordCol = findColumn(output[0], ["通话记录"], CALL_RECORD_COL_INDEX);
  taskCol = findColumn(output[0], ["任务号"]);
  dealerCol = findColumn(output[0], ["问到的门店"]);
  cityCol = findColumn(output[0], ["客户所在的城市"]);
  areaCol = findColumn(output[0], ["客户所在的区域"]);
  intentCol = findColumn(output[0], ["客户的意向"]);
  purchaseTimeCol = findColumn(output[0], ["购车时间"]);
  carModelCol = findColumn(output[0], ["意向车"]);
  defeatReasonCol = findColumn(output[0], ["战败原因"]);

  for (let i = 1; i < output.length; i += 1) {
    const taskId = extractTaskId(output[i][sourceTaskCol]) || text(output[i][taskCol]);
    const dealerName = extractDealerName(output[i][sourceRuleCol]) || text(output[i][dealerCol]);
    const cityName = extractCity(output[i][sourceCallRecordCol], dealerName) || text(output[i][cityCol]);
    const areaName = extractArea(output[i][sourceCallRecordCol], cityName, dealerName) || text(output[i][areaCol]);
    const leadFields = extractLeadFields(output[i][sourceRuleCol], output[i][sourceTaskCol]);
    const intent = leadFields.intent || text(output[i][intentCol]);
    const purchaseTime = leadFields.purchaseTime || text(output[i][purchaseTimeCol]);
    const carModel = leadFields.carModel || text(output[i][carModelCol]);
    const defeatReason = leadFields.defeatReason || text(output[i][defeatReasonCol]);
    output[i][taskCol] = taskId;
    output[i][dealerCol] = dealerName;
    output[i][cityCol] = cityName;
    output[i][areaCol] = areaName;
    output[i][intentCol] = intent;
    output[i][purchaseTimeCol] = purchaseTime;
    output[i][carModelCol] = carModel;
    output[i][defeatReasonCol] = defeatReason;
    if (taskId) taskCount += 1;
    if (dealerName) dealerCount += 1;
    if (cityName) cityCount += 1;
    if (areaName) areaCount += 1;
    if (intent) intentCount += 1;
    if (purchaseTime) purchaseTimeCount += 1;
    if (carModel) carModelCount += 1;
    if (defeatReason) defeatReasonCount += 1;
  }

  return {
    rows: output,
    rowCount: Math.max(output.length - 1, 0),
    taskCount,
    dealerCount,
    cityCount,
    areaCount,
    intentCount,
    purchaseTimeCount,
    carModelCount,
    defeatReasonCount
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
    cityCountEl.textContent = result.cityCount;
    areaCountEl.textContent = result.areaCount;
    intentCountEl.textContent = result.intentCount;
    purchaseTimeCountEl.textContent = result.purchaseTimeCount;
    carModelCountEl.textContent = result.carModelCount;
    defeatReasonCountEl.textContent = result.defeatReasonCount;
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
