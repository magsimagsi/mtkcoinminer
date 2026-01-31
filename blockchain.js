// Blockchain/Wallet Functions
let web3 = null;
let userAccount = null;
let connected = false;
let tokenContract = null;
let walletListeners = false;

// Contract Configuration
const TOKEN_CONFIG = {
    MTK: {
        address: '0x3D6Eb3Fc92C799CB6b8716c5c8E5f8A78eFE8A43',
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

// ERC20 ABI
const ERC20_ABI = [
    {"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"type":"function"},
    {"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"type":"function"},
    {"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"},
    {"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"},
    {"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"type":"function"},
    {"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"faucet","outputs":[],"type":"function"}
];

// Initialize Web3 and Check Connection
async function initWeb3() {
    try {
        if (typeof window.ethereum === 'undefined') {
            console.log('MetaMask not installed');
            return false;
        }

        // Check for existing connection
        const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
        });

        if (accounts.length > 0) {
            userAccount = accounts[0];
            web3 = new Web3(window.ethereum);
            connected = true;
            
            // Initialize token contract
            tokenContract = new web3.eth.Contract(ERC20_ABI, TOKEN_CONFIG.MTK.address);
            
            console.log('Web3 initialized with existing connection:', userAccount);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Web3 initialization error:', error);
        return false;
    }
}

// Connect Wallet
async function connectWallet() {
    try {
        console.log('Connecting wallet...');
        
        if (typeof window.ethereum === 'undefined') {
            showNotification('Please install MetaMask!', 'error');
            return;
        }

        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (accounts.length === 0) {
            showNotification('Please unlock MetaMask!', 'error');
            return;
        }
        
        userAccount = accounts[0];
        web3 = new Web3(window.ethereum);
        connected = true;
        
        // Check network
        const chainId = await web3.eth.getChainId();
        const isSepolia = chainId === 11155111;
        
        // Initialize token contract
        tokenContract = new web3.eth.Contract(ERC20_ABI, TOKEN_CONFIG.MTK.address);
        
        // Update UI
        updateUIAfterConnection(isSepolia);
        
        // Get balances
        await updateBalances();
        
        showNotification(`Wallet connected: ${formatAddress(userAccount)}`, 'success');
        
        if (!isSepolia) {
            showNotification('Switch to Sepolia for MTK tokens', 'warning');
        }
        
        // Set up event listeners
        setupWalletListeners();
        
    } catch (error) {
        console.error('Connection error:', error);
        
        if (error.code === 4001) {
            showNotification('Connection rejected by user', 'error');
        } else if (error.message.includes('Already processing eth_requestAccounts')) {
            showNotification('MetaMask is busy. Please try again.', 'warning');
        } else {
            showNotification('Connection failed: ' + error.message, 'error');
        }
    }
}

// Update UI after connection
function updateUIAfterConnection(isSepolia) {
    updateElement('walletStatus', 'Connected ✓');
    updateElement('accountAddress', formatAddress(userAccount));
    updateElement('network', isSepolia ? 'Sepolia Testnet ✓' : `Network ${chainId}`);
    
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
        
        // Reinitialize contract with new account
        if (web3) {
            tokenContract = new web3.eth.Contract(ERC20_ABI, TOKEN_CONFIG.MTK.address);
            updateBalances();
        }
    }
}

// Handle Chain Changes
function handleChainChanged(chainId) {
    console.log('Chain changed to:', chainId);
    setTimeout(() => window.location.reload(), 100);
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

// Check and fix wallet connection
async function checkAndFixConnection() {
    console.log('Checking wallet connection...');
    
    if (typeof window.ethereum === 'undefined') {
        console.log('MetaMask not installed');
        return false;
    }
    
    try {
        const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
        });
        
        console.log('MetaMask accounts:', accounts);
        
        if (accounts.length === 0) {
            console.log('No accounts connected');
            window.connected = false;
            window.userAccount = null;
            return false;
        }
        
        // Check if our variables match MetaMask
        if (!window.userAccount || window.userAccount.toLowerCase() !== accounts[0].toLowerCase()) {
            console.log('Account mismatch, fixing...');
            window.userAccount = accounts[0];
            window.connected = true;
            
            // Initialize web3 if needed
            if (!window.web3) {
                window.web3 = new Web3(window.ethereum);
            }
            
            // Initialize token contract
            if (window.web3 && !tokenContract) {
                tokenContract = new web3.eth.Contract(ERC20_ABI, TOKEN_CONFIG.MTK.address);
            }
            
            // Update UI
            updateElement('accountAddress', formatAddress(userAccount));
            updateElement('walletStatus', 'Connected ✓');
            
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
            
            console.log('Connection fixed successfully');
            return true;
        }
        
        console.log('Connection is valid');
        return true;
        
    } catch (error) {
        console.error('Connection check error:', error);
        return false;
    }
}

// Update All Balances
async function updateBalances() {
    if (!connected || !web3) return;
    
    try {
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
                
            } catch (tokenError) {
                console.error('Token balance error:', tokenError);
            }
        }
        
        // Get latest block
        const blockNumber = await web3.eth.getBlockNumber();
        updateElement('lastBlock', blockNumber);
        
    } catch (error) {
        console.error('Balance update error:', error);
    }
}

// Get MTK Tokens from Faucet
async function getMTKFromFaucet() {
    if (!connected || !web3 || !tokenContract) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    try {
        showPendingOverlay('Getting 100 MTK from faucet...');
        
        const tx = await tokenContract.methods.faucet(
            userAccount,
            web3.utils.toWei('100', 'ether')
        ).send({
            from: userAccount,
            gas: 100000
        });
        
        // Wait for transaction
        setTimeout(async () => {
            hidePendingOverlay();
            showNotification('✅ Received 100 MTK tokens!', 'success');
            
            // Add to transaction history
            addTransactionToHistory(tx.transactionHash, 100, userAccount, 'faucet');
            
            // Update balance
            await updateBalances();
            
        }, 2000);
        
    } catch (error) {
        hidePendingOverlay();
        console.error('Faucet error:', error);
        
        if (error.code === 4001) {
            showNotification('Transaction rejected', 'error');
        } else if (error.message.includes('insufficient funds')) {
            showNotification('Need ETH for gas fees', 'error');
        } else if (error.message.includes('IBAN') || error.message.includes('indirect')) {
            showNotification('Please use a standard Ethereum address in MetaMask', 'warning');
        } else {
            showNotification('Faucet error: ' + error.message, 'error');
        }
    }
}

// Mint Game MTK to Real Tokens (For claim function)
async function mintGameTokens(amount) {
    console.log('Minting game tokens:', amount);
    
    if (!window.connected || !window.web3 || !window.userAccount) {
        showNotification('Connect wallet first!', 'error');
        return false;
    }
    
    try {
        showPendingOverlay(`Converting ${amount} game MTK to real tokens...`);
        
        // Use faucet function to give tokens (simulates conversion)
        const tx = await tokenContract.methods.faucet(
            userAccount,
            web3.utils.toWei(amount.toString(), 'ether')
        ).send({
            from: userAccount,
            gas: 100000
        });
        
        console.log('Mint transaction:', tx);
        
        // Wait for transaction
        setTimeout(async () => {
            try {
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
                
            } catch (error) {
                hidePendingOverlay();
                showNotification('Transaction completed!', 'info');
            }
        }, 2000);
        
        return true;
        
    } catch (error) {
        hidePendingOverlay();
        console.error('Mint error:', error);
        
        if (error.code === 4001) {
            showNotification('Transaction rejected by user', 'error');
        } else if (error.message.includes('insufficient funds')) {
            showNotification('Insufficient ETH for gas fees', 'error');
        } else if (error.message.includes('IBAN') || error.message.includes('indirect')) {
            showNotification('Please check your MetaMask address settings', 'warning');
        } else {
            showNotification('Mint failed: ' + error.message, 'error');
        }
        return false;
    }
}

// Estimate Withdrawal Gas
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
        
        const estimatedGas = await tokenContract.methods.transfer(
            recipient, 
            amountInWei
        ).estimateGas({ from: userAccount });
        
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
        } else if (error.message.includes('IBAN') || error.message.includes('indirect')) {
            showNotification('Please use a standard Ethereum address', 'warning');
        } else {
            showNotification('Gas estimation failed: ' + error.message, 'error');
        }
    }
}

// Withdraw Tokens
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
        
        const tx = await tokenContract.methods.transfer(
            recipient, 
            amountInWei
        ).send({ 
            from: userAccount,
            gas: 100000
        });
        
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
        
        // Wait a bit then check
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
        } else if (error.message.includes('IBAN') || error.message.includes('indirect')) {
            showNotification('Address format issue. Please use standard Ethereum address.', 'warning');
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
    } catch (error) {
        if (error.code === 4902) {
            // Add Sepolia network
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

// Check MTK Balance
async function checkMTKBalance() {
    if (!connected || !web3 || !userAccount) {
        showNotification('Connect wallet first!', 'error');
        return;
    }
    
    try {
        const balance = await tokenContract.methods.balanceOf(userAccount).call();
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
            isSepolia: chainId === '0xaa36a7'
        };
    } catch (error) {
        return { connected: false, reason: error.message };
    }
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
window.formatAddress = formatAddress;
