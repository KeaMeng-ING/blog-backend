const slugify = require("slugify");
const { format } = require("date-fns");

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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
      const { title, content, subtitle, categoryId, imageData } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          message: "Title and content are required",
        });
      }

      let imageUrl = null;
      if (imageData) {
        const uploadResult = await uploadBase64Image(imageData);
        imageUrl = uploadResult.url;
      }

      let slug = slugify(title, { lower: true, strict: true });

      // Ensure the slug is unique
      let existingPost = await prisma.post.findUnique({ where: { slug } });
      if (existingPost) {
        slug = `${slug}-${Date.now()}`; // Append timestamp to make it unique
      }

      const newPost = await prisma.post.create({
        data: {
          title,
          content,
          subtitle,
          slug,
          authorId: req.authData.id,
          categoryId,
          imageUrl,
          published: true,
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
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  async getAllCategories(req, res) {
    try {
      const categories = await prisma.category.findMany();
      res.json({ categories });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  async getPostBySlugAndSamePosts(req, res) {
    try {
      const { slug } = req.params;

      const post = await prisma.post.findUnique({
        where: { slug },
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

      const postsFromSameAuthor = await prisma.post.findMany({
        where: {
          authorId: post.authorId,
          slug: {
            not: slug, // Exclude the current post
          },
        },
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json({ post, postsFromSameAuthor });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = postController;
