module.exports = (sequelize, DataTypes) => {
  const Supplier = sequelize.define('Supplier', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contact: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    phone: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active'
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

  Supplier.associate = (models) => {
    // Supplier can have many products
    Supplier.hasMany(models.Product, {
      foreignKey: 'supplierId'
    });
  };

  return Supplier;
};