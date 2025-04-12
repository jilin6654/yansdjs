// ==UserScript==
// @name         B站AI视频一键评论自动切换
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  一键评论后自动点赞、等待并切换到下一个AI相关视频
// @author       YourName
// @match        https://www.bilibili.com/video/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 配置对象
    const config = {
        commentInterval: 30,     // 评论间隔时间(分钟)
        minViewers: 10,         // 最低在线人数要求
        lowViewersDelay: 5,     // 在线人数不足时的等待时间(秒)
        scrollDelay: 20000,     // 滚动到底部后的等待时间(毫秒) - 20秒
        likeDelay: 1000,        // 点赞后的等待时间(毫秒)
        commentDelay: 2000,     // 评论后的等待时间(毫秒)
        randomScrollInterval: 60000, // 随机滚动间隔时间(毫秒) - 1分钟
        randomScrollAmount: 200  // 随机滚动幅度(像素)
    };

    // 评论内容数组
    const comments = [
        "👈最近发现个超好用的ai工具，gemini、grok-3、claude、deepseek、mj绘图全都能用，超方便～",
        "👈不用再到处切换ai工具了！这里gemini、grok-3、claude、deepseek还有mj绘图都能用，超省事～",
        "👈分享个宝藏！可以同时用gemini、grok-3、claude、deepseek，还能玩mj绘图，真心推荐～",
        "👈终于不用在多个ai工具间来回切换了！gemini、grok-3、claude、deepseek和mj绘图这里都有～",
        "👈发现个超实用的ai工具，gemini、grok-3、claude、deepseek、mj绘图都能用，体验很棒～",
        "👈最近在用的这个太方便了，gemini、grok-3、claude、deepseek、mj绘图全都有，爱了爱了～",
        "👈找到个超棒的！gemini、grok-3、claude、deepseek和mj绘图都能用，省了不少事～",
        "👈推荐这个！gemini、grok-3、claude、deepseek、mj绘图都能用，用着很顺手～",
        "👈用了这个后真的回不去了，gemini、grok-3、claude、deepseek、mj绘图全都有，太方便了～",
        "👈最近发现的这个真心不错，gemini、grok-3、claude、deepseek、mj绘图都能用，安利给大家～",
        "👈分享一个我最近常用的，gemini、grok-3、claude、deepseek、mj绘图都在这里啦～",
        "👈这个真的解决了我很多问题，gemini、grok-3、claude、deepseek、mj绘图都能用，超实用～",
        "👈强烈推荐！gemini、grok-3、claude、deepseek、mj绘图全都有，用着特别顺手～"
    ];

    let countdownInterval = null;
    let countdownElement = null;
    let remainingTime = 0;
    let isProcessing = false;
    let randomScrollInterval = null;

    // 延迟函数
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 随机滚动函数
    function randomScroll() {
        const currentScroll = window.scrollY;
        const scrollDirection = Math.random() > 0.5 ? 1 : -1; // 随机决定向上或向下滚动
        const scrollAmount = Math.floor(Math.random() * config.randomScrollAmount) * scrollDirection;
        const newScroll = Math.max(0, currentScroll + scrollAmount);

        window.scrollTo({
            top: newScroll,
            behavior: 'smooth'
        });
        console.log(`随机滚动: ${scrollAmount > 0 ? '向下' : '向上'} ${Math.abs(scrollAmount)}px`);
    }

    // 开始随机滚动
    function startRandomScroll() {
        stopRandomScroll();
        randomScroll(); // 立即执行一次
        randomScrollInterval = setInterval(randomScroll, config.randomScrollInterval);
    }

    // 停止随机滚动
    function stopRandomScroll() {
        if (randomScrollInterval) {
            clearInterval(randomScrollInterval);
            randomScrollInterval = null;
        }
    }

    // 创建功能按钮和在线人数显示
    function createCommentButton() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.right = '20px';
        container.style.top = '50%';
        container.style.transform = 'translateY(-50%)';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'flex-end';
        container.style.gap = '10px';

        // 创建一键评论按钮
        const commentButton = document.createElement('button');
        commentButton.textContent = '一键评论';
        commentButton.style.padding = '10px 15px';
        commentButton.style.backgroundColor = '#fb7299';
        commentButton.style.color = 'white';
        commentButton.style.border = 'none';
        commentButton.style.borderRadius = '20px';
        commentButton.style.cursor = 'pointer';
        commentButton.style.fontSize = '14px';
        commentButton.style.fontWeight = 'bold';
        commentButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        commentButton.style.transition = 'all 0.3s';

        // 鼠标悬停效果
        commentButton.addEventListener('mouseover', () => {
            commentButton.style.backgroundColor = '#ff85ad';
            commentButton.style.transform = 'scale(1.05)';
        });
        commentButton.addEventListener('mouseout', () => {
            commentButton.style.backgroundColor = '#fb7299';
            commentButton.style.transform = 'scale(1)';
        });

        // 点击事件 - 一键评论
        commentButton.addEventListener('click', async () => {
            if (!isProcessing) {
                isProcessing = true;
                commentButton.textContent = '执行中...';
                await processVideo();
                commentButton.textContent = '一键评论';
                isProcessing = false;
            }
        });

        // 创建手动评论按钮
        const manualCommentButton = document.createElement('button');
        manualCommentButton.textContent = '手动评论';
        manualCommentButton.style.padding = '10px 15px';
        manualCommentButton.style.backgroundColor = '#23ade5';
        manualCommentButton.style.color = 'white';
        manualCommentButton.style.border = 'none';
        manualCommentButton.style.borderRadius = '20px';
        manualCommentButton.style.cursor = 'pointer';
        manualCommentButton.style.fontSize = '14px';
        manualCommentButton.style.fontWeight = 'bold';
        manualCommentButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        manualCommentButton.style.transition = 'all 0.3s';

        // 鼠标悬停效果
        manualCommentButton.addEventListener('mouseover', () => {
            manualCommentButton.style.backgroundColor = '#4fc1e9';
            manualCommentButton.style.transform = 'scale(1.05)';
        });
        manualCommentButton.addEventListener('mouseout', () => {
            manualCommentButton.style.backgroundColor = '#23ade5';
            manualCommentButton.style.transform = 'scale(1)';
        });

        // 点击事件 - 手动评论
        manualCommentButton.addEventListener('click', async () => {
            if (!isProcessing) {
                isProcessing = true;
                manualCommentButton.textContent = '评论中...';
                await performComment();
                manualCommentButton.textContent = '手动评论';
                isProcessing = false;
            }
        });

        // 创建倒计时显示
        countdownElement = document.createElement('div');
        countdownElement.style.padding = '8px 12px';
        countdownElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        countdownElement.style.color = 'white';
        countdownElement.style.borderRadius = '12px';
        countdownElement.style.fontSize = '12px';
        countdownElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        countdownElement.style.display = 'none';
        countdownElement.innerHTML = '倒计时: 00:00:00';

        // 创建在线人数显示
        const onlineInfo = document.createElement('div');
        onlineInfo.style.padding = '8px 12px';
        onlineInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        onlineInfo.style.color = 'white';
        onlineInfo.style.borderRadius = '12px';
        onlineInfo.style.fontSize = '12px';
        onlineInfo.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';

        // 更新在线人数函数
        function updateOnlineInfo() {
            const onlineElement = document.querySelector('.bpx-player-video-info-online');
            if (onlineElement) {
                const onlineText = onlineElement.innerHTML;
                const onlineNumber = parseInt(onlineText.replace(/[^0-9]/g, ''));
                onlineInfo.innerHTML = `当前在线: ${onlineText} <span style="color:${onlineNumber > config.minViewers ? '#00ff00' : '#ff0000'}">(${onlineNumber > config.minViewers ? '满足条件' : '不满足条件'})</span>`;
                return onlineNumber;
            } else {
                onlineInfo.innerHTML = '在线人数: 获取中...';
                return 0;
            }
        }

        // 初始更新
        updateOnlineInfo();
        // 每1秒更新一次
        setInterval(updateOnlineInfo, 1000);

        // 添加到容器
        container.appendChild(commentButton);
        container.appendChild(manualCommentButton);
        container.appendChild(onlineInfo);
        container.appendChild(countdownElement);
        document.body.appendChild(container);
    }

    // 开始倒计时
    function startCountdown(minutes) {
        stopCountdown();
        remainingTime = minutes * 60;
        countdownElement.style.display = 'block';
        updateCountdownDisplay();

        countdownInterval = setInterval(() => {
            remainingTime--;
            updateCountdownDisplay();

            if (remainingTime <= 0) {
                stopCountdown();
            }
        }, 1000);
    }

    // 停止倒计时
    function stopCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        countdownElement.style.display = 'none';
    }

    // 更新倒计时显示
    function updateCountdownDisplay() {
        const hours = Math.floor(remainingTime / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        const seconds = remainingTime % 60;

        countdownElement.innerHTML = `下一个视频倒计时: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 滚动到页面底部
    function scrollToBottom() {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
        console.log('已滚动到页面底部');
    }

    // 查找匹配的视频
    function findMatchingPictureInRecList() {
        const keywords = ["deepseek", "claude", "cursor", "cline", "gpt"];
        const pictureElements = document.querySelectorAll('.rec-list .card-box picture');

        for (const picture of pictureElements) {
            const img = picture.querySelector('img');
            if (img && img.hasAttribute('alt')) {
                const altValue = img.getAttribute('alt').toLowerCase();
                if (keywords.some(keyword => altValue.includes(keyword.toLowerCase()))) {
                    return picture;
                }
            }
        }
        return null;
    }

    // 切换到下一个视频
    async function switchToNextVideo() {
        try {
            // 先尝试查找匹配的视频
            const nextVideopic = findMatchingPictureInRecList();

            if (nextVideopic) {
                nextVideopic.click();
                console.log('切换到匹配的推荐视频');
                await delay(5000); // 等待5秒让页面加载
                return true;
            }

            // 如果没有匹配的视频，尝试查找常规的下一个视频
            const nextVideo = document.querySelector('.siglep-active')?.parentNode?.parentNode?.nextElementSibling?.querySelector('.cover');
            if (nextVideo) {
                nextVideo.click();
                console.log('切换到常规的下一个视频');
                await delay(5000); // 等待5秒让页面加载
                return true;
            }

            console.log('没有找到下一个视频');
            return false;
        } catch (e) {
            console.error('切换视频时出错:', e);
            return false;
        }
    }

    // 检查是否已经点赞
    function isVideoLiked() {
        try {
            const dz = document.querySelectorAll('div[title="点赞（Q）"]')[0];
            return dz && dz.classList.contains("on");
        } catch (e) {
            console.error('检查点赞状态时出错:', e);
            return false;
        }
    }

    // 执行评论操作
    async function performComment() {
        // 随机选择评论
        const randomComment = comments[Math.floor(Math.random() * comments.length)];
        
        // 滚动到页面底部
        scrollToBottom();
        console.log(`等待${config.scrollDelay/1000}秒让页面加载...`);
        // 评论
        await sendComment(randomComment);
    }

    // 处理视频的完整流程
    async function processVideo() {
        const onlineNumber = getOnlineNumber();

        if (onlineNumber > config.minViewers) {
            // 检查是否已经点赞
            const alreadyLiked = isVideoLiked();

            if (alreadyLiked) {
                console.log('视频已经点赞过，直接切换到下一个视频');
                await switchToNextVideo();
                await processVideo(); // 继续处理下一个视频
                return;
            }

            await performComment();

            console.log(`评论和点赞完成，等待${config.commentInterval}分钟后切换到下一个视频`);

            // 设置间隔时间后切换到下一个视频
            startCountdown(config.commentInterval);
            startRandomScroll(); // 开始随机滚动

            await delay(config.commentInterval * 60 * 1000); // 等待指定分钟

            stopRandomScroll(); // 停止随机滚动
            await switchToNextVideo();
            await processVideo(); // 继续处理下一个视频
        } else {
            console.log(`在线人数${onlineNumber}不足${config.minViewers}人，${config.lowViewersDelay}秒后切换到下一个视频`);

            await delay(config.lowViewersDelay * 1000); // 等待指定秒数
            await switchToNextVideo();
            await processVideo(); // 继续处理下一个视频
        }
    }

    // 获取在线人数
    function getOnlineNumber() {
        const onlineElement = document.querySelector('.bpx-player-video-info-online');
        if (onlineElement) {
            const onlineText = onlineElement.innerHTML;
            return parseInt(onlineText.replace(/[^0-9]/g, ''));
        }
        return 0;
    }

    // 点赞视频
    async function likeVideo() {
        try {
            const dz = document.querySelectorAll('div[title="点赞（Q）"]')[0];
            if (dz && !dz.classList.contains("on")) {
                dz.click();
                console.log('点赞成功');
                await delay(config.likeDelay);
            } else if (dz && dz.classList.contains("on")) {
                console.log('视频已经点赞过');
            }
        } catch (e) {
            console.error('点赞时出错:', e);
        }
    }

    // 检查评论区是否加载完成
    async function waitForCommentSection() {
        const maxAttempts = 10;
        const interval = 1000;

        for (let i = 0; i < maxAttempts; i++) {
            const commentSection = document.querySelector('bili-comments');
            if (commentSection) {
                const inputElement = commentSection.shadowRoot?.querySelector('bili-comments-header-renderer')
                    ?.shadowRoot?.querySelector('bili-comment-box')
                    ?.shadowRoot?.querySelector('bili-comment-rich-textarea')
                    ?.shadowRoot?.querySelector('#input .brt-root .brt-editor');

                if (inputElement) {
                    return true;
                }
            }
            await delay(interval);
            console.log(`等待评论区加载...尝试 ${i+1}/${maxAttempts}`);
        }
        return false;
    }

    // 发送评论函数
    async function sendComment(comment) {
        try {
            // 先等待评论区加载完成
            const isLoaded = await waitForCommentSection();
            if (!isLoaded) {
                console.log('评论区加载超时，无法发表评论');
                return;
            }

            // 获取评论输入框
            const commentSection = document.querySelector('bili-comments');
            const inputElement = commentSection.shadowRoot.querySelector('bili-comments-header-renderer')
                .shadowRoot.querySelector('bili-comment-box')
                .shadowRoot.querySelector('bili-comment-rich-textarea')
                .shadowRoot.querySelector('#input .brt-root .brt-editor');

            if (inputElement) {

                inputElement.click()

                // 设置评论内容
                inputElement.innerText = comment;

                // 触发输入事件
                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                inputElement.dispatchEvent(inputEvent);

                await delay(500);

                // 获取发布按钮并点击
                const publishButton = commentSection.shadowRoot.querySelector('bili-comments-header-renderer')
                    .shadowRoot.querySelector('bili-comment-box')
                    .shadowRoot.querySelector('#pub button');

                if (publishButton) {
                    //publishButton.click();
                    console.log('评论发表成功');
                    await delay(config.commentDelay);
                } else {
                    alert('无法找到发布按钮')
                }
            } else {
                alert('无法找到评论输入框');
            }
        } catch (e) {
            alert('评论时出错:', e);
        }
    }

    // 页面加载完成后添加按钮和在线人数显示
    window.addEventListener('load', createCommentButton);
})();
