const SAVE_KEY = "coin-clicker-save";
const BUILDING_DEFINITIONS = [
  {
    id: "catCafe",
    name: "ネコカフェ",
    description: "お客さんを集めて、1秒ごとにコイン +5",
    basePrice: 200,
    priceStep: 120,
    income: 5,
    unlock: {
      label: "おてつだいネコを10匹買うと開放",
      check: (state) => state.helperLevel >= 10,
    },
  },
  {
    id: "catWorkshop",
    name: "ネコ工房",
    description: "道具づくりで、1秒ごとにコイン +20",
    basePrice: 1500,
    priceStep: 900,
    income: 20,
    unlock: {
      label: "ネコカフェを5個買うと開放",
      check: (state) => state.buildings.catCafe.count >= 5,
    },
  },
  {
    id: "catMarket",
    name: "ネコマーケット",
    description: "にぎやかなお店で、1秒ごとにコイン +100",
    basePrice: 12000,
    priceStep: 7000,
    income: 100,
    unlock: {
      label: "ネコ工房を5個買うと開放",
      check: (state) => state.buildings.catWorkshop.count >= 5,
    },
  },
  {
    id: "catTower",
    name: "ネコタワー",
    description: "高い塔から大きく稼いで、1秒ごとにコイン +500",
    basePrice: 90000,
    priceStep: 50000,
    income: 500,
    unlock: {
      label: "ネコマーケットを5個買うと開放",
      check: (state) => state.buildings.catMarket.count >= 5,
    },
  },
  {
    id: "catKingdom",
    name: "ネコ王国",
    description: "王国の力で、1秒ごとにコイン +3000",
    basePrice: 700000,
    priceStep: 350000,
    income: 3000,
    unlock: {
      label: "ネコタワーを5個買うと開放",
      check: (state) => state.buildings.catTower.count >= 5,
    },
  },
];

const state = {
  coins: 0,
  totalCoins: 0,
  clickPower: 1,
  powerLevel: 0,
  helperLevel: 0,
  powerAutoEnabled: false,
  helperAutoEnabled: false,
  powerPrice: 10,
  helperPrice: 25,
  buildings: {
    catCafe: { count: 0, price: 200, autoEnabled: false },
    catWorkshop: { count: 0, price: 1500, autoEnabled: false },
    catMarket: { count: 0, price: 12000, autoEnabled: false },
    catTower: { count: 0, price: 90000, autoEnabled: false },
    catKingdom: { count: 0, price: 700000, autoEnabled: false },
  },
};

const coinCount = document.getElementById("coin-count");
const coinsPerSecond = document.getElementById("coins-per-second");
const buildingList = document.getElementById("building-list");
const clickButton = document.getElementById("click-button");
const powerCard = document.getElementById("power-upgrade");
const helperCard = document.getElementById("helper-upgrade");
const powerBuyButton = document.getElementById("power-buy-button");
const helperBuyButton = document.getElementById("helper-buy-button");
const powerAutoButton = document.getElementById("power-auto-button");
const helperAutoButton = document.getElementById("helper-auto-button");
const powerPrice = document.getElementById("power-price");
const helperPrice = document.getElementById("helper-price");
const powerCount = document.getElementById("power-count");
const helperCount = document.getElementById("helper-count");
const bonusTotal = document.getElementById("bonus-total");
const bonusStatus = document.getElementById("bonus-status");
const totalCoins = document.getElementById("total-coins");
const resetButton = document.getElementById("reset-button");
const luckyMessage = document.getElementById("lucky-message");

let luckyMessageTimerId = null;

function updateBuildingPrices() {
  for (const building of BUILDING_DEFINITIONS) {
    const owned = state.buildings[building.id].count;
    state.buildings[building.id].price = building.basePrice + owned * building.priceStep;
  }
}

function saveGame() {
  const saveData = {
    coins: state.coins,
    totalCoins: state.totalCoins,
    powerLevel: state.powerLevel,
    helperLevel: state.helperLevel,
    powerAutoEnabled: state.powerAutoEnabled,
    helperAutoEnabled: state.helperAutoEnabled,
    buildings: state.buildings,
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function updateUpgradeValues() {
  state.clickPower = 1 + state.powerLevel;
  state.powerPrice = 10 + state.powerLevel * 10;
  state.helperPrice = 25 + state.helperLevel * 15;
}

function loadGame() {
  const rawData = localStorage.getItem(SAVE_KEY);

  if (!rawData) {
    return false;
  }

  try {
    const saveData = JSON.parse(rawData);
    state.coins = Number(saveData.coins) || 0;
    state.totalCoins = Number(saveData.totalCoins) || 0;
    state.powerLevel = Number(saveData.powerLevel) || 0;
    state.helperLevel = Number(saveData.helperLevel) || 0;
    state.powerAutoEnabled = Boolean(saveData.powerAutoEnabled);
    state.helperAutoEnabled = Boolean(saveData.helperAutoEnabled);
    if (saveData.buildings) {
      for (const building of BUILDING_DEFINITIONS) {
        const savedBuilding = saveData.buildings[building.id];

        if (!savedBuilding) {
          continue;
        }

        state.buildings[building.id].count = Number(savedBuilding.count) || 0;
        state.buildings[building.id].autoEnabled = Boolean(savedBuilding.autoEnabled);
      }
    }
    updateUpgradeValues();
    updateBuildingPrices();
    return true;
  } catch (error) {
    localStorage.removeItem(SAVE_KEY);
    return false;
  }
}

function resetGame() {
  state.coins = 0;
  state.totalCoins = 0;
  state.powerLevel = 0;
  state.helperLevel = 0;
  state.powerAutoEnabled = false;
  state.helperAutoEnabled = false;
  for (const building of BUILDING_DEFINITIONS) {
    state.buildings[building.id].count = 0;
    state.buildings[building.id].autoEnabled = false;
  }
  updateUpgradeValues();
  updateBuildingPrices();
  saveGame();
  updateScreen();
}

function getMilestoneBonus() {
  let multiplier = 1;
  const activeBonuses = [];

  if (state.helperLevel >= 10) {
    multiplier *= 2;
    activeBonuses.push("10匹で x2");
  }

  if (state.helperLevel >= 25) {
    multiplier *= 2;
    activeBonuses.push("25匹で x2");
  }

  if (state.helperLevel >= 50) {
    multiplier *= 3;
    activeBonuses.push("50匹で x3");
  }

  return { multiplier, activeBonuses };
}

function getBuildingIncome() {
  let total = 0;

  for (const building of BUILDING_DEFINITIONS) {
    total += state.buildings[building.id].count * building.income;
  }

  return total;
}

function getPassiveBaseIncome() {
  return state.helperLevel + getBuildingIncome();
}

function getPassiveFinalIncome() {
  return getPassiveBaseIncome() * getMilestoneBonus().multiplier;
}

function isBuildingUnlocked(building) {
  return building.unlock.check(state);
}

function renderBuildings() {
  const cards = [];

  for (const building of BUILDING_DEFINITIONS) {
    const data = state.buildings[building.id];
    const unlocked = isBuildingUnlocked(building);
    const canBuy = unlocked && state.coins >= data.price;
    const badgeText = unlocked ? "開放中" : "未開放";
    const autoText = `オート購入: ${data.autoEnabled ? "オン" : "オフ"}`;

    cards.push(`
      <article class="building-card${canBuy ? " can-buy" : ""}${unlocked ? "" : " locked"}">
        <div class="building-top">
          <div>
            <span class="building-name">${building.name}</span>
            <span class="building-income">${building.description}</span>
            <span class="building-price">価格: <strong>${data.price}</strong> コイン</span>
            <span class="building-owned">所持数: <strong>${data.count}</strong></span>
            ${unlocked ? "" : `<span class="building-lock">${building.unlock.label}</span>`}
          </div>
          <span class="building-badge">${badgeText}</span>
        </div>
        <div class="building-actions">
          <button
            class="mini-button building-buy-button"
            type="button"
            data-building-id="${building.id}"
            ${unlocked && state.coins >= data.price ? "" : "disabled"}
          >
            1個買う
          </button>
          <button
            class="mini-button auto-button${data.autoEnabled ? " is-on" : ""}"
            type="button"
            data-building-auto-id="${building.id}"
            ${unlocked ? "" : "disabled"}
          >
            ${autoText}
          </button>
        </div>
      </article>
    `);
  }

  buildingList.innerHTML = cards.join("");
}

function updateScreen() {
  const milestoneBonus = getMilestoneBonus();
  const passiveCoins = getPassiveBaseIncome();
  const finalPassiveCoins = getPassiveFinalIncome();

  coinCount.textContent = state.coins;
  coinsPerSecond.textContent = finalPassiveCoins;
  totalCoins.textContent = state.totalCoins;
  powerPrice.textContent = state.powerPrice;
  helperPrice.textContent = state.helperPrice;
  powerCount.textContent = state.powerLevel;
  helperCount.textContent = state.helperLevel;
  bonusTotal.textContent = `現在の倍率: x${milestoneBonus.multiplier}`;
  bonusStatus.textContent = milestoneBonus.activeBonuses.length > 0
    ? `発動中: ${milestoneBonus.activeBonuses.join(" / ")} / 基本の自動収入: ${passiveCoins} コイン/秒`
    : `まだ節目ボーナスは発動していません。 / 基本の自動収入: ${passiveCoins} コイン/秒`;

  powerBuyButton.disabled = state.coins < state.powerPrice;
  helperBuyButton.disabled = state.coins < state.helperPrice;

  powerCard.parentElement.classList.toggle("can-buy", state.coins >= state.powerPrice);
  helperCard.parentElement.classList.toggle("can-buy", state.coins >= state.helperPrice);
  powerCard.parentElement.classList.toggle("not-ready", state.coins < state.powerPrice);
  helperCard.parentElement.classList.toggle("not-ready", state.coins < state.helperPrice);

  powerAutoButton.textContent = `オート購入: ${state.powerAutoEnabled ? "オン" : "オフ"}`;
  helperAutoButton.textContent = `オート購入: ${state.helperAutoEnabled ? "オン" : "オフ"}`;
  powerAutoButton.classList.toggle("is-on", state.powerAutoEnabled);
  helperAutoButton.classList.toggle("is-on", state.helperAutoEnabled);
  renderBuildings();
}

function addCoins(baseAmount) {
  const milestoneBonus = getMilestoneBonus();
  const finalAmount = baseAmount * milestoneBonus.multiplier;

  state.coins += finalAmount;
  state.totalCoins += finalAmount;
  updateScreen();
  saveGame();
}

function showLuckyMessage() {
  luckyMessage.textContent = "ラッキー！";

  if (luckyMessageTimerId) {
    window.clearTimeout(luckyMessageTimerId);
  }

  luckyMessageTimerId = window.setTimeout(() => {
    luckyMessage.textContent = "";
    luckyMessageTimerId = null;
  }, 900);
}

function buyPowerUpgrade() {
  if (state.coins < state.powerPrice) {
    return false;
  }

  state.coins -= state.powerPrice;
  state.powerLevel += 1;
  updateUpgradeValues();
  updateScreen();
  saveGame();
  return true;
}

function buyHelperUpgrade() {
  if (state.coins < state.helperPrice) {
    return false;
  }

  state.coins -= state.helperPrice;
  state.helperLevel += 1;
  updateUpgradeValues();
  updateScreen();
  saveGame();
  return true;
}

function buyBuilding(buildingId) {
  const building = BUILDING_DEFINITIONS.find((item) => item.id === buildingId);

  if (!building || !isBuildingUnlocked(building)) {
    return false;
  }

  const data = state.buildings[building.id];

  if (state.coins < data.price) {
    return false;
  }

  state.coins -= data.price;
  data.count += 1;
  updateBuildingPrices();
  updateScreen();
  saveGame();
  return true;
}

function toggleBuildingAuto(buildingId) {
  const building = BUILDING_DEFINITIONS.find((item) => item.id === buildingId);

  if (!building || !isBuildingUnlocked(building)) {
    return false;
  }

  state.buildings[building.id].autoEnabled = !state.buildings[building.id].autoEnabled;
  updateScreen();
  saveGame();
  return true;
}

clickButton.addEventListener("click", () => {
  let earnedCoins = state.clickPower;
  const isLucky = Math.random() < 0.1;

  if (isLucky) {
    earnedCoins *= 2;
    showLuckyMessage();
  }

  addCoins(earnedCoins);
});

powerBuyButton.addEventListener("click", () => {
  buyPowerUpgrade();
});

helperBuyButton.addEventListener("click", () => {
  buyHelperUpgrade();
});

powerAutoButton.addEventListener("click", () => {
  state.powerAutoEnabled = !state.powerAutoEnabled;
  updateScreen();
  saveGame();
});

helperAutoButton.addEventListener("click", () => {
  state.helperAutoEnabled = !state.helperAutoEnabled;
  updateScreen();
  saveGame();
});

buildingList.addEventListener("click", (event) => {
  const autoButton = event.target.closest("[data-building-auto-id]");

  if (autoButton) {
    toggleBuildingAuto(autoButton.dataset.buildingAutoId);
    return;
  }

  const button = event.target.closest("[data-building-id]");

  if (!button) {
    return;
  }

  buyBuilding(button.dataset.buildingId);
});

resetButton.addEventListener("click", () => {
  const shouldReset = window.confirm("セーブデータをリセットしますか？");

  if (!shouldReset) {
    return;
  }

  resetGame();
});

setInterval(() => {
  const passiveCoins = getPassiveBaseIncome();

  if (passiveCoins > 0) {
    addCoins(passiveCoins);
  }

  if (state.powerAutoEnabled) {
    buyPowerUpgrade();
  }

  if (state.helperAutoEnabled) {
    buyHelperUpgrade();
  }

  for (const building of BUILDING_DEFINITIONS) {
    if (state.buildings[building.id].autoEnabled) {
      buyBuilding(building.id);
    }
  }
}, 1000);

loadGame();
updateBuildingPrices();
updateScreen();
