// ==UserScript==
// @name         B站视频上传助手
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  一键填写B站上传视频信息的助手
// @author       你的名字
// @match        https://member.bilibili.com/platform/upload/video/frame*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 创建按钮
    const button = document.createElement('button');
    button.innerText = '一键填写';
    button.style.position = 'fixed';
    button.style.top = '300px';
    button.style.right = '20px';
    button.style.zIndex = 9999;
    button.style.padding = '10px 20px';
    button.style.backgroundColor = '#ff5722';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    document.body.appendChild(button);

    // 按钮点击事件
    button.addEventListener('click', async () => {
        try {
            // 简介自动填写
            const inputElement = document.querySelector('.desc-container .ql-editor p');
            if (inputElement) {
                inputElement.innerHTML = `看这里：
1. 视频用到的字幕翻译工具为烟神殿字幕工具
2. 视频翻译使用的大模型API是烟神殿API中转 yansd666.top，这个中转平台从 2024 年 1 月稳定运行至今,目前已经上线了200多种模型，包括Claude，Deepseek，GPT，千问等，绝对靠谱，主要是价格还良心，注册送 0.4 刀白嫖额度。`;
                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                inputElement.dispatchEvent(inputEvent);
            } else {
                console.log('未找到简介输入框');
            }
            await new Promise(resolve => setTimeout(resolve, 200)); // 等待 1 秒
            // 选择 AISeek 作为默认合集
            document.querySelector('.video-season-content .season-enter').click();
            await new Promise(resolve => setTimeout(resolve, 200)); // 等待 1 秒
            Array.from(document.querySelectorAll('.season-content .season-item p')).find(p => p.textContent.trim() === 'AISeek').click();
            await new Promise(resolve => setTimeout(resolve, 200)); // 等待 1 秒
            // 选择创作者声明
            document.querySelector('.setting-label .select-controller .select-item-cont').click();
            await new Promise(resolve => setTimeout(resolve, 200)); // 等待 1 秒
            document.querySelectorAll('.mark-list .mark-item')[document.querySelectorAll('.mark-list .mark-item').length - 1].click()
            await new Promise(resolve => setTimeout(resolve, 200)); // 等待 1 秒
            // 勾选杜比音效和无损音质
            document.querySelectorAll('.bcc-checkbox-label span').forEach(el => {
                if (el.textContent.includes('音')) {
                    el.click();
                }
            });
            await new Promise(resolve => setTimeout(resolve, 200)); // 等待1秒
            //清除标签
            let arr = document.querySelectorAll('.input-container .tag-pre-wrp .label-item-v2-container');
            for(let i=0;i<arr.length;i++){
                arr[0].click()
                await new Promise(resolve => setTimeout(resolve, 200)); // 等待1秒
            }
           //添加标签
            const labelArr = ["人工智能","Deepseek","Cursor","OpenAI","Cline","Claude3.7","教程","Manus","Grok3"]
            let labelInput = document.querySelectorAll('.input-container .input-instance input')[1];
            for (const label of labelArr) {
                labelInput.value = label; // 填写当前标签
                labelInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true })); // 模拟回车事件
                await new Promise(resolve => setTimeout(resolve, 200)); // 等待1秒
            }

            console.log('一键填写完成！');
        } catch (error) {
            console.error('执行过程中出现错误：', error);
        }
    });
})();
