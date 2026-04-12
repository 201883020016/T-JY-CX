// server.js - 最终版（带智能回复生成）

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

const DB_FILE = path.join(__dirname, 'db.json');

let database = {
    scheduledTasks: [],
    pendingReplies: []
};

// 加载/保存数据库的逻辑保持不变
try {
    if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        database = JSON.parse(data);
        // 兼容旧数据
        database.scheduledTasks = database.scheduledTasks || [];
        database.pendingReplies = database.pendingReplies || [];
    }
} catch (error) { console.error('无法加载数据库文件:', error); }

setInterval(() => {
    fs.writeFile(DB_FILE, JSON.stringify(database, null, 2), (err) => {
        if (err) console.error('无法保存数据库文件:', err);
    });
}, 30 * 1000);


// ---- 【核心修改】将前端的生成逻辑移植到后端 ----
const generateRepliesFromLibrary = (replyLibrary) => {
    const allReplies = [
        ...(replyLibrary.zika || []).map(r => ({ ...r, type: 'zika' })),
        ...(replyLibrary.emoji || []).map(r => ({ ...r, type: 'emoji' })),
        ...(replyLibrary.image || []).map(r => ({ ...r, type: 'image' }))
    ];

    if (allReplies.length === 0) return [];

    const replyCount = Math.floor(Math.random() * 4) + 2; // 2-5条
    const repliesToSend = [];
    for (let i = 0; i < replyCount; i++) {
        if (allReplies.length === 0) break;
        const randomIndex = Math.floor(Math.random() * allReplies.length);
        repliesToSend.push(allReplies[randomIndex]);
    }
    
    // 分离并组合
    const textLikeReplies = repliesToSend.filter(r => r.type === 'zika' || r.type === 'emoji');
    const imageReplies = repliesToSend.filter(r => r.type === 'image');
    
    const finalReplies = [];

    if (textLikeReplies.length > 0) {
        const combinedContent = textLikeReplies.map(r => r.content).join('，');
        finalReplies.push({
            sender: 'partner',
            content: combinedContent,
            type: 'text',
        });
    }

    imageReplies.forEach(r => {
        finalReplies.push({
            sender: 'partner',
            content: r.content,
            type: 'image',
        });
    });
    
    return finalReplies;
};


// ---- 核心逻辑：定时检查 ----
setInterval(() => {
    const now = Date.now();
    const dueTasks = database.scheduledTasks.filter(task => now >= task.triggerTime);

    if (dueTasks.length > 0) {
        console.log(`检测到 ${dueTasks.length} 个回复时间已到，正在生成...`);
        
        dueTasks.forEach(task => {
            // 【修改】调用新的生成函数
            const generatedReplies = generateRepliesFromLibrary(task.replyLibrary);
            
            if (generatedReplies.length > 0) {
                // 为每一条生成的回复添加时间戳和话题ID
                const repliesWithTimestamp = generatedReplies.map(reply => ({
                    ...reply,
                    timestamp: new Date(task.triggerTime).toISOString(),
                    threadId: task.threadId
                }));

                // 存入待领取列表
                database.pendingReplies.push(...repliesWithTimestamp);
                console.log(`为话题 ${task.threadId} 生成了 ${repliesWithTimestamp.length} 条回复并暂存。`);
            } else {
                console.log(`为话题 ${task.threadId} 尝试生成回复，但回复库为空。`);
            }
        });

        database.scheduledTasks = database.scheduledTasks.filter(task => now < task.triggerTime);
    }
}, 10 * 1000);


// ---- API 接口 ----
app.use(express.json({ limit: '50mb' })); // 增加请求体大小限制，以防回复库过大

// 1. 【修改】安排新回复的API
app.post('/api/schedule-reply', (req, res) => {
    // 【修改】现在需要前端传来 threadId 和 replyLibrary
    const { threadId, replyLibrary } = req.body;
    if (!threadId || !replyLibrary) {
        return res.status(400).json({ message: '请求错误，缺少 threadId 或 replyLibrary。' });
    }

    const minDelay = 5 * 60 * 1000;
    const maxDelay = 20 * 60 * 1000;
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    
    const triggerTime = Date.now() + randomDelay;
    
    // 【修改】任务中现在包含回复库
    database.scheduledTasks.push({ triggerTime, threadId, replyLibrary });

    console.log(`收到请求，新回复已为话题 ${threadId} 安排在: ${new Date(triggerTime).toLocaleString()}`);
    res.status(200).json({ message: '回复已成功安排。' });
});

// 2. 获取待领取回复的API (不变)
app.get('/api/get-pending-replies', (req, res) => {
    if (database.pendingReplies.length > 0) {
        res.status(200).json(database.pendingReplies);
        database.pendingReplies = [];
    } else {
        res.status(204).send();
    }
});

// ---- 静态文件服务和启动 (不变) ----
app.use(express.static(path.join(__dirname)));
app.listen(PORT, () => {
    console.log(`后端服务已启动，监听端口 ${PORT}`);
    console.log(`你可以通过 http://localhost:${PORT} 访问你的网页`);
});
