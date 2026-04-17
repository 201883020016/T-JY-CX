document.addEventListener('DOMContentLoaded', () => {
    const threadsContainer = document.getElementById('threads-container');
    const messageInput = document.getElementById('message-input');
    const sendImageBtn = document.getElementById('send-image-btn');
    const chatImageUploader = document.getElementById('chat-image-uploader');
    const sendBtn = document.getElementById('send-btn');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');
    
    const userProfileBtn = document.getElementById('user-profile-btn');
    const featureMenuBtn = document.getElementById('feature-menu-btn');
    const featureDrawer = document.getElementById('feature-drawer');
    const closeFeatureDrawerBtn = document.getElementById('close-feature-drawer-btn');
    
    const replyManagerMenuBtn = document.getElementById('reply-manager-menu-btn');
    const chatSettingsMenuBtn = document.getElementById('chat-settings-menu-btn');
    const backupMenuBtn = document.getElementById('backup-menu-btn');
    
    const backupModal = document.getElementById('backup-modal');
    const closeBackupBtn = document.getElementById('close-backup-btn');
    const exportReplyBtn = document.getElementById('export-reply-btn');
    const importReplyBtn = document.getElementById('import-reply-btn');
    const exportChatBtn = document.getElementById('export-chat-btn');
    const importChatBtn = document.getElementById('import-chat-btn');
    
    const profileModal = document.getElementById('profile-modal');
    const cancelProfileBtn = document.getElementById('cancel-profile-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const editAvatarPreview = document.getElementById('edit-avatar-preview');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const avatarUploader = document.getElementById('avatar-uploader');
    const editProfileName = document.getElementById('edit-profile-name');
    
    const settingsModal = document.getElementById('settings-modal');
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const minDelayInput = document.getElementById('min-delay-input');
    const maxDelayInput = document.getElementById('max-delay-input');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeDisplay = document.getElementById('font-size-display');
    
    const replyPanel = document.getElementById('reply-panel');
    const closePanelBtn = document.getElementById('close-panel-btn');
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
    const clearDataBtn = document.getElementById('clear-data-btn');
    const confirmClearModal = document.getElementById('confirm-clear-modal');
    const confirmClearInput = document.getElementById('confirm-clear-input');
    const confirmClearActionBtn = document.getElementById('confirm-clear-action-btn');
    const cancelClearBtn = document.getElementById('cancel-clear-btn');

    let threads = [];
    let replyLibrary = { zika: [], emoji: [], image: [] };
    let profile = { name: '名字', avatar: '' };
    let chatSettings = { minDelay: 5, maxDelay: 20, fontSizeLevel: 3 };
    let editingZikaIndex = -1;
    let currentPage = 1;
    const threadsPerPage = 3;
    const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='34' height='34'><circle cx='17' cy='17' r='17' fill='%23ccc'/></svg>";

    const getClientId = () => {
        let id = localStorage.getItem('cxClientId');
        if (!id) {
            id = (crypto?.randomUUID?.() || (Date.now().toString() + '-' + Math.floor(Math.random() * 1e9).toString()));
            localStorage.setItem('cxClientId', id);
        }
        return id;
    };
    const clientId = getClientId();

    const generateId = () => Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    const saveData = () => {
        localStorage.setItem('chatThreads', JSON.stringify(threads));
        localStorage.setItem('replyLibrary', JSON.stringify(replyLibrary));
    };

    const saveConfig = () => {
        localStorage.setItem('chatSettings', JSON.stringify(chatSettings));
        localStorage.setItem('userProfile', JSON.stringify(profile));
    };

    const loadData = () => {
        threads = JSON.parse(localStorage.getItem('chatThreads')) || [];
        threads.forEach(t => t.messages.forEach(m => {
            if (!m.id) m.id = generateId();
            if (m.status === 'sending') m.status = 'failed';
        }));

        const loadedLibrary = JSON.parse(localStorage.getItem('replyLibrary'));
        replyLibrary = loadedLibrary || { zika: [], emoji: [], image: [] };
        replyLibrary.zika = replyLibrary.zika || replyLibrary.text || [];
        if (replyLibrary.text) delete replyLibrary.text;
        replyLibrary.emoji = replyLibrary.emoji || [];
        replyLibrary.image = replyLibrary.image || [];

        const savedSettings = JSON.parse(localStorage.getItem('chatSettings'));
        if (savedSettings) chatSettings = { ...chatSettings, ...savedSettings };

        const savedProfile = JSON.parse(localStorage.getItem('userProfile'));
        if (savedProfile) profile = { ...profile, ...savedProfile };
    };

    const handleClearData = () => {
        localStorage.removeItem('chatThreads');
        location.reload();
    };

    const renderProfile = () => {
        document.getElementById('user-name-display').textContent = profile.name || '名字';
        document.getElementById('user-avatar-img').src = profile.avatar || defaultAvatar;
    };

    const applyFontSize = () => {
        const sizes = { 1: 14, 2: 16, 3: 18, 4: 20, 5: 22 };
        document.documentElement.style.setProperty('--message-font-size', `${sizes[chatSettings.fontSizeLevel] || 18}px`);
    };

    const populateGroupFilter = () => {
        const groups = new Set(replyLibrary.zika.map(r => r.category || '未分组'));
        const uniqueGroups = ['-- 全部 --', ...groups];
        const currentSelection = zikaGroupFilter.value;
        zikaGroupFilter.innerHTML = '';
        uniqueGroups.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            zikaGroupFilter.appendChild(option);
        });
        if (uniqueGroups.includes(currentSelection)) {
            zikaGroupFilter.value = currentSelection;
        } else {
            zikaGroupFilter.value = '-- 全部 --';
        }
    };

    const renderZikaReplies = () => {
        const selectedGroup = zikaGroupFilter.value;
        const searchTerm = zikaSearch.value.toLowerCase();
        let filteredList = replyLibrary.zika;

        if (selectedGroup && selectedGroup !== '-- 全部 --') {
            if (selectedGroup === '未分组') {
                filteredList = filteredList.filter(r => !r.category);
            } else {
                filteredList = filteredList.filter(r => r.category === selectedGroup);
            }
        }

        if (searchTerm) {
            filteredList = filteredList.filter(r => r.content.toLowerCase().includes(searchTerm));
        }

        replyListZika.innerHTML = '';
        filteredList.forEach(reply => {
            const originalIndex = replyLibrary.zika.indexOf(reply);
            const itemDiv = document.createElement('div');
            itemDiv.className = 'reply-item';
            itemDiv.innerHTML = `<div class="reply-item-content"><span class="reply-text">${reply.content}</span></div><div class="reply-item-actions"><button class="edit-btn" data-index="${originalIndex}">✎</button><button class="delete-btn" data-index="${originalIndex}" data-type="zika">✖</button></div>`;
            replyListZika.appendChild(itemDiv);
        });
    };

    const renderAllThreads = () => {
        const sortedThreads = [...threads].sort((a, b) => new Date(b.lastActivityTimestamp) - new Date(a.lastActivityTimestamp));
        const startIndex = (currentPage - 1) * threadsPerPage;
        const endIndex = startIndex + threadsPerPage;
        const paginatedThreads = sortedThreads.slice(startIndex, endIndex);

        threadsContainer.innerHTML = '';
        paginatedThreads.forEach(thread => {
            const threadElement = createThreadElement(thread);
            threadsContainer.appendChild(threadElement);
        });

        renderPaginationControls(sortedThreads.length);
    };

    const renderPaginationControls = (totalThreads) => {
        const totalPages = Math.ceil(totalThreads / threadsPerPage) || 1;
        pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            currentPage--;
            renderAllThreads();
        }
    };

    const goToNextPage = () => {
        const totalPages = Math.ceil(threads.length / threadsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderAllThreads();
        }
    };

    const createThreadElement = (thread) => {
        const threadContainer = document.createElement('div');
        threadContainer.className = 'thread-container';
        threadContainer.dataset.threadId = thread.id;

        const mainDiv = document.createElement('div');
        mainDiv.className = 'thread-main';

        const repliesDiv = document.createElement('div');
        repliesDiv.className = 'thread-replies';

        thread.messages.forEach(msg => {
            const msgElement = createMessageElement(msg, thread.id);
            if (msg.isMain) mainDiv.appendChild(msgElement);
            else repliesDiv.appendChild(msgElement);
        });

        const followUpArea = createFollowUpElement(thread.id);
        threadContainer.appendChild(mainDiv);
        threadContainer.appendChild(repliesDiv);
        threadContainer.appendChild(followUpArea);
        return threadContainer;
    };

    const createMessageElement = (msg, threadId) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.sender}`;

        const contentDiv = document.createElement('div');
        if (msg.type === 'image') {
            const img = document.createElement('img');
            img.src = msg.content;
            contentDiv.appendChild(img);
        } else {
            contentDiv.textContent = msg.content;
            contentDiv.style.whiteSpace = 'pre-wrap';
        }
        msgDiv.appendChild(contentDiv);

        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'timestamp';
        timestampDiv.textContent = new Date(msg.timestamp).toLocaleString('zh-CN');

        if (msg.sender === 'user') {
            const statusSpan = document.createElement('span');
            statusSpan.className = `msg-status ${msg.status || ''}`;
            statusSpan.dataset.msgId = msg.id;

            if (msg.status === 'sent') {
                statusSpan.innerHTML = '&#10003;';
            } else if (msg.status === 'failed') {
                statusSpan.innerHTML = '&#8635;';
                statusSpan.title = '发送给后端失败，点击重试安排';
                statusSpan.onclick = () => {
                    if (statusSpan.classList.contains('refreshing')) return;
                    statusSpan.classList.add('refreshing');
                    triggerDelayedReply(threadId, msg.id, 1);
                };
            }
            timestampDiv.appendChild(statusSpan);
        }

        msgDiv.appendChild(timestampDiv);
        return msgDiv;
    };

    const createFollowUpElement = (threadId) => {
        const div = document.createElement('div');
        div.className = 'follow-up-input-area';
        div.innerHTML = `<input type="text" class="follow-up-input" placeholder="追问..."><button class="follow-up-btn">回复</button>`;

        const followUpBtn = div.querySelector('.follow-up-btn');
        const followUpInput = div.querySelector('.follow-up-input');

        const handleFollowUp = () => {
            const text = followUpInput.value.trim();
            if (text) {
                addReplyToThread(threadId, 'user', 'text', text);
                followUpInput.value = '';
            }
        };

        followUpBtn.onclick = handleFollowUp;
        followUpInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleFollowUp(); });
        return div;
    };

    const createThread = () => {
        const text = messageInput.value.trim();
        if (!text) return;

        const now = new Date().toISOString();
        const threadId = Date.now().toString();
        const msgId = generateId();

        const newMessage = { id: msgId, sender: 'user', content: text, type: 'text', timestamp: now, isMain: true, status: 'sending' };
        const newThread = { id: threadId, messages: [newMessage], lastActivityTimestamp: now };

        threads.push(newThread);
        messageInput.value = '';

        currentPage = 1;
        renderAllThreads();
        triggerDelayedReply(threadId, msgId, 1);
        saveData();
    };

    const createImageThread = (imageData) => {
        if (!imageData) return;

        const now = new Date().toISOString();
        const threadId = Date.now().toString();
        const msgId = generateId();

        const newMessage = {
            id: msgId,
            sender: 'user',
            content: imageData,
            type: 'image',
            timestamp: now,
            isMain: true,
            status: 'sending'
        };

        const newThread = {
            id: threadId,
            messages: [newMessage],
            lastActivityTimestamp: now
        };

        threads.push(newThread);
        currentPage = 1;
        renderAllThreads();
        triggerDelayedReply(threadId, msgId, 1);
        saveData();
    };

    const addReplyToThread = (threadId, sender, type, content) => {
        const thread = threads.find(t => t.id === threadId);
        if (!thread) return;

        const now = new Date().toISOString();
        const msgId = generateId();

        const newReply = { id: msgId, sender, content, type, timestamp: now, isMain: false };
        if (sender === 'user') newReply.status = 'sending';

        thread.messages.push(newReply);
        thread.lastActivityTimestamp = now;

        if (sender === 'user') triggerDelayedReply(threadId, msgId, 1);

        currentPage = 1;
        renderAllThreads();
        saveData();
    };

    const updateMessageStatus = (threadId, msgId, status) => {
        const thread = threads.find(t => t.id === threadId);
        if (!thread) return;

        const msg = thread.messages.find(m => m.id === msgId);
        if (!msg) return;

        msg.status = status;
        saveData();

        const statusEl = document.querySelector(`.msg-status[data-msg-id="${msgId}"]`);
        if (statusEl) {
            statusEl.className = `msg-status ${status}`;
            if (status === 'sent') {
                statusEl.innerHTML = '&#10003;';
                statusEl.onclick = null;
                statusEl.title = "";
            } else if (status === 'failed') {
                statusEl.innerHTML = '&#8635;';
                statusEl.title = "发送给后端失败，点击重试安排";
                statusEl.onclick = () => {
                    if (statusEl.classList.contains('refreshing')) return;
                    statusEl.classList.add('refreshing');
                    triggerDelayedReply(threadId, msgId, 1);
                };
            } else {
                statusEl.innerHTML = '';
                statusEl.onclick = null;
            }
        }
    };

    const triggerDelayedReply = (threadId, msgId, attempt = 1) => {
        updateMessageStatus(threadId, msgId, 'sending');

        fetch('/api/schedule-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                threadId,
                replyLibrary,
                minDelayMinutes: chatSettings.minDelay,
                maxDelayMinutes: chatSettings.maxDelay,
                clientId
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('网络异常');
            return response.json();
        })
        .then(data => {
            console.log('后端安排成功:', data.message);
            updateMessageStatus(threadId, msgId, 'sent');
        })
        .catch(error => {
            console.error(`安排回复任务异常 (尝试 ${attempt}):`, error);
            if (attempt === 1) setTimeout(() => triggerDelayedReply(threadId, msgId, 2), 10000);
            else updateMessageStatus(threadId, msgId, 'failed');
        });
    };

    const ackReplies = (replyIds) => {
        if (!replyIds || replyIds.length === 0) return Promise.resolve();

        return fetch('/api/ack-replies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, replyIds })
        }).then(response => {
            if (!response.ok) throw new Error('ACK失败');
            return response.json();
        });
    };

    const displayBackendReplies = async (replies) => {
        const seenReplyIds = new Set();
        threads.forEach(t => t.messages.forEach(m => {
            if (m.replyId) seenReplyIds.add(m.replyId);
        }));

        const repliesByThread = replies.reduce((acc, reply) => {
            if (!acc[reply.threadId]) acc[reply.threadId] = [];
            acc[reply.threadId].push(reply);
            return acc;
        }, {});

        const ackIds = [];

        for (const threadId in repliesByThread) {
            const thread = threads.find(t => t.id === threadId);
            if (!thread) continue;

            repliesByThread[threadId].forEach(reply => {
                ackIds.push(reply.replyId);
                if (seenReplyIds.has(reply.replyId)) return;

                thread.messages.push({
                    id: generateId(),
                    replyId: reply.replyId,
                    sender: reply.sender,
                    content: reply.content,
                    type: reply.type,
                    timestamp: reply.timestamp,
                    isMain: false
                });
                thread.lastActivityTimestamp = reply.timestamp;
            });
        }

        currentPage = 1;
        renderAllThreads();
        saveData();
        await ackReplies(Array.from(new Set(ackIds)));
    };

    const fetchPendingReplies = () => {
        const url = `/api/get-pending-replies?clientId=${encodeURIComponent(clientId)}&_t=${Date.now()}`;

        fetch(url, { cache: 'no-store' })
        .then(response => {
            if (!response.ok) throw new Error('后端服务异常');
            if (response.status === 204) return null;
            return response.json();
        })
        .then(replies => {
            if (replies && replies.length > 0) {
                console.log('拉取到新回复:', replies);
                return displayBackendReplies(replies);
            }
        })
        .catch(error => {
            console.error('抓取待领任务失败，稍后自动重试:', error);
        });
    };

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') fetchPendingReplies();
    });

    const addZikaReply = () => {
        const content = newZikaContent.value.trim();
        const category = newZikaCategory.value.trim();
        if (content === '') return;

        if (replyLibrary.zika.some(r => r.content === content)) {
            alert('该字卡已存在。');
            return;
        }

        replyLibrary.zika.push({ content, category });
        saveData();
        populateGroupFilter();
        renderZikaReplies();
        updateCategoryDatalist();
        newZikaContent.value = '';
        newZikaCategory.value = '';
    };

    const addEmojiReply = () => {
        const content = newEmojiContent.value.trim();
        if (content === '') return;

        if (replyLibrary.emoji.some(r => r.content === content)) {
            alert('该Emoji已存在。');
            return;
        }

        replyLibrary.emoji.push({ content });
        saveData();
        renderMediaReplies('emoji', replyListEmoji);
        newEmojiContent.value = '';
    };

    const renderReplyLibrary = () => {
        populateGroupFilter();
        renderZikaReplies();
        renderMediaReplies('emoji', replyListEmoji);
        renderMediaReplies('image', replyListImage);
        updateCategoryDatalist();
    };

    const renderMediaReplies = (type, listElement) => {
        listElement.innerHTML = '';
        replyLibrary[type].forEach((item, index) => {
            const itemDiv = document.createElement('div');
            if (type === 'image') {
                itemDiv.className = 'image-item';
                itemDiv.innerHTML = `<img src="${item.content}" alt="image"><button class="delete-overlay delete-btn" data-index="${index}" data-type="${type}">&times;</button>`;
            } else if (type === 'emoji') {
                itemDiv.className = 'emoji-item';
                itemDiv.innerHTML = `${item.content}<button class="delete-overlay delete-btn" data-index="${index}" data-type="${type}">&times;</button>`;
            }
            listElement.appendChild(itemDiv);
        });
    };

    const updateCategoryDatalist = () => {
        const categories = new Set(replyLibrary.zika.map(r => r.category).filter(Boolean));
        categoryDatalist.innerHTML = '';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            categoryDatalist.appendChild(option);
        });
    };

    const addMediaReply = (type, files) => {
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                replyLibrary[type].push({ content: e.target.result });
                saveData();
                renderMediaReplies(type, replyListImage);
            };
            reader.readAsDataURL(file);
        }
    };

    const deleteReply = (type, index) => {
        if (!confirm(`确定要删除这个${type === 'zika' ? '字卡' : type === 'emoji' ? 'Emoji' : '图片'}吗？`)) return;
        replyLibrary[type].splice(index, 1);
        saveData();
        renderReplyLibrary();
    };

    const openEditModal = (index) => {
        editingZikaIndex = index;
        const reply = replyLibrary.zika[index];
        editZikaContent.value = reply.content;
        editZikaCategory.value = reply.category || '';
        editModal.style.display = 'flex';
    };

    const saveEdit = () => {
        if (editingZikaIndex === -1) return;
        const newContent = editZikaContent.value.trim();
        const newCategory = editZikaCategory.value.trim();

        if (newContent) {
            if (replyLibrary.zika.some((r, i) => r.content === newContent && i !== editingZikaIndex)) {
                alert('该字卡已存在。');
                return;
            }
            replyLibrary.zika[editingZikaIndex] = { content: newContent, category: newCategory };
            saveData();
            renderReplyLibrary();
        }
        closeEditModal();
    };

    const closeEditModal = () => {
        editingZikaIndex = -1;
        editModal.style.display = 'none';
    };

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    exportReplyBtn.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify({ replyLibrary }, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `传讯_回复库备份_${new Date().toJSON().slice(0,10)}.json`);
        backupModal.style.display = 'none';
    });

    exportChatBtn.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify({ threads }, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `传讯_聊天记录备份_${new Date().toJSON().slice(0,10)}.json`);
        backupModal.style.display = 'none';
    });

    let importTargetType = '';
    importReplyBtn.addEventListener('click', () => { importTargetType = 'reply'; fileImporter.click(); });
    importChatBtn.addEventListener('click', () => { importTargetType = 'chat'; fileImporter.click(); });

    fileImporter.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (importTargetType === 'reply') {
                    if (confirm('警告：将覆盖现有回复库，是否继续？')) {
                        replyLibrary = importedData.replyLibrary || { zika: [], emoji: [], image: [] };
                        saveData();
                        location.reload();
                    }
                } else if (importTargetType === 'chat') {
                    if (confirm('警告：将覆盖所有当前话题和聊天记录，是否继续？')) {
                        threads = importedData.threads || [];
                        saveData();
                        location.reload();
                    }
                }
            } catch (err) {
                alert('导入失败！文件格式异常。');
                console.error(err);
            }
            fileImporter.value = '';
        };
        reader.readAsText(file);
    });

    sendBtn.addEventListener('click', createThread);
    sendImageBtn.addEventListener('click', () => { chatImageUploader.click(); });
    chatImageUploader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            createImageThread(event.target.result);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });

    prevPageBtn.addEventListener('click', goToPrevPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            createThread();
        }
    });

    featureMenuBtn.addEventListener('click', () => featureDrawer.classList.add('open'));
    closeFeatureDrawerBtn.addEventListener('click', () => featureDrawer.classList.remove('open'));

    replyManagerMenuBtn.addEventListener('click', () => {
        featureDrawer.classList.remove('open');
        addZikaFormContainer.classList.remove('open');
        showAddZikaFormBtn.classList.remove('open');
        replyPanel.classList.add('open');
    });

    chatSettingsMenuBtn.addEventListener('click', () => {
        featureDrawer.classList.remove('open');
        minDelayInput.value = chatSettings.minDelay;
        maxDelayInput.value = chatSettings.maxDelay;
        fontSizeSlider.value = chatSettings.fontSizeLevel;
        updateFontSizeDisplay();
        settingsModal.style.display = 'flex';
    });

    backupMenuBtn.addEventListener('click', () => {
        featureDrawer.classList.remove('open');
        backupModal.style.display = 'flex';
    });

    closePanelBtn.addEventListener('click', () => {
        replyPanel.classList.remove('open');
        featureDrawer.classList.add('open');
    });

    closeBackupBtn.addEventListener('click', () => {
        backupModal.style.display = 'none';
        featureDrawer.classList.add('open');
    });

    const updateFontSizeDisplay = () => {
        const sizes = { 1: 14, 2: 16, 3: 18, 4: 20, 5: 22 };
        fontSizeDisplay.textContent = `${sizes[fontSizeSlider.value]}px`;
    };

    fontSizeSlider.addEventListener('input', updateFontSizeDisplay);

    cancelSettingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
        featureDrawer.classList.add('open');
    });

    saveSettingsBtn.addEventListener('click', () => {
        const minD = parseInt(minDelayInput.value), maxD = parseInt(maxDelayInput.value);
        if (isNaN(minD) || isNaN(maxD) || minD < 2 || maxD > 720 || minD >= maxD) {
            alert('无效：范围需在2分~12小时内，且最大值需大于最小值。');
            return;
        }
        chatSettings.minDelay = minD;
        chatSettings.maxDelay = maxD;
        chatSettings.fontSizeLevel = parseInt(fontSizeSlider.value);
        saveConfig();
        applyFontSize();
        settingsModal.style.display = 'none';
    });

    userProfileBtn.addEventListener('click', () => {
        editProfileName.value = profile.name || '';
        editAvatarPreview.src = profile.avatar || defaultAvatar;
        profileModal.style.display = 'flex';
    });

    cancelProfileBtn.addEventListener('click', () => profileModal.style.display = 'none');
    changeAvatarBtn.addEventListener('click', () => avatarUploader.click());

    avatarUploader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => { editAvatarPreview.src = event.target.result; };
        reader.readAsDataURL(file);
    });

    saveProfileBtn.addEventListener('click', () => {
        profile.name = editProfileName.value.trim() || '名字';
        profile.avatar = editAvatarPreview.src;
        saveConfig();
        renderProfile();
        profileModal.style.display = 'none';
    });

    tabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            tabs.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            tabContents.forEach(c => c.classList.remove('active'));
            document.getElementById(`${e.target.dataset.tab}-tab-content`).classList.add('active');
        }
    });

    addZikaBtn.addEventListener('click', addZikaReply);
    addEmojiBtn.addEventListener('click', addEmojiReply);
    showAddZikaFormBtn.addEventListener('click', () => {
        addZikaFormContainer.classList.toggle('open');
        showAddZikaFormBtn.classList.toggle('open');
    });

    zikaGroupFilter.addEventListener('change', renderZikaReplies);
    zikaSearch.addEventListener('input', renderZikaReplies);

    editZikaCategory.addEventListener('focus', (e) => {
        const originalValue = e.target.value;
        e.target.value = '';
        e.target.addEventListener('blur', () => {
            if (e.target.value === '') e.target.value = originalValue;
        }, { once: true });
    });

    imageUploader.addEventListener('change', (e) => { addMediaReply('image', e.target.files); });
    addReplyImageBtn.addEventListener('click', () => { imageUploader.click(); });

    replyPanel.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.classList.contains('delete-btn')) {
            const type = target.dataset.type;
            const index = parseInt(target.dataset.index);
            deleteReply(type, index);
        }

        if (target.classList.contains('edit-btn')) {
            const index = parseInt(target.dataset.index);
            openEditModal(index);
        }
    });

    saveEditBtn.addEventListener('click', saveEdit);
    cancelEditBtn.addEventListener('click', closeEditModal);

    clearDataBtn.addEventListener('click', () => {
        confirmClearInput.value = '';
        confirmClearActionBtn.disabled = true;
        confirmClearModal.style.display = 'flex';
    });

    cancelClearBtn.addEventListener('click', () => { confirmClearModal.style.display = 'none'; });
    confirmClearActionBtn.addEventListener('click', handleClearData);
    confirmClearInput.addEventListener('input', (e) => { confirmClearActionBtn.disabled = e.target.value !== 'delete'; });

    const initialize = () => {
        loadData();
        renderProfile();
        applyFontSize();
        renderAllThreads();
        renderReplyLibrary();
        tabs.querySelector(`[data-tab="zika"]`).click();
        fetchPendingReplies();
        setInterval(fetchPendingReplies, 60 * 1000);
    };

    initialize();
});
