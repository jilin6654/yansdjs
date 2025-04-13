// ==UserScript==
// @name         B站评论区输入框检测工具（平板友好版）
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  检测B站评论区输入框的Shadow DOM结构，并在页面内显示结果
// @author       You
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/read/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 添加自定义样式
    GM_addStyle(`
        .highlight-element {
            outline: 3px dashed red !important;
            background-color: rgba(255, 0, 0, 0.2) !important;
        }
        #check-comment-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            padding: 8px 12px;
            background: #ff9500;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        #debug-console {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 9999;
            width: 300px;
            max-height: 200px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            line-height: 1.5;
        }
        .log-entry {
            margin-bottom: 5px;
            border-bottom: 1px solid #444;
            padding-bottom: 5px;
        }
        .log-error {
            color: #ff6b6b;
        }
        .log-success {
            color: #4cd97b;
        }
        .log-info {
            color: #5ac8fa;
        }
    `);

    // 创建调试控制台 DIV
    const debugConsole = document.createElement('div');
    debugConsole.id = 'debug-console';
    debugConsole.innerHTML = '<h4 style="margin-top:0;color:#fff;">B站输入框检测日志</h4>';
    document.body.appendChild(debugConsole);

    // 日志函数（替代 console.log）
    function addLog(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.textContent = message;
        debugConsole.appendChild(logEntry);
        debugConsole.scrollTop = debugConsole.scrollHeight; // 自动滚动到底部
    }

    // 创建检测按钮
    const btn = document.createElement('button');
    btn.id = 'check-comment-btn';
    btn.textContent = '检测评论输入框';
    document.body.appendChild(btn);

    // 按钮点击事件
    btn.addEventListener('click', () => {
        debugConsole.innerHTML = '<h4 style="margin-top:0;color:#fff;">B站输入框检测日志</h4>'; // 清空日志
        addLog('=== 开始检测B站评论区输入框 ===', 'info');

        // 1. 检查顶层 bili-comments
        const commentSection = document.querySelector('bili-comments');
        if (!commentSection) {
            addLog('❌ 未找到 bili-comments 元素', 'error');
            return;
        }
        addLog('✅ 找到 bili-comments', 'success');

        // 2. 检查第一层 Shadow DOM (bili-comments-header-renderer)
        const headerRenderer = commentSection.shadowRoot?.querySelector('bili-comments-header-renderer');
        if (!headerRenderer) {
            addLog('❌ 未找到 bili-comments-header-renderer', 'error');
            return;
        }
        addLog('✅ 找到 bili-comments-header-renderer', 'success');

        // 3. 检查第二层 Shadow DOM (bili-comment-box)
        const commentBox = headerRenderer.shadowRoot?.querySelector('bili-comment-box');
        if (!commentBox) {
            addLog('❌ 未找到 bili-comment-box', 'error');
            return;
        }
        addLog('✅ 找到 bili-comment-box', 'success');

       // 4. 检查第三层 Shadow DOM (bili-comment-rich-textarea)
        let richTextarea;
        try {
            richTextarea = commentBox.shadowRoot?.querySelector('bili-comment-rich-textarea');
            if (!richTextarea) {
                addLog('❌ 未找到 bili-comment-rich-textarea', 'error');
                return;
            }
            addLog('✅ 找到 bili-comment-rich-textarea', 'success');
        } catch (e) {
            addLog(`❌ 获取 bili-comment-rich-textarea 时出错: ${e.message}`, 'error');
            return; // 终止检测
        }
        addLog('✅ 找到 bili-comment-rich-textarea', 'success');

        // 5. 检查第四层 Shadow DOM (输入框 #input .brt-root .brt-editor)
        const inputElement = richTextarea.shadowRoot?.querySelector('#input .brt-root .brt-editor');
        if (!inputElement) {
            addLog('❌ 未找到输入框 (#input .brt-root .brt-editor)', 'error');
            return;
        }
        addLog('✅ 找到输入框', 'success');

        // 高亮显示输入框
        inputElement.classList.add('highlight-element');
        addLog('💡 输入框已高亮显示（红色虚线轮廓）', 'info');

        // 自动聚焦到输入框（可选）
        inputElement.click();
        addLog('🖱️ 已尝试聚焦到输入框', 'info');
    });
})();
