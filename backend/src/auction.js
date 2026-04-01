const fs = require('fs');

// 拍卖状态
const AUCTION_STATUS = {
  ACTIVE: 'active',
  ENDED: 'ended',
  SOLD: 'sold'
};

// 拍卖物品
class AuctionItem {
  constructor(id, email, type, startingPrice, currentPrice, bidder, endTime) {
    this.id = id;
    this.email = email;
    this.type = type;
    this.startingPrice = startingPrice;
    this.currentPrice = currentPrice;
    this.bidder = bidder;
    this.endTime = endTime;
    this.status = AUCTION_STATUS.ACTIVE;
  }
}

// 拍卖系统
class AuctionSystem {
  constructor() {
    this.items = [];
    this.loadAuctions();
  }

  // 加载拍卖数据
  loadAuctions() {
    try {
      const data = fs.readFileSync('auctions.json', 'utf8');
      this.items = JSON.parse(data);
    } catch (error) {
      console.log('No auctions found, starting fresh');
      this.items = [];
    }
  }

  // 保存拍卖数据
  saveAuctions() {
    fs.writeFileSync('auctions.json', JSON.stringify(this.items, null, 2));
  }

  // 创建拍卖
  createAuction(email, type, startingPrice, durationHours) {
    const id = Date.now().toString();
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + durationHours);

    const item = new AuctionItem(
      id,
      email,
      type,
      startingPrice,
      startingPrice,
      null,
      endTime.toISOString()
    );

    this.items.push(item);
    this.saveAuctions();
    return item;
  }

  // 出价
  placeBid(auctionId, bidder, amount) {
    const item = this.items.find(item => item.id === auctionId);
    if (!item) {
      throw new Error('Auction not found');
    }

    if (item.status !== AUCTION_STATUS.ACTIVE) {
      throw new Error('Auction is not active');
    }

    if (new Date() > new Date(item.endTime)) {
      item.status = AUCTION_STATUS.ENDED;
      this.saveAuctions();
      throw new Error('Auction has ended');
    }

    if (amount <= item.currentPrice) {
      throw new Error('Bid amount must be higher than current price');
    }

    item.currentPrice = amount;
    item.bidder = bidder;
    this.saveAuctions();
    return item;
  }

  // 结束拍卖
  endAuction(auctionId) {
    const item = this.items.find(item => item.id === auctionId);
    if (!item) {
      throw new Error('Auction not found');
    }

    if (item.status !== AUCTION_STATUS.ACTIVE) {
      throw new Error('Auction is not active');
    }

    item.status = item.bidder ? AUCTION_STATUS.SOLD : AUCTION_STATUS.ENDED;
    this.saveAuctions();
    return item;
  }

  // 获取所有拍卖
  getAllAuctions() {
    // 检查并更新过期的拍卖
    this.items.forEach(item => {
      if (item.status === AUCTION_STATUS.ACTIVE && new Date() > new Date(item.endTime)) {
        item.status = item.bidder ? AUCTION_STATUS.SOLD : AUCTION_STATUS.ENDED;
      }
    });
    this.saveAuctions();
    return this.items;
  }

  // 获取活跃拍卖
  getActiveAuctions() {
    return this.getAllAuctions().filter(item => item.status === AUCTION_STATUS.ACTIVE);
  }

  // 获取已结束拍卖
  getEndedAuctions() {
    return this.getAllAuctions().filter(item => item.status === AUCTION_STATUS.ENDED || item.status === AUCTION_STATUS.SOLD);
  }
}

module.exports = {
  AuctionSystem,
  AUCTION_STATUS
};