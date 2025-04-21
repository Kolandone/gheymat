const TELEGRAM_API_TOKEN = 'Token'; //توکن ربات رو وارد کن
const CHANNEL = '@gheymatarza'; //آیدی کانالی که ربات داخلش ادمین میشه رو وارد کن
const LINK_CHANNEL = 'KOLANDJS'; //کانال اصلیت برای تبلیغ

async function telegramRequest(method, body) {
  const url = `https://api.telegram.org/bot${TELEGRAM_API_TOKEN}/${method}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await response.json();
  } catch (error) {
    console.error(`Error in ${method}:`, error);
    return { ok: false, error };
  }
}

async function sendMessage(chatId, text, keyboard = null) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (keyboard) body.reply_markup = keyboard;
  return await telegramRequest('sendMessage', body);
}

function formatPrice(price, isOnsGold = false) {
  if (isOnsGold) {

    return Number(price).toLocaleString('fa-IR', { maximumFractionDigits: 0 });
  } else {

    const tomanPrice = Math.floor(price / 10);
    return Number(tomanPrice).toLocaleString('fa-IR', { maximumFractionDigits: 0 });
  }
}

async function fetchPrices() {
  try {
    const apiResponse = await fetch('https://call3.tgju.org/ajax.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!apiResponse.ok) throw new Error(`API failed: ${apiResponse.status}`);
    const data = await apiResponse.json();

    const prices = { gold: [], currency: [], cryptocurrency: [], others: [] };
    for (const key in data.current) {
      const item = data.current[key];
      const price = parseFloat(item.p.replace(/[^\d.]/g, '')) || 0;
      const time = getTehranTime();

      const formattedItem = {
        date: getTehranDate(),
        time,
        name: keyToName(key),
        price,
        unit: 'ریال',
        key
      };

      if (isGold(key)) prices.gold.push(formattedItem);
      else if (isCurrency(key)) prices.currency.push(formattedItem);
      else if (isCrypto(key)) prices.cryptocurrency.push(formattedItem);
      else prices.others.push(formattedItem);
    }
    return prices;
  } catch (error) {
    console.error('Error fetching prices:', error);
    throw error;
  }
}

async function sendPrices(chatId, isManual = true) {
  try {
    const data = await fetchPrices();

    const gold = data.gold.filter(item => 
      ['sekee', 'sekee_real', 'sekeb', 'nim', 'rob', 'gerami', 'geram18', 'geram24', 'mesghal', 'ons', 'ons_buy', 
       'retail_sekee', 'retail_nim', 'retail_rob', 'retail_gerami', 'tgju_gold_irg18'].includes(item.key) ||
      item.key.includes('blubber')
    );

    const allowedCurrencyKeys = [
      'price_dollar_dt', 'price_gbp', 'price_eur', 'price_cad',
      'price_chf', 'price_jpy', 'price_kwd', 'price_bhd', 'price_omr', 'price_jod',
      'price_sar', 'price_aed', 'price_qar', 'price_usd', 'price_try', 'price_iqd',
      'price_afn', 'price_dzd', 'price_lyd', 'price_mad', 'price_tnd', 'price_zmw',
      'price_zar', 'price_yer', 'price_xpf', 'price_xof', 'price_xcd', 'price_xaf',
      'price_vuv', 'price_vnd', 'price_vef', 'price_uzs'
    ];

    const currenciesRaw = data.currency.filter(item => allowedCurrencyKeys.includes(item.key)).slice(0, 32);
    const sortedCurrencies = [];
    

    const dollarTehran = currenciesRaw.find(item => item.key === 'price_dollar_dt');
    const pound = currenciesRaw.find(item => item.key === 'price_gbp');
    const euro = currenciesRaw.find(item => item.key === 'price_eur');
    const cad = currenciesRaw.find(item => item.key === 'price_cad');
    if (dollarTehran) sortedCurrencies.push(dollarTehran);
    if (pound) sortedCurrencies.push(pound);
    if (euro) sortedCurrencies.push(euro);
    if (cad) sortedCurrencies.push(cad);


    const remainingCurrencies = currenciesRaw
      .filter(item => 
        item.key !== 'price_dollar_dt' && item.key !== 'price_gbp' && 
        item.key !== 'price_eur' && item.key !== 'price_cad'
      )
      .sort((a, b) => {
        if (b.price !== a.price) return b.price - a.price; 
        return a.name.localeCompare(b.name, 'fa'); 
      });

    const currencies = [...sortedCurrencies, ...remainingCurrencies];

    const importantCryptoKeys = [
      'crypto-tether-irr', 'crypto-bitcoin-irr', 'crypto-ethereum-irr', 'crypto-tron-irr', 
      'crypto-ripple-irr', 'crypto-litecoin-irr', 'crypto-binance-coin-irr', 
      'crypto-cardano-irr', 'crypto-solana-irr', 'crypto-stellar-irr', 'crypto-polkadot-irr', 
      'crypto-chainlink-irr'
    ];
    const cryptosRaw = data.cryptocurrency.filter(item => importantCryptoKeys.includes(item.key));
    const tether = cryptosRaw.find(item => item.key === 'crypto-tether-irr');
    const bitcoin = cryptosRaw.find(item => item.key === 'crypto-bitcoin-irr');
    const ethereum = cryptosRaw.find(item => item.key === 'crypto-ethereum-irr');
    const tron = cryptosRaw.find(item => item.key === 'crypto-tron-irr');
    const remainingCryptos = cryptosRaw.filter(item => 
      item.key !== 'crypto-tether-irr' && item.key !== 'crypto-bitcoin-irr' && 
      item.key !== 'crypto-ethereum-irr' && item.key !== 'crypto-tron-irr'
    );
    const cryptos = [tether, bitcoin, ethereum, tron, ...remainingCryptos].filter(Boolean);

    let message = `<a href="https://t.me/${LINK_CHANNEL}">آموزش ساخت فیلترشکن رایگان</a>\n\n`;
    message += '<b>💰 قیمت‌های به‌روز ارز و طلا 💰</b>\n\n';

    message += '<b>🏅 طلا و سکه:</b>\n';
    gold.forEach(item => {
      const isOnsGold = item.key === 'ons' || item.key === 'ons_buy';
      message += ` • ${item.name}: <b>${formatPrice(item.price, isOnsGold)} ${isOnsGold ? 'دلار' : 'تومان'}</b>\n`;
    });
    message += '\n------------------------------------------------------\n';

    message += '<b>💵 ارزهای بین‌المللی:</b>\n';
    currencies.forEach(item => {
      message += ` • ${item.name}: <b>${formatPrice(item.price)} تومان</b>\n`;
    });
    message += '\n------------------------------------------------------\n';

    message += '<b>🔗 ارزهای دیجیتال:</b>\n';
    cryptos.forEach(item => {
      message += ` • ${item.name}: <b>${formatPrice(item.price)} تومان</b>\n`;
    });

    const date = getTehranDate();
    const time = getTehranTime();
    message += `\n------------------------------------------------------\n<b>📅 تاریخ:</b> ${date} - <b>⏰ ساعت:</b> ${time}\n`;
    message += `<a href="https://t.me/${LINK_CHANNEL}">کانال ما</a>\n`;
    message += `${CHANNEL}`;

    if (message.length > 4096) {
      console.warn('Message too long, splitting into multiple messages');
      const parts = splitMessage(message, 4000);
      for (const part of parts) await sendMessage(CHANNEL, part);
    } else {
      await sendMessage(CHANNEL, message);
    }

    if (isManual) await sendMessage(chatId, 'قیمت‌ها با موفقیت به کانال ارسال شد!');
  } catch (error) {
    console.error('Error sending prices:', error);
    const errorMsg = `<b>⚠️ خطا:</b> خطای داخلی در پردازش قیمت‌ها: ${error.message}`;
    await sendMessage(CHANNEL, errorMsg);
    if (isManual) await sendMessage(chatId, `خطا در ارسال قیمت‌ها: ${error.message}`);
  }
}

function splitMessage(message, maxLength) {
  const parts = [];
  let currentPart = '';
  const lines = message.split('\n');
  for (const line of lines) {
    if ((currentPart + line + '\n').length <= maxLength) currentPart += line + '\n';
    else {
      if (currentPart) parts.push(currentPart.trim());
      currentPart = line + '\n';
    }
  }
  if (currentPart) parts.push(currentPart.trim());
  return parts;
}

const startKeyboard = { keyboard: [[{ text: '/prices' }]], resize_keyboard: true };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/prices' && request.method === 'GET') {
      try {
        const prices = await fetchPrices();
        return new Response(JSON.stringify(prices, null, 2), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (request.method === 'POST') {
      try {
        const update = await request.json();
        console.log('Received update:', update);
        if (update.message) {
          const chatId = update.message.chat.id;
          const text = update.message.text || '';
          if (text === '/start') {
            await sendMessage(chatId, `
ربات فعال‌سازی شد. لطفاً مرا در کانال یا گروه تنظیم‌شده ادمین کنید.
برای ارسال دستی قیمت‌ها از دستور /prices استفاده کنید.
`, startKeyboard);
          } else if (text === '/prices') {
            await sendPrices(chatId, true);
          } else {
            await sendMessage(chatId, 'دستور ناشناخته! لطفاً /start یا /prices را امتحان کنید.');
          }
        }
        return new Response('OK', { status: 200 });
      } catch (error) {
        console.error('Worker error during fetch:', error);
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }
    return new Response('Method not allowed', { status: 405 });
  },

  async scheduled(event, env, ctx) {
    try {
      console.log('Cron Trigger executed, sending prices to channel:', CHANNEL);
      await sendPrices(CHANNEL, false);
    } catch (error) {
      console.error('Worker error during scheduled event:', error);
    }
  }
};

function isGold(key) {
  return key.includes('sekee') || key.includes('geram') || key.includes('mesghal') || key.includes('nim') || 
         key.includes('rob') || key.includes('ons') || key.includes('gold');
}

function isCurrency(key) {
  return (key.startsWith('price_') && !key.includes('irr') && !key.includes('future') && !key.includes('buy')) || 
         key.includes('usd-') || key.includes('-usd') || key.includes('ex') || key.includes('diff');
}

function isCrypto(key) {
  return key.includes('crypto') || key.includes('-irr') || key.includes('btc') || key.includes('eth');
}

function keyToName(key) {
  const names = {
    'sekee': 'سکه امامی',
    'sekee_real': 'سکه امامی',
    'sekeb': 'سکه بهار آزادی',
    'nim': 'نیم سکه',
    'rob': 'ربع سکه',
    'gerami': 'سکه گرمی',
    'geram18': 'طلا 18 عیار',
    'geram24': 'طلا 24 عیار',
    'mesghal': 'مثقال طلا',
    'ons': 'انس طلا',
    'ons_buy': 'خرید انس طلا',
    'retail_sekee': 'سکه امامی خرده‌فروشی',
    'retail_nim': 'نیم سکه خرده‌فروشی',
    'retail_rob': 'ربع سکه خرده‌فروشی',
    'retail_gerami': 'سکه گرمی خرده‌فروشی',
    'tgju_gold_irg18': 'طلا 18 عیار',
    'sekee_blubber': 'حباب سکه امامی',
    'nim_blubber': 'حباب نیم سکه',
    'rob_blubber': 'حباب ربع سکه',
    'gerami_blubber': 'حباب سکه گرمی',

    'price_dollar_dt': 'دلار تهران',
    'price_gbp': 'پوند انگلیس',
    'price_eur': 'یورو',
    'price_cad': 'دلار کانادا',
    'price_chf': 'فرانک سوئیس',
    'price_jpy': 'ین ژاپن',
    'price_kwd': 'دینار کویت',
    'price_bhd': 'دینار بحرین',
    'price_omr': 'ریال عمان',
    'price_jod': 'دینار اردن',
    'price_sar': 'ریال عربستان',
    'price_aed': 'درهم امارات',
    'price_qar': 'ریال قطر',
    'price_usd': 'دلار آمریکا',
    'price_try': 'لیر ترکیه',
    'price_iqd': 'دینار عراق',
    'price_afn': 'افغانی افغانستان',
    'price_dzd': 'دینار الجزایر',
    'price_lyd': 'دینار لیبی',
    'price_mad': 'درهم مراکش',
    'price_tnd': 'دینار تونس',
    'price_zmw': 'کواچا زامبیا',
    'price_zar': 'رند آفریقای جنوبی',
    'price_yer': 'ریال یمن',
    'price_xpf': 'فرانک اقیانوسیه',
    'price_xof': 'فرانک غرب آفریقا',
    'price_xcd': 'دلار کارائیب شرقی',
    'price_xaf': 'فرانک آفریقای مرکزی',
    'price_vuv': 'واتو وانواتو',
    'price_vnd': 'دونگ ویتنام',
    'price_vef': 'بولیوار ونزوئلا',
    'price_uzs': 'سوم ازبکستان',

    'crypto-tether-irr': 'تتر',
    'crypto-bitcoin-irr': 'بیت‌کوین',
    'crypto-ethereum-irr': 'اتریوم',
    'crypto-tron-irr': 'ترون',
    'crypto-ripple-irr': 'ریپل',
    'crypto-litecoin-irr': 'لایت‌کوین',
    'crypto-binance-coin-irr': 'بایننس کوین',
    'crypto-cardano-irr': 'کاردانو',
    'crypto-solana-irr': 'سولانا',
    'crypto-stellar-irr': 'استلار',
    'crypto-polkadot-irr': 'پولکادات',
    'crypto-chainlink-irr': 'چین‌لینک'
  };
  return names[key] || key.replace(/[-_]/g, ' ').replace('irr', '').replace('price', '').replace('crypto', '').trim();
}

function getTehranDate() {
  return new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function getTehranTime() {
  return new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}
