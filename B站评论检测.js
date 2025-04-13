// ==UserScript==
// @name         B站评论区输入框检测工具（DOM结构输出版）
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  检测B站评论区输入框，并输出DOM结构到页面
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
            bottom: 10px;
            left: 10px;
            z-index: 9999;
            width: 90%;
            max-height: 50vh;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            line-height: 1.5;
            word-break: break-all;
        }
        .log-entry {
            margin-bottom: 8px;
            border-bottom: 1px solid #444;
            padding-bottom: 8px;
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
        .dom-tree {
            color: #d1d1d1;
            margin-left: 10px;
            white-space: pre-wrap;
        }
        .toggle-dom {
            color: #5ac8fa;
            cursor: pointer;
            text-decoration: underline;
        }
    `);

    // 创建调试控制台
    const debugConsole = document.createElement('div');
    debugConsole.id = 'debug-console';
    debugConsole.innerHTML = '<h4 style="margin-top:0;color:#fff;">B站输入框检测日志</h4>';
    document.body.appendChild(debugConsole);

    // 日志函数
    function addLog(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.textContent = message;
        debugConsole.appendChild(logEntry);
        debugConsole.scrollTop = debugConsole.scrollHeight;
    }

    // 输出DOM树函数
    function dumpDOM(element, depth = 0) {
        if (!element) return '';
        let prefix = ' '.repeat(depth * 2);
        let result = `${prefix}<${element.tagName.toLowerCase()}`;
        
        // 添加id/class信息
        if (element.id) result += ` id="${element.id}"`;
        if (element.className && typeof element.className === 'string') {
            result += ` class="${element.className}"`;
        }
        result += '>\n';

        // 处理子节点
        if (element.shadowRoot) {
            result += `${prefix}  #shadow-root\n`;
            result += dumpDOM(element.shadowRoot.firstChild, depth + 2);
        } else {
            for (let child of element.children) {
                result += dumpDOM(child, depth + 1);
            }
        }
        return result;
    }

    // 创建检测按钮
    const btn = document.createElement('button');
    btn.id = 'check-comment-btn';
    btn.textContent = '检测评论输入框';
    document.body.appendChild(btn);

    // 按钮点击事件
    btn.addEventListener('click', () => {
        debugConsole.innerHTML = '<h4 style="margin-top:0;color:#fff;">B站输入框检测日志</h4>';
        addLog('=== 开始检测B站评论区输入框 ===', 'info');

        // 1. 检查顶层 bili-comments
        const commentSection = document.querySelector('bili-comments');
        if (!commentSection) {
            addLog('❌ 未找到 bili-comments 元素', 'error');
            return;
        }
        addLog('✅ 找到 bili-comments', 'success');

        // 2. 检查第一层 Shadow DOM
        const headerRenderer = commentSection.shadowRoot?.querySelector('bili-comments-header-renderer');
        if (!headerRenderer) {
            addLog('❌ 未找到 bili-comments-header-renderer', 'error');
            return;
        }
        addLog('✅ 找到 bili-comments-header-renderer', 'success');

        // 3. 检查第二层 Shadow DOM (重点检查这个)
        const commentBox = headerRenderer.shadowRoot?.querySelector('bili-comment-box');
        if (!commentBox) {
            addLog('❌ 未找到 bili-comment-box', 'error');
            return;
        }
        addLog('✅ 找到 bili-comment-box', 'success');
        
        // 输出commentBox的DOM结构
        const domTree = dumpDOM(commentBox);
        addLog('ℹ️ bili-comment-box的DOM结构:', 'info');
        
        const domEntry = document.createElement('div');
        domEntry.className = 'dom-tree';
        domEntry.textContent = domTree;
        debugConsole.appendChild(domEntry);

        // 4. 检查第三层 Shadow DOM
        const richTextarea = commentBox.shadowRoot?.querySelector('bili-comment-rich-textarea');
        if (!richTextarea) {
            addLog('❌ 未找到 bili-comment-rich-textarea', 'error');
            addLog('💡 请检查上方输出的DOM结构，确认元素是否存在', 'info');
            return;
        }
        addLog('✅ 找到 bili-comment-rich-textarea', 'success');

        // 5. 检查输入框
        const inputElement = richTextarea.shadowRoot?.querySelector('#input .brt-root .brt-editor');
        if (!inputElement) {
            addLog('❌ 未找到输入框 (#input .brt-root .brt-editor)', 'error');
            return;
        }
        addLog('✅ 找到输入框', 'success');

        // 高亮显示
        inputElement.classList.add('highlight-element');
        addLog('💡 输入框已高亮显示（红色虚线轮廓）', 'info');
        inputElement.click();
        addLog('🖱️ 已尝试聚焦到输入框', 'info');
    });
})();
