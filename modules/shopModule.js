const dataManager = require('./dataManager');

/**
 * Показывает меню магазинов (inline кнопки)
 */
function handleShopsMenu(ctx) {
  try {
    const data = dataManager.getData();
    const shops = Object.keys(data.shops);
    const buttons = shops.map(shop => [{ text: shop, callback_data: `shop_${encodeURIComponent(shop)}` }]);
    
    ctx.reply(
      '🏪 Магазины Гагарина. Выберите интересующий магазин:',
      {
        reply_markup: {
          inline_keyboard: buttons
        }
      }
    );
  } catch (err) {
    console.error('handleShopsMenu error:', err);
    ctx.reply('❌ Ошибка при показе магазинов');
  }
}

/**
 * Обработка выбора магазина (inline)
 */
function handleShopSelection(ctx) {
  try {
    const shopName = decodeURIComponent(ctx.match[1]);
    const data = dataManager.getData();
    const shop = data.shops[shopName];
    if (!shop) {
      ctx.answerCbQuery('❌ Магазин не найден');
      return;
    }
    // Категории
    const categories = Object.keys(shop.categories);
    const buttons = categories.map(c => [{ text: c, callback_data: `category_${encodeURIComponent(shopName)}_${encodeURIComponent(c)}` }]);
    ctx.editMessageText(`🛒 <b>${shopName}</b>\n${shop.description}\n\nВыберите категорию:`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons }
    });
  } catch (err) {
    console.error('handleShopSelection error:', err);
    ctx.answerCbQuery('❌ Ошибка');
  }
}

/**
 * Обработка выбора категории (inline), показывает товары
 */
function handleCategorySelection(ctx) {
  try {
    const shopName = decodeURIComponent(ctx.match[1]);
    const categoryName = decodeURIComponent(ctx.match[2]);
    const data = dataManager.getData();
    const shop = data.shops[shopName];
    if (!shop) {
      ctx.answerCbQuery('❌ Магазин не найден');
      return;
    }
    const category = shop.categories[categoryName];
    if (!category) {
      ctx.answerCbQuery('❌ Категория не найдена');
      return;
    }
    let text = `🛒 <b>${shopName}</b>\n📦 <b>${categoryName}</b>\n\n`;
    category.forEach(item => {
      text += `• ${item.name} — <b>${item.price.toLocaleString()} тяг</b>\n`;
    });
    text += '\n<i>Создатель: ТТМ | @plaki_men</i>';
    ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: `shop_${encodeURIComponent(shopName)}` }]] }
    });
  } catch (err) {
    console.error('handleCategorySelection error:', err);
    ctx.answerCbQuery('❌ Ошибка');
  }
}

module.exports = {
  handleShopsMenu,
  handleShopSelection,
  handleCategorySelection
};
