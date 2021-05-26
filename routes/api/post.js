const express = require('express');
const auth = require('../../middlewares/auth');
const { check, validationResult } = require('express-validator');
const Post = require('../../models/Post');
const User = require('../../models/User');
const { text } = require('express');

const router = express.Router();

// Add Post
router.post(
  '/',
  [auth, [check('text', "Please provide post's text").exists()]],
  async (req, res) => {
    try {
      // check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty) {
        return res.status(400).json({ success: false, errors });
      }

      // get user data
      const user = await User.findById(req.user.id);

      if (!user) {
        return res
          .status(400)
          .json({ success: false, msg: 'User does not exist' });
      }

      const { name, avatar } = user;
      const post = {
        name,
        avatar,
        user: user.id,
        text: req.body.text,
      };

      // create post
      const createdPost = await Post.create(post);
      res.status(200).json({ success: true, data: createdPost });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false, msg: 'Something went wrong' });
    }
  }
);

// Get All Post
router.get('/', auth, async (req, res) => {
  try {
    // get all post
    const posts = await Post.find().sort({ data: -1 });

    // send res
    res.status(200).json({ success: true, count: posts.length, data: posts });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, msg: 'Something went wrong' });
  }
});

// Get Single Post
router.get('/:postId', auth, async (req, res) => {
  try {
    // get post
    const post = await Post.findById(req.params.postId);

    if (!post)
      return res.status(400).json({ success: false, msg: 'Post not Found' });

    // send res
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, msg: 'Something went wrong' });
  }
});

// Del Post
router.delete('/:postId', auth, async (req, res) => {
  try {
    // find post
    const post = await Post.findById(req.params.postId);

    if (!post) {
      res.status(400).json({ success: false, msg: 'Post not exist' });
    }

    // check post owner is the same user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        msg: 'You are not authorize to delete this post',
      });
    }

    const deletedPost = await post.remove();

    res.status(200).json({ success: true, data: deletedPost });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, msg: 'Something went wrong' });
  }
});

// Like post

router.put('/like/:id', auth, async (req, res) => {
  try {
    // get the post
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(400).json({ success: false, msg: 'Post not exist' });
    }

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res
        .status(400)
        .json({ success: false, msg: 'Post already liked' });
    }
    // in likes array add userId
    post.likes.push({ user: req.user.id });

    await post.save();

    res.status(200).json({ success: true, likes: post.likes });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, msg: 'Something went wrong' });
  }
});

// UnLike post
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    // get the post
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(400).json({ success: false, msg: 'Post not exist' });
    }

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length == 0
    ) {
      return res
        .status(400)
        .json({ success: false, msg: 'Post has not liked' });
    }
    // in likes array add userId
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.status(200).json({ success: true, likes: post.likes });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, msg: 'Something went wrong' });
  }
});

// add comment
router.post(
  '/comment/:id',
  [auth, [check('text', 'Please provide comment text').exists()]],
  async (req, res) => {
    try {
      // validation error
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors });
      }

      // fetch post
      const post = await Post.findById(req.params.id);
      const user = await User.findById(req.user.id);

      if (!post) {
        return res.status(400).json({ success: false, msg: 'Post not exist' });
      }

      const comment = {
        text: req.body.text,
        user: req.user.id,
        name: user.name,
        avatar: user.avatar,
      };

      post.comments.unshift(comment);

      post.save();

      res.status(200).json({ success: true, data: post.comments });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false, msg: 'Something went wrong' });
    }
  }
);
// remove comment
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    // fetch post
    const post = await Post.findById(req.params.id);

    // make sure the post exist
    if (!post) {
      return res.status(400).json({ success: false, msg: 'Post not exist' });
    }

    // taking out the comment
    const comment = post.comments.find(
      (comment) => comment.id.toString() === req.params.comment_id
    );

    // make sure comment exist
    if (!comment) {
      return res.status(400).json({ success: false, msg: 'Comment not exist' });
    }

    // make sure the user has access to delete
    if (comment.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ success: false, msg: 'You cant delete this comment' });
    }

    // delete
    const removeIndex = post.comments
      .map((comment) => comment.id.toString())
      .indexOf(req.params.comment_id);

    post.comments.splice(removeIndex, 1);

    post.save();

    res.status(200).json({ success: true, data: post.comments });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, msg: 'Something went wrong' });
  }
});

module.exports = router;
