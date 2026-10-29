const express = require("express"); // 引入 express
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express(); // 创建服务器实例

// ============================================================
// 数据持久化：把问卷和答卷落盘
//
// 之前用的是 `let quizzes = {}` 这种内存变量，进程一重启数据就全没了。
// 现在改成：启动时从 data/ 目录读进内存，每次写入后再存回文件。
//
// 为什么用文件而不是数据库：
//   这个后端的定位是「问卷分发通道」，数据量小（单份问卷就是一段 JSON），
//   用文件足够，且不需要额外装 MySQL、配连接池，部署成本最低。
//   代价是并发写同一文件会有竞争，所以写入用「临时文件 + rename」原子替换。
// ============================================================
const DATA_DIR = path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

// 读：文件不存在或内容损坏时，返回兜底值而不是让进程崩掉
function loadJson(name, fallback) {
  try {
    const text = fs.readFileSync(path.join(DATA_DIR, name), "utf8");
    return JSON.parse(text);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`[warn] 读取 ${name} 失败，使用空数据：`, err.message);
    }
    return fallback;
  }
}

// 写：先写 .tmp，再 rename。
// rename 在同一分区内是原子操作 —— 要么还是旧文件，要么已经是完整的新文件，
// 不会出现「写到一半进程被杀，留下半个 JSON，下次启动解析失败」的情况。
function saveJson(name, data) {
  const target = path.join(DATA_DIR, name);
  const tmp = target + ".tmp";
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, target);
  } catch (err) {
    console.error(`[error] 写入 ${name} 失败：`, err.message);
  }
}

let quizzes = loadJson("quizzes.json", {}); // id -> 问卷数据
let answers = loadJson("answers.json", {}); // quizId -> 答卷列表

// 设置 body-parser 选项，增加请求体大小限制
app.use(bodyParser.json({ limit: "50mb" })); // 允许最大 50MB 的 JSON 请求体
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true })); // 允许最大 50MB 的 URL 编码请求体

// 存储问卷
app.post("/api/saveQuiz", (req, res) => {
  const { id, quizData } = req.body;
  if (!id || !quizData) {
    return res.status(400).send({ message: "缺少 id 或 quizData" });
  }
  quizzes[id] = quizData;
  saveJson("quizzes.json", quizzes); // 落盘，重启不丢
  res.status(200).send({ message: "Quiz saved" });
});

// 根据id获取问卷内容
app.get("/api/getQuiz/:id", (req, res) => {
  const quizData = quizzes[req.params.id];
  if (!quizData) {
    // 以前这里直接 send(undefined)，前端拿到空响应体会在 JSON.parse 处炸掉，
    // 报错信息还看不出是「问卷不存在」。改成明确的 404 + JSON 体。
    return res.status(404).send({ message: "问卷不存在或已过期" });
  }
  res.status(200).send(quizData);
});

// 存储答案
// 改成追加到数组：同一份问卷可能有多个人提交，之前用对象直接覆盖，
// 第二个人提交会把第一个人的答案冲掉。
app.post("/api/submitAnswers", (req, res) => {
  const { quizId, answers: userAnswers } = req.body;
  if (!quizId || !userAnswers) {
    return res.status(400).send({ message: "缺少 quizId 或 answers" });
  }
  if (!Array.isArray(answers[quizId])) {
    answers[quizId] = [];
  }
  answers[quizId].push({
    answers: userAnswers,
    submittedAt: new Date().toISOString(),
  });
  saveJson("answers.json", answers); // 落盘
  console.log(
    `[答卷] 问卷 ${quizId} 累计收到 ${answers[quizId].length} 份提交`
  );
  res.status(200).send({ message: "Answers submitted" });
});

// 设置 Multer 存储引擎
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// 图片上传接口
app.post("/api/upload", upload.single("image"), (req, res) => {
  try {
    res.status(200).send({
      message: "Image uploaded successfully",
      imageUrl: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    res.status(500).send({ message: "Image upload failed" });
  }
});

// 提供静态资源服务
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 监听 3000 端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`服务器已启动，端口 ${PORT}`);
  console.log(
    `已加载 ${Object.keys(quizzes).length} 份问卷、` +
      `${Object.keys(answers).length} 份问卷的答卷`
  );
});
