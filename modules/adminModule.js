const dataManager = require('./dataManager');

/**
 * Проверяет роль пользователя (0=user, 1=helper, 2=admin, 3=owner)
 */
function getUserRole(userId) {
  const data = dataManager.getData();
  
  if (data.ownerId === userId) return 3;
  
  const user = dataManager.getUser(userId);
  if (!user) return 0;
  
  if (user.status === 'admin') return 2;
  if (data.helpers.includes(userId)) return 1;
  
  return 0;
}

/**
 * Проверяет минимальную роль
 */
function checkRole(ctx, minRole) {
  const userRole = getUserRole(ctx.from.id);
  return userRole >= minRole;
}

/**
 * Обработка всех админ-команд
 */
function handleAdminCommands(ctx, command, args) {
  const userId = ctx.from.id;
  const userRole = getUserRole(userId);
  
  // Команды для Helper и выше (роль 1+)
  if (command === 'одобрить' && userRole >= 1) {
    if (args.length < 2) {
      ctx.reply('❌ Использование: одобрить (ID объявления)');
      return;
    }
    handleApproveAd(ctx, parseInt(args[1]));
    return;
  }
  
  if (command === 'отклонить' && userRole >= 1) {
    if (args.length < 2) {
      ctx.reply('❌ Использование: отклонить (ID объявления)');
      return;
    }
    handleRejectAd(ctx, parseInt(args[1]));
    return;
  }
  
  if (command === 'выдать' && userRole >= 1) {
    if (args.length < 3) {
      ctx.reply('❌ Использование: выдать (ID пользователя) (сумма)');
      return;
    }
    handleGiveBalance(ctx, parseInt(args[1]), parseInt(args[2]));
    return;
  }
  
  if (command === 'снять' && userRole >= 1) {
    if (args.length < 3) {
      ctx.reply('❌ Использование: снять (ID пользователя) (сумма)');
      return;
    }
    handleTakeBalance(ctx, parseInt(args[1]), parseInt(args[2]));
    return;
  }
  
  if (command === 'установить' && userRole >= 1) {
    if (args.length < 4 || args[1] !== 'баланс') {
      ctx.reply('❌ Использование: установить баланс (ID пользователя) (сумма)');
      return;
    }
    handleSetBalance(ctx, parseInt(args[2]), parseInt(args[3]));
    return;
  }
  
  // Команды для Admin и выше (роль 2+)
  if (command === 'создать' && userRole >= 2) {
    if (args.length < 4 || args[1] !== 'промо') {
      ctx.reply('❌ Использование: создать промо (КОД) (кол-во использований) (сумма)');
      return;
    }
    handleCreatePromo(ctx, args[2], parseInt(args[3]), parseInt(args[4]));
    return;
  }
  
  if (command === 'удалить' && userRole >= 2) {
    if (args.length < 3 || args[1] !== 'промо') {
      ctx.reply('❌ Использование: удалить промо (КОД)');
      return;
    }
    handleDeletePromo(ctx, args[2]);
    return;
  }
  
  if (command === 'список' && userRole >= 2) {
    if (args.length < 2 || args[1] !== 'промо') {
      ctx.reply('❌ Использование: список промо');
      return;
    }
    handleListPromos(ctx);
    return;
  }
  
  if (command === 'закрепить' && userRole >= 2) {
    if (args.length < 3 || args[1] !== 'объявление') {
      ctx.reply('❌ Использование: закрепить объявление (ID)');
      return;
    }
    handlePinAd(ctx, parseInt(args[2]));
    return;
  }
  
  if (command === 'открепить' && userRole >= 2) {
    if (args.length < 3 || args[1] !== 'объявление') {
      ctx.reply('❌ Использование: открепить объявление (ID)');
      return;
    }
    handleUnpinAd(ctx, parseInt(args[2]));
    return;
  }
  
  if (command === 'рассылка' && userRole >= 2) {
    if (args.length < 2) {
      ctx.reply('❌ Использование: рассылка (текст сообщения)');
      return;
    }
    handleBroadcast(ctx, args.slice(1).join(' '));
    return;
  }
  
  if (command === 'статистика' && userRole >= 2) {
    handleStatistics(ctx);
    return;
  }
  
  if (command === 'бан' && userRole >= 2) {
    if (args.length < 2) {
      ctx.reply('❌ Использование: бан (ID пользователя)');
      return;
    }
    handleBanUser(ctx, parseInt(args[1]));
    return;
  }
  
  if (command === 'разбан' && userRole >= 2) {
    if (args.length < 2) {
      ctx.reply('❌ И��пользование: разбан (ID пользователя)');
      return;
    }
    handleUnbanUser(ctx, parseInt(args[1]));
    return;
  }
  
  if (command === 'проверить' && userRole >= 2) {
    if (args.length < 3 || args[1] !== 'юзера') {
      ctx.reply('❌ Использование: проверить юзера (ID)');
      return;
    }
    handleCheckUser(ctx, parseInt(args[2]));
    return;
  }
  
  if (command === 'лог' && userRole >= 2) {
    if (args.length < 2 || args[1] !== 'действий') {
      ctx.reply('❌ Использование: лог действий');
      return;
    }
    handleAdminLog(ctx);
    return;
  }
  
  // Команды только для Owner (роль 3)
  if (command === 'назначить' && userRole === 3) {
    if (args.length < 3) {
      ctx.reply('❌ Использование: назначить хелпера/админа (ID пользователя)');
      return;
    }
    if (args[1] === 'хелпера') {
      handleSetHelper(ctx, parseInt(args[2]));
    } else if (args[1] === 'админа') {
      handleSetAdmin(ctx, parseInt(args[2]));
    }
    return;
  }
  
  if (command === 'снять' && userRole === 3) {
    if (args.length < 3) {
      ctx.reply('❌ Использование: снять хелпера/админа (ID пользователя)');
      return;
    }
    if (args[1] === 'хелпера') {
      handleRemoveHelper(ctx, parseInt(args[2]));
    } else if (args[1] === 'админа') {
      handleRemoveAdmin(ctx, parseInt(args[2]));
    }
    return;
  }
  
  if ((command === 'вкл' || command === 'рег') && userRole === 3) {
    if (args.length < 2 || args[1] !== 'игры' && args[1] !== 'чат') {
      ctx.reply('❌ Использование: вкл игры или рег чат');
      return;
    }
    handleEnableGamemode(ctx);
    return;
  }
  
  if ((command === 'выкл' || command === 'анрег') && userRole === 3) {
    if (args.length < 2 || args[1] !== 'игры' && args[1] !== 'чат') {
      ctx.reply('❌ Использование: выкл игры или анрег чат');
      return;
    }
    handleDisableGamemode(ctx);
    return;
  }
  
  if (command === 'настройка' && userRole === 3) {
    if (args.length < 2) {
      ctx.reply('❌ Использование: настройка соцсетей (текст)');
      return;
    }
    if (args[1] === 'соцсетей') {
      const text = args.slice(2).join(' ');
      handleSetSocials(ctx, text);
    }
    return;
  }
  
  if (command === 'режим' && userRole === 3) {
    if (args.length < 2) {
      ctx.reply('❌ Использование: режим обслуживания');
      return;
    }
    if (args[1] === 'обслуживания') {
      handleMaintenanceMode(ctx, true);
    }
    return;
  }
  
  if (command === 'выкл' && args[1] === 'обслуживание' && userRole === 3) {
    handleMaintenanceMode(ctx, false);
    return;
  }
  
  if (command === 'бекап' && userRole === 3) {
    handleBackup(ctx);
    return;
  }
  
  if (command === 'рестарт' && userRole === 3) {
    handleRestart(ctx);
    return;
  }
}

// ============== ФУНКЦИИ HANDLER ==============

function handleApproveAd(ctx, adId) {
  try {
    const ad = dataManager.getAd(adId);
    if (!ad) {
      ctx.reply('❌ Объявление не найдено');
      return;
    }
    dataManager.updateAd(adId, { status: 'approved' });
    ctx.reply(`✅ Объявление #${adId} одобрено!`);
    dataManager.logAdminAction(ctx.from.id, 'approve_ad', { adId });
  } catch (err) {
    console.error('Approve ad error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleRejectAd(ctx, adId) {
  try {
    const ad = dataManager.getAd(adId);
    if (!ad) {
      ctx.reply('❌ Объявление не найдено');
      return;
    }
    dataManager.updateAd(adId, { status: 'rejected' });
    ctx.reply(`❌ Объявление #${adId} отклонено!`);
    dataManager.logAdminAction(ctx.from.id, 'reject_ad', { adId });
  } catch (err) {
    console.error('Reject ad error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleGiveBalance(ctx, userId, amount) {
  try {
    if (isNaN(userId) || isNaN(amount) || amount < 0) {
      ctx.reply('❌ Некорректные параметры');
      return;
    }
    
    const user = dataManager.getUser(userId);
    if (!user) {
      ctx.reply('❌ Пользователь не найден');
      return;
    }
    
    const userRole = getUserRole(ctx.from.id);
    const maxAmount = userRole === 1 ? 300000 : Infinity; // Helper имеет лимит 300k
    
    if (amount > maxAmount) {
      ctx.reply(`❌ Вы можете выдать максимум ${maxAmount.toLocaleString()} тяг`);
      return;
    }
    
    dataManager.updateBalance(userId, amount);
    ctx.reply(`✅ Пользователю ${userId} выдано ${amount.toLocaleString()} тяг\nНовый баланс: ${user.balance + amount}`);
    dataManager.logAdminAction(ctx.from.id, 'give_balance', { userId, amount });
  } catch (err) {
    console.error('Give balance error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleTakeBalance(ctx, userId, amount) {
  try {
    if (isNaN(userId) || isNaN(amount) || amount < 0) {
      ctx.reply('❌ Некорректные параметры');
      return;
    }
    
    const user = dataManager.getUser(userId);
    if (!user) {
      ctx.reply('❌ Пользователь не найден');
      return;
    }
    
    dataManager.updateBalance(userId, -amount);
    ctx.reply(`✅ У пользователя ${userId} снято ${amount.toLocaleString()} тяг\nНовый баланс: ${user.balance - amount}`);
    dataManager.logAdminAction(ctx.from.id, 'take_balance', { userId, amount });
  } catch (err) {
    console.error('Take balance error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleSetBalance(ctx, userId, amount) {
  try {
    if (isNaN(userId) || isNaN(amount) || amount < 0) {
      ctx.reply('❌ Некорректные параметры');
      return;
    }
    
    const user = dataManager.getUser(userId);
    if (!user) {
      ctx.reply('❌ Пользователь не найден');
      return;
    }
    
    const oldBalance = user.balance;
    dataManager.setBalance(userId, amount);
    ctx.reply(`✅ Баланс пользователя ${userId} изменен\n${oldBalance.toLocaleString()} → ${amount.toLocaleString()}`);
    dataManager.logAdminAction(ctx.from.id, 'set_balance', { userId, oldBalance, amount });
  } catch (err) {
    console.error('Set balance error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleCreatePromo(ctx, code, uses, amount) {
  try {
    if (!code || isNaN(uses) || isNaN(amount) || uses < 1 || amount < 0) {
      ctx.reply('❌ Некорректные параметры');
      return;
    }
    
    dataManager.addPromo(code, uses, amount);
    ctx.reply(`✅ Промокод создан!\n\n🎁 Код: <code>${code}</code>\n📊 Использований: ${uses}\n💰 Награда: ${amount.toLocaleString()} тяг`);
    dataManager.logAdminAction(ctx.from.id, 'create_promo', { code, uses, amount });
  } catch (err) {
    console.error('Create promo error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleDeletePromo(ctx, code) {
  try {
    const data = dataManager.getData();
    if (!data.promos[code]) {
      ctx.reply('❌ Промокод не найден');
      return;
    }
    
    delete data.promos[code];
    dataManager.saveData(data);
    ctx.reply(`✅ Промокод ${code} удален!`);
    dataManager.logAdminAction(ctx.from.id, 'delete_promo', { code });
  } catch (err) {
    console.error('Delete promo error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleListPromos(ctx) {
  try {
    const data = dataManager.getData();
    if (Object.keys(data.promos).length === 0) {
      ctx.reply('❌ Промокодов не найдено');
      return;
    }
    
    let text = '🎁 <b>Активные промокоды:</b>\n\n';
    for (const [code, promo] of Object.entries(data.promos)) {
      text += `• <code>${code}</code> - ${promo.usesLeft} использ. - ${promo.amount.toLocaleString()} тяг\n`;
    }
    
    ctx.replyWithHTML(text);
  } catch (err) {
    console.error('List promos error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handlePinAd(ctx, adId) {
  try {
    const ad = dataManager.getAd(adId);
    if (!ad) {
      ctx.reply('❌ Объявление не найдено');
      return;
    }
    
    dataManager.updateAd(adId, { pinned: true });
    ctx.reply(`✅ Объявление #${adId} закреплено!`);
    dataManager.logAdminAction(ctx.from.id, 'pin_ad', { adId });
  } catch (err) {
    console.error('Pin ad error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleUnpinAd(ctx, adId) {
  try {
    const ad = dataManager.getAd(adId);
    if (!ad) {
      ctx.reply('❌ Объявление не найдено');
      return;
    }
    
    dataManager.updateAd(adId, { pinned: false });
    ctx.reply(`✅ Объявление #${adId} откреплено!`);
    dataManager.logAdminAction(ctx.from.id, 'unpin_ad', { adId });
  } catch (err) {
    console.error('Unpin ad error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleBroadcast(ctx, text) {
  try {
    const data = dataManager.getData();
    const userIds = Object.keys(data.users).map(id => parseInt(id));
    
    if (userIds.length === 0) {
      ctx.reply('❌ Нет пользователей для рассылки');
      return;
    }
    
    ctx.reply(`⏳ Начинается рассылка ${userIds.length} пользователям...`);
    
    let sent = 0;
    let failed = 0;
    
    userIds.forEach(userId => {
      setTimeout(() => {
        ctx.telegram.sendMessage(userId, text).catch(() => failed++);
        sent++;
      }, 50); // Небольшая задержка чтобы не спамить API
    });
    
    setTimeout(() => {
      ctx.reply(`✅ Рассылка завершена!\n✔️ Отправлено: ${sent}\n❌ Ошибок: ${failed}`);
    }, userIds.length * 50 + 1000);
    
    dataManager.logAdminAction(ctx.from.id, 'broadcast', { userCount: userIds.length });
  } catch (err) {
    console.error('Broadcast error:', err);
    ctx.reply('❌ Ошибка при рассылке');
  }
}

function handleStatistics(ctx) {
  try {
    const data = dataManager.getData();
    const users = Object.values(data.users);
    
    const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
    const totalGames = users.reduce((sum, u) => sum + u.stats.gamesPlayed, 0);
    const totalWins = users.reduce((sum, u) => sum + u.stats.wins, 0);
    
    ctx.replyWithHTML(`
📊 <b>Статистика бота:</b>

👥 <b>Пользователи:</b> ${data.stats.totalUsers}
📝 <b>Запросов:</b> ${data.stats.totalRequests}
💰 <b>В обороте:</b> ${totalBalance.toLocaleString()} тяг
🎮 <b>Игр сыграно:</b> ${totalGames}
🏆 <b>Побед:</b> ${totalWins}
📢 <b>Объявлений:</b> ${data.ads.length}
🎁 <b>Промокодов:</b> ${Object.keys(data.promos).length}
👮 <b>Хелперов:</b> ${data.helpers.length}
🚫 <b>Забанено:</b> ${data.bannedUsers.length}

<i>Создатель: ТТМ | @plaki_men</i>
    `);
  } catch (err) {
    console.error('Statistics error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleBanUser(ctx, userId) {
  try {
    const user = dataManager.getUser(userId);
    if (!user) {
      ctx.reply('❌ Пользователь не найден');
      return;
    }
    
    dataManager.banUser(userId);
    ctx.reply(`🚫 Пользователь ${userId} (${user.name}) забанен!`);
    dataManager.logAdminAction(ctx.from.id, 'ban_user', { userId });
  } catch (err) {
    console.error('Ban user error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleUnbanUser(ctx, userId) {
  try {
    const user = dataManager.getUser(userId);
    if (!user) {
      ctx.reply('❌ Пользователь не найден');
      return;
    }
    
    dataManager.unbanUser(userId);
    ctx.reply(`✅ Пользователь ${userId} (${user.name}) разбанен!`);
    dataManager.logAdminAction(ctx.from.id, 'unban_user', { userId });
  } catch (err) {
    console.error('Unban user error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleCheckUser(ctx, userId) {
  try {
    const user = dataManager.getUser(userId);
    if (!user) {
      ctx.reply('❌ Пользователь не найден');
      return;
    }
    
    ctx.replyWithHTML(`
👤 <b>Информация о пользователе ${userId}:</b>

📛 <b>Имя:</b> ${user.name}
📊 <b>Статус:</b> ${user.status}
💰 <b>Баланс:</b> ${user.balance.toLocaleString()} тяг
📅 <b>Дата регистрации:</b> ${new Date(user.regDate).toLocaleString()}
🎮 <b>Игр сыграно:</b> ${user.stats.gamesPlayed}
🏆 <b>Побед:</b> ${user.stats.wins}
📦 <b>Достижений:</b> ${user.achievements.length}
📤 <b>В инвентаре:</b> ${user.inventory.length} предметов

<i>Создатель: ТТМ | @plaki_men</i>
    `);
  } catch (err) {
    console.error('Check user error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleAdminLog(ctx) {
  try {
    const data = dataManager.getData();
    const logs = data.adminLog.slice(-20).reverse();
    
    if (logs.length === 0) {
      ctx.reply('❌ Логов действий не найдено');
      return;
    }
    
    let text = '📋 <b>Последние 20 действий админов:</b>\n\n';
    logs.forEach((log, i) => {
      const time = new Date(log.timestamp).toLocaleString();
      text += `${i + 1}. <b>${log.action}</b> (${time})\n`;
    });
    
    ctx.replyWithHTML(text);
  } catch (err) {
    console.error('Admin log error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleSetHelper(ctx, userId) {
  try {
    const user = dataManager.getUser(userId);
    if (!user) {
      ctx.reply('❌ Пользователь не найден');
      return;
    }
    
    const data = dataManager.getData();
    if (!data.helpers.includes(userId)) {
      data.helpers.push(userId);
      dataManager.saveData(data);
    }
    
    ctx.reply(`✅ Пользователь ${userId} (${user.name}) назначен хелпером!`);
    dataManager.logAdminAction(ctx.from.id, 'set_helper', { userId });
  } catch (err) {
    console.error('Set helper error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleRemoveHelper(ctx, userId) {
  try {
    const user = dataManager.getUser(userId);
    if (!user) {
      ctx.reply('❌ Пользователь не найден');
      return;
    }
    
    const data = dataManager.getData();
    const index = data.helpers.indexOf(userId);
    if (index !== -1) {
      data.helpers.splice(index, 1);
      dataManager.saveData(data);
    }
    
    ctx.reply(`✅ Пользователь ${userId} (${user.name}) снят с должности хелпера!`);
    dataManager.logAdminAction(ctx.from.id, 'remove_helper', { userId });
  } catch (err) {
    console.error('Remove helper error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleSetAdmin(ctx, userId) {
  try {
    const user = dataManager.getUser(userId);
    if (!user) {
      ctx.reply('❌ Пользователь не найден');
      return;
    }
    
    user.status = 'admin';
    dataManager.saveData();
    
    ctx.reply(`✅ Пользователь ${userId} (${user.name}) назначен админом!`);
    dataManager.logAdminAction(ctx.from.id, 'set_admin', { userId });
  } catch (err) {
    console.error('Set admin error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleRemoveAdmin(ctx, userId) {
  try {
    const user = dataManager.getUser(userId);
    if (!user) {
      ctx.reply('❌ Пользователь не найден');
      return;
    }
    
    user.status = 'user';
    dataManager.saveData();
    
    ctx.reply(`✅ Пользователь ${userId} (${user.name}) понижен!`);
    dataManager.logAdminAction(ctx.from.id, 'remove_admin', { userId });
  } catch (err) {
    console.error('Remove admin error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleEnableGamemode(ctx) {
  try {
    const data = dataManager.getData();
    const chatId = ctx.chat.id;
    
    if (!data.gamemodeChats.includes(chatId)) {
      data.gamemodeChats.push(chatId);
      dataManager.saveData(data);
      ctx.reply('✅ Игровой режим <b>ВКЛЮЧЕН</b> в этом чате!', { parse_mode: 'HTML' });
    } else {
      ctx.reply('ℹ️ Игровой режим уже включен');
    }
    
    dataManager.logAdminAction(ctx.from.id, 'enable_gamemode', { chatId });
  } catch (err) {
    console.error('Enable gamemode error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleDisableGamemode(ctx) {
  try {
    const data = dataManager.getData();
    const chatId = ctx.chat.id;
    const index = data.gamemodeChats.indexOf(chatId);
    
    if (index !== -1) {
      data.gamemodeChats.splice(index, 1);
      dataManager.saveData(data);
      ctx.reply('✅ Игровой режим <b>ВЫКЛЮЧЕН</b> в этом чате!', { parse_mode: 'HTML' });
    } else {
      ctx.reply('ℹ️ Игровой режим уже отключен');
    }
    
    dataManager.logAdminAction(ctx.from.id, 'disable_gamemode', { chatId });
  } catch (err) {
    console.error('Disable gamemode error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleSetSocials(ctx, text) {
  try {
    const data = dataManager.getData();
    data.settings.socialsText = text;
    dataManager.saveData(data);
    ctx.reply('✅ Текст социальных сетей обновлен!');
    dataManager.logAdminAction(ctx.from.id, 'set_socials', {});
  } catch (err) {
    console.error('Set socials error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleMaintenanceMode(ctx, enabled) {
  try {
    const data = dataManager.getData();
    data.maintenanceMode = enabled;
    dataManager.saveData(data);
    
    const status = enabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН';
    ctx.reply(`✅ Режим обслуживания <b>${status}</b>!`, { parse_mode: 'HTML' });
    dataManager.logAdminAction(ctx.from.id, 'toggle_maintenance', { enabled });
  } catch (err) {
    console.error('Maintenance mode error:', err);
    ctx.reply('❌ Ошибка');
  }
}

function handleBackup(ctx) {
  try {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, '../data.json');
    
    ctx.replyWithDocument({
      source: fs.createReadStream(dataPath),
      filename: `backup_${Date.now()}.json`
    });
    
    dataManager.logAdminAction(ctx.from.id, 'backup', {});
  } catch (err) {
    console.error('Backup error:', err);
    ctx.reply('❌ Ошибка при создании бекапа');
  }
}

function handleRestart(ctx) {
  try {
    dataManager.initializeData();
    ctx.reply('✅ Конфигурация перезагружена!');
    dataManager.logAdminAction(ctx.from.id, 'restart', {});
  } catch (err) {
    console.error('Restart error:', err);
    ctx.reply('❌ Ошибка при рестарте');
  }
}

module.exports = {
  getUserRole,
  checkRole,
  handleAdminCommands
};
