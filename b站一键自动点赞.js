// ==UserScript==
// @name         B站一键自动点赞
// @namespace    https://example.com
// @version      1.4
// @description  在哔哩哔哩页面添加一键自动点赞功能，并添加停止点赞的功能
// @author       Your Name
// @match        *://www.bilibili.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 创建一键自动点赞按钮
    const button = document.createElement('button');
    button.textContent = '一键自动点赞';
    button.style.position = 'fixed';
    button.style.top = '40%';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.padding = '10px 20px';
    button.style.backgroundColor = '#00a1d6';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    button.style.fontSize = '16px';

    document.body.appendChild(button);

    // 创建停止点赞按钮
    const stopButton = document.createElement('button');
    stopButton.textContent = '停止点赞';
    stopButton.style.position = 'fixed';
    stopButton.style.top = '50%';
    stopButton.style.right = '10px';
    stopButton.style.zIndex = '9999';
    stopButton.style.padding = '10px 20px';
    stopButton.style.backgroundColor = '#ff4c4c';
    stopButton.style.color = '#fff';
    stopButton.style.border = 'none';
    stopButton.style.borderRadius = '5px';
    stopButton.style.cursor = 'pointer';
    stopButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    stopButton.style.fontSize = '16px';

    document.body.appendChild(stopButton);

    let isRunning = false;
    let stopRequested = false;

    const autoLike = async () => {
        try {
            while (!stopRequested) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 1 秒
                // 暂停视频播放
                document.querySelector('.bpx-player-ctrl-play').click()

                //切换评论到最新评论列表
                document.querySelector('bili-comments').shadowRoot.querySelector('bili-comments-header-renderer').shadowRoot.querySelectorAll('bili-text-button')[1].click();
                await new Promise(resolve => setTimeout(resolve, 2000));
               try{
               const dz = document.querySelectorAll('div[title="点赞（Q）"]')[0]
                if(!dz.classList.contains("on")){
                    dz.click();
                    const inputElement = document.querySelector('bili-comments')
                    .shadowRoot.querySelector('bili-comments-header-renderer')
                    .shadowRoot.querySelector('bili-comment-box')
                    .shadowRoot.querySelector('bili-comment-rich-textarea')
                    .shadowRoot.querySelector('#input .brt-root .brt-editor');

                    inputElement.innerHTML = "支持 早日火！！";

                    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                    inputElement.dispatchEvent(inputEvent);
                    document.querySelector('bili-comments')
                .shadowRoot.querySelector('bili-comments-header-renderer')
                .shadowRoot.querySelector('bili-comment-box')
                .shadowRoot.querySelector('#pub button').click();
                }
               }catch{
               console.log('跳过点赞')
               }

                //先滚动到底部获取评论区
               let cms = await scrollToBottomAndCheck();
                //循环点击评论

                await clickFFButtons(cms);

                // 滚动到页面顶部
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });

                // 等待 5 秒加载页面
                await new Promise(resolve => setTimeout(resolve, 3000));

                // 跳转到合集中的下一个视频
                const nextVideo = document.querySelector('.video-pod__list div[data-scrolled="true"]')?.nextElementSibling;

                //获取下一个视频
                const nextVideopic = document.querySelector('.rec-list .card-box picture');
                if (nextVideo && nextVideo.querySelector('.single-p .title-txt')) {
                    nextVideo.querySelector('.single-p .title-txt').click();
                } else if(nextVideopic){
                nextVideopic.click();
                }
                else {
                    console.error('无法找到下一个视频，自动点赞停止');
                    isRunning = false;
                    break;
                }
            }
        } catch (error) {
            console.error('发生错误:', error);
        } finally {
            isRunning = false;
            stopRequested = false;
        }
    };

    async function scrollToBottomAndCheck() {
    let previousScrollHeight = 0;

    while (true) {
        // 滚动到底部
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });

        // 等待2秒
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 获取评论列表和滚动高度
        const comments = document.querySelector('bili-comments').shadowRoot.querySelectorAll('bili-comment-thread-renderer');
        const currentScrollHeight = document.documentElement.scrollHeight;

        // 判断条件：评论数量大于200或者已经滚动到底部
        if (comments.length > 500 || currentScrollHeight === previousScrollHeight) {
            return comments;
        }

        // 更新上一次的滚动高度
        previousScrollHeight = currentScrollHeight;
    }
}

   async function clickFFButtons(threads) {
       const ffButtons = []
        for (let thread of threads) {
            let ff = thread.shadowRoot
                ?.querySelector('bili-comment-renderer')
                ?.shadowRoot.querySelector('bili-comment-action-buttons-renderer')
                ?.shadowRoot.querySelector("#like button");
            // 判断是否是up主
            let uinfo = thread.shadowRoot
                ?.querySelector('bili-comment-renderer')?.shadowRoot.querySelector('bili-comment-user-info')?.shadowRoot.querySelector('#user-up');

            if (ff && uinfo == null) {
                let biliIcon = ff.querySelector('bili-icon');
                if (biliIcon?.getAttribute('style') === '') {
                    ffButtons.push(biliIcon);
                }
            }
        }
        for (let item of ffButtons) {
            if (stopRequested) break; // 检查停止请求
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            item.click();
            await new Promise(resolve => setTimeout(resolve, 600));
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
}

    // 一键自动点赞按钮点击事件
    button.addEventListener('click', () => {
        if (!isRunning) {
            isRunning = true;
            stopRequested = false;
            autoLike();
        }
    });

    // 停止点赞按钮点击事件
    stopButton.addEventListener('click', () => {
        if (isRunning) {
            stopRequested = true;
        }
    });
})();
