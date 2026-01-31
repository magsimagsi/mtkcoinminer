// Main Application Script
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Initialize game if not already initialized
    if (typeof initGame === 'function') {
        setTimeout(() => {
            if (!window.gameInitialized) {
                initGame();
                window.gameInitialized = true;
            }
        }, 100);
    }
    
    // Check for existing wallet connection
    checkExistingConnection();
    
    // Initialize charts if Chart.js is loaded
    if (typeof Chart !== 'undefined') {
        initCharts();
    }
});

// Check existing wallet connection
async function checkExistingConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0 && typeof connectWallet === 'function') {
                // Auto-connect if previously connected
                setTimeout(() => connectWallet(), 1000);
            }
        } catch (error) {
            console.log('No existing connection found');
        }
    }
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
        // Update with real mining data
        const newData = window.miningChart.data.datasets[0].data;
        newData.push(Math.floor(Math.random() * 1000));
        if (newData.length > 10) newData.shift();
        window.miningChart.update();
    }
    
    if (window.distributionChart) {
        // Update with real distribution data
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
// Add to script.js
window.debugWithdraw = function() {
    console.log('=== WITHDRAW DEBUG INFO ===');
    console.log('1. connected:', window.connected);
    console.log('2. web3:', typeof web3);
    console.log('3. tokenContract:', tokenContract ? '✓ Loaded' : '✗ Not loaded');
    console.log('4. userAccount:', userAccount || 'Not connected');
    console.log('5. walletTokenBalance:', window.walletTokenBalance || 0);
    console.log('6. Form inputs:', {
        amount: document.getElementById('withdrawAmount')?.value || 'Not found',
        recipient: document.getElementById('recipientAddress')?.value || 'Not found'
    });
    
    // Check ETH balance
    if (web3 && userAccount) {
        web3.eth.getBalance(userAccount).then(balance => {
            console.log('7. ETH Balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
        });
    }
    
    // Check token balance
    if (tokenContract && userAccount) {
        tokenContract.methods.balanceOf(userAccount).call().then(balance => {
            tokenContract.methods.decimals().call().then(decimals => {
                const formatted = balance / Math.pow(10, decimals);
                console.log('8. Token Balance:', formatted, 'tokens');
            });
        });
    }
    
    alert('Check browser console (F12) for debug info!');
};
// Add this to the END of your script.js file:

// Initialize blockchain connection and MTK token info
setTimeout(() => {
    // Check for existing wallet connection
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
            if (accounts.length > 0 && typeof connectWallet === 'function') {
                setTimeout(() => connectWallet(), 1000);
            }
        });
    }
    
    // Add MTK token info to page (floating info panel)
    if (!document.getElementById('mtkTokenInfo')) {
        const tokenInfoDiv = document.createElement('div');
        tokenInfoDiv.id = 'mtkTokenInfo';
        tokenInfoDiv.style.cssText = `
            position: fixed;
            bottom: 60px;
            right: 10px;
            background: rgba(248, 197, 85, 0.1);
            border: 1px solid #f8c555;
            border-radius: 8px;
            padding: 10px;
            font-size: 12px;
            color: #f8c555;
            z-index: 9998;
            max-width: 200px;
            backdrop-filter: blur(10px);
            display: none;
        `;
        tokenInfoDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <strong>MTK Token Info</strong>
                <button onclick="document.getElementById('mtkTokenInfo').style.display='none'" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px;">×</button>
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-bottom: 5px;">
                Sepolia Testnet
            </div>
            <div style="font-family: monospace; font-size: 10px; background: rgba(0,0,0,0.3); padding: 3px; border-radius: 3px; margin-bottom: 5px; word-break: break-all;">
                0x3D6Eb3Fc92C799CB6b8716c5c8E5f8A78eFE8A43
            </div>
            <div style="display: flex; gap: 5px;">
                <button onclick="addMTKToMetaMask()" style="background: #f8c555; color: black; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; flex: 1;">
                    <i class="fas fa-plus-circle"></i> Add to MetaMask
                </button>
                <button onclick="getMTKTokens()" style="background: #2ed573; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; flex: 1;">
                    <i class="fas fa-gift"></i> Get MTK
                </button>
            </div>
        `;
        document.body.appendChild(tokenInfoDiv);
        
        // Show token info after 3 seconds
        setTimeout(() => {
            if (document.getElementById('mtkTokenInfo')) {
                document.getElementById('mtkTokenInfo').style.display = 'block';
            }
        }, 3000);
    }
    
    // Add debug buttons if needed
    if (window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1')) {
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            padding: 10px;
            border-radius: 8px;
            z-index: 9997;
            display: flex;
            gap: 5px;
        `;
        debugDiv.innerHTML = `
            <button onclick="debugWithdraw()" style="background: #ff6b6b; color: white; padding: 6px; border-radius: 4px; font-size: 10px; border: none; cursor: pointer;">
                Debug
            </button>
            <button onclick="checkExistingConnection()" style="background: #4ecdc4; color: white; padding: 6px; border-radius: 4px; font-size: 10px; border: none; cursor: pointer;">
                Reconnect
            </button>
            <button onclick="updateBalances()" style="background: #45b7d1; color: white; padding: 6px; border-radius: 4px; font-size: 10px; border: none; cursor: pointer;">
                Refresh
            </button>
        `;
        document.body.appendChild(debugDiv);
    }
    
}, 2000);

// Add function to test MTK faucet
window.testMTKFaucet = async function() {
    console.log('Testing MTK faucet...');
    
    if (!window.connected) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    try {
        showPendingOverlay('Testing MTK faucet...');
        
        // Test the contract directly
        const testTx = {
            from: userAccount,
            to: '0x3D6Eb3Fc92C799CB6b8716c5c8E5f8A78eFE8A43',
            data: '0x379607f5000000000000000000000000' + userAccount.slice(2) + '0000000000000000000000000000000000000000000000056bc75e2d63100000',
            gas: '0x186a0'
        };
        
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [testTx]
        });
        
        console.log('Test faucet transaction:', txHash);
        showNotification('Test faucet transaction sent! Check MetaMask.', 'info');
        hidePendingOverlay();
        
    } catch (error) {
        hidePendingOverlay();
        console.error('Test faucet error:', error);
        showNotification('Test failed: ' + error.message, 'error');
    }
};

// Add function to check MTK token balance
window.checkMTKBalance = async function() {
    if (!web3 || !userAccount) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    try {
        const contract = new web3.eth.Contract([
            {
                "constant": true,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            }
        ], '0x3D6Eb3Fc92C799CB6b8716c5c8E5f8A78eFE8A43');
        
        const balance = await contract.methods.balanceOf(userAccount).call();
        const decimals = await contract.methods.decimals().call();
        const formatted = balance / Math.pow(10, decimals);
        
        showNotification(`Your MTK Balance: ${formatted.toFixed(4)} MTK`, 'success');
        console.log('MTK Balance:', formatted);
        
    } catch (error) {
        console.error('Balance check error:', error);
        showNotification('Failed to check balance', 'error');
    }
};

// Export new functions
window.testMTKFaucet = testMTKFaucet;
window.checkMTKBalance = checkMTKBalance;

// Export functions for other modules
window.showNotification = showNotification;
window.showPendingOverlay = showPendingOverlay;
window.hidePendingOverlay = hidePendingOverlay;
window.updateCharts = updateCharts;
