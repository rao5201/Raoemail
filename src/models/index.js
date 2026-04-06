const Sequelize = require('sequelize');

// Create sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

// Test connection
sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Database connection error:', err));

// Import models
const User = require('./User');
const Article = require('./Article');
const File = require('./File');
const Supplier = require('./Supplier');
const Product = require('./Product');
const Sale = require('./Sale');
const Expense = require('./Expense');
const CustomerEmail = require('./CustomerEmail');
const OperationLog = require('./OperationLog');

// Initialize models
const models = {
  User: User(sequelize, Sequelize),
  Article: Article(sequelize, Sequelize),
  File: File(sequelize, Sequelize),
  Supplier: Supplier(sequelize, Sequelize),
  Product: Product(sequelize, Sequelize),
  Sale: Sale(sequelize, Sequelize),
  Expense: Expense(sequelize, Sequelize),
  CustomerEmail: CustomerEmail(sequelize, Sequelize),
  OperationLog: OperationLog(sequelize, Sequelize)
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Sync database
sequelize.sync({ force: false })
  .then(() => console.log('Database synchronized'))
  .catch(err => console.error('Database synchronization error:', err));

module.exports = {
  sequelize,
  ...models
};