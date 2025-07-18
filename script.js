document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const passwordDisplay = document.getElementById('password');
    const copyBtn = document.getElementById('copy-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const generateBtn = document.getElementById('generate-btn');
    const lengthSlider = document.getElementById('length');
    const lengthValue = document.getElementById('length-value');
    const uppercaseCheckbox = document.getElementById('uppercase');
    const lowercaseCheckbox = document.getElementById('lowercase');
    const numbersCheckbox = document.getElementById('numbers');
    const symbolsCheckbox = document.getElementById('symbols');
    const excludeSimilarCheckbox = document.getElementById('exclude-similar');
    const excludeDuplicatesCheckbox = document.getElementById('exclude-duplicates');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const historyContainer = document.getElementById('history-container');
    const clearHistoryBtn = document.getElementById('clear-history');
    const themeToggle = document.getElementById('theme-toggle');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const closeModal = document.querySelector('.close');
    
    // 自动生成密码功能的元素
    const autoPasswordDisplay = document.getElementById('auto-password');
    const autoCopyBtn = document.getElementById('auto-copy-btn');
    const autoRefreshBtn = document.getElementById('auto-refresh-btn');
    const autoStrengthBar = document.getElementById('auto-strength-bar');
    const autoStrengthText = document.getElementById('auto-strength-text');
    const autoTimer = document.getElementById('auto-timer');

    // 定义字符集
    const charSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~'
    };

    // 相似字符
    const similarChars = 'il1Lo0O';

    // 密码历史记录
    let passwordHistory = JSON.parse(localStorage.getItem('passwordHistory')) || [];

    // 初始化
    initializeApp();

    // 事件监听器
    lengthSlider.addEventListener('input', updateLengthDisplay);
    generateBtn.addEventListener('click', generatePassword);
    refreshBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyPasswordToClipboard);
    clearHistoryBtn.addEventListener('click', clearHistory);
    themeToggle.addEventListener('change', toggleTheme);
    closeModal.addEventListener('click', closeModalFunc);
    
    // 自动生成密码相关的事件监听器
    autoCopyBtn.addEventListener('click', copyAutoPasswordToClipboard);
    autoRefreshBtn.addEventListener('click', generateAutoPassword);
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModalFunc();
    });

    // 确保至少有一个字符集被选中
    [uppercaseCheckbox, lowercaseCheckbox, numbersCheckbox, symbolsCheckbox].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const anyChecked = uppercaseCheckbox.checked || lowercaseCheckbox.checked || 
                              numbersCheckbox.checked || symbolsCheckbox.checked;
            if (!anyChecked) {
                checkbox.checked = true;
                showNotification('至少需要选择一种字符类型');
            }
        });
    });

    // 初始化应用
    function initializeApp() {
        updateLengthDisplay();
        loadThemePreference();
        renderPasswordHistory();
        startAutoPasswordGeneration();
    }

    // 更新密码长度显示
    function updateLengthDisplay() {
        lengthValue.textContent = lengthSlider.value;
    }

    // 生成密码
    function generatePassword() {
        // 获取选项
        const length = parseInt(lengthSlider.value);
        const includeUppercase = uppercaseCheckbox.checked;
        const includeLowercase = lowercaseCheckbox.checked;
        const includeNumbers = numbersCheckbox.checked;
        const includeSymbols = symbolsCheckbox.checked;
        const excludeSimilar = excludeSimilarCheckbox.checked;
        const excludeDuplicates = excludeDuplicatesCheckbox.checked;

        // 至少选择一种字符类型
        if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
            showNotification('请至少选择一种字符类型');
            uppercaseCheckbox.checked = true;
            return;
        }

        // 构建字符集
        let charset = '';
        if (includeUppercase) charset += charSets.uppercase;
        if (includeLowercase) charset += charSets.lowercase;
        if (includeNumbers) charset += charSets.numbers;
        if (includeSymbols) charset += charSets.symbols;

        // 排除相似字符
        if (excludeSimilar) {
            for (let i = 0; i < similarChars.length; i++) {
                charset = charset.replace(similarChars[i], '');
            }
        }

        // 生成密码
        let password = '';
        let charsetCopy = charset;

        // 确保每种选中的字符类型至少出现一次
        const requiredChars = [];
        if (includeUppercase) {
            let upperChars = charSets.uppercase;
            if (excludeSimilar) upperChars = removeChars(upperChars, similarChars);
            requiredChars.push(getRandomChar(upperChars));
        }
        if (includeLowercase) {
            let lowerChars = charSets.lowercase;
            if (excludeSimilar) lowerChars = removeChars(lowerChars, similarChars);
            requiredChars.push(getRandomChar(lowerChars));
        }
        if (includeNumbers) {
            let numberChars = charSets.numbers;
            if (excludeSimilar) numberChars = removeChars(numberChars, similarChars);
            requiredChars.push(getRandomChar(numberChars));
        }
        if (includeSymbols) {
            requiredChars.push(getRandomChar(charSets.symbols));
        }

        // 添加必需字符
        for (let i = 0; i < requiredChars.length; i++) {
            password += requiredChars[i];
            
            // 如果排除重复字符，则从字符集中移除已使用的字符
            if (excludeDuplicates) {
                charsetCopy = charsetCopy.replace(requiredChars[i], '');
            }
        }

        // 添加剩余字符
        for (let i = requiredChars.length; i < length; i++) {
            // 如果排除重复但字符集已用尽，就不再排除
            if (excludeDuplicates && charsetCopy.length === 0) {
                charsetCopy = charset;
                showNotification('字符集不足，可能包含重复字符');
            }

            const randomChar = getRandomChar(charsetCopy);
            password += randomChar;

            // 如果排除重复字符，则从字符集中移除已使用的字符
            if (excludeDuplicates) {
                charsetCopy = charsetCopy.replace(randomChar, '');
            }
        }

        // 打乱必需字符的顺序
        password = shuffleString(password);

        // 显示密码并更新强度指示器
        passwordDisplay.textContent = password;
        updateStrengthIndicator(password);
        
        // 添加到历史记录
        addToHistory(password);
    }

    // 从字符串中移除指定字符
    function removeChars(str, charsToRemove) {
        let result = str;
        for (let i = 0; i < charsToRemove.length; i++) {
            result = result.replace(charsToRemove[i], '');
        }
        return result;
    }

    // 获取随机字符
    function getRandomChar(characters) {
        return characters.charAt(Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1) * characters.length));
    }

    // 打乱字符串
    function shuffleString(str) {
        const array = str.split('');
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1) * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array.join('');
    }

    // 更新强度指示器
    function updateStrengthIndicator(password) {
        const strength = calculatePasswordStrength(password);
        
        // 更新强度条
        strengthBar.style.width = `${strength}%`;
        
        // 清除之前的数据属性
        strengthBar.removeAttribute('data-strength');
        
        // 根据强度设置数据属性和文本
        if (strength < 25) {
            strengthBar.setAttribute('data-strength', 'weak');
            strengthText.textContent = '弱';
        } else if (strength < 50) {
            strengthBar.setAttribute('data-strength', 'medium');
            strengthText.textContent = '中等';
        } else if (strength < 75) {
            strengthBar.setAttribute('data-strength', 'strong');
            strengthText.textContent = '强';
        } else {
            strengthBar.setAttribute('data-strength', 'very-strong');
            strengthText.textContent = '非常强';
        }
    }

    // 计算密码强度
    function calculatePasswordStrength(password) {
        // 基本分数：长度
        let score = Math.min(30, password.length * 2);
        
        // 字符多样性
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[^A-Za-z0-9]/.test(password);
        
        const variety = (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + 
                       (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0);
        
        score += variety * 10;
        
        // 检查重复模式
        const repeats = password.length - new Set(password.split('')).size;
        score -= repeats * 3;
        
        // 确保分数在0-100之间
        return Math.max(0, Math.min(100, score));
    }

    // 复制密码到剪贴板
    function copyPasswordToClipboard() {
        const password = passwordDisplay.textContent;
        if (password && password !== '点击生成按钮创建密码') {
            navigator.clipboard.writeText(password)
                .then(() => {
                    showNotification('密码已复制到剪贴板！');
                })
                .catch(err => {
                    console.error('无法复制：', err);
                    showNotification('复制失败，请手动复制');
                });
        } else {
            showNotification('请先生成密码');
        }
    }

    // 复制自动生成的密码到剪贴板
    function copyAutoPasswordToClipboard() {
        const password = autoPasswordDisplay.textContent;
        if (password && password !== '等待生成...') {
            navigator.clipboard.writeText(password)
                .then(() => {
                    showNotification('自动推荐密码已复制到剪贴板！');
                })
                .catch(err => {
                    showNotification('复制失败，请手动复制');
                });
        }
    }

    // 添加到历史记录
    function addToHistory(password) {
        // 创建历史记录对象
        const historyItem = {
            password,
            timestamp: Date.now(),
            strength: calculatePasswordStrength(password),
            options: {
                length: parseInt(lengthSlider.value),
                uppercase: uppercaseCheckbox.checked,
                lowercase: lowercaseCheckbox.checked,
                numbers: numbersCheckbox.checked,
                symbols: symbolsCheckbox.checked,
                excludeSimilar: excludeSimilarCheckbox.checked,
                excludeDuplicates: excludeDuplicatesCheckbox.checked
            }
        };

        // 添加到历史记录数组开头
        passwordHistory.unshift(historyItem);

        // 限制历史记录数量（最多保存10个）
        if (passwordHistory.length > 10) {
            passwordHistory.pop();
        }

        // 保存到本地存储
        localStorage.setItem('passwordHistory', JSON.stringify(passwordHistory));

        // 更新历史记录显示
        renderPasswordHistory();
    }

    // 渲染密码历史记录
    function renderPasswordHistory() {
        // 清空历史容器
        historyContainer.innerHTML = '';

        if (passwordHistory.length === 0) {
            historyContainer.innerHTML = '<p class="empty-history">尚无历史记录</p>';
            return;
        }

        // 添加每个历史记录项
        passwordHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            // 确定强度级别
            let strengthClass;
            if (item.strength < 25) strengthClass = 'weak';
            else if (item.strength < 50) strengthClass = 'medium';
            else if (item.strength < 75) strengthClass = 'strong';
            else strengthClass = 'very-strong';

            // 创建历史记录项内容
            historyItem.innerHTML = `
                <span class="history-password">${item.password}</span>
                <div class="history-info">
                    <span class="history-strength" data-strength="${strengthClass}"></span>
                    <button class="icon-btn" title="复制密码">
                        <i class="far fa-copy"></i>
                    </button>
                </div>
            `;

            // 添加复制事件
            historyItem.querySelector('.icon-btn').addEventListener('click', () => {
                navigator.clipboard.writeText(item.password)
                    .then(() => {
                        showNotification('历史密码已复制到剪贴板！');
                    })
                    .catch(err => {
                        showNotification('复制失败，请手动复制');
                    });
            });

            // 添加点击事件，点击历史记录项恢复该配置
            historyItem.addEventListener('click', (e) => {
                // 如果点击的是复制按钮，不执行恢复操作
                if (!e.target.closest('.icon-btn')) {
                    restoreFromHistory(index);
                }
            });

            historyContainer.appendChild(historyItem);
        });
    }

    // 从历史记录恢复设置
    function restoreFromHistory(index) {
        const item = passwordHistory[index];
        
        // 恢复选项设置
        lengthSlider.value = item.options.length;
        uppercaseCheckbox.checked = item.options.uppercase;
        lowercaseCheckbox.checked = item.options.lowercase;
        numbersCheckbox.checked = item.options.numbers;
        symbolsCheckbox.checked = item.options.symbols;
        excludeSimilarCheckbox.checked = item.options.excludeSimilar;
        excludeDuplicatesCheckbox.checked = item.options.excludeDuplicates;
        
        // 更新显示
        updateLengthDisplay();
        passwordDisplay.textContent = item.password;
        updateStrengthIndicator(item.password);
        
        showNotification('已恢复密码设置');
    }

    // 清除历史记录
    function clearHistory() {
        passwordHistory = [];
        localStorage.removeItem('passwordHistory');
        renderPasswordHistory();
        showNotification('历史记录已清除');
    }

    // 显示通知
    function showNotification(message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // 添加到文档
        document.body.appendChild(notification);
        
        // 淡入效果
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 淡出并移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 切换主题
    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDarkTheme = document.body.classList.contains('dark-theme');
        localStorage.setItem('darkTheme', isDarkTheme);
    }

    // 加载主题偏好
    function loadThemePreference() {
        const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
        if (isDarkTheme) {
            document.body.classList.add('dark-theme');
            themeToggle.checked = true;
        }
    }

    // 关闭模态框
    function closeModalFunc() {
        modal.style.display = 'none';
    }

    // 自动密码生成功能
    function startAutoPasswordGeneration() {
        // 首次生成
        generateAutoPassword();
        
        // 设置参数
        const timerDuration = 15; // 15秒倒计时
        const timerArc = document.getElementById('timer-arc');
        
        // 圆形路径的周长约为 2*PI*r，对于r=18的圆，约为113
        const pathLength = 113;
        timerArc.style.strokeDasharray = `${pathLength}`;
        
        // 设置定时器，每15秒生成一次
        let countdown = timerDuration;
        
        // 更新计时器显示
        function updateTimer() {
            // 更新文字显示
            autoTimer.textContent = countdown;
            
            // 计算并设置进度 - 优化计算逻辑
            const dashOffset = pathLength * (1 - countdown / timerDuration);
            timerArc.style.strokeDashoffset = dashOffset;
            
            countdown--;
            
            if (countdown < 0) {
                countdown = timerDuration;
                generateAutoPassword();
                timerArc.style.strokeDashoffset = 0; // 重置圆环
            }
        }
        
        // 初始更新计时器
        updateTimer();
        
        // 每秒更新计时器
        setInterval(updateTimer, 1000);
    }
    
    // 生成自动推荐密码
    function generateAutoPassword() {
        // 自动生成的密码设置，固定为强密码配置
        const length = Math.floor(Math.random() * 8) + 16; // 16-24位随机长度
        const includeUppercase = true;
        const includeLowercase = true;
        const includeNumbers = true;
        const includeSymbols = true;
        const excludeSimilar = true;
        const excludeDuplicates = false;
        
        // 构建字符集
        let charset = '';
        if (includeUppercase) charset += charSets.uppercase;
        if (includeLowercase) charset += charSets.lowercase;
        if (includeNumbers) charset += charSets.numbers;
        if (includeSymbols) charset += charSets.symbols;
        
        // 排除相似字符
        if (excludeSimilar) {
            for (let i = 0; i < similarChars.length; i++) {
                charset = charset.replace(similarChars[i], '');
            }
        }
        
        // 生成密码
        let password = '';
        let charsetCopy = charset;
        
        // 确保每种选中的字符类型至少出现一次
        const requiredChars = [];
        if (includeUppercase) {
            let upperChars = charSets.uppercase;
            if (excludeSimilar) upperChars = removeChars(upperChars, similarChars);
            requiredChars.push(getRandomChar(upperChars));
        }
        if (includeLowercase) {
            let lowerChars = charSets.lowercase;
            if (excludeSimilar) lowerChars = removeChars(lowerChars, similarChars);
            requiredChars.push(getRandomChar(lowerChars));
        }
        if (includeNumbers) {
            let numberChars = charSets.numbers;
            if (excludeSimilar) numberChars = removeChars(numberChars, similarChars);
            requiredChars.push(getRandomChar(numberChars));
        }
        if (includeSymbols) {
            requiredChars.push(getRandomChar(charSets.symbols));
        }
        
        // 添加必需字符
        for (let i = 0; i < requiredChars.length; i++) {
            password += requiredChars[i];
            
            // 如果排除重复字符，则从字符集中移除已使用的字符
            if (excludeDuplicates) {
                charsetCopy = charsetCopy.replace(requiredChars[i], '');
            }
        }
        
        // 添加剩余字符
        for (let i = requiredChars.length; i < length; i++) {
            // 如果排除重复但字符集已用尽，就不再排除
            if (excludeDuplicates && charsetCopy.length === 0) {
                charsetCopy = charset;
            }
            
            const randomChar = getRandomChar(charsetCopy);
            password += randomChar;
            
            // 如果排除重复字符，则从字符集中移除已使用的字符
            if (excludeDuplicates) {
                charsetCopy = charsetCopy.replace(randomChar, '');
            }
        }
        
        // 打乱必需字符的顺序
        password = shuffleString(password);
        
        // 显示密码并更新强度指示器
        autoPasswordDisplay.textContent = password;
        updateAutoStrengthIndicator(password);
    }
    
    // 更新自动密码强度指示器
    function updateAutoStrengthIndicator(password) {
        const strength = calculatePasswordStrength(password);
        
        // 更新强度条
        autoStrengthBar.style.width = `${strength}%`;
        
        // 清除之前的数据属性
        autoStrengthBar.removeAttribute('data-strength');
        
        // 根据强度设置数据属性和文本
        if (strength < 25) {
            autoStrengthBar.setAttribute('data-strength', 'weak');
            autoStrengthText.textContent = '弱';
        } else if (strength < 50) {
            autoStrengthBar.setAttribute('data-strength', 'medium');
            autoStrengthText.textContent = '中等';
        } else if (strength < 75) {
            autoStrengthBar.setAttribute('data-strength', 'strong');
            autoStrengthText.textContent = '强';
        } else {
            autoStrengthBar.setAttribute('data-strength', 'very-strong');
            autoStrengthText.textContent = '非常强';
        }
    }

    // 初始生成一个密码
    generatePassword();
});

// 添加CSS到头部（通知样式）
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background-color: var(--primary);
        color: white;
        padding: 12px 24px;
        border-radius: var(--border-radius);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s, transform 0.3s;
    }
    .notification.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
`;
document.head.appendChild(style); 