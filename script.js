document.addEventListener('DOMContentLoaded', () => {
    // ===================================
    // 登录验证和页面权限管理
    // ===================================
    const currentPage = window.location.pathname.split('/').pop();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const restrictedPages = ['jump.html', 'rss.html', 'notes.html', 'podcast.html'];

    // 如果未登录且访问受限页面，则跳转到登录页
    if (restrictedPages.includes(currentPage) && !isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    // 动态显示登录/退出登录按钮
    const authButton = document.getElementById('auth-button');
    if (authButton) {
        if (isLoggedIn) {
            authButton.textContent = '退出登录';
            authButton.addEventListener('click', () => {
                localStorage.removeItem('isLoggedIn');
                window.location.href = 'login.html';
            });
        } else {
            authButton.textContent = '登录';
            authButton.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
    }

    // ===================================
    // 登录功能
    // ===================================
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');

    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault(); // 防止表单默认提交行为
            const username = usernameInput.value.trim().toLowerCase();
            const password = passwordInput.value.trim();

            // 修正：用户名转小写，密码保持原样
            if (username === 'foync' && password === '090420') {
                localStorage.setItem('isLoggedIn', 'true');
                window.location.href = 'index.html';
            } else {
                alert('用户名或密码错误，请重试。');
            }
        });
    }

    // ===================================
    // 主题切换功能
    // ===================================
    const htmlElement = document.documentElement;
    const themeSwitcherContainer = document.querySelector('.theme-switcher-container');
    const themeSwitcherToggle = document.querySelector('.theme-switcher-toggle');
    const themeSwitcherOptions = document.querySelector('.theme-switcher-options');
    const themeButtons = document.querySelectorAll('.theme-switcher-options button');

    function applyTheme(theme) {
        if (theme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            htmlElement.dataset.theme = systemPrefersDark ? 'dark' : 'light';
        } else {
            htmlElement.dataset.theme = theme;
        }
        localStorage.setItem('theme', theme);
        
        // 动态调整文本颜色 RGB 变量
        if (htmlElement.dataset.theme === 'dark') {
            htmlElement.style.setProperty('--text-color-rgb', '224, 224, 224');
        } else if (htmlElement.dataset.theme === 'colorful') {
            htmlElement.style.setProperty('--text-color-rgb', '51, 51, 51');
        } else {
            htmlElement.style.setProperty('--text-color-rgb', '18, 18, 18');
        }
    }

    const savedTheme = localStorage.getItem('theme') || 'system';
    applyTheme(savedTheme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('theme') === 'system') {
            applyTheme('system');
        }
    });

    if (themeSwitcherToggle) {
        themeSwitcherToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            themeSwitcherOptions.classList.toggle('open');
        });
    }

    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            applyTheme(theme);
            themeSwitcherOptions.classList.remove('open');
        });
    });

    if (themeSwitcherContainer) {
        themeSwitcherContainer.addEventListener('mouseenter', () => {
            themeSwitcherOptions.classList.add('open');
        });
        themeSwitcherContainer.addEventListener('mouseleave', () => {
            themeSwitcherOptions.classList.remove('open');
        });
    }

    document.addEventListener('click', (event) => {
        if (themeSwitcherOptions && themeSwitcherOptions.classList.contains('open') && !themeSwitcherContainer.contains(event.target)) {
            themeSwitcherOptions.classList.remove('open');
        }
    });

    // ===================================
    // 网址跳转功能
    // ===================================
    const urlInput = document.getElementById('url-input');
    const urlNameInput = document.getElementById('url-name');
    const addJumpBtn = document.getElementById('add-jump-btn');
    const jumpList = document.getElementById('jump-list');

    function saveJumps() {
        const jumps = [];
        if (jumpList) {
            jumpList.querySelectorAll('.jump-list-item').forEach(item => {
                jumps.push({
                    url: item.dataset.url,
                    name: item.querySelector('.jump-title').textContent
                });
            });
        }
        localStorage.setItem('jumps', JSON.stringify(jumps));
    }

    function renderJumps() {
        if (!jumpList) return;
        jumpList.innerHTML = '';
        const jumps = JSON.parse(localStorage.getItem('jumps')) || [];
        jumps.forEach(jump => {
            const jumpItem = document.createElement('a');
            jumpItem.href = jump.url;
            jumpItem.target = '_blank';
            jumpItem.className = 'jump-list-item card';
            jumpItem.dataset.url = jump.url;
            jumpItem.innerHTML = `
                <span class="jump-title">${jump.name}</span>
                <span class="jump-url">${jump.url}</span>
                <button class="jump-delete-btn">删除</button>
            `;
            jumpList.appendChild(jumpItem);
        });
    }

    if (addJumpBtn) {
        addJumpBtn.addEventListener('click', () => {
            const url = urlInput.value;
            const name = urlNameInput.value || url;
            if (url) {
                const jumps = JSON.parse(localStorage.getItem('jumps')) || [];
                jumps.push({ url, name });
                localStorage.setItem('jumps', JSON.stringify(jumps));
                renderJumps();
                urlInput.value = '';
                urlNameInput.value = '';
            }
        });
    }

    if (jumpList) {
        jumpList.addEventListener('click', (e) => {
            if (e.target.classList.contains('jump-delete-btn')) {
                e.preventDefault();
                const jumpItem = e.target.closest('.jump-list-item');
                const urlToDelete = jumpItem.dataset.url;
                const jumps = JSON.parse(localStorage.getItem('jumps')) || [];
                const updatedJumps = jumps.filter(jump => jump.url !== urlToDelete);
                localStorage.setItem('jumps', JSON.stringify(updatedJumps));
                jumpItem.remove();
            }
        });
        renderJumps();
    }
    
    // ===================================
    // RSS 阅读器功能
    // ===================================
    const rssUrlInput = document.getElementById('rss-url-input');
    const subscribeBtn = document.getElementById('subscribe-button');
    const rssFeedContainer = document.getElementById('rss-feed-container');
    const rssLoading = document.getElementById('rss-loading');

    function saveRssFeeds(feeds) {
        localStorage.setItem('rssFeeds', JSON.stringify(feeds));
    }

    function getRssFeeds() {
        return JSON.parse(localStorage.getItem('rssFeeds')) || [];
    }
    
    async function fetchRssFeed(url, container) {
        container.innerHTML = '<p>加载中...</p>';
        try {
            const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
            const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
            const text = await response.text();
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            
            const items = xmlDoc.querySelectorAll('item');
            let feedContent = '';
            
            items.forEach(item => {
                const title = item.querySelector('title')?.textContent || '无标题';
                const link = item.querySelector('link')?.textContent || '#';
                const description = item.querySelector('description')?.textContent || '无描述';
                
                feedContent += `
                    <div class="rss-feed-item card">
                        <h4><a href="${link}" target="_blank">${title}</a></h4>
                        <p>${description}</p>
                    </div>
                `;
            });
            container.innerHTML = feedContent;
        } catch (error) {
            console.error('获取 RSS 失败:', error);
            container.innerHTML = '<p>加载 RSS 失败。请检查地址是否正确。</p>';
        }
    }

    function renderRssFeeds() {
        if (!rssFeedContainer) return;
        const feeds = getRssFeeds();
        rssFeedContainer.innerHTML = '';
        feeds.forEach(feed => {
            const feedCard = document.createElement('div');
            feedCard.className = 'rss-card card';
            feedCard.innerHTML = `
                <div class="rss-card-header">
                    <h3>${feed.title || feed.url}</h3>
                    <div class="rss-actions">
                        <button class="delete-rss-btn" data-url="${feed.url}">删除</button>
                    </div>
                </div>
                <div class="rss-feed-content" data-url="${feed.url}">加载中...</div>
            `;
            rssFeedContainer.appendChild(feedCard);
            const contentContainer = feedCard.querySelector('.rss-feed-content');
            fetchRssFeed(feed.url, contentContainer);
        });
    }

    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            const url = rssUrlInput.value.trim();
            if (url) {
                const feeds = getRssFeeds();
                // 检查是否已存在
                if (!feeds.some(feed => feed.url === url)) {
                    feeds.push({ url: url, title: url });
                    saveRssFeeds(feeds);
                    renderRssFeeds();
                    rssUrlInput.value = '';
                } else {
                    alert('该订阅源已存在！');
                }
            }
        });
    }

    if (rssFeedContainer) {
        rssFeedContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-rss-btn')) {
                const urlToDelete = e.target.dataset.url;
                const feeds = getRssFeeds();
                const updatedFeeds = feeds.filter(feed => feed.url !== urlToDelete);
                saveRssFeeds(updatedFeeds);
                renderRssFeeds();
            }
        });
        renderRssFeeds();
    }
    
    // ===================================
    // 笔记功能
    // ===================================
    const addNoteBtn = document.getElementById('add-note-btn');
    const notesListContainer = document.getElementById('notes-list-container');
    const noteEditorContainer = document.getElementById('note-editor-container');
    
    function getNotes() {
        return JSON.parse(localStorage.getItem('notes')) || [];
    }

    function saveNotes(notes) {
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function renderNotesList() {
        if (!notesListContainer) return;
        notesListContainer.innerHTML = '';
        const notes = getNotes();
        notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'notes-list-item';
            noteItem.dataset.noteId = note.id;
            noteItem.innerHTML = `
                <h4>${note.title}</h4>
                <button class="delete-note-btn">删除</button>
            `;
            notesListContainer.appendChild(noteItem);
        });
    }

    function displayNoteContent(note) {
        if (!noteEditorContainer) return;
        
        noteEditorContainer.innerHTML = `
            <div class="note-edit-area card">
                <input type="text" id="note-title-input" placeholder="笔记标题" value="${note.title}">
                <div class="editor-toolbar">
                    <button id="bold-btn"><b>B</b></button>
                    <button id="italic-btn"><i>I</i></button>
                    <button id="underline-btn"><u>U</u></button>
                </div>
                <textarea id="note-editor" class="note-textarea">${note.content}</textarea>
                <div class="note-actions">
                    <button id="save-note-btn" class="login-button">保存</button>
                </div>
            </div>
        `;
        
        const noteEditor = document.getElementById('note-editor');
        const noteTitleInput = document.getElementById('note-title-input');
        const saveNoteBtn = document.getElementById('save-note-btn');
        
        noteEditor.focus();
        
        saveNoteBtn.addEventListener('click', () => {
            note.content = noteEditor.value;
            note.title = noteTitleInput.value.trim() || '无标题';
            const notes = getNotes();
            const noteIndex = notes.findIndex(n => n.id === note.id);
            if (noteIndex !== -1) {
                notes[noteIndex] = note;
                saveNotes(notes);
                renderNotesList();
            }
        });
    }

    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            const newNote = {
                id: Date.now(),
                title: '新笔记',
                content: ''
            };
            const notes = getNotes();
            notes.push(newNote);
            saveNotes(notes);
            renderNotesList();
            displayNoteContent(newNote);
        });
    }

    if (notesListContainer) {
        notesListContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-note-btn')) {
                e.stopPropagation();
                const noteItem = e.target.closest('.notes-list-item');
                const noteId = parseInt(noteItem.dataset.noteId);
                const notes = getNotes();
                const updatedNotes = notes.filter(n => n.id !== noteId);
                saveNotes(updatedNotes);
                renderNotesList();
                if (noteEditorContainer.querySelector('[data-note-id="' + noteId + '"]')) {
                    noteEditorContainer.innerHTML = '<p>请在左侧选择一篇笔记进行查看或编辑。</p>';
                }
            } else {
                const noteItem = e.target.closest('.notes-list-item');
                if (noteItem) {
                    const noteId = parseInt(noteItem.dataset.noteId);
                    const notes = getNotes();
                    const note = notes.find(n => n.id === noteId);
                    if (note) {
                        displayNoteContent(note);
                    }
                }
            }
        });
        renderNotesList();
    }
    
    // ===================================
    // 播客功能
    // ===================================
    const podcastDetailContainer = document.getElementById('podcast-detail-container');
    const urlParams = new URLSearchParams(window.location.search);
    const audioUrl = urlParams.get('audio');
    const title = urlParams.get('title');
    const description = urlParams.get('description');

    if (podcastDetailContainer && audioUrl && title && description) {
        const cleanDescription = decodeURIComponent(description);
        podcastDetailContainer.innerHTML = `
            <h2>${decodeURIComponent(title)}</h2>
            <audio id="podcast-player" controls class="audio-player">
                <source src="${decodeURIComponent(audioUrl)}" type="audio/mpeg">
                您的浏览器不支持音频播放器。
            </audio>
            <div class="rss-item-description">
                ${cleanDescription}
            </div>
        `;
    }
});