import fetch from 'node-fetch';
import config from './config.js';

// Mapping of common token symbols to their contract addresses
const TOKEN_ADDRESSES = {
  'ETH': {
    network: 'eth-mainnet',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'  // WETH address
  },
  'USDC': {
    network: 'eth-mainnet', 
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  },
  'USDT': {
    network: 'eth-mainnet',
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7'
  },
  'WBTC': {
    network: 'eth-mainnet',
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
  },
  'DAI': {
    network: 'eth-mainnet',
    address: '0x6b175474e89094c44da98b954eedeac495271d0f'
  }
};

// Create reverse mapping from addresses to symbols
export function getAddressToSymbolMap() {
  const addressToSymbol = {};
  Object.entries(TOKEN_ADDRESSES).forEach(([symbol, data]) => {
    addressToSymbol[data.address.toLowerCase()] = symbol;
  });
  return addressToSymbol;
}

export async function fetchTokenPrices(symbols) {
  const fetchURL = `https://api.g.alchemy.com/prices/v1/${config.ALCHEMY_API_KEY}/tokens/by-address`;
  
  // Convert symbols to addresses
  const addressRequests = symbols.map(symbol => {
    const tokenInfo = TOKEN_ADDRESSES[symbol.toUpperCase()];
    if (!tokenInfo) {
      throw new Error(`No address found for token: ${symbol}`);
    }
    return {
      ...tokenInfo,
      symbol  // Add symbol to the request for reference
    };
  });

  const requestBody = {
    addresses: addressRequests
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.ALCHEMY_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  };

  try {
    const response = await fetch(fetchURL, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Add the addresses to the response data for mapping back to symbols
    if (data.data) {
      data.data = data.data.map((item, index) => ({
        ...item,
        address: addressRequests[index].address,
        symbol: addressRequests[index].symbol
      }));
    }
    
    // Log the response and request for debugging
    console.log('Request:', JSON.stringify(requestBody, null, 2));
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return null;
  }
}

// Helper function to add more token addresses dynamically
export function addTokenAddress(symbol, network, address) {
  TOKEN_ADDRESSES[symbol.toUpperCase()] = { network, address };
}

// Helper function to get available tokens
export function getAvailableTokens() {
  return Object.keys(TOKEN_ADDRESSES);
}