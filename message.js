// message.js - 已修复重复声明的错误

document.addEventListener('DOMContentLoaded', () => {
    // --- 元素获取 (完整、无重复的版本) ---
    const threadsContainer = document.getElementById('threads-container');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');
    const replyPanel = document.getElementById('reply-panel');
    const replyManagerBtn = document.getElementById('reply-manager-btn');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const importBtn = document.getElementById('import-btn');
    const exportBtn = document.getElementById('export-btn');
    const fileImporter = document.getElementById('file-importer');
    const imageUploader = document.getElementById('image-uploader');
    const tabs = document.querySelector('.tabs');
    const tabContents = document.querySelectorAll('.tab-content');
    const replyListZika = document.getElementById('reply-list-zika');
    const addZikaBtn = document.getElementById('add-zika-btn');
    const newZikaContent = document.getElementById('new-zika-content');
    const newZikaCategory = document.getElementById('new-zika-category');
    const categoryDatalist = document.getElementById('category-list');
    const zikaGroupFilter = document.getElementById('zika-group-filter');
    const zikaSearch = document.getElementById('zika-search');
    const showAddZikaFormBtn = document.getElementById('show-add-zika-form-btn');
    const addZikaFormContainer = document.getElementById('add-zika-form-container');
    const replyListEmoji = document.getElementById('reply-list-emoji');
    const addEmojiBtn = document.getElementById('add-emoji-btn');
    const newEmojiContent = document.getElementById('new-emoji-content');
    const replyListImage = document.getElementById('reply-list-image');
    const addReplyImageBtn = document.getElementById('add-reply-image-btn');
    const editModal = document.getElementById('edit-modal');
    const editZikaContent = document.getElementById('edit-zika-content');
    const editZikaCategory = document.getElementById('edit-zika-category');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const fileReader = new FileReader();
    const clearDataBtn = document.getElementById('clear-data-btn');
    const confirmClearModal = document.getElementById('confirm-clear-modal');
    const confirmClearInput = document.getElementById('confirm-clear-input');
    const confirmClearActionBtn = document.getElementById('confirm-clear-action-btn');
    const cancelClearBtn = document.getElementById('cancel-clear-btn');

    // --- 数据模型 ---
    let threads = [];
    let replyLibrary = { zika: [], emoji: [], image: [] };
    let editingZikaIndex = -1;
    let currentPage = 1;
    const threadsPerPage = 3;

    // --- 数据持久化 ---
    const saveData = () => { localStorage.setItem('chatThreads', JSON.stringify(threads)); localStorage.setItem('replyLibrary', JSON.stringify(replyLibrary)); };
    const loadData = () => { threads = JSON.parse(localStorage.getItem('chatThreads')) || []; const loadedLibrary = JSON.parse(localStorage.getItem('replyLibrary')); replyLibrary = loadedLibrary || { zika: [], emoji: [], image: [] }; replyLibrary.zika = replyLibrary.zika || replyLibrary.text || []; if (replyLibrary.text) delete replyLibrary.text; replyLibrary.emoji = replyLibrary.emoji || []; replyLibrary.image = replyLibrary.image || []; };
    const handleClearData = () => { localStorage.removeItem('chatThreads'); location.reload(); };

    // --- 字卡库UI ---
    const populateGroupFilter = () => { const groups = new Set(replyLibrary.zika.map(r => r.category || '未分组')); const uniqueGroups = ['-- 全部 --', ...groups]; const currentSelection = zikaGroupFilter.value; zikaGroupFilter.innerHTML = ''; uniqueGroups.forEach(group => { const option = document.createElement('option'); option.value = group; option.textContent = group; zikaGroupFilter.appendChild(option); }); if (uniqueGroups.includes(currentSelection)) { zikaGroupFilter.value = currentSelection; } else { zikaGroupFilter.value = '-- 全部 --'; } };
    const renderZikaReplies = () => { const selectedGroup = zikaGroupFilter.value; const searchTerm = zikaSearch.value.toLowerCase(); let filteredList = replyLibrary.zika; if (selectedGroup && selectedGroup !== '-- 全部 --') { if (selectedGroup === '未分组') { filteredList = filteredList.filter(r => !r.category); } else { filteredList = filteredList.filter(r => r.category === selectedGroup); } } if (searchTerm) { filteredList = filteredList.filter(r => r.content.toLowerCase().includes(searchTerm)); } replyListZika.innerHTML = ''; filteredList.forEach(reply => { const originalIndex = replyLibrary.zika.indexOf(reply); const itemDiv = document.createElement('div'); itemDiv.className = 'reply-item'; itemDiv.innerHTML = `<div class="reply-item-content"><span class="reply-text">${reply.content}</span></div><div class="reply-item-actions"><button class="edit-btn" data-index="${originalIndex}">✎</button><button class="delete-btn" data-index="${originalIndex}" data-type="zika">✖</button></div>`; replyListZika.appendChild(itemDiv); }); };

    // --- 渲染引擎 ---
    const renderAllThreads = () => { const sortedThreads = [...threads].sort((a, b) => new Date(b.lastActivityTimestamp) - new Date(a.lastActivityTimestamp)); const startIndex = (currentPage - 1) * threadsPerPage; const endIndex = startIndex + threadsPerPage; const paginatedThreads = sortedThreads.slice(startIndex, endIndex); threadsContainer.innerHTML = ''; paginatedThreads.forEach(thread => { const threadElement = createThreadElement(thread); threadsContainer.appendChild(threadElement); }); renderPaginationControls(sortedThreads.length); };
    const renderPaginationControls = (totalThreads) => { const totalPages = Math.ceil(totalThreads / threadsPerPage) || 1; pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页`; prevPageBtn.disabled = currentPage === 1; nextPageBtn.disabled = currentPage === totalPages; };
    const goToPrevPage = () => { if (currentPage > 1) { currentPage--; renderAllThreads(); } };
    const goToNextPage = () => { const totalPages = Math.ceil(threads.length / threadsPerPage); if (currentPage < totalPages) { currentPage++; renderAllThreads(); } };
    const createThreadElement = (thread) => { const threadContainer = document.createElement('div'); threadContainer.className = 'thread-container'; threadContainer.dataset.threadId = thread.id; const mainDiv = document.createElement('div'); mainDiv.className = 'thread-main'; const repliesDiv = document.createElement('div'); repliesDiv.className = 'thread-replies'; thread.messages.forEach(msg => { const msgElement = createMessageElement(msg); if (msg.isMain) { mainDiv.appendChild(msgElement); } else { repliesDiv.appendChild(msgElement); } }); const followUpArea = createFollowUpElement(thread.id); threadContainer.appendChild(mainDiv); threadContainer.appendChild(repliesDiv); threadContainer.appendChild(followUpArea); return threadContainer; };
    const createMessageElement = (msg) => { const msgDiv = document.createElement('div'); msgDiv.className = `message ${msg.sender}`; const contentDiv = document.createElement('div'); if (msg.type === 'image') { const img = document.createElement('img'); img.src = msg.content; contentDiv.appendChild(img); } else { contentDiv.textContent = msg.content; contentDiv.style.whiteSpace = 'pre-wrap'; } msgDiv.appendChild(contentDiv); const timestampDiv = document.createElement('div'); timestampDiv.className = 'timestamp'; timestampDiv.textContent = new Date(msg.timestamp).toLocaleString('zh-CN'); msgDiv.appendChild(timestampDiv); return msgDiv; };
    const createFollowUpElement = (threadId) => { const div = document.createElement('div'); div.className = 'follow-up-input-area'; div.innerHTML = `<input type="text" class="follow-up-input" placeholder="追问..."><button class="follow-up-btn">回复</button>`; const followUpBtn = div.querySelector('.follow-up-btn'); const followUpInput = div.querySelector('.follow-up-input'); const handleFollowUp = () => { const text = followUpInput.value.trim(); if (text) { addReplyToThread(threadId, 'user', 'text', text); followUpInput.value = ''; } }; followUpBtn.onclick = handleFollowUp; followUpInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { handleFollowUp(); } }); return div; };

    // --- 核心逻辑 (连接后端) ---
    const createThread = () => { const text = messageInput.value.trim(); if (!text) return; const now = new Date().toISOString(); const threadId = Date.now().toString(); const newMessage = { sender: 'user', content: text, type: 'text', timestamp: now, isMain: true }; const newThread = { id: threadId, messages: [newMessage], lastActivityTimestamp: now }; threads.push(newThread); messageInput.value = ''; messageInput.style.height = 'auto'; currentPage = 1; renderAllThreads(); triggerDelayedReply(threadId); saveData(); };
    const addReplyToThread = (threadId, sender, type, content) => { const thread = threads.find(t => t.id === threadId); if (!thread) return; const now = new Date().toISOString(); const newReply = { sender, content, type, timestamp: now, isMain: false }; thread.messages.push(newReply); thread.lastActivityTimestamp = now; if (sender === 'user') { triggerDelayedReply(threadId); } currentPage = 1; renderAllThreads(); saveData(); };
    
    const triggerDelayedReply = (threadId) => {
        fetch('/api/schedule-reply', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                threadId: threadId,
                replyLibrary: replyLibrary 
            })
        })
        .then(response => response.json())
        .then(data => { console.log('后端服务回应:', data.message); })
        .catch(error => { console.error('无法连接到后端服务来安排回复:', error); });
    };

    const displayBackendReplies = (replies) => {
        const repliesByThread = replies.reduce((acc, reply) => {
            if (!acc[reply.threadId]) { acc[reply.threadId] = []; }
            acc[reply.threadId].push(reply);
            return acc;
        }, {});

        for (const threadId in repliesByThread) {
            const thread = threads.find(t => t.id === threadId);
            if (thread) {
                repliesByThread[threadId].forEach(reply => {
                    thread.messages.push(reply);
                    thread.lastActivityTimestamp = reply.timestamp;
                });
            }
        }
        currentPage = 1;
        renderAllThreads();
        saveData();
    };

    const fetchPendingReplies = () => {
        fetch('/api/get-pending-replies')
        .then(response => {
            if (response.status === 204) { return null; }
            return response.json();
        })
        .then(replies => {
            if (replies && replies.length > 0) {
                console.log('从后端获取到待领取的回复:', replies);
                displayBackendReplies(replies);
            }
        })
        .catch(error => { console.error('无法从后端获取待领取的回复:', error); });
    };

    // --- 回复库管理 & 导入导出 ---
    const addZikaReply = () => { const content = newZikaContent.value.trim(); const category = newZikaCategory.value.trim(); if (content === '') return; if (replyLibrary.zika.some(r => r.content === content)) { alert('该字卡已存在。'); return; } replyLibrary.zika.push({ content, category }); saveData(); populateGroupFilter(); renderZikaReplies(); updateCategoryDatalist(); newZikaContent.value = ''; newZikaCategory.value = ''; };
    const addEmojiReply = () => { const content = newEmojiContent.value.trim(); if (content === '') return; if (replyLibrary.emoji.some(r => r.content === content)) { alert('该Emoji已存在。'); return; } replyLibrary.emoji.push({ content }); saveData(); renderMediaReplies('emoji', replyListEmoji); newEmojiContent.value = ''; };
    const renderReplyLibrary = () => { populateGroupFilter(); renderZikaReplies(); renderMediaReplies('emoji', replyListEmoji); renderMediaReplies('image', replyListImage); updateCategoryDatalist(); };
    const renderMediaReplies = (type, listElement) => { listElement.innerHTML = ''; replyLibrary[type].forEach((item, index) => { const itemDiv = document.createElement('div'); if (type === 'image') { itemDiv.className = 'image-item'; itemDiv.innerHTML = `<img src="${item.content}" alt="image"><button class="delete-overlay delete-btn" data-index="${index}" data-type="${type}">&times;</button>`; } else if (type === 'emoji') { itemDiv.className = 'emoji-item'; itemDiv.innerHTML = `${item.content}<button class="delete-overlay delete-btn" data-index="${index}" data-type="${type}">&times;</button>`; } listElement.appendChild(itemDiv); }); };
    const updateCategoryDatalist = () => { const categories = new Set(replyLibrary.zika.map(r => r.category).filter(Boolean)); categoryDatalist.innerHTML = ''; categories.forEach(cat => { const option = document.createElement('option'); option.value = cat; categoryDatalist.appendChild(option); }); };
    const addMediaReply = (type, files) => { for (const file of files) { const reader = new FileReader(); reader.onload = (e) => { replyLibrary[type].push({ content: e.target.result }); saveData(); renderMediaReplies(type, replyListImage); }; reader.readAsDataURL(file); } };
    const deleteReply = (type, index) => { if (!confirm(`确定要删除这个${type === 'zika' ? '字卡' : type === 'emoji' ? 'Emoji' : '图片'}吗？`)) return; replyLibrary[type].splice(index, 1); saveData(); renderReplyLibrary(); };
    const openEditModal = (index) => { editingZikaIndex = index; const reply = replyLibrary.zika[index]; editZikaContent.value = reply.content; editZikaCategory.value = reply.category || ''; editModal.style.display = 'flex'; };
    const saveEdit = () => { if (editingZikaIndex === -1) return; const newContent = editZikaContent.value.trim(); const newCategory = editZikaCategory.value.trim(); if (newContent) { if (replyLibrary.zika.some((r, i) => r.content === newContent && i !== editingZikaIndex)) { alert('该字卡已存在。'); return; } replyLibrary.zika[editingZikaIndex] = { content: newContent, category: newCategory }; saveData(); renderReplyLibrary(); } closeEditModal(); };
    const closeEditModal = () => { editingZikaIndex = -1; editModal.style.display = 'none'; };
    const exportData = () => { const data = { threads, replyLibrary }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `传讯_备份_${new Date().toJSON().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); };
    const importData = () => { fileImporter.onchange = (e) => { const file = e.target.files[0]; if (!file) return; fileReader.onload = (event) => { try { const importedData = JSON.parse(event.target.result); if (confirm('警告：导入将覆盖所有话题和回复库，是否继续？')) { threads = importedData.threads || []; replyLibrary = importedData.replyLibrary || { zika: [], emoji: [], image: [] }; saveData(); location.reload(); } } catch (err) { alert('导入失败！文件格式错误。'); console.error(err); } }; fileReader.readAsText(file); }; fileImporter.click(); };
    
    // --- 清空确认模态框逻辑 ---
    const showClearConfirmModal = () => { confirmClearInput.value = ''; confirmClearActionBtn.disabled = true; confirmClearModal.style.display = 'flex'; };
    const hideClearConfirmModal = () => { confirmClearModal.style.display = 'none'; };

    // --- 事件绑定 ---
    sendBtn.addEventListener('click', createThread);
    prevPageBtn.addEventListener('click', goToPrevPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); createThread(); } });
    replyManagerBtn.addEventListener('click', () => { addZikaFormContainer.classList.remove('open'); showAddZikaFormBtn.classList.remove('open'); replyPanel.classList.add('open'); });
    closePanelBtn.addEventListener('click', () => replyPanel.classList.remove('open'));
    tabs.addEventListener('click', (e) => { if (e.target.classList.contains('tab-btn')) { tabs.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); tabContents.forEach(c => c.classList.remove('active')); document.getElementById(`${e.target.dataset.tab}-tab-content`).classList.add('active'); } });
    addZikaBtn.addEventListener('click', addZikaReply);
    addEmojiBtn.addEventListener('click', addEmojiReply);
    showAddZikaFormBtn.addEventListener('click', () => { addZikaFormContainer.classList.toggle('open'); showAddZikaFormBtn.classList.toggle('open'); });
    zikaGroupFilter.addEventListener('change', renderZikaReplies);
    zikaSearch.addEventListener('input', renderZikaReplies);
    editZikaCategory.addEventListener('focus', (e) => { const originalValue = e.target.value; e.target.value = ''; e.target.addEventListener('blur', () => { if (e.target.value === '') { e.target.value = originalValue; } }, { once: true }); });
    imageUploader.addEventListener('change', (e) => { addMediaReply('image', e.target.files); });
    addReplyImageBtn.addEventListener('click', () => { imageUploader.click(); });
    replyPanel.addEventListener('click', (e) => { const target = e.target.closest('button'); if (!target) return; if (target.classList.contains('delete-btn')) { const type = target.dataset.type; const index = parseInt(target.dataset.index); deleteReply(type, index); } if (target.classList.contains('edit-btn')) { const index = parseInt(target.dataset.index); openEditModal(index); } });
    saveEditBtn.addEventListener('click', saveEdit);
    cancelEditBtn.addEventListener('click', closeEditModal);
    importBtn.addEventListener('click', importData);
    exportBtn.addEventListener('click', exportData);
    clearDataBtn.addEventListener('click', showClearConfirmModal);
    cancelClearBtn.addEventListener('click', hideClearConfirmModal);
    confirmClearActionBtn.addEventListener('click', handleClearData);
    confirmClearInput.addEventListener('input', (e) => { confirmClearActionBtn.disabled = e.target.value !== 'delete'; });
    
    // --- 页面初始化 ---
    const initialize = () => {
        loadData();
        renderAllThreads();
        renderReplyLibrary();
        tabs.querySelector(`[data-tab="zika"]`).click();
        fetchPendingReplies();
        setInterval(fetchPendingReplies, 60 * 1000);
    };

    initialize();
});
