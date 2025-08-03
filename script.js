document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const restrictedPages = ['jump.html', 'rss.html'];

    if (restrictedPages.includes(currentPage) && !isLoggedIn) {
        window.location.href = 'login.html';
        return;
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
    }

    const savedTheme = localStorage.getItem('theme') || 'system';
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
                    }
                }
            });
        }

        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('read-saved-rss-btn')) {
                const url = event.target.dataset.url;
                fetchRssFeed(url);
            }
            if (event.target.classList.contains('delete-rss-btn')) {
                const url = event.target.dataset.url;
                if (confirm(`确定要删除此订阅源吗？`)) {
                    deleteRssFeed(url);
                }
            }
            if (event.target.classList.contains('edit-rss-btn')) {
                const url = event.target.dataset.url;
                const newTitle = prompt('请输入新的标题：');
                if (newTitle !== null && newTitle.trim() !== '') {
                    updateRssFeedTitle(url, newTitle.trim());
                } else if (newTitle !== null) {
                    alert('标题不能为空。');
                }
            }
        });
    }

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const errorMessage = document.getElementById('error-message');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const username = usernameInput.value.trim().toLowerCase();
            const password = passwordInput.value.trim().toLowerCase();

            if (username === 'foync' && password === '090420') {
                localStorage.setItem('isLoggedIn', 'true');
                alert('登录成功！');
                window.location.href = 'index.html';
            } else {
                errorMessage.style.display = 'block';
                alert('请检查账号或密码并重试。');
            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });
    }
});