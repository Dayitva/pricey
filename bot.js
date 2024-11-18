import TelegramBot from 'node-telegram-bot-api';
import config from './config.js';
import { fetchTokenPrices, addTokenAddress, getAddressToSymbolMap } from './prices-fetch.js';

// Create a bot instance
const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, {polling: true});

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Use /price <symbol1> <symbol2> ...\n\n');
    // 'Supported tokens: ETH, USDC, USDT, WBTC, DAI\n' +
    // 'To add a custom token, use /addtoken <symbol> <network> <contract-address>');
});

// Handle /price command
bot.onText(/\/price (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  
  if (!match[1]) {
    return bot.sendMessage(chatId, 'Please provide token symbols. Example: /price ETH USDC USDT');
  }

  try {
    const symbols = match[1].toUpperCase().split(' ');
    const response = await fetchTokenPrices(symbols);
    
    if (!response || !response.data) {
      return bot.sendMessage(chatId, 'Unable to fetch prices at the moment.');
    }

    // Get the map of addresses to symbols for reverse lookup
    const addressToSymbol = getAddressToSymbolMap();

    // Format the response
    let responseText = '💰 Current Token Prices:\n\n';
    
    response.data.forEach(tokenData => {
      // Get the token address from the request
      const address = tokenData.address?.toLowerCase();
      const symbol = addressToSymbol[address] || 'UNKNOWN';

      if (tokenData.error) {
        responseText += `${symbol}: Error - ${tokenData.error}\n\n`;
      } else if (tokenData.prices && tokenData.prices.length > 0) {
        const priceData = tokenData.prices[0];
        const price = parseFloat(priceData.value).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        });
        const lastUpdated = new Date(priceData.lastUpdatedAt).toLocaleString();
        responseText += `${symbol}: $${price}\n` +
                       `Last Updated: ${lastUpdated}\n\n`;
      } else {
        responseText += `${symbol}: Price data unavailable\n\n`;
      }
    });

    bot.sendMessage(chatId, responseText);
  } catch (error) {
    console.error('Error processing price request:', error);
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

// Handle /addtoken command
bot.onText(/\/addtoken (\w+) (\w+-\w+) (0x[a-fA-F0-9]{40})/, (msg, match) => {
  const chatId = msg.chat.id;
  
  if (match.length !== 4) {
    return bot.sendMessage(chatId, 'Invalid format. Use: /addtoken <symbol> <network> <contract-address>');
  }

  const [, symbol, network, address] = match;

  try {
    addTokenAddress(symbol, network, address);
    bot.sendMessage(chatId, `✅ Token ${symbol} added successfully! You can now use it with /price`);
  } catch (error) {
    bot.sendMessage(chatId, `❌ Error adding token: ${error.message}`);
  }
});

console.log('Telegram Bot is running...');