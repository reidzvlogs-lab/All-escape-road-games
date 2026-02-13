(function () {
  function asNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  }

  function parseConfig() {
    var params = new URLSearchParams(window.location.search);
    var isAdminMode = params.get('admin') === '1';
    var gameId = (window.config && window.config.gameId) || location.pathname.split('/').filter(Boolean)[0] || 'escape-road';

    var shared = localStorage.getItem('escapeRoadAdminConfig');
    var gameSpecific = localStorage.getItem(gameId + ':adminConfig');
    var parsedShared = {};
    var parsedGame = {};

    try { if (shared) parsedShared = JSON.parse(shared); } catch (_) {}
    try { if (gameSpecific) parsedGame = JSON.parse(gameSpecific); } catch (_) {}

    var money = asNumber(params.get('money'), asNumber(parsedGame.money, asNumber(parsedShared.money, 0)));
    var cars = asNumber(params.get('cars'), asNumber(parsedGame.cars, asNumber(parsedShared.cars, 0)));
    var allCars = (params.get('allCars') || String(parsedGame.allCarsUnlocked ?? parsedShared.allCarsUnlocked || 'false')) === 'true';

    return {
      isAdminMode: isAdminMode,
      gameId: gameId,
      money: money,
      cars: cars,
      allCarsUnlocked: allCars,
      updatedAt: new Date().toISOString()
    };
  }

  var state = parseConfig();
  window.__ER_ADMIN_MODE__ = state.isAdminMode;
  window.__ER_ADMIN_STATE__ = state;

  if (state.isAdminMode && window.config) {
    window.config.enableMoreGame = 'no';
    window.config.enablePromotion = false;
    window.config.eventLog = false;
  }

  if (!state.isAdminMode) return;

  // Keep canonical config entries.
  localStorage.setItem('escapeRoadAdminConfig', JSON.stringify(state));
  localStorage.setItem(state.gameId + ':adminConfig', JSON.stringify(state));

  // Write broad compatibility keys used by many Unity/JS game templates.
  var values = {
    money: String(state.money),
    Money: String(state.money),
    cash: String(state.money),
    coins: String(state.money),
    coin: String(state.money),
    gold: String(state.money),
    cars: String(state.cars),
    Cars: String(state.cars),
    carCount: String(state.cars),
    carsOwned: String(state.cars),
    unlockedAllCars: state.allCarsUnlocked ? '1' : '0',
    allCarsUnlocked: state.allCarsUnlocked ? '1' : '0',
    admin_money: String(state.money),
    admin_cars: String(state.cars),
    admin_all_cars: String(state.allCarsUnlocked)
  };

  Object.keys(values).forEach(function (key) {
    localStorage.setItem(key, values[key]);
    localStorage.setItem(state.gameId + ':' + key, values[key]);
  });

  // If the game listens for postMessage, this makes the state available.
  window.addEventListener('message', function (event) {
    if (!event || !event.data) return;
    if (event.data.type === 'ESCAPE_ROAD_ADMIN_STATE_REQUEST' && event.source) {
      event.source.postMessage({ type: 'ESCAPE_ROAD_ADMIN_STATE', payload: state }, '*');
    }
  });
})();
