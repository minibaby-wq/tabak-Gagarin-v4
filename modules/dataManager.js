const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data.json');

/**
 * Инициализирует data.json если файл не существует
 */
function initializeData() {
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = {
      ownerId: null,
      helpers: [],
      shops: getDefaultShops(),
      users: {},
      ads: [],
      promos: {},
      rouletteLog: [],
      gamemodeChats: [],
      bannedUsers: [],
      maintenanceMode: false,
      settings: {
        socialsText: 'Наши социальные сети:\n🔗 Instagram\n🔗 TikTok\n🔗 YouTube',
        casinoCoefficients: [0, 0.4, 0.5, 0.7, 1.1, 1.3, 1.6, 1.9, 2.7, 4.8, 9.15, 15.9, 24.6, 48.3, 59.3, 80, 93, 99.9, 100, 111.111]
      },
      stats: {
        totalUsers: 0,
        totalRequests: 0
      },
      adminLog: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    console.log('📝 Создан файл data.json');
  }
}

/**
 * Получает данные из файла
 */
function getData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Ошибка при чтении data.json:', err);
    return {};
  }
}

/**
 * Сохраняет данные в файл
 */
function saveData(data = null) {
  try {
    if (data === null) {
      data = getData();
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Ошибка при сохранении data.json:', err);
  }
}

/**
 * Получает пользователя по ID
 */
function getUser(userId) {
  const data = getData();
  return data.users[userId] || null;
}

/**
 * Создает нового пользователя
 */
function createUser(userId, name) {
  const data = getData();
  
  if (!data.users[userId]) {
    data.users[userId] = {
      balance: 50000,
      regDate: new Date().toISOString(),
      name: name,
      status: 'user',
      lastBonus: 0,
      lastSuperBonus: 0,
      inventory: [],
      achievements: [],
      stats: {
        gamesPlayed: 0,
        wins: 0,
        casinoWins: 0,
        rouletteWins: 0,
        diceWins: 0,
        coinWins: 0,
        lotteryWins: 0
      },
      investments: [],
      farmPlots: [],
      miningCooldown: 0
    };
    
    data.stats.totalUsers++;
    saveData(data);
    console.log(`✅ Пользователь ${userId} (${name}) зарегистрирован`);
  }
  
  return data.users[userId];
}

/**
 * Обновляет баланс пользователя
 */
function updateBalance(userId, amount) {
  const data = getData();
  const user = data.users[userId];
  
  if (user) {
    user.balance = Math.max(0, user.balance + amount);
    saveData(data);
    return user.balance;
  }
  return null;
}

/**
 * Устанавливает баланс пользователя
 */
function setBalance(userId, amount) {
  const data = getData();
  const user = data.users[userId];
  
  if (user) {
    user.balance = Math.max(0, amount);
    saveData(data);
    return user.balance;
  }
  return null;
}

/**
 * Добавляет объявление
 */
function addAd(userId, text) {
  const data = getData();
  const id = Math.max(0, ...data.ads.map(ad => ad.id || 0)) + 1;
  
  data.ads.push({
    id,
    text,
    authorId: userId,
    date: Date.now(),
    pinned: false,
    status: 'pending'
  });
  
  saveData(data);
  return id;
}

/**
 * Получает объявление по ID
 */
function getAd(id) {
  const data = getData();
  return data.ads.find(ad => ad.id === id) || null;
}

/**
 * Обновляет объявление
 */
function updateAd(id, updates) {
  const data = getData();
  const ad = data.ads.find(ad => ad.id === id);
  
  if (ad) {
    Object.assign(ad, updates);
    saveData(data);
  }
  
  return ad;
}

/**
 * Удаляет объявление
 */
function deleteAd(id) {
  const data = getData();
  const index = data.ads.findIndex(ad => ad.id === id);
  
  if (index !== -1) {
    data.ads.splice(index, 1);
    saveData(data);
    return true;
  }
  
  return false;
}

/**
 * Получает одобренные объявления
 */
function getApprovedAds() {
  const data = getData();
  return data.ads
    .filter(ad => ad.status === 'approved')
    .sort((a, b) => {
      if (a.pinned === b.pinned) {
        return b.date - a.date;
      }
      return b.pinned - a.pinned;
    });
}

/**
 * Добавляет промокод
 */
function addPromo(code, uses, amount) {
  const data = getData();
  data.promos[code] = { usesLeft: uses, amount };
  saveData(data);
}

/**
 * Проверяет и применяет промокод
 */
function applyPromo(code) {
  const data = getData();
  const promo = data.promos[code];
  
  if (promo && promo.usesLeft > 0) {
    promo.usesLeft--;
    if (promo.usesLeft === 0) {
      delete data.promos[code];
    }
    saveData(data);
    return promo.amount;
  }
  
  return 0;
}

/**
 * Добавляет запись рулетки
 */
function addRouletteLog(number, color) {
  const data = getData();
  data.rouletteLog.push({
    number,
    color,
    time: Date.now()
  });
  
  // Сохраняем только последние 10
  if (data.rouletteLog.length > 10) {
    data.rouletteLog.shift();
  }
  
  saveData(data);
}

/**
 * Добавляет достижение пользователю
 */
function addAchievement(userId, achievementId, name, description) {
  const data = getData();
  const user = data.users[userId];
  
  if (user && !user.achievements.find(a => a.id === achievementId)) {
    user.achievements.push({
      id: achievementId,
      name,
      description,
      date: new Date().toISOString()
    });
    saveData(data);
    return true;
  }
  
  return false;
}

/**
 * Проверяет, находится ли пользователь в бане
 */
function isBanned(userId) {
  const data = getData();
  return data.bannedUsers.includes(userId);
}

/**
 * Добывает пользователя
 */
function banUser(userId) {
  const data = getData();
  if (!data.bannedUsers.includes(userId)) {
    data.bannedUsers.push(userId);
    saveData(data);
  }
}

/**
 * Разбанивает пользователя
 */
function unbanUser(userId) {
  const data = getData();
  const index = data.bannedUsers.indexOf(userId);
  if (index !== -1) {
    data.bannedUsers.splice(index, 1);
    saveData(data);
  }
}

/**
 * Логирует действие админа
 */
function logAdminAction(adminId, action, details) {
  const data = getData();
  data.adminLog.push({
    adminId,
    action,
    details,
    timestamp: new Date().toISOString()
  });
  
  // Сохраняем только последние 100 действий
  if (data.adminLog.length > 100) {
    data.adminLog.shift();
  }
  
  saveData(data);
}

/**
 * Получает магазины по умолчанию
 */
function getDefaultShops() {
  return {
    'Smoking Shop': {
      description: '🔥 Лучший выбор',
      categories: {
        'Расходники': [
          { name: 'Угли', price: 300 },
          { name: 'Кальяни', price: 1500 }
        ],
        'Жидкости': [
          { name: 'Жидкость Cherry', price: 500 },
          { name: 'Жидкость Mint', price: 500 }
        ],
        'Под Устройства': [
          { name: 'Voopoo Drag', price: 3000 }
        ]
      }
    },
    'ПРО Табак': {
      description: '⭐ Премиум качество',
      categories: {
        'Расходники': [
          { name: 'Спирали', price: 200 },
          { name: 'Сетка', price: 150 }
        ],
        'HQD': [
          { name: 'HQD Max', price: 800 }
        ]
      }
    },
    'Табачный рай': {
      description: '🎯 Широкий ассортимент',
      categories: {
        'Жидкости': [
          { name: 'Жидкость Apple', price: 450 },
          { name: 'Жидкость Strawberry', price: 450 }
        ],
        'Расходники': [
          { name: 'Фильтры', price: 100 }
        ]
      }
    },
    'Табачный Рай(новый)': {
      description: '✨ Новинки',
      categories: {
        'Под Устройства': [
          { name: 'Lost Mary', price: 2500 }
        ],
        'HQD': [
          { name: 'HQD Pro', price: 1200 }
        ]
      }
    },
    'Дым&Пар': {
      description: '💨 Оригинальные товары',
      categories: {
        'Расходники': [
          { name: 'Фарш', price: 250 }
        ],
        'Жидкости': [
          { name: 'Жидкость Tobacco', price: 600 }
        ]
      }
    }
  };
}

module.exports = {
  initializeData,
  getData,
  saveData,
  getUser,
  createUser,
  updateBalance,
  setBalance,
  addAd,
  getAd,
  updateAd,
  deleteAd,
  getApprovedAds,
  addPromo,
  applyPromo,
  addRouletteLog,
  addAchievement,
  isBanned,
  banUser,
  unbanUser,
  logAdminAction,
  getDefaultShops
};
