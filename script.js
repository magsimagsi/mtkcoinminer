// Main Application Script
document.addEventListener('DOMContentLoaded', function() {
    console.log('MTK Miner Game Loading...');
    
    // Navigation handling
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
            
            // Scroll to top of section
            document.querySelector('.main-container').scrollTop = 0;
        });
    });
    
    // Initialize game
    if (typeof initGame === 'function') {
        setTimeout(() => {
            if (!window.gameInitialized) {
                initGame();
                window.gameInitialized = true;
            }
        }, 500);
    }
    
    // Initialize blockchain connection
    initializeBlockchain();
    
    // Initialize charts if Chart.js is loaded
    if (typeof Chart !== 'undefined') {
        initCharts();
    }
    
    // Add MTK token info panel
    addMTKTokenPanel();
    
    // Setup auto-fill for recipient address
    setupRecipientAutoFill();
});

// Initialize blockchain connection
async function initializeBlockchain() {
    console.log('Initializing blockchain connection...');
    
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
        console.log('MetaMask not detected');
        showNotification('Please install MetaMask to connect wallet', 'warning');
        return;
    }
    
    // Try to auto-connect if already connected
    if (typeof autoConnectIfConnected === 'function') {
        setTimeout(async () => {
            const connected = await autoConnectIfConnected();
            if (connected) {
                console.log('Auto-connected to existing wallet');
            }
        }, 500);
    }
    
    // Set up click handler for wallet status
    const walletStatus = document.querySelector('.wallet-status');
    if (walletStatus) {
        walletStatus.addEventListener('click', function() {
            if (window.connected) {
                // Show MTK panel
                const panel = document.getElementById('mtkTokenPanel');
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
            } else {
                // Connect wallet
                if (typeof connectWallet === 'function') {
                    connectWallet();
                }
            }
        });
    }
    
    // Set up periodic connection checking
    setInterval(async () => {
        if (typeof verifyConnection === 'function') {
            const status = await verifyConnection();
            if (status.connected && !window.connected) {
                console.log('Found disconnected but active session, fixing...');
                if (typeof checkAndFixConnection === 'function') {
                    await checkAndFixConnection();
                }
            }
        }
    }, 30000);
}

// Initialize charts
function initCharts() {
    // Mining progress chart
    const miningCtx = document.getElementById('miningChart')?.getContext('2d');
    if (miningCtx) {
        window.miningChart = new Chart(miningCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 10}, (_, i) => `Day ${i + 1}`),
                datasets: [{
                    label: 'MTK Mined',
                    data: Array.from({length: 10}, () => Math.floor(Math.random() * 1000)),
                    borderColor: '#f8c555',
                    backgroundColor: 'rgba(248, 197, 85, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
    
    // Token distribution chart
    const distributionCtx = document.getElementById('distributionChart')?.getContext('2d');
    if (distributionCtx) {
        window.distributionChart = new Chart(distributionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Mined', 'Claimed', 'Withdrawn'],
                datasets: [{
                    data: [100, 50, 25],
                    backgroundColor: [
                        '#f8c555',
                        '#2ed573',
                        '#ffa502'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
}

// Update charts with real data
function updateCharts() {
    if (window.miningChart) {
        const newData = window.miningChart.data.datasets[0].data;
        newData.push(Math.floor(Math.random() * 1000));
        if (newData.length > 10) newData.shift();
        window.miningChart.update();
    }
    
    if (window.distributionChart) {
        const totalMined = window.totalMined || 0;
        const totalClaimed = window.totalClaimed || 0;
        const totalWithdrawn = window.totalWithdrawn || 0;
        
        window.distributionChart.data.datasets[0].data = [
            totalMined,
            totalClaimed,
            totalWithdrawn
        ];
        window.distributionChart.update();
    }
}

// Add MTK token info panel
function addMTKTokenPanel() {
    // Remove existing panel if any
    const existingPanel = document.getElementById('mtkTokenPanel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Create new panel
    const panel = document.createElement('div');
    panel.id = 'mtkTokenPanel';
    panel.className = 'mtk-token-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 70px;
        right: 20px;
        background: rgba(30, 41, 59, 0.95);
        border: 1px solid #f8c555;
        border-radius: 12px;
        padding: 15px;
        width: 280px;
        z-index: 9998;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        display: none;
        animation: slideInUp 0.3s ease;
    `;
    
    panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="color: #f8c555; margin: 0; font-size: 16px;">
                <i class="fas fa-coins"></i> MTK Token
            </h4>
            <button onclick="document.getElementById('mtkTokenPanel').style.display='none'" 
                    style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 18px;">
                ×
            </button>
        </div>
        
        <div style="margin-bottom: 10px;">
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 5px;">Contract Address:</div>
            <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 11px; word-break: break-all;">
                0x3D6Eb3Fc92C799CB6b8716c5c8E5f8A78eFE8A43
            </div>
        </div>
        
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
            <button onclick="addMTKToMetaMask()" 
                    style="flex: 1; background: #f8c555; color: black; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">
                <i class="fas fa-plus-circle"></i> Add to MetaMask
            </button>
            <button onclick="window.open('https://sepolia.etherscan.io/address/0x3D6Eb3Fc92C799CB6b8716c5c8E5f8A78eFE8A43', '_blank')" 
                    style="flex: 1; background: rgba(255,255,255,0.1); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                <i class="fas fa-external-link-alt"></i> Etherscan
            </button>
        </div>
        
        <div style="display: flex; gap: 8px;">
            <button onclick="getMTKFromFaucet()" 
                    style="flex: 1; background: #2ed573; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                <i class="fas fa-gift"></i> Get MTK
            </button>
            <button onclick="checkMTKBalance()" 
                    style="flex: 1; background: rgba(255,255,255,0.1); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                <i class="fas fa-wallet"></i> Check Balance
            </button>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Show panel after 5 seconds if not connected
    setTimeout(() => {
        if (panel && !document.querySelector('.wallet-status.connected')) {
            panel.style.display = 'block';
        }
    }, 5000);
}

// Setup auto-fill for recipient address
function setupRecipientAutoFill() {
    // Watch for wallet connection to auto-fill recipient
    const originalConnect = window.connectWallet;
    window.connectWallet = async function() {
        const result = await originalConnect.apply(this, arguments);
        
        // Auto-fill recipient address after connection
        setTimeout(() => {
            if (window.userAccount) {
                const recipientInput = document.getElementById('recipientAddress');
                if (recipientInput && !recipientInput.value) {
                    recipientInput.value = window.userAccount;
                    showNotification('Recipient address auto-filled with your wallet', 'info');
                }
            }
        }, 1000);
        
        return result;
    };
}

// Export functions
window.showNotification = showNotification;
window.showPendingOverlay = showPendingOverlay;
window.hidePendingOverlay = hidePendingOverlay;
window.updateCharts = updateCharts;
