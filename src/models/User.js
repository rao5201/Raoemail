module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },
    name: {
      type: DataTypes.STRING
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

  User.associate = (models) => {
    // User can have many articles
    User.hasMany(models.Article, {
      foreignKey: 'userId'
    });

    // User can upload many files
    User.hasMany(models.File, {
      foreignKey: 'userId'
    });

    // User can make many sales
    User.hasMany(models.Sale, {
      foreignKey: 'userId'
    });

    // User can create many expenses
    User.hasMany(models.Expense, {
      foreignKey: 'userId'
    });
  };

  return User;
};