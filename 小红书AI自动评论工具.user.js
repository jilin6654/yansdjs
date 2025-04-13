// ==UserScript==
// @name         小红书AI自动评论工具-优化版
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  自动筛选AI相关内容并随机发送评论（带点赞功能）
// @author       You
// @match        https://www.xiaohongshu.com/*
// @icon         https://www.xiaohongshu.com/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_log
// ==/UserScript==

(function() {
    'use strict';

    // 配置项
    const CONFIG = {
        AI_KEYWORDS: [
            'claude', 'gemini', 'gpt', 'deepseek', 'cline',
            'cursor', 'manus', 'chatgpt', '文心一言', '通义千问',
            '星火认知', '混元', 'ERNIE', 'Bard', 'PaLM', 'Llama',
            'Mistral', 'ChatGLM', '悟道', '盘古', '昆仑', '天工',
            '智谱', '百川', '云雀', '豆包'
        ].map(k => k.toLowerCase()),

        // 小红书常用表情库
        EMOJI_LIST: [
            "✨", "🌟", "💡", "🔥", "🎯",
            "🤖", "🚀", "📌", "🔍", "😎",
            "💭", "👀", "👍", "🤔", "👏",
            "🙌", "💯", "❤️", "🧠", "⚡",
            "🌈", "🍀", "🎉", "🛠️", "🔑"
        ],

        PROMOTION_MESSAGES: [
    "👈 支持实时流式输出！做聊天机器人时用户反馈'和真人对话一样流畅'～",
    "👈 独家的中文语境优化！生成的内容比直接调用官方接口更符合本土表达✨",
    "👈 企业级稳定性认证！我们连续调用30天零中断，SLA比官网还高！",
    "👈 内置敏感词过滤+内容安全审核，完全不用担心违规风险🧐",
    "👈 超贴心！API文档里连'常见踩坑案例'都写好了，小白也能快速上手",
    "👈 支持多模态输入！图片/语音/文本都能处理，做智能客服超省心",
    "👈 凌晨3点测试响应速度依然＜0.3秒，夜猫子开发者狂喜🐱‍💻",
    "👈 偷偷说...这里能提前体验到某些还没公开的新模型功能！",
    "👈 团队实测：批量处理1万条数据时，错误率比同类接口低40%！",
    "👈 提供沙箱测试环境！不用充值就能先试调用效果，良心哭了😭",
    "👈 和官方完全兼容的AI接口，文档清晰，迁移过来半小时就搞定了！",
    "👈 实测支持最新多模态模型，图片识别准确率超高，价格还更香",
    "👈 小众但靠谱的API服务！我们APP集成后用户都说AI回复更流畅了",
    "👈 独家的并发优化技术，高峰期也不会卡顿，适合需要稳定性的项目",
    "👈 接口居然支持实时流式传输！做聊天机器人体验感拉满",
    "👈 开发者友好型API，自带用量统计面板和异常报警功能",
    "👈 中文语境优化太强了！比直接用官方接口的语义理解更本土化",
    "👈 能调用到某些官网没有的垂直领域小模型，做细分市场神器",
    "👈 自动扩容功能超实用！流量突然暴涨时也不会服务中断"
  ],

        INTERVALS: {
            PAGE_LOAD: 5000,      // 页面加载等待
            AFTER_LIKE: 3000,     // 点赞后等待
            AFTER_OPEN: 4000,     // 打开笔记后等待
            BEFORE_COMMENT: 2500,  // 点击评论框前等待
            BEFORE_SEND: 2000,     // 发送前等待
            AFTER_SEND: 1800000     // 发送后等待10分钟
        },
        MAX_RETRY: 3              // 最大重试次数
    };

    // 创建控制面板
    const panel = document.createElement('div');
    Object.assign(panel.style, {
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        zIndex: 9999,
        background: 'white',
        padding: '15px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    });

    // 主按钮样式
    const mainBtnStyle = {
        width: '160px',
        margin: '8px 0',
        padding: '12px 10px',
        backgroundColor: '#ff2442',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center'
    };

    // 一键评论主按钮
    const commentBtn = document.createElement('button');
    commentBtn.textContent = '💬 一键评论';
    Object.assign(commentBtn.style, mainBtnStyle);

    // 状态指示灯
    const statusLight = document.createElement('div');
    Object.assign(statusLight.style, {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: '#ccc',
        marginTop: '8px'
    });

    // 进度显示
    const progressText = document.createElement('div');
    Object.assign(progressText.style, {
        fontSize: '12px',
        color: '#666',
        marginTop: '8px',
        textAlign: 'center',
        minHeight: '36px',
        width: '160px'
    });

    // 倒计时显示
    const countdownText = document.createElement('div');
    Object.assign(countdownText.style, {
        fontSize: '11px',
        color: '#ff2442',
        marginTop: '4px',
        fontWeight: 'bold',
        width: '160px',
        textAlign: 'center'
    });

    // 组装面板
    panel.append(commentBtn, statusLight, progressText, countdownText);
    document.body.appendChild(panel);

    // 核心功能类
    class AIAssistant {
        constructor() {
            this.filteredContents = [];
            this.isRunning = false;
            this.currentIndex = 0;
            this.retryCount = 0;
            this.countdownInterval = null;
            this.observer = null;
            this.usedMessages = [];
            this.autoRestart = false; // 新增自动重启标志
        }

        resetState() {
            this.filteredContents = [];
            this.isRunning = false;
            this.currentIndex = 0;
            this.retryCount = 0;
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            countdownText.textContent = '';
        }

        // 获取带随机表情的评论
        getRandomMessage() {
            if (this.usedMessages.length >= CONFIG.PROMOTION_MESSAGES.length) {
                this.usedMessages = [];
            }

            const availableMessages = CONFIG.PROMOTION_MESSAGES.filter(
                msg => !this.usedMessages.includes(msg)
            );

            let randomMsg = availableMessages[
                Math.floor(Math.random() * availableMessages.length)
            ];

            // 随机插入1-3个表情
            const emojiCount = Math.min(3, 1 + Math.floor(Math.random() * 2));
            const usedEmojis = new Set();

            for (let i = 0; i < emojiCount; i++) {
                let randomEmoji;
                do {
                    randomEmoji = CONFIG.EMOJI_LIST[
                        Math.floor(Math.random() * CONFIG.EMOJI_LIST.length)
                    ];
                } while (usedEmojis.has(randomEmoji));

                usedEmojis.add(randomEmoji);

                const insertPos = Math.floor(
                    Math.random() * randomMsg.length
                );
                randomMsg = [
                    randomMsg.slice(0, insertPos),
                    randomEmoji,
                    randomMsg.slice(insertPos)
                ].join('');
            }

            this.usedMessages.push(randomMsg);
            return randomMsg;
        }

        // 增强型关键词匹配
        matchAIKeywords(text) {
            const cleanText = text.toLowerCase()
                .replace(/\s/g, '')
                .normalize('NFKC');
            return CONFIG.AI_KEYWORDS.some(kw => cleanText.includes(kw));
        }

        // 等待函数（带倒计时）
        async wait(ms, showCountdown = false) {
            if (showCountdown) {
                return new Promise(resolve => {
                    let remaining = Math.ceil(ms / 1000);
                    const updateCountdown = () => {
                        // 计算分钟和秒数
                        const minutes = Math.floor(remaining / 60);
                        const seconds = remaining % 60;
                        // 格式化为mm:ss，确保两位数显示
                        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        countdownText.textContent = `等待 ${formattedTime}后继续...`;
                        remaining--;

                        if (remaining < 0) {
                            clearInterval(this.countdownInterval);
                            countdownText.textContent = '';
                            resolve();
                        }
                    };

                    updateCountdown();
                    this.countdownInterval = setInterval(updateCountdown, 1000);
                });
            }
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // 简化点击操作
        async simpleClick(element) {
            if (!element) throw new Error('元素不存在');

            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.wait(500);
            element.click();
        }

        // 获取内容(解决SPA问题)
        async getContents() {
            return new Promise(resolve => {
                const sections = [...document.querySelectorAll('section')];
                if (sections.length > 0) {
                    resolve(sections);
                    return;
                }

                // 使用MutationObserver监听内容变化
                this.observer = new MutationObserver(mutations => {
                    const newSections = [...document.querySelectorAll('section')];
                    if (newSections.length > 0) {
                        this.observer.disconnect();
                        resolve(newSections);
                    }
                });

                this.observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // 超时处理
                setTimeout(() => {
                    this.observer.disconnect();
                    resolve([...document.querySelectorAll('section')]);
                }, CONFIG.INTERVALS.PAGE_LOAD);
            });
        }

        // 带重试的点击操作
        async reliableClick(selector, context = document) {
            let retry = 0;
            while (retry < CONFIG.MAX_RETRY) {
                try {
                    const element = context.querySelector(selector);
                    if (!element) throw new Error(`元素未找到: ${selector}`);

                    await this.simpleClick(element);
                    return true;
                } catch (error) {
                    retry++;
                    GM_log(`点击重试 ${retry}/${CONFIG.MAX_RETRY}: ${error}`);
                    await this.wait(2000 + retry * 1000);

                    // 尝试关闭可能遮挡的弹窗
                    await this.closeModal();
                }
            }
            throw new Error(`点击失败: ${selector}`);
        }

        // 执行点赞操作
        async performLike(item) {
            try {
                const likeBtn = item.querySelector('.like-lottie');
                if (likeBtn) {
                    await this.simpleClick(likeBtn);
                    await this.wait(CONFIG.INTERVALS.AFTER_LIKE);
                    return true;
                }
                return false;
            } catch (error) {
                GM_log(`点赞失败: ${error}`);
                return false;
            }
        }

        // 关闭所有模态框
        async closeModal() {
            const modals = [
                '.note-detail-mask .close-mask-dark',
                '.modal-close-button',
                '.dialog-close',
                '.close-btn'
            ];

            for (const selector of modals) {
                const closeBtn = document.querySelector(selector);
                if (closeBtn) {
                    try {
                        await this.simpleClick(closeBtn);
                        await this.wait(1000);
                    } catch (error) {
                        GM_log(`关闭弹窗失败: ${error}`);
                    }
                }
            }
        }

        // 确保回到列表视图
        async ensureListView() {
            await this.closeModal();

            // 检查是否在列表页
            const inListView = document.querySelector('section') &&
                              !document.querySelector('.note-detail-mask');
            if (!inListView) {
                // 尝试返回
                const backBtn = document.querySelector('.back-button, .close-btn');
                if (backBtn) {
                    await this.simpleClick(backBtn);
                    await this.wait(CONFIG.INTERVALS.PAGE_LOAD);
                } else {
                    // 刷新页面作为最后手段
                    window.location.reload();
                    await this.wait(CONFIG.INTERVALS.PAGE_LOAD);
                }
            }
        }

        // 等待元素出现
        async waitForElement(selector, timeout = 10000) {
            const start = Date.now();
            return new Promise((resolve, reject) => {
                const check = () => {
                    const el = document.querySelector(selector);
                    if (el) return resolve(el);
                    if (Date.now() - start > timeout) {
                        return reject(new Error(`等待元素超时: ${selector}`));
                    }
                    setTimeout(check, 500);
                };
                check();
            });
        }

        // 执行单条评论流程（新增点赞步骤）
        async processSingleItem(item) {
            try {
                // 1. 确保回到列表页
                await this.ensureListView();

                // 2. 滚动到目标位置
                progressText.textContent = `处理中 ${this.currentIndex + 1}/${this.filteredContents.length}`;
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.wait(1500);

                // 3. 执行点赞
                await this.performLike(item);

                // 4. 点击封面(使用重试机制)
                await this.reliableClick('.cover', item);
                await this.wait(CONFIG.INTERVALS.AFTER_OPEN);

                // 5. 点击评论框
                await this.reliableClick('.note-detail-mask .engage-bar-container .input-box span');
                await this.wait(CONFIG.INTERVALS.BEFORE_COMMENT);

                // 6. 输入随机评论内容
                const textarea = await this.waitForElement('.note-detail-mask .interactions .engage-bar .content-input');
                const randomMessage = this.getRandomMessage();
                textarea.innerHTML = randomMessage;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                await this.wait(CONFIG.INTERVALS.BEFORE_SEND);

                // 7. 发送评论
                const sendBtn = await this.waitForElement('.note-detail-mask .interactions .engage-bar button');
                sendBtn.disabled = false;
                await this.simpleClick(sendBtn);

                // 8. 关闭弹窗
                await this.wait(1000);
                await this.closeModal();

                return true;
            } catch (error) {
                GM_notification({
                    title: `第 ${this.currentIndex + 1} 条处理失败`,
                    text: error.message,
                    timeout: 5000
                });
                return false;
            }
        }

        // 滚动页面并重新开始
        async scrollAndRestart() {
            // 向下滚动1000px
            window.scrollBy({
                top: 1000,
                behavior: 'smooth'
            });

            await this.wait(3000); // 等待滚动完成

            // 重置状态并重新开始
            this.resetState();
            this.startAutoComment();
        }

        // 主流程控制
        async startAutoComment() {
            if (this.isRunning) return;
            this.resetState();
            this.isRunning = true;
            commentBtn.disabled = true;
            statusLight.style.backgroundColor = '#ffeb3b';

            try {
                // 1. 获取内容
                progressText.textContent = '正在加载内容...';
                const sections = await this.getContents();

                this.filteredContents = sections
                    .map(section => ({
                        section,
                        title: section.querySelector('.footer .title span')?.innerHTML || '',
                        like: section.querySelector('.like-wrapper svg use')?.getAttribute('xlink:href') === '#like'
                    }))
                    .filter(({title, like}) => this.matchAIKeywords(title) && like === true);

                if (this.filteredContents.length === 0) {
                    progressText.textContent = '未找到AI相关内容';
                    statusLight.style.backgroundColor = '#f44336';

                    // 如果没有找到内容，滚动并重新开始
                    if (this.autoRestart) {
                        await this.scrollAndRestart();
                    }
                    return;
                }

                // 2. 开始处理
                commentBtn.textContent = `📤 评论中 (${this.filteredContents.length})`;
                statusLight.style.backgroundColor = '#4caf50';

                // 3. 循环处理每条内容
                while (this.currentIndex < this.filteredContents.length) {
                    const success = await this.processSingleItem(
                        this.filteredContents[this.currentIndex].section
                    );

                    if (success) {
                        this.currentIndex++;
                        this.retryCount = 0;

                        // 最后一条不等待
                        if (this.currentIndex < this.filteredContents.length) {
                            await this.wait(CONFIG.INTERVALS.AFTER_SEND, true);
                        }
                    } else {
                        this.retryCount++;
                        if (this.retryCount > CONFIG.MAX_RETRY) {
                            this.currentIndex++;
                            this.retryCount = 0;
                        }
                        await this.wait(5000);
                    }
                }

                // 4. 完成处理
                progressText.textContent = `已完成 ${this.filteredContents.length} 条评论`;
                statusLight.style.backgroundColor = '#4caf50';
                GM_notification({
                    title: '小红书自动评论完成',
                    text: `成功评论 ${this.currentIndex} 条内容`,
                    timeout: 5000
                });

                // 5. 如果启用了自动重启，则滚动并重新开始
                if (this.autoRestart) {
                    await this.scrollAndRestart();
                }

            } catch (error) {
                console.error('主流程出错:', error);
                progressText.textContent = '出错: ' + error.message;
                statusLight.style.backgroundColor = '#f44336';
                GM_notification({
                    title: '自动评论出错',
                    text: error.message,
                    timeout: 5000
                });
            } finally {
                if (!this.autoRestart) {
                    this.isRunning = false;
                    commentBtn.disabled = false;
                    commentBtn.textContent = '💬 一键评论';
                    countdownText.textContent = '';
                }
            }
        }
    }

    // 初始化助手
    const assistant = new AIAssistant();

    // 事件监听
    commentBtn.addEventListener('click', () => {
        assistant.autoRestart = true; // 启用自动重启
        assistant.startAutoComment();
    });

    // 添加悬浮效果
    commentBtn.addEventListener('mouseenter', () => {
        commentBtn.style.transform = 'scale(1.05)';
        commentBtn.style.boxShadow = '0 6px 16px rgba(255,36,66,0.3)';
    });

    commentBtn.addEventListener('mouseleave', () => {
        commentBtn.style.transform = 'scale(1)';
        commentBtn.style.boxShadow = 'none';
    });
})();