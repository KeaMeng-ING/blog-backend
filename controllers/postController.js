const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const slugify = require("slugify");
const { format } = require("date-fns");

const postController = {
  async getAllPosts(req, res) {
    try {
      const posts = await prisma.post.findMany({
        where: {
          published: true,
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      // console.log(posts);

      const formattedPosts = posts.map((post) => ({
        ...post,
        authorName: post.author
          ? `${post.author.firstName} ${post.author.lastName}`.trim()
          : "Unknown",
        categoryName: post.category ? post.category.name : "Uncategorized",
        createdAt: format(new Date(post.createdAt), "yyyy-MM-dd - HH:mm:ss"), // Format createdAt
        author: undefined, // Remove the original author object
        category: undefined, // Remove the original category object
      }));

      // console.log(formattedPosts);

      res.json({ posts: formattedPosts });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  async createPost(req, res) {
    try {
      const { title, content, subtitle, categoryId, imageUrl } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          message: "Title and content are required",
        });
      }

      const slug = slugify(title, { lower: true, strict: true });

      const newPost = await prisma.post.create({
        data: {
          title,
          content,
          subtitle,
          slug,
          authorId: req.authData.id,
          categoryId,
          imageUrl,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
            },
          },
        },
      });

      res.json({
        message: "Post created",
        post: newPost,
      });

      // console.log(newPost);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = postController;
