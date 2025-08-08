document.addEventListener('DOMContentLoaded', () => {
    // ===================================
    // 登录验证和页面权限管理
    // ===================================
    const currentPage = window.location.pathname.split('/').pop();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const restrictedPages = ['jump.html', 'rss.html', 'notes.html', 'podcast.html', 'todo.html'];

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
            e.preventDefault();
            const username = usernameInput.value.trim().toLowerCase();
            const password = passwordInput.value.trim();

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

        if (htmlElement.dataset.theme === 'dark') {
            htmlElement.style.setProperty('--text-color-rgb', '224, 224, 224');
        } else if (htmlElement.dataset.theme === 'colorful') {
            htmlElement.style.setProperty('--text-color-rgb', '51, 51, 51');
        } else {
            htmlElement.style.setProperty('--text-color-rgb', '18, 18, 18');
        }
    }

    const savedTheme = localStorage.getItem('theme') || 'colorful';
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
    const rssUrlInput = document.getElementById('rss-url');
    const addRssBtn = document.getElementById('add-rss-btn');
    const rssFeedContainer = document.getElementById('rss-feed-container');

    function saveRssFeeds(feeds) {
        localStorage.setItem('rssFeeds', JSON.stringify(feeds));
    }

    function renderRssFeedList() {
        if (!rssFeedContainer) return;
        const feeds = JSON.parse(localStorage.getItem('rssFeeds')) || [];
        rssFeedContainer.innerHTML = '';
        feeds.forEach(feed => {
            const rssItem = document.createElement('div');
            rssItem.className = 'rss-item';
            rssItem.innerHTML = `
                <div class="rss-item-info">
                    <span class="rss-item-title">${feed.title || feed.url}</span>
                    <button class="rss-delete-btn">删除</button>
                </div>
                <div class="rss-feed-content" data-url="${feed.url}">加载中...</div>
            `;
            rssFeedContainer.appendChild(rssItem);
            fetchRssFeed(feed.url, rssItem.querySelector('.rss-feed-content'));
        });
    }

    async function fetchRssFeed(url, container) {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
            const data = await response.json();
            if (data.status === 'ok' && data.items) {
                const feedContent = data.items.map(item => {
                    const cleanDescription = DOMPurify.sanitize(item.description);
                    return `
                        <a href="${item.link}" target="_blank" class="rss-item-link">
                            <h4>${item.title}</h4>
                            <p>${cleanDescription}</p>
                        </a>
                    `;
                }).join('');
                container.innerHTML = feedContent;
            } else {
                container.textContent = '加载 RSS 失败。';
            }
        } catch (error) {
            console.error('获取 RSS 失败:', error);
            container.textContent = '加载 RSS 失败。';
        }
    }

    if (addRssBtn) {
        addRssBtn.addEventListener('click', () => {
            const url = rssUrlInput.value;
            if (url) {
                const feeds = JSON.parse(localStorage.getItem('rssFeeds')) || [];
                feeds.push({ url: url, title: url });
                saveRssFeeds(feeds);
                renderRssFeedList();
                rssUrlInput.value = '';
            }
        });
    }

    if (rssFeedContainer) {
        rssFeedContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('rss-delete-btn')) {
                const rssItem = e.target.closest('.rss-item');
                const urlToDelete = rssItem.querySelector('.rss-feed-content').dataset.url;
                const feeds = JSON.parse(localStorage.getItem('rssFeeds')) || [];
                const updatedFeeds = feeds.filter(feed => feed.url !== urlToDelete);
                saveRssFeeds(updatedFeeds);
                rssItem.remove();
            }
        });
        renderRssFeedList();
    }

    // ===================================
    // 笔记功能
    // ===================================
    const addNoteBtn = document.getElementById('add-note-btn');
    const notesListContainer = document.getElementById('notes-list-container');
    const noteDisplay = document.getElementById('note-display');

    let currentNoteId = null;

    function saveNotes(notes) {
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function getNotes() {
        return JSON.parse(localStorage.getItem('notes')) || [];
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
        if (!noteDisplay) return;
        noteDisplay.innerHTML = `
            <h2>${note.title}</h2>
            <div class="note-edit-area">
                <textarea id="note-editor" class="note-textarea">${note.content}</textarea>
                <div class="note-actions">
                    <button id="save-note-btn" class="login-button">保存</button>
                </div>
            </div>
        `;
        const noteEditor = document.getElementById('note-editor');
        const saveNoteBtn = document.getElementById('save-note-btn');
        if (noteEditor) {
            noteEditor.focus();
        }
        if (saveNoteBtn) {
            saveNoteBtn.addEventListener('click', () => {
                note.content = noteEditor.value;
                note.title = noteEditor.value.split('\n')[0] || '无标题';
                const notes = getNotes();
                const noteIndex = notes.findIndex(n => n.id === note.id);
                if (noteIndex !== -1) {
                    notes[noteIndex] = note;
                    saveNotes(notes);
                    renderNotesList();
                }
            });
        }
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
            currentNoteId = newNote.id;
        });
    }

    if (notesListContainer) {
        notesListContainer.addEventListener('click', (e) => {
            const noteItem = e.target.closest('.notes-list-item');
            if (e.target.classList.contains('delete-note-btn')) {
                e.stopPropagation();
                const noteId = parseInt(noteItem.dataset.noteId);
                const notes = getNotes();
                const updatedNotes = notes.filter(n => n.id !== noteId);
                saveNotes(updatedNotes);
                renderNotesList();
                if (currentNoteId === noteId) {
                    noteDisplay.innerHTML = '<p>请在左侧选择一篇笔记进行查看或编辑。</p>';
                    currentNoteId = null;
                }
            } else if (noteItem) {
                const noteId = parseInt(noteItem.dataset.noteId);
                const notes = getNotes();
                const note = notes.find(n => n.id === noteId);
                if (note) {
                    displayNoteContent(note);
                    currentNoteId = noteId;
                    notesListContainer.querySelectorAll('.notes-list-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    noteItem.classList.add('active');
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
        const cleanDescription = DOMPurify.sanitize(decodeURIComponent(description));
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

    // ===================================
    // 待办事项功能
    // ===================================
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoList = document.getElementById('todo-list');

    function renderTodoList() {
        if (!todoList) return;
        todoList.innerHTML = '';
        const todos = JSON.parse(localStorage.getItem('todos')) || [];
        todos.forEach(todo => {
            const todoItem = document.createElement('li');
            todoItem.className = `todo-list-item card ${todo.completed ? 'completed' : ''}`;
            todoItem.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
                <span class="todo-text">${todo.text}</span>
                <button class="todo-delete-btn" data-id="${todo.id}">删除</button>
            `;
            todoList.appendChild(todoItem);
        });
    }

    function saveTodos(todos) {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    if (addTodoBtn) {
        addTodoBtn.addEventListener('click', () => {
            const todoText = todoInput.value.trim();
            if (todoText) {
                const todos = JSON.parse(localStorage.getItem('todos')) || [];
                const newTodo = {
                    id: Date.now(),
                    text: todoText,
                    completed: false
                };
                todos.push(newTodo);
                saveTodos(todos);
                renderTodoList();
                todoInput.value = '';
            }
        });

        todoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addTodoBtn.click();
            }
        });
    }

    if (todoList) {
        todoList.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            let todos = JSON.parse(localStorage.getItem('todos')) || [];

            if (e.target.classList.contains('todo-checkbox')) {
                todos = todos.map(todo => {
                    if (todo.id === id) {
                        todo.completed = !todo.completed;
                    }
                    return todo;
                });
                saveTodos(todos);
                renderTodoList();
            } else if (e.target.classList.contains('todo-delete-btn')) {
                todos = todos.filter(todo => todo.id !== id);
                saveTodos(todos);
                renderTodoList();
            }
        });

        renderTodoList();
    }
});