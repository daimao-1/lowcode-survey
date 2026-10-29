// 临时验证脚本：证明 server.js 的持久化真的生效（重启不丢数据）
// 用完即删，不留在项目里
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const SERVER_DIR = "C:/Users/kissmonkey/Desktop/工作/项目/低码平台/项目成品/server";
const PORT = 3137;
const BASE = `http://127.0.0.1:${PORT}`;
const DATA_DIR = path.join(SERVER_DIR, "data");

function startServer() {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ["server.js"], {
      cwd: SERVER_DIR,
      env: { ...process.env, PORT: String(PORT) },
    });
    let out = "";
    const timer = setTimeout(() => reject(new Error("启动超时: " + out)), 10000);
    p.stdout.on("data", (d) => {
      out += d.toString();
      if (out.includes("服务器已启动")) {
        clearTimeout(timer);
        resolve(p);
      }
    });
    p.stderr.on("data", (d) => (out += d.toString()));
  });
}

function stopServer(p) {
  return new Promise((r) => {
    p.once("exit", r);
    p.kill();
  });
}

const log = (...a) => console.log(...a);

// 清掉可能存在的旧测试数据
for (const f of ["quizzes.json", "answers.json"]) {
  const fp = path.join(DATA_DIR, f);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

let fails = 0;
const check = (name, cond, extra = "") => {
  log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!cond) fails++;
};

// ---------- 第一次启动：写入 ----------
let p = await startServer();
const quiz = {
  title: "持久化测试问卷",
  coms: JSON.stringify([{ id: "c1", type: "questionRadio" }]),
};
let res = await fetch(`${BASE}/api/saveQuiz`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: "q-persist-001", quizData: quiz }),
});
check("saveQuiz 返回 200", res.status === 200);

// 同一份问卷提交两份答卷，验证是追加而不是覆盖
for (const n of [1, 2]) {
  await fetch(`${BASE}/api/submitAnswers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quizId: "q-persist-001", answers: { 1: `第${n}份` } }),
  });
}

res = await fetch(`${BASE}/api/getQuiz/q-persist-001`);
check("重启前能读到问卷", res.status === 200);

// 不存在的 id 应该 404
res = await fetch(`${BASE}/api/getQuiz/not-exist`);
check("不存在的问卷返回 404", res.status === 404, `实际 ${res.status}`);

await stopServer(p);
log("— 已关闭服务，模拟进程重启 —");

// ---------- 第二次启动：验证数据还在 ----------
p = await startServer();
res = await fetch(`${BASE}/api/getQuiz/q-persist-001`);
const body = res.status === 200 ? await res.json() : null;
check(
  "重启后问卷仍然存在（核心承诺）",
  res.status === 200 && body?.title === "持久化测试问卷",
  res.status === 200 ? `title=${body?.title}` : `status=${res.status}`
);

// 再提交一份，看是不是追加到已有的 2 份之后
await fetch(`${BASE}/api/submitAnswers`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ quizId: "q-persist-001", answers: { 1: "第3份" } }),
});
await stopServer(p);

const answersFile = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "answers.json"), "utf8")
);
const count = answersFile["q-persist-001"]?.length;
check("答卷是追加存储（3 份）", count === 3, `实际 ${count} 份`);
check(
  "答卷带时间戳",
  typeof answersFile["q-persist-001"]?.[0]?.submittedAt === "string"
);

// 清理测试数据，不留垃圾
for (const f of ["quizzes.json", "answers.json"]) {
  const fp = path.join(DATA_DIR, f);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}
const tmpLeft = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".tmp"));
check("没有残留 .tmp 文件", tmpLeft.length === 0, tmpLeft.join(","));

log(`\n===== 结果：${fails === 0 ? "全部通过" : fails + " 项失败"} =====`);
process.exit(fails === 0 ? 0 : 1);
