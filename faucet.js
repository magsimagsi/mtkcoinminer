// Faucet Functions

// Get MTK Tokens from Faucet
function getMTKTokens() {
    console.log('getMTKTokens() called');
    
    if (!window.connected) {
        showNotification('Connect wallet first!', 'error');
        const connectConfirm = confirm('Connect wallet now?');
        if (connectConfirm && typeof connectWallet === 'function') {
            connectWallet();
        }
        return;
    }
    
    // Check if on Sepolia
    if (window.web3) {
        window.web3.eth.getChainId().then(chainId => {
            if (chainId !== 11155111) {
                const switchConfirm = confirm('Switch to Sepolia network for MTK faucet?');
                if (switchConfirm && typeof switchToSepolia === 'function') {
                    switchToSepolia();
                    setTimeout(() => {
                        if (typeof getMTKFromFaucet === 'function') {
                            getMTKFromFaucet();
                        }
                    }, 2000);
                }
            } else {
                if (typeof getMTKFromFaucet === 'function') {
                    getMTKFromFaucet();
                } else {
                    showNotification('MTK faucet function not loaded', 'error');
                }
            }
        });
    }
}

// Get UNI Tokens
function getUniTokens() {
    if (!window.connected) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    createUniInstructionsModal();
}

function createUniInstructionsModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4000;
        backdrop-filter: blur(10px);
    `;
    
    modal.innerHTML = `
        <div style="background: #1e293b; border-radius: 16px; padding: 30px; max-width: 500px; width: 90%; border: 2px solid #f8c555;">
            <h3 style="color: #f8c555; margin-bottom: 20px;"><i class="fas fa-gift"></i> Get UNI Tokens</h3>
            <div style="color: #94a3b8; margin-bottom: 20px;">
                <p><strong>Step 1:</strong> Get Sepolia ETH from a faucet</p>
                <p><strong>Step 2:</strong> Go to Uniswap on Sepolia network</p>
                <p><strong>Step 3:</strong> Swap ETH for UNI tokens</p>
                <p><strong>UNI Address:</strong> <code style="background: rgba(255,255,255,0.1); padding: 5px; border-radius: 4px;">0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984</code></p>
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="window.open('https://sepoliafaucet.com', '_blank')" style="background: #667eea; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; flex: 1;">
                    Get ETH First
                </button>
                <button onclick="window.open('https://app.uniswap.org/swap', '_blank')" style="background: #ff007a; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; flex: 1;">
                    Go to Uniswap
                </button>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #64748b; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Get LINK Tokens
function getLinkTokens() {
    if (!window.connected) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    showNotification('Opening Chainlink faucet...', 'info');
    window.open('https://faucets.chain.link/sepolia', '_blank');
}

// Get DAI Tokens
function getDaiTokens() {
    if (!window.connected) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    showNotification('To get DAI: Swap ETH for DAI on Uniswap', 'info');
    window.open('https://app.uniswap.org/swap', '_blank');
}

// Copy Address to Clipboard
function copyAddress() {
    if (!window.userAccount) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    navigator.clipboard.writeText(window.userAccount)
        .then(() => {
            showNotification('Address copied to clipboard!', 'success');
        })
        .catch(err => {
            showNotification('Failed to copy address', 'error');
        });
}

// Get Test ETH from Faucet
function getTestETH(faucetType) {
    const faucets = {
        alchemy: 'https://sepoliafaucet.com',
        infura: 'https://www.infura.io/faucet/sepolia',
        quicknode: 'https://faucet.quicknode.com/ethereum/sepolia'
    };
    
    const url = faucets[faucetType];
    if (url) {
        showNotification(`Opening ${faucetType} faucet...`, 'info');
        window.open(url, '_blank');
    }
}

// Export functions
window.getUniTokens = getUniTokens;
window.getLinkTokens = getLinkTokens;
window.getDaiTokens = getDaiTokens;
window.getMTKTokens = getMTKTokens;
window.copyAddress = copyAddress;
window.getTestETH = getTestETH;
