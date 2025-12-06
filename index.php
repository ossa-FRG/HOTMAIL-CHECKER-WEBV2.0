<?php


$ipAddressDefault2 = get_client_ip_env();
function get_client_ip_env(){
    $ipAddressDefault = '';
    if (getenv('HTTP_CLIENT_IP'))
     $ipAddressDefault = getenv('HTTP_CLIENT_IP');
    else if(getenv('HTTP_X_FORWARDED_FOR'))
     $ipAddressDefault = getenv('HTTP_X_FORWARDED_FOR');
    else if(getenv('HTTP_X_FORWARDED'))
     $ipAddressDefault = getenv('HTTP_X_FORWARDED');
    else if(getenv('HTTP_FORWARDED_FOR'))
     $ipAddressDefault = getenv('HTTP_FORWARDED_FOR');
    else if(getenv('HTTP_FORWARDED'))
     $ipAddressDefault = getenv('HTTP_FORWARDED');
    else if(getenv('REMOTE_ADDR'))
     $ipAddressDefault = getenv('REMOTE_ADDR');
    else
     $ipAddressDefault = 'UNKNOWN IP Address';
   
    return $ipAddressDefault;
   }

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hotmail Account Checker - DARKXCODE</title>
    <link rel="icon" type="image/x-icon" href="img/outlook.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <div class="logo-container">
                <div class="logo-placeholder"><img src="img/outlook.png"></div>
                <h1>Hotmail Account Checker</h1>
            </div>
            <button class="theme-toggle" id="themeToggle">
                <i class="fas fa-moon"></i>
                <span>Dark Mode</span>
            </button>
        </header>

        <div class="main-content">
            <!-- Input Section -->
            <div class="card">
                <h2 class="card-title"><i class="fas fa-cogs"></i> Configuration</h2>
                
                <div class="form-group">
                    <label for="apikey">API Key *</label>
                    <input type="text" id="apikey" placeholder="Enter your API key">
                    <div class="info-text">How to get API key: Contact <a href="https://t.me/zlaxtert" target="_blank">https://t.me/zlaxtert</a></div>
                </div>

                <div class="form-group">
                    <label for="proxyList">Proxy List (Optional)</label>
                    <textarea id="proxyList" rows="4" placeholder="Enter proxy list (ip:port format) one per line"></textarea>
                    <div class="info-text">Optional: For rotating proxies, add multiple proxies (one per line)</div>
                </div>

                <div class="form-group">
                    <label for="proxyAuth">Proxy Authentication (Optional)</label>
                    <input type="text" id="proxyAuth" placeholder="username:password">
                    <div class="info-text">Optional: Proxy authentication in username:password format</div>
                </div>

                <div class="form-group">
                    <label for="proxyType">Proxy Type</label>
                    <select id="proxyType">
                        <option value="http">HTTP</option>
                        <option value="https">HTTPS</option>
                        <option value="socks4">SOCKS4</option>
                        <option value="socks5">SOCKS5</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Account List (Max 100,000)</label>
                    <div class="file-upload" id="fileUpload">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Click to upload or drag and drop</p>
                        <p>Supported formats: TXT, CSV, XLSX</p>
                        <p>Format: email|password or email:password</p>
                        <input type="file" id="fileInput" accept=".txt,.csv,.xlsx">
                    </div>
                    <div class="info-text" id="fileInfo">No file selected</div>
                </div>

                <div class="form-group">
                    <label for="accountList">Or paste account list directly</label>
                    <textarea id="accountList" rows="6" placeholder="Paste accounts here (email|password or email:password) one per line"></textarea>
                    <div class="info-text">Example: example@hotmail.com|Password@123 or example@hotmail.com:Password@123</div>
                </div>

                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="progress-text">
                        <span id="progressText">0/0</span>
                        <span id="remainingText">Remaining: 0</span>
                    </div>
                </div>

                <div class="buttons-container">
                    <button class="btn btn-primary" id="startBtn">
                        <i class="fas fa-play"></i> Start Checking
                    </button>
                    <button class="btn btn-danger" id="stopBtn" disabled>
                        <i class="fas fa-stop"></i> Stop
                    </button>
                    <button class="btn btn-secondary" id="clearBtn">
                        <i class="fas fa-trash"></i> Clear All
                    </button>
                </div>
            </div>

            <!-- Results Section -->
            <div class="card">
                <h2 class="card-title"><i class="fas fa-chart-bar"></i> Results</h2>
                
                <div class="status-container">
                    <div class="status-box live">
                        <span class="count" id="liveCount">0</span>
                        <span>LIVE</span>
                    </div>
                    <div class="status-box die">
                        <span class="count" id="dieCount">0</span>
                        <span>DIE</span>
                    </div>
                    <div class="status-box retry">
                        <span class="count" id="retryCount">0</span>
                        <span>RETRY</span>
                    </div>
                    <div class="status-box error">
                        <span class="count" id="errorCount">0</span>
                        <span>ERROR</span>
                    </div>
                </div>

                <div class="results-container">
                    <div class="results-tabs">
                        <button class="tab-btn active" data-tab="live">LIVE</button>
                        <button class="tab-btn" data-tab="die">DIE</button>
                        <button class="tab-btn" data-tab="retry">RETRY</button>
                        <button class="tab-btn" data-tab="error">ERROR</button>
                        <button class="tab-btn" data-tab="all">ALL</button>
                    </div>

                    <div class="results-content" id="resultsContent">
                        <!-- Results will be displayed here -->
                        <div class="no-results">No results yet. Start checking to see results here.</div>
                    </div>

                    <div class="export-options">
                        <button class="btn btn-success btn-small" id="exportLive">
                            <i class="fas fa-download"></i> Export LIVE
                        </button>
                        <button class="btn btn-danger btn-small" id="exportDie">
                            <i class="fas fa-download"></i> Export DIE
                        </button>
                        <button class="btn btn-warning btn-small" id="exportRetry">
                            <i class="fas fa-download"></i> Export RETRY
                        </button>
                        <button class="btn btn-primary btn-small" id="exportAll">
                            <i class="fas fa-download"></i> Export ALL
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="copyright">
            <p>&copy; <span id="currentYear"></span> DARKXCODE | Author: <a href="https://t.me/zlaxtert" target="_blank">ZLAXTERT</a> | API: <a href="https://api.darkxcode.site" target="_blank">DARKXCODE API</a></p>
            <p><?php echo "IP : " . $ipAddressDefault2;?></p>
        </div>
    </div>

    <div class="notification" id="notification"></div>

    <script src="js/call.js" type="text/javascript"></script>
</body>
</html>