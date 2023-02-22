const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const db = require("../models");
const User = db.users;

let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = "6dqw7dydyw7ewyuw";

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      // console.log("jwt_payload::", jwt_payload);
      User.findOne({ where: { id: jwt_payload.id } })
        .then((user) => {
          if (user) {
            // console.log("yes::", user);

            return done(null, user);
          }
          // console.log("no");
          return done(null, false);
        })
        .catch((err) => console.log(err));
    })
  );
};
