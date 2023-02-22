module.exports = (app) => {
  const users = require("../controllers/user.controller");

  var router = require("express").Router();

  const passport = require("passport");
  require("../utils/passport")(passport);

  // Create a new Tutorial
  router.post("/signup", users.register);

  router.post("/verify-Otp", users.verifyOtp);

  router.post("/resendOtp", users.resendOtp);

  router.post("/login", users.login);

  router.post("/forgotCredential", users.forgotCredential);

  router.patch("/updatePassword", users.updatePassword);

  router.patch(
    "/updateEmail",
    passport.authenticate("jwt", { session: false }),
    users.updateEmailOnProfile
  );

  router.patch(
    "/verfiyOtpProfile",
    passport.authenticate("jwt", { session: false }),
    users.verifyOtpOnProfile
  );

  router.patch(
    "/resendOtpCodeProfile",
    passport.authenticate("jwt", { session: false }),
    users.resendOtpCodeOnProfile
  );

  router.patch(
    "/updatePasswordOnProfile",
    passport.authenticate("jwt", { session: false }),
    users.updatePasswordOnProfile
  );

  app.use("/api/users", router);
};
