const { DataTypes } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define("post", {
    title: {
      type: DataTypes.STRING,
    },
    message: {
      type: DataTypes.STRING,
    },
    creator: {
      type: DataTypes.STRING,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    selectedFile: {
      type: DataTypes.TEXT,
    },
    likeCount: {
      type: DataTypes.INTEGER,
    },
  });

  return Post;
};
