const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

// Импорт модулей
const dataManager = require('./modules/dataManager');
const gameModule = require('./modules/gameModule');
const adminModule = require('./modules/adminModule');
const shopModule = require('./modules/shopModule');
const baraholkaModule = require('./modules/baraholkaModule');
const economyModule = require('./modules/economyModule');
const commandHandler = require('./modules/commandHandler');

// Константы
const BOT_TOKEN = '8883304724:AAE17NA4DIoz-4v4GmH9L_x0EiXKO1w4IY8';
const OWNER_USERNAME = 'plaki_men';
const KEEP_ALIVE_INTERVAL = 30000; // 30 секунд

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN);

// Инициализация данных
dataManager.initializeData();

// ============== KEEP-ALIVE МЕХАНИЗМ ==============
let keepAliveInterval;

async function startKeepAlive() {
  keepAliveInterval = setInterval(async () => {
    try {
      const data = dataManager.getData();
      if (data.ownerId) {
        try {
          await bot.telegram.sendMessage(
            data.ownerId,
            '🟢 Bot Alive',
            { parse_mode: 'HTML', disable_notification: true }
          );
        } catch (err) {
          console.log('Keep-alive ping failed (owner might be offline):', err.message);
        }
      }
    } catch (err) {
      console.error('Keep-alive error:', err);
    }
  }, KEEP_ALIVE_INTERVAL);
}

function stopKeepAlive() {
  if (keepAliveInterval) clearInterval(keepAliveInterval);
}

// ============== MIDDLEWARE ==============

// Middleware для инициализации пользователя
bot.use(async (ctx, next) => {
  try {
    if (ctx.from && ctx.message) {
      const userId = ctx.from.id;
      const user = dataManager.getUser(userId);
      
      if (!user) {
        dataManager.createUser(userId, ctx.from.first_name || 'User');
      }
      
      // Логирование запросов
      const data = dataManager.getData();
      data.stats.totalRequests++;
      dataManager.saveData();
      
      // Определение владельца через юзернейм
      if (ctx.from.username === OWNER_USERNAME && !data.ownerId) {
        data.ownerId = userId;
        dataManager.saveData();
        console.log(`✅ Owner ID set: ${userId}`);
      }
    }
  } catch (err) {
    console.error('Middleware error:', err);
  }
  
  return next();
});

// ============== ОСНОВНЫЕ КОМАНДЫ ==============

// /start
bot.command('start', (ctx) => {
  try {
    const user = dataManager.getUser(ctx.from.id);
    const welcomeText = `
👋 Добро пожаловать в **Табак Гагарина Бот**!

${user ? `Рады видеть вас снова, ${user.name}!` : 'Вы успешно зарегистрированы!'}

💰 **Баланс:** ${user ? user.balance.toLocaleString() : '50000'} тяг

📱 Используйте команды для игр и управления аккаунтом.
Введите 📖 **помощь** для справки.

_Создатель: ТТМ | @plaki_men_
    `;
    
    ctx.replyWithHTML(welcomeText, {
      reply_markup: {
        keyboard: [
          [{ text: '💰 Баланс' }, { text: '👤 Профиль' }],
          [{ text: '🎮 Магазины' }, { text: '📢 Барахолка' }],
          [{ text: '📖 Помощь' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    });
  } catch (err) {
    console.error('Start command error:', err);
    ctx.reply('❌ Ошибка при выполнении команды');
  }
});

// /help
bot.command('help', commandHandler.handleHelp);

// ============== ПОЛЬЗОВАТЕЛЬСКИЕ КОМАНДЫ (БЕЗ /) ==============

// Баланс
bot.hears(['💰 Баланс', 'баланс'], (ctx) => {
  try {
    const user = dataManager.getUser(ctx.from.id);
    if (!user) {
      ctx.reply('❌ Пользователь не найден');
      return;
    }
    
    ctx.replyWithHTML(`
💰 <b>Ваш баланс:</b>
<code>${user.balance.toLocaleString()}</code> тяг

👤 Пользователь: <b>${user.name}</b>
📊 Статус: <b>${user.status}</b>

<i>Создатель: ТТМ | @plaki_men</i>
    `);
  } catch (err) {
    console.error('Balance command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Профиль
bot.hears(['👤 Профиль', 'профиль'], (ctx) => {
  try {
    economyModule.handleProfile(ctx);
  } catch (err) {
    console.error('Profile command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Помощь
bot.hears(['📖 Помощь', 'помощь'], (ctx) => {
  try {
    commandHandler.handleHelp(ctx);
  } catch (err) {
    console.error('Help command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Магазины
bot.hears(['🎮 Магазины', 'магазины'], (ctx) => {
  try {
    shopModule.handleShopsMenu(ctx);
  } catch (err) {
    console.error('Shops command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Барахолка
bot.hears(['📢 Барахолка', 'барахолка'], (ctx) => {
  try {
    baraholkaModule.handleBaraholkaMenu(ctx);
  } catch (err) {
    console.error('Baraholka command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Социальные сети
bot.hears('социальные сети', (ctx) => {
  try {
    const data = dataManager.getData();
    ctx.replyWithHTML(`📱 <b>Социальные сети:</b>\n\n${data.settings.socialsText}\n\n<i>Создатель: ТТМ | @plaki_men</i>`);
  } catch (err) {
    console.error('Social networks command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// О боте
bot.hears('о боте', (ctx) => {
  try {
    ctx.replyWithHTML(`
ℹ️ <b>О Боте</b>

🎯 <b>Назначение:</b> Бот для табачных магазинов Гагарина + игровой модуль

👑 <b>Владелец:</b> @plaki_men

💻 <b>Технология:</b> JavaScript (Node.js + Telegraf)

🎮 <b>Функции:</b>
• Мини-игры (казино, рулетка, кубик, монетка)
• Экономика (баланс, бонусы, инвестиции)
• Магазины и каталог товаров
• Барахолка (модерируемые объявления)
• Админ-панель

⚡ <b>Версия:</b> 4.0

<i>Создатель: ТТМ | @plaki_men</i>
    `);
  } catch (err) {
    console.error('About command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Контакты владельца
bot.hears('контакты владельца', (ctx) => {
  try {
    ctx.replyWithHTML(`
📞 <b>Контакты владельца:</b>

👤 <b>Telegram:</b> @plaki_men

💬 <i>Связаться с разработчиком можно напрямую через профиль</i>

<i>Создатель: ТТМ | @plaki_men</i>
    `);
  } catch (err) {
    console.error('Contacts command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// ============== ИГРЫ ==============

// Казино
bot.hears(/казино\s+(\d+)/, (ctx) => {
  try {
    const amount = parseInt(ctx.match[1]);
    gameModule.handleCasino(ctx, amount);
  } catch (err) {
    console.error('Casino command error:', err);
    ctx.reply('❌ Ошибка при выполнении команды');
  }
});

// Рулетка
bot.hears(/рулетка\s+([кчз])\s+(\d+)\s+(\d+)/, (ctx) => {
  try {
    const color = ctx.match[1];
    const number = parseInt(ctx.match[2]);
    const amount = parseInt(ctx.match[3]);
    gameModule.handleRoulette(ctx, color, number, amount);
  } catch (err) {
    console.error('Roulette command error:', err);
    ctx.reply('❌ Ошибка при выполнении команды');
  }
});

// Кубик
bot.hears(/кубик\s+(\d+)/, (ctx) => {
  try {
    const amount = parseInt(ctx.match[1]);
    gameModule.handleDice(ctx, amount);
  } catch (err) {
    console.error('Dice command error:', err);
    ctx.reply('❌ Ошибка при выполнении команды');
  }
});

// Монетка
bot.hears(/монетка\s+(\d+)/, (ctx) => {
  try {
    const amount = parseInt(ctx.match[1]);
    gameModule.handleCoin(ctx, amount);
  } catch (err) {
    console.error('Coin command error:', err);
    ctx.reply('❌ Ошибка при выполнении команды');
  }
});

// Лотерея
bot.hears(/лотерея\s+(\d+)/, (ctx) => {
  try {
    const amount = parseInt(ctx.match[1]);
    gameModule.handleLottery(ctx, amount);
  } catch (err) {
    console.error('Lottery command error:', err);
    ctx.reply('❌ Ошибка при выполнении команды');
  }
});

// Драка (на ответ)
bot.hears(/драка\s+(\d+)/, (ctx) => {
  try {
    const amount = parseInt(ctx.match[1]);
    gameModule.handleFight(ctx, amount);
  } catch (err) {
    console.error('Fight command error:', err);
    ctx.reply('❌ Ошибка при выполнении команды');
  }
});

// ============== ЭКОНОМИКА ==============

// Бонус
bot.hears('бонус', (ctx) => {
  try {
    economyModule.handleBonus(ctx);
  } catch (err) {
    console.error('Bonus command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Супер бонус
bot.hears('супер бонус', (ctx) => {
  try {
    economyModule.handleSuperBonus(ctx);
  } catch (err) {
    console.error('Super bonus command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Топ баланс
bot.hears('топ баланс', (ctx) => {
  try {
    economyModule.handleTopBalance(ctx);
  } catch (err) {
    console.error('Top balance command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Рейтинг
bot.hears('рейтинг', (ctx) => {
  try {
    economyModule.handleRating(ctx);
  } catch (err) {
    console.error('Rating command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Достижения
bot.hears('достижения', (ctx) => {
  try {
    economyModule.handleAchievements(ctx);
  } catch (err) {
    console.error('Achievements command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Инвестиции
bot.hears(/инвестиции\s+(.+)/, (ctx) => {
  try {
    const args = ctx.match[1].split(/\s+/);
    economyModule.handleInvestments(ctx, args);
  } catch (err) {
    console.error('Investments command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Шахта
bot.hears('шахта', (ctx) => {
  try {
    economyModule.handleMining(ctx);
  } catch (err) {
    console.error('Mining command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Ферма
bot.hears(/ферма\s+(.+)?/, (ctx) => {
  try {
    const args = ctx.match[1] ? ctx.match[1].split(/\s+/) : [];
    economyModule.handleFarm(ctx, args);
  } catch (err) {
    console.error('Farm command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// ============== БАРАХОЛКА ==============

// Добавить объявление
bot.hears(/\+объявление\s+(.+)/, (ctx) => {
  try {
    const text = ctx.match[1];
    baraholkaModule.handleAddAd(ctx, text);
  } catch (err) {
    console.error('Add ad command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// Удалить объявление
bot.hears(/\-объявление\s+(\d+)/, (ctx) => {
  try {
    const id = parseInt(ctx.match[1]);
    baraholkaModule.handleDeleteAd(ctx, id);
  } catch (err) {
    console.error('Delete ad command error:', err);
    ctx.reply('❌ Ошибка');
  }
});

// ============== АДМИН-КОМАНДЫ ==============

// Проверка всех админ-команд
bot.hears(/(.+)/, (ctx) => {
  try {
    const text = ctx.message.text.trim();
    const args = text.split(/\s+/);
    const command = args[0].toLowerCase();
    
    // Проверка админ-команд
    adminModule.handleAdminCommands(ctx, command, args);
  } catch (err) {
    console.error('Command handling error:', err);
  }
});

// ============== ОБРАБОТКА ДЕЙСТВИЙ (CALLBACK) ==============

// Inline кнопки
bot.action(/shop_(.+)/, (ctx) => {
  try {
    shopModule.handleShopSelection(ctx);
  } catch (err) {
    console.error('Shop selection error:', err);
    ctx.answerCbQuery('❌ Ошибка');
  }
});

bot.action(/category_(.+)_(.+)/, (ctx) => {
  try {
    shopModule.handleCategorySelection(ctx);
  } catch (err) {
    console.error('Category selection error:', err);
    ctx.answerCbQuery('❌ Ошибка');
  }
});

bot.action(/approve_ad_(\d+)/, (ctx) => {
  try {
    const id = parseInt(ctx.match[1]);
    baraholkaModule.handleApproveAd(ctx, id);
  } catch (err) {
    console.error('Approve ad error:', err);
    ctx.answerCbQuery('❌ Ошибка');
  }
});

bot.action(/reject_ad_(\d+)/, (ctx) => {
  try {
    const id = parseInt(ctx.match[1]);
    baraholkaModule.handleRejectAd(ctx, id);
  } catch (err) {
    console.error('Reject ad error:', err);
    ctx.answerCbQuery('❌ Ошибка');
  }
});

bot.action(/help_page_(\d+)/, (ctx) => {
  try {
    const page = parseInt(ctx.match[1]);
    commandHandler.sendHelpPage(ctx, page);
  } catch (err) {
    console.error('Help page error:', err);
    ctx.answerCbQuery('❌ Ошибка');
  }
});

// ============== ЗАПУСК БОТА ==============

async function main() {
  try {
    console.log('🤖 Запуск бота...');
    
    // Включение логирования
    bot.catch((err, ctx) => {
      console.error('Bot error:', err);
    });
    
    // Запуск бота
    await bot.launch();
    console.log('✅ Бот успешно запущен!');
    
    // Запуск Keep-Alive
    startKeepAlive();
    console.log('🔄 Keep-Alive механизм активирован');
    
    // Graceful shutdown
    process.once('SIGINT', () => {
      stopKeepAlive();
      bot.stop('SIGINT');
      console.log('👋 Бот остановлен');
    });
    
    process.once('SIGTERM', () => {
      stopKeepAlive();
      bot.stop('SIGTERM');
      console.log('👋 Бот остановлен');
    });
  } catch (err) {
    console.error('❌ Ошибка при запуске бота:', err);
    process.exit(1);
  }
}

// Запуск приложения
main();

module.exports = { bot, dataManager };
