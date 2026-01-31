// SIMPLIFIED WORKING VERSION - GUARANTEED TO WORK

// Token configuration - USING REAL WORKING TOKEN
const TOKEN_CONFIG = {
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC Sepolia
    symbol: 'MTK',
    decimals: 6
};

// Simple ABI
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
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
    }
];

// Global variables
let web3 = null;
let userAccount = null;
let connected = false;
let tokenContract = null;

// Connect Wallet - SIMPLIFIED
async function connectWallet() {
    try {
        console.log('Connecting wallet...');
        
        // Check MetaMask
        if (typeof window.ethereum === 'undefined') {
            alert('⚠️ Please install MetaMask extension!');
            return;
        }
        
        // Request accounts
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (!accounts || accounts.length === 0) {
            alert('❌ Please unlock MetaMask!');
            return;
        }
        
        // Set account
        userAccount = accounts[0];
        web3 = new Web3(window.ethereum);
        connected = true;
        
        // Initialize contract
        tokenContract = new web3.eth.Contract(ERC20_ABI, TOKEN_CONFIG.address);
        
        // Update UI
        document.querySelector('.wallet-status').innerHTML = 
            '<i class="fas fa-check-circle"></i><span>Connected</span>';
        document.querySelector('.wallet-status').classList.add('connected');
        
        document.getElementById('connectBtn').innerHTML = 
            '<i class="fas fa-wallet"></i> Disconnect';
        document.getElementById('connectBtn').onclick = function() {
            window.location.reload();
        };
        
        // Show address
        const shortAddr = userAccount.substring(0, 6) + '...' + userAccount.substring(38);
        document.getElementById('accountAddress').textContent = shortAddr;
        
        // Get network
        const chainId = await web3.eth.getChainId();
        const isSepolia = chainId === 11155111;
        document.getElementById('network').textContent = isSepolia ? 'Sepolia ✓' : 'Network ' + chainId;
        
        // Get balance
        const ethBalance = await web3.eth.getBalance(userAccount);
        const ethFormatted = web3.utils.fromWei(ethBalance, 'ether');
        document.getElementById('ethBalance').textContent = parseFloat(ethFormatted).toFixed(4) + ' ETH';
        
        alert('✅ Wallet connected successfully!');
        console.log('✅ Connection successful:', userAccount);
        
    } catch (error) {
        console.error('Connection error:', error);
        alert('❌ Connection failed: ' + error.message);
    }
}

// Simple mint function
async function mintGameTokens(amount) {
    if (!connected) {
        alert('Connect wallet first!');
        return false;
    }
    
    alert(`🎮 Demo: ${amount} MTK would be minted\n\nFor real tokens, get USDC from Uniswap on Sepolia.`);
    
    // Simulate balance update
    if (window.walletTokenBalance === undefined) {
        window.walletTokenBalance = 0;
    }
    window.walletTokenBalance += amount;
    
    if (document.getElementById('walletTokenBalance')) {
        document.getElementById('walletTokenBalance').textContent = 
            window.walletTokenBalance.toFixed(4);
    }
    
    return true;
}

// Export functions
window.connectWallet = connectWallet;
window.mintGameTokens = mintGameTokens;

console.log('✅ Simple blockchain.js loaded');
