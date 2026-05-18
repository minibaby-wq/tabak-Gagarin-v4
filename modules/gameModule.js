const dataManager = require('./dataManager');
const adminModule = require('./adminModule');

/**
 * Проверяет, включен ли игровой режим в чате
 */
function isGamemodeEnabled(chatId) {
  const data = dataManager.getData();
  return data.gamemodeChats.includes(chatId);
}

/**
 * Обработка казино
 */
function handleCasino(ctx, amount) {
  try {
    // Проверка игрового режима
    if (!isGamemodeEnabled(ctx.chat.id)) {
      ctx.reply('❌ Игровой режим в этом чате отключен. Попросите владельца включить вкл игры');
      return;
    }
    
    // Проверка бана
    if (dataManager.isBanned(ctx.from.id)) {
      ctx.reply('❌ Вы забанены и не можете использовать игры');
      return;
    }
    
    // Проверка корректности
    if (isNaN(amount) || amount <= 0) {
      ctx.reply('❌ Некорректная ставка. Использование: казино (сумма)');
      return;
    }
    
    const user = dataManager.getUser(ctx.from.id);
    if (user.balance < amount) {
      ctx.reply(`❌ Недостаточно средств. Ваш баланс: ${user.balance.toLocaleString()} тяг`);
      return;
    }
    
    // Снимаем ставку
    dataManager.updateBalance(ctx.from.id, -amount);
    
    // Генерируем случайный коэффициент
    const data = dataManager.getData();
    const coefficients = data.settings.casinoCoefficients;
    const coefficient = coefficients[Math.floor(Math.random() * coefficients.length)];
    
    const winnings = Math.floor(amount * coefficient);
    
    // Обновляем статистику
    user.stats.gamesPlayed++;
    if (coefficient > 0) {
      user.stats.casinoWins++;
      user.stats.wins++;
    }
    
    // Добавляем выигрыш
    dataManager.updateBalance(ctx.from.id, winnings);
    
    const result = coefficient > 0 ? '🎉 ВЫИГРЫШ!' : '💥 ПРОИГРЫШ!';
    
    ctx.replyWithHTML(`
${result}

🎰 <b>Казино</b>
💵 Ставка: ${amount.toLocaleString()} тяг
📊 Коэффициент: ${coefficient}x
💰 Выигрыш: ${winnings.toLocaleString()} тяг
📈 Новый баланс: ${user.balance.toLocaleString()} тяг

<i>Создатель: ТТМ | @plaki_men</i>
    `);
  } catch (err) {
    console.error('Casino error:', err);
    ctx.reply('❌ Ошибка при выполнении команды');
  }
}

/**
 * Обработка рулетки
 */
function handleRoulette(ctx, color, number, amount) {
  try {
    if (!isGamemodeEnabled(ctx.chat.id)) {
      ctx.reply('❌ Игровой режим отключен');
      return;
    }
    
    if (dataManager.isBanned(ctx.from.id)) {
      ctx.reply('❌ Вы забанены');
      return;
    }
    
    // Проверка цвета
    if (!['к', 'ч', 'з'].includes(color)) {
      ctx.reply('❌ Неверный цвет. Используйте: к (красное), ч (черное), з (зеленое)');
      return;
    }
    
    // Проверка номера
    if (isNaN(number) || number < 0 || number > 36) {
      ctx.reply('❌ Номер должен быть от 0 до 36');
      return;
    }
    
    // Проверка ставки
    if (isNaN(amount) || amount <= 0) {
      ctx.reply('❌ Некорректная ставка');
      return;
    }
    
    const user = dataManager.getUser(ctx.from.id);
    if (user.balance < amount) {
      ctx.reply(`❌ Недостаточно средств`);
      return;
    }
    
    // Снимаем ставку
    dataManager.updateBalance(ctx.from.id, -amount);
    
    // Генерируем результат
    const wheelNumber = Math.floor(Math.random() * 37);
    const wheelColor = wheelNumber === 0 ? 'з' : (Math.random() < 0.5 ? 'к' : 'ч');
    
    let coefficient = 0;
    let won = false;
    
    if (color === 'з' && wheelColor === 'з') {
      coefficient = 14;
      won = true;
    } else if (color !== 'з' && wheelColor === color) {
      coefficient = 2;
      won = true;
    }
    
    if (number === wheelNumber) {
      coefficient = 36;
      won = true;
    }
    
    const winnings = Math.floor(amount * coefficient);
    dataManager.updateBalance(ctx.from.id, winnings);
    
    if (won) {
      user.stats.rouletteWins++;
      user.stats.wins++;
    }
    user.stats.gamesPlayed++;
    
    // Сохраняем в лог рулетки
    dataManager.addRouletteLog(wheelNumber, wheelColor);
    
    const colorText = { 'к': '🔴 Красное', 'ч': '⚫ Черное', 'з': '🟢 Зеленое' };
    const result = won ? '🎉 ВЫИГРЫШ!' : '💥 ПРОИГРЫШ!';
    
    ctx.replyWithHTML(`
${result}

🎡 <b>Рулетка</b>
🎯 Ваша ставка: ${colorText[color]}, номер ${number}
🌐 Результат: ${colorText[wheelColor]}, номер ${wheelNumber}
💰 Выигрыш: ${winnings.toLocaleString()} тяг
📈 Баланс: ${user.balance.toLocaleString()} тяг

<i>Создатель: ТТМ | @plaki_men</i>
    `);
  } catch (err) {
    console.error('Roulette error:', err);
    ctx.reply('❌ Ошибка');
  }
}

/**
 * Обработка кубика
 */
function handleDice(ctx, amount) {
  try {
    if (!isGamemodeEnabled(ctx.chat.id)) {
      ctx.reply('❌ Игровой режим отключен');
      return;
    }
    
    if (dataManager.isBanned(ctx.from.id)) {
      ctx.reply('❌ Вы забанены');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      ctx.reply('❌ Некорректная ставка');
      return;
    }
    
    const user = dataManager.getUser(ctx.from.id);
    if (user.balance < amount) {
      ctx.reply('❌ Недостаточно средств');
      return;
    }
    
    dataManager.updateBalance(ctx.from.id, -amount);
    
    const playerDice = Math.floor(Math.random() * 6) + 1;
    const botDice = Math.floor(Math.random() * 6) + 1;
    
    let winnings = 0;
    let result = '';
    
    if (playerDice > botDice) {
      winnings = amount * 2;
      result = '🎉 Вы победили!';
      user.stats.diceWins++;
      user.stats.wins++;
    } else if (playerDice === botDice) {
      winnings = amount;
      result = '🤝 Ничья! Возврат ставки';
    } else {
      result = '💥 Бот победил!';
    }
    
    dataManager.updateBalance(ctx.from.id, winnings);
    user.stats.gamesPlayed++;
    
    ctx.replyWithHTML(`
${result}

🎲 <b>Кубик</b>
👤 Ваш бросок: ${playerDice}
🤖 Бросок бота: ${botDice}
💰 Выигрыш: ${winnings.toLocaleString()} тяг
📈 Баланс: ${user.balance.toLocaleString()} тяг

<i>Создатель: ТТМ | @plaki_men</i>
    `);
  } catch (err) {
    console.error('Dice error:', err);
    ctx.reply('❌ Ошибка');
  }
}

/**
 * Обработка монетки
 */
function handleCoin(ctx, amount) {
  try {
    if (!isGamemodeEnabled(ctx.chat.id)) {
      ctx.reply('❌ Игровой режим отключен');
      return;
    }
    
    if (dataManager.isBanned(ctx.from.id)) {
      ctx.reply('❌ Вы забанены');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      ctx.reply('❌ Некорректная ставка');
      return;
    }
    
    const user = dataManager.getUser(ctx.from.id);
    if (user.balance < amount) {
      ctx.reply('❌ Недостаточно средств');
      return;
    }
    
    dataManager.updateBalance(ctx.from.id, -amount);
    
    const won = Math.random() < 0.5;
    const side = won ? 'Орел ✨' : 'Решка 🪙';
    const winnings = won ? amount * 2 : 0;
    
    if (won) {
      user.stats.coinWins++;
      user.stats.wins++;
    }
    user.stats.gamesPlayed++;
    
    dataManager.updateBalance(ctx.from.id, winnings);
    
    const result = won ? '🎉 ВЫИГРЫШ!' : '💥 ПРОИГРЫШ!';
    
    ctx.replyWithHTML(`
${result}

🪙 <b>Монетка</b>
🎯 Выпало: ${side}
💰 Выигрыш: ${winnings.toLocaleString()} тяг
📈 Баланс: ${user.balance.toLocaleString()} тяг

<i>Создатель: ТТМ | @plaki_men</i>
    `);
  } catch (err) {
    console.error('Coin error:', err);
    ctx.reply('❌ Ошибка');
  }
}

/**
 * Обработка лотереи
 */
function handleLottery(ctx, amount) {
  try {
    if (!isGamemodeEnabled(ctx.chat.id)) {
      ctx.reply('❌ Игровой режим отключен');
      return;
    }
    
    if (dataManager.isBanned(ctx.from.id)) {
      ctx.reply('❌ Вы забанены');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      ctx.reply('❌ Некорректная ставка');
      return;
    }
    
    const user = dataManager.getUser(ctx.from.id);
    if (user.balance < amount) {
      ctx.reply('❌ Недостаточно средств');
      return;
    }
    
    dataManager.updateBalance(ctx.from.id, -amount);
    
    const won = Math.random() < 0.1; // 10% шанс
    const winnings = won ? amount * 5 : 0;
    
    if (won) {
      user.stats.lotteryWins++;
      user.stats.wins++;
    }
    user.stats.gamesPlayed++;
    
    dataManager.updateBalance(ctx.from.id, winnings);
    
    const result = won ? '🎉 ДЖЕКПОТ!' : '💥 НЕ ПОВЕЗЛО';
    
    ctx.replyWithHTML(`
${result}

🎰 <b>Лотерея</b> (10% шанс)
💵 Ставка: ${amount.toLocaleString()} тяг
💰 Выигрыш: ${winnings.toLocaleString()} тяг
📈 Баланс: ${user.balance.toLocaleString()} тяг

<i>Создатель: ТТМ | @plaki_men</i>
    `);
  } catch (err) {
    console.error('Lottery error:', err);
    ctx.reply('❌ Ошибка');
  }
}

/**
 * Обработка драки (PvP)
 */
function handleFight(ctx, amount) {
  try {
    if (!isGamemodeEnabled(ctx.chat.id)) {
      ctx.reply('❌ Игровой режим отключен');
      return;
    }
    
    if (dataManager.isBanned(ctx.from.id)) {
      ctx.reply('❌ Вы забанены');
      return;
    }
    
    // Проверка ответа
    if (!ctx.message.reply_to_message) {
      ctx.reply('❌ Используйте команду в ответ на сообщение противника');
      return;
    }
    
    const opponentId = ctx.message.reply_to_message.from.id;
    if (opponentId === ctx.from.id) {
      ctx.reply('❌ Вы не можете драться сами с собой');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      ctx.reply('❌ Некорректная ставка');
      return;
    }
    
    const attacker = dataManager.getUser(ctx.from.id);
    const opponent = dataManager.getUser(opponentId);
    
    if (!opponent) {
      ctx.reply('❌ Противник не найден в системе');
      return;
    }
    
    if (attacker.balance < amount || opponent.balance < amount) {
      ctx.reply('❌ У одного из игроков недостаточно средств');
      return;
    }
    
    // Снимаем ставки
    dataManager.updateBalance(ctx.from.id, -amount);
    dataManager.updateBalance(opponentId, -amount);
    
    // Определяем победителя (50/50)
    const attackerWins = Math.random() < 0.5;
    const bank = amount * 2;
    
    if (attackerWins) {
      dataManager.updateBalance(ctx.from.id, bank);
      attacker.stats.wins++;
      ctx.replyWithHTML(`
🥊 <b>ДРАКА</b>

🎯 Результат: Победил ${ctx.from.first_name}! 🏆
💰 Выигрыш: ${bank.toLocaleString()} тяг
📈 Баланс: ${attacker.balance.toLocaleString()} тяг

<i>Создатель: ТТМ | @plaki_men</i>
      `);
    } else {
      dataManager.updateBalance(opponentId, bank);
      opponent.stats.wins++;
      ctx.replyWithHTML(`
🥊 <b>ДРАКА</b>

🎯 Результат: Победил ${ctx.message.reply_to_message.from.first_name}! 🏆
💰 Выигрыш: ${bank.toLocaleString()} тяг (${ctx.from.first_name} потерял ${amount.toLocaleString()})

<i>Создатель: ТТМ | @plaki_men</i>
      `);
    }
    
    attacker.stats.gamesPlayed++;
    opponent.stats.gamesPlayed++;
  } catch (err) {
    console.error('Fight error:', err);
    ctx.reply('❌ Ошибка');
  }
}

module.exports = {
  isGamemodeEnabled,
  handleCasino,
  handleRoulette,
  handleDice,
  handleCoin,
  handleLottery,
  handleFight
};
