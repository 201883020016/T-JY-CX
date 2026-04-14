// server.js - 支持自定义时间区间与状态增强
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;
const DB_FILE = path.join(__dirname, 'db.json');

let database = {
    scheduledTasks: [],
    pendingReplies: [],
    claimedReplies: [] // 增加领取留档，用于后台排查丢单
};

try {
    if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        database = JSON.parse(data);
        database.scheduledTasks = Array.isArray(database.scheduledTasks) ? database.scheduledTasks : [];
        database.pendingReplies = Array.isArray(database.pendingReplies) ? database.pendingReplies : [];
        database.claimedReplies = Array.isArray(database.claimedReplies) ? database.claimedReplies : [];
    }
} catch (error) {
    console.error('无法加载数据库文件:', error);
}

setInterval(() => {
    fs.writeFile(DB_FILE, JSON.stringify(database, null, 2), (err) => {
        if (err) console.error('无法保存数据库文件:', err);
    });
}, 30 * 1000);

const generateRepliesFromLibrary = (replyLibrary = {}) => {
    const zika = Array.isArray(replyLibrary.zika) ? replyLibrary.zika : [];
    const emoji = Array.isArray(replyLibrary.emoji) ? replyLibrary.emoji : [];
    const image = Array.isArray(replyLibrary.image) ? replyLibrary.image : [];

    const allReplies = [...zika.map(r => ({ ...r, type: 'zika' })), ...emoji.map(r => ({ ...r, type: 'emoji' })), ...image.map(r => ({ ...r, type: 'image' }))];
    if (allReplies.length === 0) return [];

    const replyCount = Math.floor(Math.random() * 4) + 2; 
    const repliesToSend = [];

    for (let i = 0; i < replyCount; i++) {
        const randomIndex = Math.floor(Math.random() * allReplies.length);
        repliesToSend.push(allReplies[randomIndex]);
    }

    const textLikeReplies = repliesToSend.filter(r => r.type === 'zika' || r.type === 'emoji');
    const imageReplies = repliesToSend.filter(r => r.type === 'image');
    const finalReplies = [];

    if (textLikeReplies.length > 0) {
        const combinedContent = textLikeReplies.map(r => r.content).join('，');
        finalReplies.push({ sender: 'partner', content: combinedContent, type: 'text' });
    }

    imageReplies.forEach(r => { finalReplies.push({ sender: 'partner', content: r.content, type: 'image' }); });
    return finalReplies;
};

// 检查到期任务
setInterval(() => {
    const now = Date.now();
    const dueTasks = database.scheduledTasks.filter(task => now >= task.triggerTime);

    if (dueTasks.length > 0) {
        console.log(`检测到 ${dueTasks.length} 个回复时间已到，正在生成...`);

        dueTasks.forEach(task => {
            try {
                if (!task || !task.threadId || !task.replyLibrary) return;

                const generatedReplies = generateRepliesFromLibrary(task.replyLibrary);
                if (generatedReplies.length > 0) {
                    const repliesWithTimestamp = generatedReplies.map(reply => ({
                        ...reply, timestamp: new Date(task.triggerTime).toISOString(), threadId: task.threadId
                    }));
                    database.pendingReplies.push(...repliesWithTimestamp);
                    console.log(`为话题 ${task.threadId} 生成了 ${repliesWithTimestamp.length} 条回复并暂存。`);
                }
            } catch (error) { console.error('处理定时任务时出错:', error); }
        });
        database.scheduledTasks = database.scheduledTasks.filter(task => now < task.triggerTime);
    }
}, 10 * 1000);

app.use(express.json({ limit: '50mb' }));

app.post('/api/schedule-reply', (req, res) => {
    const { threadId, replyLibrary, minDelayMinutes, maxDelayMinutes } = req.body;

    if (!threadId || !replyLibrary) return res.status(400).json({ message: '请求错误，缺少关键参数。' });

    // 接收前端配置并做安全底线校验
    const minMinutes = Math.max(2, Number(minDelayMinutes) || 5);
    const maxMinutes = Math.min(720, Math.max(minMinutes + 1, Number(maxDelayMinutes) || 20));

    const minDelay = minMinutes * 60 * 1000;
    const maxDelay = maxMinutes * 60 * 1000;
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    const triggerTime = Date.now() + randomDelay;
    database.scheduledTasks.push({ triggerTime, threadId, replyLibrary });

    console.log(`收到请求，新回复已为话题 ${threadId} 安排在: ${new Date(triggerTime).toLocaleString()} (延迟约 ${Math.floor(randomDelay/60000)} 分钟)`);
    res.status(200).json({ message: '回复已成功安排。' });
});

app.get('/api/get-pending-replies', (req, res) => {
    if (database.pendingReplies.length > 0) {
        const repliesToReturn = [...database.pendingReplies];
        
        // 【关键防御】记录前端领取的流水，方便追踪丢单情况，最多留最近 50 次日志
        database.claimedReplies.push({
            claimedAt: new Date().toISOString(),
            count: repliesToReturn.length,
            replies: repliesToReturn
        });
        if (database.claimedReplies.length > 50) database.claimedReplies = database.claimedReplies.slice(-50);

        // 👇 就是这一句！加上它，你的黑框终端就会播报前端拿走消息的动作了
        console.log(`[前端已拉取] ${new Date().toLocaleString()} - 前端刚刚取走了 ${repliesToReturn.length} 条回复！`);

        res.status(200).json(repliesToReturn);
        database.pendingReplies = []; // 发出后立即清空内存中的待领队列
    } else {
        res.status(204).send();
    }
});

app.use(express.static(path.join(__dirname)));
app.listen(PORT, () => {
    console.log(`后端服务已启动，监听端口 ${PORT}`);
});
