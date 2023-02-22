module.exports = (app) => {
  const posts = require("../controllers/post.controller");

  var router = require("express").Router();

  const passport = require("passport");
  require("../utils/passport")(passport);

  router.post(
    "/createPost",
    passport.authenticate("jwt", { session: false }),
    posts.createPost
  );

  router.patch(
    "/updatePost/:id",
    passport.authenticate("jwt", { session: false }),
    posts.updatePost
  );

  router.delete(
    "/deletePost/:post_id",
    passport.authenticate("jwt", { session: false }),
    posts.deletePost
  );

  router.patch(
    "/likePost/:id",
    passport.authenticate("jwt", { session: false }),
    posts.likePost
  );

  router.get(
    "/getPostsByUser",
    passport.authenticate("jwt", { session: false }),
    posts.getPostByUser
  );

  router.get(
    "/getPost/:id",
    passport.authenticate("jwt", { session: false }),
    posts.getPost
  );

  app.use("/api/posts", router);
};
