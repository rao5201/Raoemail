module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    category: {
      type: DataTypes.STRING
    },
    supplierId: {
      type: DataTypes.INTEGER
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  Product.associate = (models) => {
    // Product belongs to a supplier
    Product.belongsTo(models.Supplier, {
      foreignKey: 'supplierId'
    });

    // Product can have many sales
    Product.hasMany(models.Sale, {
      foreignKey: 'productId'
    });
  };

  return Product;
};