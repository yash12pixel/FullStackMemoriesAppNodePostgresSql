const dbConfig = require("../config/db.config");

const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require("./user.model")(sequelize, Sequelize);
db.posts = require("./post.model")(sequelize, Sequelize);

db.users.hasMany(db.posts, { as: "posts" });
db.posts.belongsTo(db.users, {
  foreignKey: "userId",
  as: "user",
});

module.exports = db;
