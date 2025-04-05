// filepath: /Users/keameng/Desktop/blog-app/backend/controllers/postController.js
const postController = {
  async getAllPosts(req, res) {
    console.log("Fetching all posts");
    res.json("All posts fetched successfully");
  },

  async createPost(req, res) {
    const { title, content } = req.body;
  },
};

module.exports = postController;
