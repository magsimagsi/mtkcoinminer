// Blockchain/Wallet Functions
let web3 = null;
let userAccount = null;
let connected = false;
let tokenContract = null;
let walletListeners = false;

// Contract Configuration - FIXED ADDRESS (checksum format)
const TOKEN_CONFIG = {
    MTK: {
        address: '0x3D6Eb3Fc92C799CB6b8716c5c8E5f8A78eFE8A43', // This is correct
        name: 'MTK Game Token',
        symbol: 'MTK',
        decimals: 18,
        etherscan: 'https://sepolia.etherscan.io/address/0x3D6Eb3Fc92C799CB6b8716c5c8E5f8A78eFE8A43'
    },
    UNI: {
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        name: 'Uniswap',
        symbol: 'UNI',
        decimals: 18
    },
    LINK: {
        address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
        name: 'Chainlink',
        symbol: 'LINK',
        decimals: 18
    },
    DAI: {
        address: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6',
        name: 'DAI Stablecoin',
        symbol: 'DAI',
        decimals: 18
    }
};

// ERC20 ABI - UPDATED WITH CORRECT FUNCTION SIGNATURES
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
        "constant": false,
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "faucet",
        "outputs": [],
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

// Initialize Web3 and Check Connection
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
            
            // IMPORTANT: Convert address to checksum format
            const checksumAddress = web3.utils.toChecksumAddress(TOKEN_CONFIG.MTK.address);
            console.log('Original address:', TOKEN_CONFIG.MTK.address);
            console.log('Checksum address:', checksumAddress);
            
            // Initialize token contract with checksum address
            tokenContract = new web3.eth.Contract(ERC20_ABI, checksumAddress);
            
            console.log('Web3 initialized with existing connection:', userAccount);
            
            // Check network
            const chainId = await web3.eth.getChainId();
            const isSepolia = chainId === 11155111 || chainId === '0xaa36a7';
            
            // Update UI
            updateUIAfterConnection(isSepolia, chainId);
            
            // Get balances
            await updateBalances();
            
            // Set up event listeners
            setupWalletListeners();
            
            showNotification('Auto-connected to existing wallet', 'success');
            return true;
        }
        
        console.log('No existing wallet connection found');
        return false;
    } catch (error) {
        console.error('Web3 initialization error:', error);
        showNotification('Connection error: ' + error.message, 'error');
        return false;
    }
}

// Connect Wallet - FIXED VERSION
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
        
        // Convert address to checksum format
        const checksumAddress = web3.utils.toChecksumAddress(TOKEN_CONFIG.MTK.address);
        console.log('Using checksum address:', checksumAddress);
        
        // Initialize token contract with checksum address
        tokenContract = new web3.eth.Contract(ERC20_ABI, checksumAddress);
        
        // Update UI
        updateUIAfterConnection(isSepolia, chainId);
        
        // Get balances
        await updateBalances();
        
        showNotification(`✅ Wallet connected: ${formatAddress(userAccount)}`, 'success');
        
        if (!isSepolia) {
            const switchConfirm = confirm('You are not on Sepolia network. Switch to Sepolia for MTK tokens?');
            if (switchConfirm) {
                await switchToSepolia();
            }
        }
        
        // Set up event listeners
        setupWalletListeners();
        
    } catch (error) {
        console.error('Connection error:', error);
        
        if (error.code === 4001) {
            showNotification('❌ Connection rejected by user', 'error');
        } else if (error.message.includes('Already processing eth_requestAccounts')) {
            showNotification('MetaMask is busy. Please try again.', 'warning');
        } else if (error.message.includes('Provided address')) {
            // Handle address validation error
            console.error('Address validation error:', error);
            showNotification('Contract address issue detected. Please refresh the page.', 'error');
        } else {
            showNotification('Connection failed: ' + error.message, 'error');
        }
    }
}

// Update UI after connection
function updateUIAfterConnection(isSepolia, chainId) {
    console.log('Updating UI after connection, isSepolia:', isSepolia);
    
    updateElement('walletStatus', 'Connected ✓');
    updateElement('accountAddress', formatAddress(userAccount));
    
    if (isSepolia) {
        updateElement('network', 'Sepolia Testnet ✓');
    } else {
        const networkName = getNetworkName(chainId);
        updateElement('network', `${networkName} (Switch to Sepolia)`);
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

// Helper: Get network name from chain ID
function getNetworkName(chainId) {
    const chainIdNum = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
    
    switch (chainIdNum) {
        case 1: return 'Mainnet';
        case 11155111: return 'Sepolia';
        case 5: return 'Goerli';
        case 137: return 'Polygon';
        case 42161: return 'Arbitrum';
        default: return `Chain ${chainIdNum}`;
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
        
        // Reinitialize contract with new account
        if (web3) {
            const checksumAddress = web3.utils.toChecksumAddress(TOKEN_CONFIG.MTK.address);
            tokenContract = new web3.eth.Contract(ERC20_ABI, checksumAddress);
            updateBalances();
        }
    }
}

// Handle Chain Changes
function handleChainChanged(chainId) {
    console.log('Chain changed to:', chainId);
    // Reload page to reinitialize with new network
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
    
    // Clear transaction history
    const transactionsList = document.getElementById('transactionsList');
    if (transactionsList) {
        transactionsList.innerHTML = `
            <div class="transaction-item empty">
                <i class="fas fa-history"></i>
                <span>No transactions yet</span>
            </div>
        `;
    }
    
    // Remove event listeners
    if (window.ethereum && walletListeners) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
        walletListeners = false;
    }
    
    showNotification('Wallet disconnected', 'info');
}

// Get MTK Tokens from Faucet - FIXED VERSION
async function getMTKFromFaucet() {
    if (!connected || !web3 || !tokenContract) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    try {
        showPendingOverlay('Getting 100 MTK from faucet...');
        
        // Use toChecksumAddress for the user account too
        const checksumUserAccount = web3.utils.toChecksumAddress(userAccount);
        
        const tx = await tokenContract.methods.faucet(
            checksumUserAccount,
            web3.utils.toWei('100', 'ether')
        ).send({
            from: userAccount,
            gas: 200000
        });
        
        hidePendingOverlay();
        showNotification('✅ Received 100 MTK tokens!', 'success');
        
        // Add to transaction history
        addTransactionToHistory(tx.transactionHash, 100, userAccount, 'faucet');
        
        // Update balance
        await updateBalances();
        
    } catch (error) {
        hidePendingOverlay();
        console.error('Faucet error:', error);
        
        if (error.code === 4001) {
            showNotification('Transaction rejected', 'error');
        } else if (error.message.includes('insufficient funds')) {
            showNotification('Need ETH for gas fees', 'error');
        } else if (error.message.includes('Provided address')) {
            showNotification('Address format issue. Please refresh page.', 'error');
        } else {
            showNotification('Faucet error: ' + error.message, 'error');
        }
    }
}

// Mint Game MTK to Real Tokens (For claim function) - FIXED
async function mintGameTokens(amount) {
    console.log('Minting game tokens:', amount);
    
    if (!connected || !web3 || !userAccount) {
        showNotification('Connect wallet first!', 'error');
        return false;
    }
    
    try {
        showPendingOverlay(`Converting ${amount} game MTK to real tokens...`);
        
        // Use checksum addresses
        const checksumUserAccount = web3.utils.toChecksumAddress(userAccount);
        
        const tx = await tokenContract.methods.faucet(
            checksumUserAccount,
            web3.utils.toWei(amount.toString(), 'ether')
        ).send({
            from: userAccount,
            gas: 200000
        });
        
        console.log('Mint transaction:', tx);
        
        hidePendingOverlay();
        showNotification(`✅ ${amount} MTK added to your wallet!`, 'success');
        
        // Update wallet balance
        if (window.walletTokenBalance !== undefined) {
            window.walletTokenBalance += amount;
        }
        
        // Add to transaction history
        addTransactionToHistory(tx.transactionHash, amount, userAccount, 'faucet');
        
        // Update balances
        await updateBalances();
        
        return true;
        
    } catch (error) {
        hidePendingOverlay();
        console.error('Mint error:', error);
        
        if (error.code === 4001) {
            showNotification('Transaction rejected by user', 'error');
        } else if (error.message.includes('insufficient funds')) {
            showNotification('Insufficient ETH for gas fees', 'error');
        } else if (error.message.includes('Provided address')) {
            showNotification('Address issue. Please refresh page.', 'error');
        } else {
            showNotification('Mint failed: ' + error.message, 'error');
        }
        return false;
    }
}

// Update All Balances - FIXED
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
                const checksumUserAccount = web3.utils.toChecksumAddress(userAccount);
                const tokenBalance = await tokenContract.methods.balanceOf(checksumUserAccount).call();
                const decimals = await tokenContract.methods.decimals().call();
                const tokenFormatted = tokenBalance / Math.pow(10, decimals);
                
                // Update global variable and UI
                window.walletTokenBalance = tokenFormatted;
                updateElement('walletTokenBalance', tokenFormatted.toFixed(4));
                updateElement('statsWalletBalance', `${tokenFormatted.toFixed(4)} MTK`);
                
                console.log('Token balance:', tokenFormatted);
            } catch (tokenError) {
                console.error('Token balance error:', tokenError);
                // Try with non-checksum address as fallback
                try {
                    const tokenBalance = await tokenContract.methods.balanceOf(userAccount).call();
                    const decimals = await tokenContract.methods.decimals().call();
                    const tokenFormatted = tokenBalance / Math.pow(10, decimals);
                    
                    window.walletTokenBalance = tokenFormatted;
                    updateElement('walletTokenBalance', tokenFormatted.toFixed(4));
                    updateElement('statsWalletBalance', `${tokenFormatted.toFixed(4)} MTK`);
                } catch (fallbackError) {
                    console.error('Fallback balance error:', fallbackError);
                }
            }
        }
        
        // Get latest block
        const blockNumber = await web3.eth.getBlockNumber();
        updateElement('lastBlock', blockNumber);
        
    } catch (error) {
        console.error('Balance update error:', error);
    }
}

// Estimate Withdrawal Gas - FIXED
async function estimateWithdrawGas() {
    if (!connected || !web3 || !tokenContract) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    const amountInput = document.getElementById('withdrawAmount');
    const recipientInput = document.getElementById('recipientAddress');
    
    if (!amountInput || !recipientInput) {
        showNotification('Form fields not found!', 'error');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    let recipient = recipientInput.value.trim();
    
    // Use own address if recipient is empty
    if (!recipient) {
        recipient = userAccount;
        recipientInput.value = userAccount;
    }
    
    // Validation
    if (!amount || amount <= 0 || isNaN(amount)) {
        showNotification('Enter valid amount (greater than 0)', 'error');
        return;
    }
    
    if (!recipient || !web3.utils.isAddress(recipient)) {
        showNotification('Invalid Ethereum address', 'error');
        return;
    }
    
    const walletBalance = window.walletTokenBalance || 0;
    if (walletBalance < amount) {
        showNotification(`Insufficient balance! You have ${walletBalance.toFixed(4)} MTK`, 'error');
        return;
    }
    
    try {
        showPendingOverlay('Estimating gas...');
        
        const decimals = await tokenContract.methods.decimals().call();
        const amountInWei = (amount * Math.pow(10, decimals)).toString();
        
        // Use checksum addresses
        const checksumRecipient = web3.utils.toChecksumAddress(recipient);
        const checksumUserAccount = web3.utils.toChecksumAddress(userAccount);
        
        const estimatedGas = await tokenContract.methods.transfer(
            checksumRecipient, 
            amountInWei
        ).estimateGas({ from: checksumUserAccount });
        
        const gasPrice = await web3.eth.getGasPrice();
        const gasCostEth = estimatedGas * gasPrice / Math.pow(10, 18);
        
        // Update gas info display
        const gasInfo = document.getElementById('withdrawGasInfo');
        if (gasInfo) {
            gasInfo.innerHTML = `
                <i class="fas fa-gas-pump"></i>
                <div>
                    <strong>Gas Estimate</strong><br>
                    Units: ${estimatedGas.toLocaleString()}<br>
                    Price: ${(gasPrice / Math.pow(10, 9)).toFixed(2)} Gwei<br>
                    Cost: ~${gasCostEth.toFixed(6)} ETH<br>
                    <small style="color: #94a3b8;">Sepolia Testnet</small>
                </div>
            `;
            gasInfo.style.display = 'flex';
        }
        
        // Enable withdraw button
        const withdrawBtn = document.querySelector('.btn-withdraw');
        if (withdrawBtn) {
            withdrawBtn.disabled = false;
            withdrawBtn.textContent = `Send ${amount} MTK`;
        }
        
        hidePendingOverlay();
        showNotification('Gas estimation complete!', 'success');
        
    } catch (error) {
        hidePendingOverlay();
        console.error('Gas estimation error:', error);
        
        if (error.message.includes('insufficient funds')) {
            showNotification('Insufficient ETH for gas fees', 'error');
        } else if (error.message.includes('Provided address')) {
            showNotification('Address format issue. Using fallback method.', 'warning');
            // Try with non-checksum as fallback
            try {
                const decimals = await tokenContract.methods.decimals().call();
                const amountInWei = (amount * Math.pow(10, decimals)).toString();
                
                const estimatedGas = await tokenContract.methods.transfer(
                    recipient, 
                    amountInWei
                ).estimateGas({ from: userAccount });
                
                const gasPrice = await web3.eth.getGasPrice();
                const gasCostEth = estimatedGas * gasPrice / Math.pow(10, 18);
                
                const gasInfo = document.getElementById('withdrawGasInfo');
                if (gasInfo) {
                    gasInfo.innerHTML = `
                        <i class="fas fa-gas-pump"></i>
                        <div>
                            <strong>Gas Estimate (Fallback)</strong><br>
                            Units: ${estimatedGas.toLocaleString()}<br>
                            Price: ${(gasPrice / Math.pow(10, 9)).toFixed(2)} Gwei<br>
                            Cost: ~${gasCostEth.toFixed(6)} ETH<br>
                            <small style="color: #94a3b8;">Sepolia Testnet</small>
                        </div>
                    `;
                    gasInfo.style.display = 'flex';
                }
                
                const withdrawBtn = document.querySelector('.btn-withdraw');
                if (withdrawBtn) {
                    withdrawBtn.disabled = false;
                    withdrawBtn.textContent = `Send ${amount} MTK`;
                }
                
                showNotification('Gas estimation complete (fallback)!', 'success');
            } catch (fallbackError) {
                showNotification('Gas estimation failed: ' + fallbackError.message, 'error');
            }
        } else {
            showNotification('Gas estimation failed: ' + error.message, 'error');
        }
    }
}

// Withdraw Tokens - FIXED
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
        
        // Try with checksum address first
        let tx;
        try {
            const checksumRecipient = web3.utils.toChecksumAddress(recipient);
            tx = await tokenContract.methods.transfer(
                checksumRecipient, 
                amountInWei
            ).send({ 
                from: userAccount,
                gas: 200000
            });
        } catch (checksumError) {
            console.log('Checksum failed, trying without:', checksumError);
            // Fallback to non-checksum
            tx = await tokenContract.methods.transfer(
                recipient, 
                amountInWei
            ).send({ 
                from: userAccount,
                gas: 200000
            });
        }
        
        // Update pending overlay
        const pendingTxHash = document.getElementById('pendingTxHash');
        const pendingText = document.getElementById('pendingText');
        
        if (pendingTxHash) {
            pendingTxHash.innerHTML = `
                Tx Hash: ${tx.transactionHash.substring(0, 20)}...<br>
                <a href="https://sepolia.etherscan.io/tx/${tx.transactionHash}" 
                   target="_blank" 
                   style="color: #f8c555; font-size: 0.9em;">
                   View on Etherscan
                </a>
            `;
        }
        if (pendingText) {
            pendingText.textContent = 'Waiting for confirmation...';
        }
        
        // Wait for transaction
        setTimeout(async () => {
            try {
                const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
                
                if (receipt && receipt.status) {
                    hidePendingOverlay();
                    
                    // Update wallet balance
                    window.walletTokenBalance -= amount;
                    window.totalWithdrawn = (window.totalWithdrawn || 0) + amount;
                    
                    // Update UI
                    updateElement('walletTokenBalance', window.walletTokenBalance.toFixed(4));
                    updateElement('totalWithdrawn', window.totalWithdrawn);
                    
                    // Clear form
                    if (amountInput) amountInput.value = '';
                    
                    // Add to transaction history
                    addTransactionToHistory(tx.transactionHash, amount, recipient, 'success');
                    
                    showNotification(`✅ Successfully sent ${amount} MTK!`, 'success');
                    
                    // Refresh balances
                    setTimeout(() => updateBalances(), 3000);
                    
                } else {
                    hidePendingOverlay();
                    showNotification('Transaction pending or failed', 'warning');
                    addTransactionToHistory(tx.transactionHash, amount, recipient, 'failed');
                }
                
            } catch (error) {
                hidePendingOverlay();
                showNotification('Transaction sent! Check Etherscan.', 'info');
                addTransactionToHistory(tx.transactionHash, amount, recipient, 'pending');
            }
        }, 3000);
        
    } catch (error) {
        hidePendingOverlay();
        console.error('Withdrawal error:', error);
        
        if (error.code === 4001) {
            showNotification('Transaction rejected by user', 'error');
        } else if (error.message.includes('insufficient funds')) {
            showNotification('Insufficient ETH for gas fees', 'error');
        } else if (error.message.includes('Provided address')) {
            showNotification('Address format issue. Please refresh page.', 'error');
        } else {
            showNotification('Withdrawal failed: ' + error.message, 'error');
        }
    }
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
    if (status === 'faucet') icon = 'fa-gift';
    
    transactionItem.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="transaction-details">
            <div class="transaction-amount">${amount} MTK</div>
            <div class="transaction-to">${status === 'faucet' ? 'From Faucet' : 'To: ' + shortRecipient}</div>
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

// Refresh Transactions
function refreshTransactions() {
    if (!connected) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    updateBalances();
    showNotification('Balances refreshed!', 'success');
}

// Switch Network to Sepolia
async function switchToSepolia() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
        });
        showNotification('Switched to Sepolia!', 'success');
        
        // Reload after switching network
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        if (error.code === 4902) {
            // Add Sepolia network
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

// Add MTK to MetaMask
async function addMTKToMetaMask() {
    if (!window.ethereum) {
        showNotification('MetaMask not installed', 'error');
        return;
    }
    
    if (!connected) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    try {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: TOKEN_CONFIG.MTK.address,
                    symbol: 'MTK',
                    decimals: 18,
                    image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png'
                },
            },
        });
        showNotification('MTK token added to MetaMask!', 'success');
    } catch (error) {
        console.error('Error adding token:', error);
        showNotification('Failed to add token to MetaMask', 'error');
    }
}

// Format address helper
function formatAddress(address) {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Check MTK Balance - FIXED
async function checkMTKBalance() {
    if (!connected || !web3 || !userAccount) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    try {
        // Try checksum address first
        let balance;
        try {
            const checksumUserAccount = web3.utils.toChecksumAddress(userAccount);
            balance = await tokenContract.methods.balanceOf(checksumUserAccount).call();
        } catch (checksumError) {
            console.log('Checksum failed, trying without:', checksumError);
            balance = await tokenContract.methods.balanceOf(userAccount).call();
        }
        
        const decimals = await tokenContract.methods.decimals().call();
        const formatted = balance / Math.pow(10, decimals);
        
        showNotification(`Your MTK Balance: ${formatted.toFixed(4)} MTK`, 'success');
        return formatted;
    } catch (error) {
        console.error('Balance check error:', error);
        showNotification('Failed to check balance', 'error');
        return 0;
    }
}

// Verify Connection Status
async function verifyConnection() {
    if (!window.ethereum) {
        return { connected: false, reason: 'MetaMask not installed' };
    }
    
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        return {
            connected: accounts.length > 0,
            account: accounts[0] || null,
            chainId: chainId,
            isSepolia: chainId === '0xaa36a7' || chainId === 11155111
        };
    } catch (error) {
        return { connected: false, reason: error.message };
    }
}

// Auto-connect if MetaMask is already connected
async function autoConnectIfConnected() {
    console.log('Checking for existing MetaMask connection...');
    
    if (typeof window.ethereum === 'undefined') {
        console.log('MetaMask not installed');
        return false;
    }
    
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log('Existing accounts:', accounts);
        
        if (accounts.length > 0) {
            console.log('Found existing connection, auto-connecting...');
            
            userAccount = accounts[0];
            web3 = new Web3(window.ethereum);
            connected = true;
            
            // Convert address to checksum format
            const checksumAddress = web3.utils.toChecksumAddress(TOKEN_CONFIG.MTK.address);
            tokenContract = new web3.eth.Contract(ERC20_ABI, checksumAddress);
            
            // Update UI
            updateElement('walletStatus', 'Connected ✓');
            updateElement('accountAddress', formatAddress(userAccount));
            
            const walletStatus = document.querySelector('.wallet-status');
            if (walletStatus) {
                walletStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Connected</span>';
                walletStatus.classList.add('connected');
            }
            
            const connectBtn = document.getElementById('connectBtn');
            if (connectBtn) {
                connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Disconnect';
                connectBtn.onclick = disconnectWallet;
            }
            
            // Check network
            const chainId = await web3.eth.getChainId();
            const isSepolia = chainId === 11155111 || chainId === '0xaa36a7';
            updateElement('network', isSepolia ? 'Sepolia Testnet ✓' : `Chain ${chainId}`);
            
            // Get balances
            await updateBalances();
            
            setupWalletListeners();
            
            console.log('Auto-connect successful!');
            return true;
        }
        
        console.log('No existing connection found');
        return false;
        
    } catch (error) {
        console.error('Auto-connect error:', error);
        return false;
    }
}

// Debug function
function debugWallet() {
    console.log('=== WALLET DEBUG INFO ===');
    console.log('1. MetaMask installed:', typeof window.ethereum !== 'undefined');
    console.log('2. Window connected:', window.connected);
    console.log('3. User account:', window.userAccount);
    console.log('4. Web3 initialized:', window.web3 !== null);
    console.log('5. Token contract:', window.tokenContract !== null);
    console.log('6. MTK balance:', window.walletTokenBalance || 0);
    
    if (typeof verifyConnection === 'function') {
        verifyConnection().then(status => {
            console.log('7. Verified connection:', status);
        });
    }
    
    alert('Check browser console (F12) for debug info!');
}

// Export functions
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.estimateWithdrawGas = estimateWithdrawGas;
window.withdrawTokens = withdrawTokens;
window.refreshTransactions = refreshTransactions;
window.switchToSepolia = switchToSepolia;
window.getMTKFromFaucet = getMTKFromFaucet;
window.addMTKToMetaMask = addMTKToMetaMask;
window.mintGameTokens = mintGameTokens;
window.checkMTKBalance = checkMTKBalance;
window.checkAndFixConnection = checkAndFixConnection;
window.verifyConnection = verifyConnection;
window.initWeb3 = initWeb3;
window.autoConnectIfConnected = autoConnectIfConnected;
window.formatAddress = formatAddress;
window.debugWallet = debugWallet;

// Auto-initialize when script loads
setTimeout(async () => {
    if (typeof window.ethereum !== 'undefined') {
        await initWeb3();
    }
}, 100);
