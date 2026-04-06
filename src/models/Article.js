module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define('Article', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'draft'
    },
    category: {
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

  Article.associate = (models) => {
    // Article belongs to a user
    Article.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };

  return Article;
};