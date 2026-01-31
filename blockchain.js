// Blockchain/Wallet Functions - FIXED VERSION
let web3 = null;
let userAccount = null;
let connected = false;
let tokenContract = null;
let walletListeners = false;

// Contract Configuration
const TOKEN_CONFIG = {
    MTK: {
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC Sepolia
        name: 'MTK Game Token',
        symbol: 'MTK',
        decimals: 6,
        etherscan: 'https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
    }
};

// CORRECT ERC20 ABI - NO FAUCET FUNCTION
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "success", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }
];

// Initialize Web3
async function initWeb3() {
    try {
        console.log('initWeb3() called');
        
        if (typeof window.ethereum === 'undefined') {
            console.log('MetaMask not installed');
            showNotification('Please install MetaMask extension!', 'error');
            return false;
        }

        // Check for existing connection
        const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
        });

        console.log('Existing accounts:', accounts);

        if (accounts.length > 0) {
            userAccount = accounts[0];
            web3 = new Web3(window.ethereum);
            connected = true;
            
            // Initialize token contract
            const checksumAddress = web3.utils.toChecksumAddress(TOKEN_CONFIG.MTK.address);
            tokenContract = new web3.eth.Contract(ERC20_ABI, checksumAddress);
            
            console.log('Web3 initialized with existing connection');
            
            // Check network
            const chainId = await web3.eth.getChainId();
            const isSepolia = chainId === 11155111 || chainId === '0xaa36a7';
            
            // Update UI
            updateUIAfterConnection(isSepolia, chainId);
            
            // Get balances
            await updateBalances();
            
            // Set up event listeners
            setupWalletListeners();
            
            return true;
        }
        
        console.log('No existing wallet connection found');
        return false;
    } catch (error) {
        console.error('Web3 initialization error:', error);
        return false;
    }
}

// Connect Wallet
async function connectWallet() {
    try {
        console.log('connectWallet() called');
        
        if (typeof window.ethereum === 'undefined') {
            showNotification('Please install MetaMask browser extension!', 'error');
            return;
        }

        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        console.log('Accounts received:', accounts);
        
        if (accounts.length === 0) {
            showNotification('Please unlock MetaMask!', 'error');
            return;
        }
        
        userAccount = accounts[0];
        web3 = new Web3(window.ethereum);
        connected = true;
        
        // Check network
        const chainId = await web3.eth.getChainId();
        const isSepolia = chainId === 11155111 || chainId === '0xaa36a7';
        
        // Initialize token contract
        const checksumAddress = web3.utils.toChecksumAddress(TOKEN_CONFIG.MTK.address);
        tokenContract = new web3.eth.Contract(ERC20_ABI, checksumAddress);
        
        // Update UI
        updateUIAfterConnection(isSepolia, chainId);
        
        // Get balances
        await updateBalances();
        
        showNotification(`✅ Wallet connected: ${formatAddress(userAccount)}`, 'success');
        
        if (!isSepolia) {
            showNotification('Switch to Sepolia for full functionality', 'warning');
        }
        
        // Set up event listeners
        setupWalletListeners();
        
    } catch (error) {
        console.error('Connection error:', error);
        
        if (error.code === 4001) {
            showNotification('❌ Connection rejected by user', 'error');
        } else if (error.message.includes('Already processing eth_requestAccounts')) {
            showNotification('MetaMask is busy. Please try again.', 'warning');
        } else {
            showNotification('Connection failed: ' + error.message, 'error');
        }
    }
}

// Get MTK Tokens from Faucet - UPDATED TO SHOW INSTRUCTIONS
async function getMTKFromFaucet() {
    if (!connected || !web3) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    // Show instructions since USDC doesn't have faucet
    showNotification('Opening instructions to get tokens...', 'info');
    
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
            <h3 style="color: #f8c555; margin-bottom: 20px;">
                <i class="fas fa-info-circle"></i> Get MTK Tokens
            </h3>
            <div style="color: #94a3b8; margin-bottom: 20px;">
                <p><strong>USDC on Sepolia doesn't have a faucet.</strong></p>
                <p>To get tokens:</p>
                <p>1. Get Sepolia ETH from a faucet</p>
                <p>2. Go to Uniswap (Sepolia network)</p>
                <p>3. Swap ETH for USDC</p>
                <p>4. They'll appear as MTK in the game</p>
                <p><strong>Token Address:</strong></p>
                <code style="background: rgba(255,255,255,0.1); padding: 5px; border-radius: 4px; display: block; margin-top: 5px; word-break: break-all;">
                    0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
                </code>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="window.open('https://sepoliafaucet.com', '_blank')" 
                        style="background: #667eea; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 120px;">
                    Get ETH
                </button>
                <button onclick="window.open('https://app.uniswap.org/swap', '_blank')" 
                        style="background: #f8c555; color: black; border: none; padding: 12px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 120px;">
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

// Mint Game MTK - SIMULATED VERSION (since no faucet)
async function mintGameTokens(amount) {
    console.log('Minting game tokens:', amount);
    
    if (!connected || !web3 || !userAccount) {
        showNotification('Connect wallet first!', 'error');
        return false;
    }
    
    try {
        showPendingOverlay(`Processing ${amount} MTK...`);
        
        // Since USDC doesn't have faucet, we simulate
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        hidePendingOverlay();
        
        // Show instructions for getting real tokens
        const getReal = confirm(
            `Game: ${amount} MTK would be minted\n\n` +
            `USDC token doesn't have a faucet function.\n` +
            `To get real tokens:\n` +
            `1. Get Sepolia ETH from faucet\n` +
            `2. Swap for USDC on Uniswap\n\n` +
            `Open instructions?`
        );
        
        if (getReal) {
            getMTKFromFaucet();
        } else {
            // Update game balance (simulated)
            if (window.walletTokenBalance !== undefined) {
                window.walletTokenBalance += amount;
                updateElement('walletTokenBalance', window.walletTokenBalance.toFixed(4));
                showNotification(`🎮 ${amount} MTK added to game balance`, 'success');
            }
        }
        
        return true;
        
    } catch (error) {
        hidePendingOverlay();
        console.error('Mint error:', error);
        showNotification('Mint failed: ' + error.message, 'error');
        return false;
    }
}

// Update All Balances
async function updateBalances() {
    if (!connected || !web3) {
        console.log('Cannot update balances: not connected');
        return;
    }
    
    try {
        console.log('Updating balances...');
        
        // Get ETH balance
        const ethBalance = await web3.eth.getBalance(userAccount);
        const ethFormatted = web3.utils.fromWei(ethBalance, 'ether');
        updateElement('ethBalance', `${parseFloat(ethFormatted).toFixed(4)} ETH`);
        
        // Get MTK token balance
        if (tokenContract && userAccount) {
            try {
                const tokenBalance = await tokenContract.methods.balanceOf(userAccount).call();
                const decimals = await tokenContract.methods.decimals().call();
                const tokenFormatted = tokenBalance / Math.pow(10, decimals);
                
                // Update global variable and UI
                window.walletTokenBalance = tokenFormatted;
                updateElement('walletTokenBalance', tokenFormatted.toFixed(4));
                updateElement('statsWalletBalance', `${tokenFormatted.toFixed(4)} MTK`);
                
                console.log('Token balance:', tokenFormatted);
            } catch (tokenError) {
                console.error('Token balance error:', tokenError);
                // Set to 0 if error
                window.walletTokenBalance = 0;
                updateElement('walletTokenBalance', '0');
            }
        }
        
        // Get latest block
        const blockNumber = await web3.eth.getBlockNumber();
        updateElement('lastBlock', blockNumber);
        
    } catch (error) {
        console.error('Balance update error:', error);
    }
}

// Withdraw Tokens - FIXED (real transfer works)
async function withdrawTokens() {
    if (!connected || !web3 || !tokenContract) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    const amountInput = document.getElementById('withdrawAmount');
    const recipientInput = document.getElementById('recipientAddress');
    
    const amount = parseFloat(amountInput?.value);
    let recipient = recipientInput?.value?.trim();
    
    // Use own address if recipient is empty
    if (!recipient) {
        recipient = userAccount;
        recipientInput.value = userAccount;
    }
    
    // Validation
    if (!amount || amount <= 0) {
        showNotification('Enter valid amount', 'error');
        return;
    }
    
    if (!recipient || !web3.utils.isAddress(recipient)) {
        showNotification('Enter valid address', 'error');
        return;
    }
    
    const walletBalance = window.walletTokenBalance || 0;
    if (walletBalance < amount) {
        showNotification(`Insufficient balance! You have ${walletBalance.toFixed(4)} MTK`, 'error');
        return;
    }
    
    try {
        showPendingOverlay('Processing withdrawal...');
        
        const decimals = await tokenContract.methods.decimals().call();
        const amountInWei = (amount * Math.pow(10, decimals)).toString();
        
        // Check ETH balance for gas
        const ethBalance = await web3.eth.getBalance(userAccount);
        const ethBalanceFormatted = parseFloat(web3.utils.fromWei(ethBalance, 'ether'));
        
        if (ethBalanceFormatted < 0.001) {
            hidePendingOverlay();
            showNotification(`Insufficient ETH for gas! You need ~0.001 ETH\nYou have: ${ethBalanceFormatted.toFixed(6)} ETH`, 'error');
            return;
        }
        
        const tx = await tokenContract.methods.transfer(
            recipient, 
            amountInWei
        ).send({ 
            from: userAccount,
            gas: 100000
        });
        
        hidePendingOverlay();
        showNotification(`✅ Successfully sent ${amount} MTK!`, 'success');
        
        // Update wallet balance
        window.walletTokenBalance -= amount;
        
        // Update UI
        updateElement('walletTokenBalance', window.walletTokenBalance.toFixed(4));
        
        // Clear form
        if (amountInput) amountInput.value = '';
        
        // Add to transaction history
        addTransactionToHistory(tx.transactionHash, amount, recipient, 'success');
        
        // Refresh balances
        setTimeout(() => updateBalances(), 3000);
        
    } catch (error) {
        hidePendingOverlay();
        console.error('Withdrawal error:', error);
        
        if (error.code === 4001) {
            showNotification('Transaction rejected by user', 'error');
        } else if (error.message.includes('insufficient funds')) {
            showNotification('Insufficient ETH for gas fees', 'error');
        } else if (error.message.includes('Returned values aren\'t valid')) {
            showNotification('Token transfer failed. Check your token balance.', 'error');
        } else {
            showNotification('Withdrawal failed: ' + error.message, 'error');
        }
    }
}

// Update UI after connection
function updateUIAfterConnection(isSepolia, chainId) {
    updateElement('walletStatus', 'Connected ✓');
    updateElement('accountAddress', formatAddress(userAccount));
    
    if (isSepolia) {
        updateElement('network', 'Sepolia Testnet ✓');
    } else {
        updateElement('network', `Chain ${chainId} (Switch to Sepolia)`);
    }
    
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Disconnect';
        connectBtn.onclick = disconnectWallet;
    }
    
    const walletStatus = document.querySelector('.wallet-status');
    if (walletStatus) {
        walletStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Connected</span>';
        walletStatus.classList.add('connected');
    }
}

// Setup wallet listeners
function setupWalletListeners() {
    if (!walletListeners && window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        window.ethereum.on('disconnect', handleDisconnect);
        walletListeners = true;
        console.log('Wallet listeners set up');
    }
}

// Handle Account Changes
function handleAccountsChanged(accounts) {
    console.log('Accounts changed:', accounts);
    
    if (accounts.length === 0) {
        disconnectWallet();
    } else if (accounts[0] !== userAccount) {
        userAccount = accounts[0];
        updateElement('accountAddress', formatAddress(userAccount));
        showNotification('Account changed', 'info');
        updateBalances();
    }
}

// Handle Chain Changes
function handleChainChanged(chainId) {
    console.log('Chain changed to:', chainId);
    window.location.reload();
}

// Handle Disconnect
function handleDisconnect(error) {
    console.log('Wallet disconnected:', error);
    disconnectWallet();
}

// Disconnect Wallet
function disconnectWallet() {
    console.log('Disconnecting wallet...');
    
    connected = false;
    web3 = null;
    userAccount = null;
    tokenContract = null;
    
    // Update UI
    updateElement('walletStatus', 'Not Connected');
    updateElement('accountAddress', 'Not connected');
    updateElement('network', '-');
    updateElement('ethBalance', '0 ETH');
    updateElement('walletTokenBalance', '0 MTK');
    
    // Reset connect button
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect Wallet';
        connectBtn.onclick = connectWallet;
    }
    
    // Update wallet status display
    const walletStatus = document.querySelector('.wallet-status');
    if (walletStatus) {
        walletStatus.innerHTML = '<i class="fas fa-plug"></i><span>Not Connected</span>';
        walletStatus.classList.remove('connected');
    }
    
    showNotification('Wallet disconnected', 'info');
}

// Format address helper
function formatAddress(address) {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Add Transaction to History
function addTransactionToHistory(txHash, amount, recipient, status) {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;
    
    // Remove empty state if present
    const emptyItem = transactionsList.querySelector('.transaction-item.empty');
    if (emptyItem) {
        emptyItem.remove();
    }
    
    const transactionItem = document.createElement('div');
    transactionItem.className = `transaction-item ${status}`;
    
    const time = new Date().toLocaleTimeString();
    const shortHash = txHash.substring(0, 10) + '...' + txHash.substring(62);
    const shortRecipient = recipient.substring(0, 6) + '...' + recipient.substring(38);
    
    let icon = 'fa-exchange-alt';
    if (status === 'success') icon = 'fa-check-circle';
    if (status === 'failed') icon = 'fa-times-circle';
    if (status === 'pending') icon = 'fa-clock';
    
    transactionItem.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="transaction-details">
            <div class="transaction-amount">${amount} MTK</div>
            <div class="transaction-to">To: ${shortRecipient}</div>
            <div class="transaction-hash">${shortHash}</div>
        </div>
        <div class="transaction-time">${time}</div>
    `;
    
    transactionsList.insertBefore(transactionItem, transactionsList.firstChild);
    
    // Limit to 10 transactions
    const items = transactionsList.querySelectorAll('.transaction-item:not(.empty)');
    if (items.length > 10) {
        transactionsList.removeChild(items[items.length - 1]);
    }
}

// Switch Network to Sepolia
async function switchToSepolia() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
        });
        showNotification('Switched to Sepolia!', 'success');
        setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
        if (error.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0xaa36a7',
                        chainName: 'Sepolia Test Network',
                        nativeCurrency: {
                            name: 'Sepolia ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: ['https://rpc.sepolia.org'],
                        blockExplorerUrls: ['https://sepolia.etherscan.io']
                    }]
                });
                showNotification('Sepolia network added!', 'success');
            } catch (addError) {
                showNotification('Failed to add Sepolia network', 'error');
            }
        } else {
            showNotification('Failed to switch network', 'error');
        }
    }
}

// Check MTK Balance
async function checkMTKBalance() {
    if (!connected || !web3 || !userAccount) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    try {
        if (tokenContract) {
            const balance = await tokenContract.methods.balanceOf(userAccount).call();
            const decimals = await tokenContract.methods.decimals().call();
            const formatted = balance / Math.pow(10, decimals);
            
            showNotification(`Your MTK Balance: ${formatted.toFixed(4)}`, 'success');
            return formatted;
        } else {
            const balance = window.walletTokenBalance || 0;
            showNotification(`Your MTK Balance: ${balance.toFixed(4)} MTK`, 'success');
            return balance;
        }
    } catch (error) {
        console.error('Balance check error:', error);
        showNotification('Failed to check balance', 'error');
        return 0;
    }
}

// Export functions
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.getMTKFromFaucet = getMTKFromFaucet;
window.mintGameTokens = mintGameTokens;
window.checkMTKBalance = checkMTKBalance;
window.withdrawTokens = withdrawTokens;
window.switchToSepolia = switchToSepolia;
window.initWeb3 = initWeb3;
window.formatAddress = formatAddress;

// Auto-initialize
setTimeout(async () => {
    if (typeof window.ethereum !== 'undefined') {
        await initWeb3();
    }
}, 100);
