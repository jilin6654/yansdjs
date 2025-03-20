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
                const nextVideopic = findMatchingPictureInRecList();
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

function findMatchingPictureInRecList() {
    // 定义要匹配的关键词
    const keywords = ["deepseek", "claude", "cursor", "cline", "gpt"];

    // 获取所有 .rec-list .card-box 下的 picture 标签
    const pictureElements = document.querySelectorAll('.rec-list .card-box picture');

    // 遍历每个 picture 标签
    for (const picture of pictureElements) {
        // 获取当前 picture 标签中的 img 标签
        const img = picture.querySelector('img');

        // 检查 img 是否存在且包含 alt 属性
        if (img && img.hasAttribute('alt')) {
            // 获取 alt 属性值并转换为小写
            const altValue = img.getAttribute('alt').toLowerCase();

            // 判断 alt 是否包含任意关键词
            if (keywords.some(keyword => altValue.includes(keyword.toLowerCase()))) {
                // 如果匹配成功，返回该 picture 标签
                return picture;
            }
        }
    }

    // 如果没有匹配到，返回 null
    return null;
}

    //判断评论是否包含烟神殿
    function hasUserName(thread) {
    // 获取所有评论标签
    const replyElements = thread.shadowRoot
        ?.querySelector('bili-comment-replies-renderer')
        ?.shadowRoot.querySelectorAll('bili-comment-reply-renderer');

    // 如果没有找到评论标签，直接返回 false
    if (!replyElements) {
        return false;
    }

    // 遍历每一个评论标签
    for (const item of replyElements) {
        // 获取用户名
        const userName = item.shadowRoot
            ?.querySelector('bili-comment-user-info')
            ?.shadowRoot.querySelector('#user-name a')?.innerText;

        // 检查用户名是否包含“烟神殿”
        if (userName && userName.includes("烟神殿")) {
            return true; // 如果找到匹配的用户名，返回 true
        }
    }

    // 如果所有评论都不包含目标用户名，返回 false
    return false;
}

    //发表回复
   function postCall(thread) {
    // 确保传入的 thread 对象存在
    if (!thread) {
        console.error('Thread is null or undefined');
        return false;
    }

    // 定位文本域
    const textArea = thread.shadowRoot
        ?.querySelector('#reply-container bili-comment-box')
        ?.shadowRoot.querySelector('bili-comment-rich-textarea')?.shadowRoot?.querySelector('.brt-editor');

    // 检查文本域是否存在
    if (!textArea) {
        console.error('Text area not found');
        return false;
    }
          // 向文本域输入内容
        textArea.innerHTML = '[打call][打call][打call]';
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        textArea.dispatchEvent(inputEvent);


    // 定位发布按钮
    const publishButton = thread.shadowRoot
        ?.querySelector('#reply-container bili-comment-box')
        ?.shadowRoot?.querySelector('#pub button');

    // 检查发布按钮是否存在
    if (!publishButton) {
        console.error('Publish button not found');
        return false;
    }

    // 点击发布按钮
    publishButton.click();

    // 返回成功状态
    return true;
}

   async function clickFFButtons(threads) {
       const ffButtons = []
       //循环点赞评论回复，不回复up主
        for (let thread of threads) {
            let ff = thread.shadowRoot
                ?.querySelector('bili-comment-renderer')
                ?.shadowRoot.querySelector('bili-comment-action-buttons-renderer')
                ?.shadowRoot.querySelector("#like button");
            let replyBtn = thread.shadowRoot
                ?.querySelector('bili-comment-renderer')
                ?.shadowRoot.querySelector('bili-comment-action-buttons-renderer')
                ?.shadowRoot.querySelector("#reply button");
            // 判断是否是up主
            let uinfo = thread.shadowRoot
                ?.querySelector('bili-comment-renderer')?.shadowRoot.querySelector('bili-comment-user-info')?.shadowRoot.querySelector('#user-up');

            if (ff && uinfo == null) {
                let biliIcon = ff.querySelector('bili-icon');
                if (biliIcon?.getAttribute('style') === '') {
                    biliIcon.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    biliIcon.click();
                    await new Promise(resolve => setTimeout(resolve, 600));
                    if(!hasUserName(thread)){
                        //点击回复按钮
                        replyBtn.click();
                         await new Promise(resolve => setTimeout(resolve, 500));
                        //等待0.5秒后进行回复
                        postCall(thread)
                    }
                }
            }
        }
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
