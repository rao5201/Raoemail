module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
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

  File.associate = (models) => {
    // File belongs to a user
    File.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };

  return File;
};