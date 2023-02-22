module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    firstName: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    otpCode: {
      type: DataTypes.INTEGER,
    },
    otpCreateTime: {
      type: DataTypes.DATE,
    },
    isOTPVerified: {
      type: DataTypes.BOOLEAN,
    },
  });

  return User;
};
