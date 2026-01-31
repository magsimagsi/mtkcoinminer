// Faucet Functions

// Get MTK Tokens
async function getMTKTokens() {
    console.log('getMTKTokens() called');
    
    if (!window.connected || !window.userAccount) {
        const connectFirst = confirm('Connect wallet to get MTK tokens! Connect now?');
        if (connectFirst && typeof connectWallet === 'function') {
            await connectWallet();
            if (!window.connected) return;
        } else {
            return;
        }
    }
    
    // Check network
    if (window.web3) {
        try {
            const chainId = await window.web3.eth.getChainId();
            const isSepolia = chainId === 11155111 || chainId === '0xaa36a7';
            
            if (!isSepolia) {
                const switchConfirm = confirm('Switch to Sepolia network for MTK tokens?');
                if (switchConfirm && typeof switchToSepolia === 'function') {
                    await switchToSepolia();
                    return;
                }
            }
        } catch (error) {
            console.log('Network check failed:', error);
        }
    }
    
    // Show faucet instructions
    if (typeof getMTKFromFaucet === 'function') {
        getMTKFromFaucet();
    } else {
        showNotification('Faucet function not available', 'error');
    }
}

// Get UNI Tokens
async function getUniTokens() {
    if (!window.connected) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    // Show instructions modal
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
        <div style="background: #1e293b; border-radius: 16px; padding: 30px; max-width: 500px; width: 90%; border: 2px solid #ff007a;">
            <h3 style="color: #ff007a; margin-bottom: 20px;">
                <i class="fas fa-coins"></i> Get UNI Tokens
            </h3>
            <div style="color: #94a3b8; margin-bottom: 20px;">
                <p><strong>Step 1:</strong> Get Sepolia ETH from a faucet</p>
                <p><strong>Step 2:</strong> Go to Uniswap on Sepolia network</p>
                <p><strong>Step 3:</strong> Swap ETH for UNI tokens</p>
                <p><strong>UNI Address:</strong> 
                    <code style="background: rgba(255,255,255,0.1); padding: 5px; border-radius: 4px; display: block; margin-top: 5px; word-break: break-all;">
                        0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
                    </code>
                </p>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="window.open('https://sepoliafaucet.com', '_blank')" 
                        style="background: #667eea; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 120px;">
                    Get ETH
                </button>
                <button onclick="window.open('https://app.uniswap.org/swap', '_blank')" 
                        style="background: #ff007a; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 120px;">
                    Uniswap
                </button>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #64748b; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer;">
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
async function getLinkTokens() {
    if (!window.connected) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    showNotification('Opening Chainlink faucet...', 'info');
    window.open('https://faucets.chain.link/sepolia', '_blank');
}

// Get DAI Tokens
async function getDaiTokens() {
    if (!window.connected) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    // Show instructions modal
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
        <div style="background: #1e293b; border-radius: 16px; padding: 30px; max-width: 500px; width: 90%; border: 2px solid #f6851b;">
            <h3 style="color: #f6851b; margin-bottom: 20px;">
                <i class="fas fa-coins"></i> Get DAI Tokens
            </h3>
            <div style="color: #94a3b8; margin-bottom: 20px;">
                <p><strong>Step 1:</strong> Get Sepolia ETH from a faucet</p>
                <p><strong>Step 2:</strong> Go to Uniswap on Sepolia network</p>
                <p><strong>Step 3:</strong> Swap ETH for DAI tokens</p>
                <p><strong>DAI Address:</strong> 
                    <code style="background: rgba(255,255,255,0.1); padding: 5px; border-radius: 4px; display: block; margin-top: 5px; word-break: break-all;">
                        0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357
                    </code>
                </p>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="window.open('https://sepoliafaucet.com', '_blank')" 
                        style="background: #667eea; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 120px;">
                    Get ETH
                </button>
                <button onclick="window.open('https://app.uniswap.org/swap', '_blank')" 
                        style="background: #f6851b; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 120px;">
                    Uniswap
                </button>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #64748b; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer;">
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
window.getTestETH = getTestETH;
