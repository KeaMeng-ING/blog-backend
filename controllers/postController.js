const slugify = require("slugify");
const { format } = require("date-fns");

// const { PrismaClient } = require("@prisma/client");
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
      const { title, content, subtitle, categoryId, imageUrl } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          message: "Title and content are required",
        });
      }

      // let imageUrl = null;
      // if (imageUrl) {
      //   const uploadResult = await uploadBase64Image(imageUrl);
      //   imageUrl = uploadResult.url;
      // }

      // console.log(imageUrl);

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
              username: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      let message = "Post from another author";
      let postsFromSameAuthor = await prisma.post.findMany({
        where: {
          authorId: post.authorId,
          slug: {
            not: slug, // Exclude the current post
          },
        },
      });

      if (postsFromSameAuthor.length == 0) {
        postsFromSameAuthor = await prisma.post.findMany({
          where: {
            published: true,
          },
          orderBy: {
            views: "desc",
          },
          take: 6,
        });
        message = "No posts from this author";
      }

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json({ post, postsFromSameAuthor, message });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  async incrementViews(req, res) {
    try {
      const { slug } = req.params;

      const post = await prisma.post.update({
        where: { slug },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      return res.status(200).json({ views: post.views });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Server error", error });
    }
  },

  async getPostsByUsername(req, res) {
    try {
      const { username } = req.params;

      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const posts = await prisma.post.findMany({
        where: { authorId: user.id },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      res.json({ posts });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = postController;
