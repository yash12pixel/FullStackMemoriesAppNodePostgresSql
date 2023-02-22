const db = require("../models");
const Post = db.posts;
const User = db.users;

const getAllPosts = async (id) => {
  try {
    await User.findByPk(id, { include: ["posts"] })
      .then((posts) => {
        // console.log("posts", posts.posts);
        return posts.posts;
      })
      .catch((err) => {
        console.log(">> Error while finding posts: ", err);
      });
  } catch (error) {
    console.log("Error in fetching all the posts::", error);
  }
};

exports.createPost = async (req, res) => {
  const { title, message, selectedFile, creator, tags } = req.body;
  let id = req.user.id;
  try {
    if (!creator) {
      res.status(406).json({ message: "Creator is required" });
    } else if (!title) {
      res.status(406).json({ message: "Title is required" });
    } else if (!message) {
      res.status(406).json({ message: "Message is required" });
    } else if (!tags) {
      res.status(406).json({ message: "Tags is required" });
    } else if (!selectedFile) {
      res.status(406).json({ message: "Image file is required" });
    } else {
      const post = {
        title: title,
        message: message,
        creator: creator,
        tags: tags,
        selectedFile: selectedFile,
        userId: id,
      };
      await Post.create(post)
        .then((data) => {
          res.status(200).json({ success: true, data: data });
        })
        .catch((err) => {
          // console.log("err::", err);
          res.status(501).send({
            message:
              err.message || "Some error occurred while creating the Tutorial.",
          });
        });
    }
  } catch (error) {
    // console.log("Error For Create Post", error.message);
    return res
      .status(500)
      .json({ success: false, msg: "Error For Create Post" });
  }
};

exports.updatePost = async (req, res) => {
  const { title, message, creator, selectedFile, tags } = req.body;
  const { id } = req.params;
  try {
    const isPost = await Post.findOne({ where: { id: id } });
    if (!isPost) {
      res.status(400).json({ success: false, msg: "invalid post id" });
      return false;
    } else {
      const postdata = isPost.dataValues;
      await Post.update(
        {
          title: title,
          message: message,
          creator: creator,
          selectedFile: selectedFile,
          tags: tags,
        },
        { where: { id: postdata.id } }
      )
        .then(() => {
          Post.findByPk(id)
            .then((post) => {
              return res.status(200).json({
                success: true,
                msg: "post fetch successfully",
                post: post,
              });
            })
            .catch((err) => {
              console.log(">> Error while finding post: ", err);
            });
        })
        .catch((err) => {
          console.log(">> Eroor: ", err);
        });
    }
  } catch (error) {
    // console.log("Error in Post Update", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.deletePost = async (req, res) => {
  const { post_id } = req.params;
  let id = req.user.id;

  try {
    const isPost = await Post.findOne({ where: { id: post_id } });
    if (!isPost) {
      res.status(400).json({ success: false, msg: "invalid post id" });
      return false;
    } else {
      //   const postdata = isPost.dataValues;
      await Post.destroy({
        where: { id: post_id },
      })
        .then(() => {
          User.findByPk(id, { include: ["posts"] })
            .then((post) => {
              return res.status(200).json({
                success: true,
                msg: "post fetch successfully",
                post: post,
              });
            })
            .catch((err) => {
              console.log(">> Error while finding post: ", err);
            });
        })
        .catch((err) => {
          console.log(">> Error while delete Post: ", err);
        });
    }
  } catch (error) {
    // console.log("Error in Post Delete", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.getPostByUser = async (req, res) => {
  let id = req.user.id;
  try {
    await User.findByPk(id, { include: ["posts"] })
      .then((posts) => {
        return res.status(200).json({
          success: true,
          msg: "user's post fetch successfully",
          postsByUser: posts,
        });
      })
      .catch((err) => {
        console.log(">> Error while finding posts: ", err);
      });
  } catch (error) {
    // console.log("Error in fetch user's posts", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.likePost = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const isPost = await Post.findOne({ where: { id: id } });
    if (!isPost) {
      res.status(400).json({ success: false, msg: "invalid post id" });
      return false;
    } else {
      const postdata = isPost.dataValues;
      await Post.update(
        {
          likeCount: postdata.likeCount + 1,
        },
        { where: { id: postdata.id } }
      )
        .then(() =>
          Post.findByPk(id)
            .then((post) => {
              return res.status(200).json({
                success: true,
                msg: "post fetch successfully",
                post: post,
              });
            })
            .catch((err) => {
              console.log(">> Error while finding post: ", err);
            })
        )
        .catch((err) => {
          console.log(">> Eroor: ", err);
        });
    }
  } catch (error) {
    // console.log("Error in Like post", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.getPost = async (req, res) => {
  const { id } = req.params;
  try {
    const isPost = await Post.findOne({ where: { id: id } });
    if (!isPost) {
      res.status(400).json({ success: false, msg: "invalid post id" });
      return false;
    } else {
      await Post.findByPk(id, { include: ["user"] })
        .then((post) => {
          return res.status(200).json({
            success: true,
            msg: "post fetch successfully",
            post: post,
          });
        })
        .catch((err) => {
          console.log(">> Error while finding post: ", err);
        });
    }
  } catch (error) {
    // console.log("Error in fetch post detail", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};
