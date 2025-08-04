document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const restrictedPages = ['jump.html', 'rss.html', 'notes.html'];

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

    const htmlElement = document.documentElement;

    function applyTheme(theme) {
        if (theme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            htmlElement.dataset.theme = systemPrefersDark ? 'dark' : 'light';
        } else {
            htmlElement.dataset.theme = theme;
        }
        localStorage.setItem('theme', theme);
        
        // 动态调整文本颜色 RGB 变量
        if (theme === 'dark') {
            htmlElement.style.setProperty('--text-color-rgb', '224, 224, 224');
        } else if (theme === 'colorful') {
            htmlElement.style.setProperty('--text-color-rgb', '51, 51, 51');
        } else {
            htmlElement.style.setProperty('--text-color-rgb', '18, 18, 18');
        }
    }

    const savedTheme = localStorage.getItem('theme') || 'colorful'; // 修改此处：将默认主题设为 'colorful'
    applyTheme(savedTheme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('theme') === 'system') {
            applyTheme('system');
        }
    });

    const themeSwitcherContainer = document.querySelector('.theme-switcher-container');
    const themeSwitcherToggle = document.querySelector('.theme-switcher-toggle');
    const themeSwitcherOptions = document.querySelector('.theme-switcher-options');
    const themeButtons = document.querySelectorAll('.theme-switcher-options button');

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
    //  网址跳转功能
    // ===================================
    const urlInput = document.getElementById('url-input');
    const jumpButton = document.getElementById('jump-button');
    if (jumpButton) {
        function navigateToUrl() {
            let url = urlInput.value.trim();
            if (url) {
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                window.open(url, '_blank');
            } else {
                alert('请输入一个有效的网址。');
            }
        }
        jumpButton.addEventListener('click', navigateToUrl);
        if (urlInput) {
            urlInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    navigateToUrl();
                }
            });
        }
    }

    // ===================================
    //  RSS 阅读器功能
    // ===================================
    const rssUrlInput = document.getElementById('rss-url-input');
    const subscribeButton = document.getElementById('subscribe-button');
    const feedContainer = document.getElementById('rss-feed-container');
    const loadingIndicator = document.getElementById('rss-loading');
    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-container';

    if (feedContainer) {
        let currentFeedData = null;
        const itemsPerPage = 10;
        let currentPage = 1;
        const savedRssListContainer = document.createElement('div');
        savedRssListContainer.id = 'saved-rss-list';
        feedContainer.before(savedRssListContainer);
        feedContainer.after(paginationContainer);

        function renderPagination() {
            paginationContainer.innerHTML = '';
            if (!currentFeedData || currentFeedData.items.length <= itemsPerPage) return;
            const totalPages = Math.ceil(currentFeedData.items.length / itemsPerPage);
            const prevButton = document.createElement('button');
            prevButton.textContent = '上一页';
            prevButton.disabled = currentPage === 1;
            prevButton.addEventListener('click', () => {
                currentPage--;
                displayFeed(currentFeedData);
                window.scrollTo(0, 0);
            });
            paginationContainer.appendChild(prevButton);
            const pageInfo = document.createElement('span');
            pageInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
            paginationContainer.appendChild(pageInfo);
            const nextButton = document.createElement('button');
            nextButton.textContent = '下一页';
            nextButton.disabled = currentPage === totalPages;
            nextButton.addEventListener('click', () => {
                currentPage++;
                displayFeed(currentFeedData);
                window.scrollTo(0, 0);
            });
            paginationContainer.appendChild(nextButton);
        }

        async function fetchRssFeed(rssUrl) {
            loadingIndicator.classList.remove('hidden');
            feedContainer.innerHTML = '';

            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`网络响应错误: ${response.statusText}`);
                }
                const data = await response.json();

                if (data.status === 'ok') {
                    let feedTitle = data.feed.title;
                    if (!feedTitle) {
                        const newTitle = prompt('该订阅源缺少标题，请为其命名：', '未命名订阅');
                        if (newTitle === null || newTitle.trim() === '') {
                            alert('取消订阅。');
                            return;
                        }
                        feedTitle = newTitle.trim();
                    }

                    currentFeedData = data;
                    currentPage = 1;
                    displayFeed(currentFeedData);
                    alert('RSS 订阅读取成功！');
                    rssUrlInput.value = '';
                    saveRssFeed({ url: rssUrl, title: feedTitle });
                } else {
                    throw new Error(data.message || '无法解析此 RSS 源。');
                }
            } catch (error) {
                console.error('获取 RSS 失败:', error);
                feedContainer.innerHTML = `<p style="color: red;">加载失败: ${error.message}</p>`;
                alert('RSS 订阅读取失败，请检查。');
            } finally {
                loadingIndicator.classList.add('hidden');
            }
        }

        function displayFeed(data) {
            const feedInfo = `<h3><a href="${data.feed.link}" target="_blank">${data.feed.title}</a></h3><p>${data.feed.description}</p>`;
            feedContainer.innerHTML = feedInfo;

            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const itemsToDisplay = data.items.slice(start, end);

            itemsToDisplay.forEach(item => {
                const itemElement = document.createElement('div');
                // 新增：为每个 RSS 条目添加液态玻璃卡片样式
                itemElement.classList.add('rss-item-card');
                const hasAudio = item.enclosure && item.enclosure.type && item.enclosure.type.startsWith('audio');

                const titleText = hasAudio ? `🎧 ${item.title}` : item.title;
                const meta = `<div class="rss-item-meta">作者: ${item.author || '未知'} | 发布于: ${new Date(item.pubDate).toLocaleString()}</div>`;
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.description;
                const descriptionText = tempDiv.textContent || tempDiv.innerText || "";
                const description = `<div class="rss-item-description">${descriptionText.substring(0, 300)}...</div>`;

                const itemLink = item.link;
                itemElement.innerHTML = `
                    <div class="rss-item">
                        <h4 class="rss-item-title"><a href="${itemLink}" target="_blank">${titleText}</a></h4>
                        ${meta}
                        ${description}
                    </div>
                `;

                if (hasAudio) {
                    const titleElement = itemElement.querySelector('.rss-item-title a');
                    titleElement.href = `podcast.html?audioUrl=${encodeURIComponent(item.enclosure.link)}&title=${encodeURIComponent(item.title)}&description=${encodeURIComponent(item.description)}`;
                }

                feedContainer.appendChild(itemElement);
            });

            renderPagination();
        }

        function loadSavedRssFeeds() {
            savedRssListContainer.innerHTML = '<h3 class="saved-rss-title">已保存的订阅</h3>';
            const savedFeeds = JSON.parse(localStorage.getItem('savedRssFeeds')) || [];

            const filteredFeeds = savedFeeds.filter(feed => feed.title !== 'undefined');

            if (filteredFeeds.length > 0) {
                const list = document.createElement('ul');
                filteredFeeds.forEach(feed => {
                    const feedItem = document.createElement('li');
                    feedItem.className = 'saved-rss-item';
                    feedItem.innerHTML = `
                        <span class="feed-title" data-url="${feed.url}">${feed.title}</span>
                        <div class="rss-item-actions">
                            <button class="read-saved-rss-btn" data-url="${feed.url}">读取</button>
                            <button class="edit-rss-btn" data-url="${feed.url}">编辑</button>
                            <button class="delete-rss-btn" data-url="${feed.url}">删除</button>
                        </div>
                    `;
                    list.appendChild(feedItem);
                });
                savedRssListContainer.appendChild(list);
            } else {
                savedRssListContainer.innerHTML += '<p>暂无已保存的订阅源。</p>';
            }

            localStorage.setItem('savedRssFeeds', JSON.stringify(filteredFeeds));
        }

        function saveRssFeed(feed) {
            let savedFeeds = JSON.parse(localStorage.getItem('savedRssFeeds')) || [];
            if (!savedFeeds.some(f => f.url === feed.url)) {
                savedFeeds.push(feed);
                localStorage.setItem('savedRssFeeds', JSON.stringify(savedFeeds));
                loadSavedRssFeeds();
            }
        }

        function updateRssFeedTitle(url, newTitle) {
            let savedFeeds = JSON.parse(localStorage.getItem('savedRssFeeds')) || [];
            savedFeeds.forEach(feed => {
                if (feed.url === url) {
                    feed.title = newTitle;
                }
            });
            localStorage.setItem('savedRssFeeds', JSON.stringify(savedFeeds));
            loadSavedRssFeeds();
        }

        function deleteRssFeed(url) {
            let savedFeeds = JSON.parse(localStorage.getItem('savedRssFeeds')) || [];
            savedFeeds = savedFeeds.filter(feed => feed.url !== url);
            localStorage.setItem('savedRssFeeds', JSON.stringify(savedFeeds));
            loadSavedRssFeeds();
        }

        if (isLoggedIn) {
            loadSavedRssFeeds();
        }

        subscribeButton.addEventListener('click', () => {
            const rssUrl = rssUrlInput.value.trim();
            if (rssUrl) {
                fetchRssFeed(rssUrl);
            } else {
                alert('请输入 RSS 订阅源地址。');
            }
        });

        if (rssUrlInput) {
            rssUrlInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    const rssUrl = rssUrlInput.value.trim();
                    if (rssUrl) {
                        fetchRssFeed(rssUrl);
                    } else {
                        alert('请输入 RSS 订阅源地址。');
                    }
                }
            });
        }

        if (savedRssListContainer) {
            savedRssListContainer.addEventListener('click', async (event) => {
                const target = event.target;
                const url = target.dataset.url;
                if (!url) return;

                if (target.classList.contains('read-saved-rss-btn')) {
                    fetchRssFeed(url);
                } else if (target.classList.contains('delete-rss-btn')) {
                    if (confirm('确定要删除此订阅吗？')) {
                        deleteRssFeed(url);
                    }
                } else if (target.classList.contains('edit-rss-btn')) {
                    const newTitle = prompt('请输入新的订阅名称：', target.closest('.saved-rss-item').querySelector('.feed-title').textContent);
                    if (newTitle !== null && newTitle.trim() !== '') {
                        updateRssFeedTitle(url, newTitle);
                    }
                }
            });
        }
    }

    // ===================================
    //  播客详情页面
    // ===================================
    const podcastContainer = document.getElementById('podcast-container');
    if (podcastContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const audioUrl = urlParams.get('audioUrl');
        const title = urlParams.get('title');
        const description = urlParams.get('description');

        const podcastDetail = document.getElementById('podcast-detail');
        if (podcastDetail && audioUrl && title) {
            podcastDetail.innerHTML = `
                <h2>${title}</h2>
                <audio controls class="audio-player">
                    <source src="${audioUrl}" type="audio/mpeg">
                    你的浏览器不支持音频播放。
                </audio>
                <div class="podcast-description">${description || ''}</div>
            `;
        } else {
            if (podcastDetail) {
                podcastDetail.innerHTML = '<p>未找到播客信息。</p>';
            }
        }
    }

    // ===================================
    //  笔记功能
    // ===================================
    const newNoteBtn = document.getElementById('new-note-btn');
    const notesList = document.getElementById('notes-list');
    const noteTitleInput = document.getElementById('note-title-input');
    const editorContent = document.getElementById('editor-content');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const deleteNoteBtn = document.getElementById('delete-note-btn');
    const toggleViewBtn = document.getElementById('toggle-view-btn');
    const noteContentPreview = document.getElementById('note-content-preview');

    let currentNoteId = null;

    if (newNoteBtn) {
        function renderNotesList() {
            notesList.innerHTML = '';
            const notes = JSON.parse(localStorage.getItem('notes')) || [];
            if (notes.length === 0) {
                notesList.innerHTML = '<p class="no-notes-message">暂无笔记</p>';
                return;
            }

            notes.forEach(note => {
                const noteItem = document.createElement('div');
                noteItem.classList.add('notes-list-item');
                noteItem.dataset.id = note.id;
                noteItem.innerHTML = `
                    <h4>${note.title || '无标题笔记'}</h4>
                `;
                noteItem.addEventListener('click', () => {
                    loadNote(note.id);
                });
                notesList.appendChild(noteItem);
            });

            // 恢复选中状态
            if (currentNoteId) {
                const activeItem = document.querySelector(`.notes-list-item[data-id='${currentNoteId}']`);
                if (activeItem) {
                    activeItem.classList.add('active');
                }
            }
        }

        function loadNote(id) {
            const notes = JSON.parse(localStorage.getItem('notes')) || [];
            const note = notes.find(n => n.id === id);

            if (note) {
                currentNoteId = note.id;
                noteTitleInput.value = note.title;
                editorContent.value = note.content;
                deleteNoteBtn.classList.remove('hidden');

                document.querySelectorAll('.notes-list-item').forEach(item => item.classList.remove('active'));
                document.querySelector(`.notes-list-item[data-id='${id}']`).classList.add('active');
            }
        }

        function saveNote() {
            const notes = JSON.parse(localStorage.getItem('notes')) || [];
            const title = noteTitleInput.value.trim() || '无标题笔记';
            const content = editorContent.value.trim();

            if (!content) {
                alert('笔记内容不能为空！');
                return;
            }

            if (currentNoteId) {
                const noteIndex = notes.findIndex(n => n.id === currentNoteId);
                if (noteIndex > -1) {
                    notes[noteIndex].title = title;
                    notes[noteIndex].content = content;
                    notes[noteIndex].updatedAt = new Date().toISOString();
                }
            } else {
                const newNote = {
                    id: Date.now().toString(),
                    title: title,
                    content: content,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                notes.push(newNote);
                currentNoteId = newNote.id;
            }

            localStorage.setItem('notes', JSON.stringify(notes));
            renderNotesList();
            alert('笔记已保存！');
        }

        function deleteNote() {
            if (!currentNoteId) return;

            if (confirm('确定要删除此笔记吗？')) {
                let notes = JSON.parse(localStorage.getItem('notes')) || [];
                notes = notes.filter(n => n.id !== currentNoteId);
                localStorage.setItem('notes', JSON.stringify(notes));
                alert('笔记已删除。');
                newNote();
                renderNotesList();
            }
        }

        function newNote() {
            currentNoteId = null;
            noteTitleInput.value = '';
            editorContent.value = '';
            deleteNoteBtn.classList.add('hidden');
            document.querySelectorAll('.notes-list-item').forEach(item => item.classList.remove('active'));
        }

        function toggleView() {
            if (toggleViewBtn.textContent === '预览') {
                noteContentPreview.innerHTML = marked.parse(editorContent.value);
                document.getElementById('editor-view').classList.add('hidden');
                noteContentPreview.classList.remove('hidden');
                toggleViewBtn.textContent = '编辑';
            } else {
                noteContentPreview.classList.add('hidden');
                document.getElementById('editor-view').classList.remove('hidden');
                toggleViewBtn.textContent = '预览';
            }
        }

        newNoteBtn.addEventListener('click', newNote);
        saveNoteBtn.addEventListener('click', saveNote);
        deleteNoteBtn.addEventListener('click', deleteNote);
        toggleViewBtn.addEventListener('click', toggleView);

        // 绑定富文本控制按钮
        document.getElementById('bold-btn').addEventListener('click', () => {
            document.execCommand('bold', false, null);
        });
        document.getElementById('italic-btn').addEventListener('click', () => {
            document.execCommand('italic', false, null);
        });
        document.getElementById('underline-btn').addEventListener('click', () => {
            document.execCommand('underline', false, null);
        });
        document.getElementById('font-size-select').addEventListener('change', (e) => {
            document.execCommand('fontSize', false, e.target.value);
        });

        renderNotesList();
    }
});