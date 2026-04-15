// server.js - 支持自定义时间区间与 ACK 确认删除（防丢单）
// 机制：
// - schedule-reply 时带 clientId，任务和回复都归属到该 clientId
// - get-pending-replies 只返回该 clientId 的“未 ACK 回复”，并且不删除
// - 前端渲染并落库后，调用 ack-replies，后端收到 ACK 才从 pending 删除
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 8080;
const DB_FILE = path.join(__dirname, 'db.json');

let database = {
  scheduledTasks: [],
  pendingReplies: [], // { replyId, clientId, threadId, sender, content, type, timestamp, createdAt }
  claimedReplies: []  // 留档：包含领取/ack 记录，方便排查
};

const safeParseJson = (text, fallback) => {
  try { return JSON.parse(text); } catch { return fallback; }
};

const normalizeDb = (db) => {
  db = db && typeof db === 'object' ? db : {};
  db.scheduledTasks = Array.isArray(db.scheduledTasks) ? db.scheduledTasks : [];
  db.pendingReplies = Array.isArray(db.pendingReplies) ? db.pendingReplies : [];
  db.claimedReplies = Array.isArray(db.claimedReplies) ? db.claimedReplies : [];
  return db;
};

try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    database = normalizeDb(safeParseJson(data, database));
  }
} catch (error) {
  console.error('无法加载数据库文件:', error);
  database = normalizeDb(database);
}

// 定时落盘（容器不重启时可防止内存丢失）
setInterval(() => {
  fs.writeFile(DB_FILE, JSON.stringify(database, null, 2), (err) => {
    if (err) console.error('无法保存数据库文件:', err);
  });
}, 30 * 1000);

const serverId = () => crypto.randomUUID();

const generateRepliesFromLibrary = (replyLibrary = {}) => {
  const zika = Array.isArray(replyLibrary.zika) ? replyLibrary.zika : [];
  const emoji = Array.isArray(replyLibrary.emoji) ? replyLibrary.emoji : [];
  const image = Array.isArray(replyLibrary.image) ? replyLibrary.image : [];

  const allReplies = [
    ...zika.map(r => ({ ...r, type: 'zika' })),
    ...emoji.map(r => ({ ...r, type: 'emoji' })),
    ...image.map(r => ({ ...r, type: 'image' }))
  ];
  if (allReplies.length === 0) return [];

  const replyCount = Math.floor(Math.random() * 4) + 2; // 2~5
  const repliesToSend = [];

  for (let i = 0; i < replyCount; i++) {
    const randomIndex = Math.floor(Math.random() * allReplies.length);
    repliesToSend.push(allReplies[randomIndex]);
  }

  // 你说“合并文本回复”是设计如此，这里保持原逻辑
  const textLikeReplies = repliesToSend.filter(r => r.type === 'zika' || r.type === 'emoji');
  const imageReplies = repliesToSend.filter(r => r.type === 'image');
  const finalReplies = [];

  if (textLikeReplies.length > 0) {
    const combinedContent = textLikeReplies.map(r => r.content).join('，');
    finalReplies.push({ sender: 'partner', content: combinedContent, type: 'text' });
  }
  imageReplies.forEach(r => finalReplies.push({ sender: 'partner', content: r.content, type: 'image' }));

  return finalReplies;
};

// 检查到期任务 -> 生成回复 -> 写入 pendingReplies（不再被 get 直接清空）
setInterval(() => {
  const now = Date.now();
  const dueTasks = database.scheduledTasks.filter(task => now >= task.triggerTime);

  if (dueTasks.length > 0) {
    console.log(`检测到 ${dueTasks.length} 个回复时间已到，正在生成...`);

    dueTasks.forEach(task => {
      try {
        if (!task || !task.threadId || !task.replyLibrary || !task.clientId) return;

        const generatedReplies = generateRepliesFromLibrary(task.replyLibrary);
        if (generatedReplies.length > 0) {
          const repliesWithMeta = generatedReplies.map(reply => ({
            replyId: serverId(),
            clientId: task.clientId,
            threadId: task.threadId,
            sender: reply.sender,
            content: reply.content,
            type: reply.type,
            timestamp: new Date(task.triggerTime).toISOString(),
            createdAt: new Date().toISOString()
          }));

          database.pendingReplies.push(...repliesWithMeta);
          console.log(`为 client=${task.clientId} 话题=${task.threadId} 生成 ${repliesWithMeta.length} 条回复，进入 pending 等待 ACK。`);
        }
      } catch (error) {
        console.error('处理定时任务时出错:', error);
      }
    });

    // 移除已到期任务
    database.scheduledTasks = database.scheduledTasks.filter(task => now < task.triggerTime);
  }
}, 10 * 1000);

app.use(express.json({ limit: '50mb' }));

// 安排回复任务（必须带 clientId）
app.post('/api/schedule-reply', (req, res) => {
  const { threadId, replyLibrary, minDelayMinutes, maxDelayMinutes, clientId } = req.body;

  if (!threadId || !replyLibrary || !clientId) {
    return res.status(400).json({ message: '请求错误，缺少关键参数(threadId/replyLibrary/clientId)。' });
  }

  // 接收前端配置并做安全底线校验
  const minMinutes = Math.max(2, Number(minDelayMinutes) || 5);
  const maxMinutes = Math.min(720, Math.max(minMinutes + 1, Number(maxDelayMinutes) || 20));

  const minDelay = minMinutes * 60 * 1000;
  const maxDelay = maxMinutes * 60 * 1000;
  const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

  const triggerTime = Date.now() + randomDelay;
  database.scheduledTasks.push({ triggerTime, threadId, replyLibrary, clientId });

  console.log(
    `收到请求 client=${clientId}，新回复已为话题 ${threadId} 安排在: ${new Date(triggerTime).toLocaleString()} (延迟约 ${Math.floor(randomDelay / 60000)} 分钟)`
  );
  res.status(200).json({ message: '回复已成功安排。' });
});

// 拉取待领取回复：只返回该 clientId 的 pending（不删除）
// 未 ACK 的会在刷新/重新打开时重复返回，直到 ACK 成功
app.get('/api/get-pending-replies', (req, res) => {
  const clientId = req.query.clientId;

  if (!clientId) {
    return res.status(400).json({ message: '缺少 clientId' });
  }

  const replies = database.pendingReplies.filter(r => r.clientId === clientId);

  if (replies.length === 0) {
    return res.status(204).send();
  }

  // 领取流水（仅记录，不删除）
  database.claimedReplies.push({
    type: 'fetch',
    clientId,
    fetchedAt: new Date().toISOString(),
    count: replies.length,
    replyIds: replies.map(r => r.replyId)
  });
  if (database.claimedReplies.length > 200) database.claimedReplies = database.claimedReplies.slice(-200);

  console.log(`[前端拉取] ${new Date().toLocaleString()} client=${clientId} 拉取到 ${replies.length} 条待确认回复（未删除，等待 ACK）`);
  res.status(200).json(replies);
});

// 前端确认已显示并落库后，发送 ACK，后端收到 ACK 才删除
app.post('/api/ack-replies', (req, res) => {
  const { clientId, replyIds } = req.body;

  if (!clientId || !Array.isArray(replyIds) || replyIds.length === 0) {
    return res.status(400).json({ message: '请求错误，缺少 clientId 或 replyIds' });
  }

  const before = database.pendingReplies.length;

  // 只删除属于该 clientId 且 replyId 命中的
  const idSet = new Set(replyIds);
  database.pendingReplies = database.pendingReplies.filter(r => {
    if (r.clientId !== clientId) return true;
    return !idSet.has(r.replyId);
  });

  const after = database.pendingReplies.length;
  const deleted = before - after;

  database.claimedReplies.push({
    type: 'ack',
    clientId,
    ackAt: new Date().toISOString(),
    count: replyIds.length,
    deleted,
    replyIds
  });
  if (database.claimedReplies.length > 200) database.claimedReplies = database.claimedReplies.slice(-200);

  console.log(`[ACK] ${new Date().toLocaleString()} client=${clientId} ACK ${replyIds.length} 条，实际删除 ${deleted} 条 pending`);
  res.status(200).json({ message: 'ACK received', deleted });
});

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`后端服务已启动，监听端口 ${PORT}`);
});
