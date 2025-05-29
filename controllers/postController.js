const slugify = require("slugify");
const { format } = require("date-fns");

// const { PrismaClient } = require("@prisma/client");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const postController = {
  async getAllPosts(req, res) {
    try {
      // Get query parameters with defaults
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search;
      const status = req.query.status;
      const category = req.query.category;

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Build the where clause based on filters
      const whereClause = {};

      // Status filter
      if (status) {
        if (status === "published") {
          whereClause.published = true;
        } else if (status === "draft") {
          whereClause.published = false;
        } else if (status === "scheduled") {
          whereClause.published = false;
          whereClause.scheduledAt = { gt: new Date() };
        }
      }

      // Category filter
      if (category && category !== "all") {
        whereClause.category = {
          name: {
            equals: category,
            mode: "insensitive",
          },
        };
      }

      // Search filter (across title, content, and author name)
      if (search) {
        whereClause.OR = [
          {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            content: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            author: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        ];
      }

      // Get total count for pagination
      const totalPosts = await prisma.post.count({ where: whereClause });

      // Get posts with pagination
      const posts = await prisma.post.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              imageUrl: true,
              username: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: "desc", // Most recent posts first
        },
      });

      // Format posts for frontend
      const formattedPosts = posts.map((post) => ({
        ...post,
        authorName: post.author
          ? `${post.author.firstName} ${post.author.lastName}`.trim()
          : "Unknown",
        categoryName: post.category ? post.category.name : "Uncategorized",
        createdAt: format(new Date(post.createdAt), "yyyy-MM-dd - HH:mm:ss"), // Format createdAt
        authorProfileImage: post.author.imageUrl || null, // Use author's imageUrl if available
        authorUsername: post.author.username || null, // Use author's username if available
        author: undefined, // Remove the original author object
        category: undefined, // Remove the original category object
      }));

      // Return posts with pagination metadata
      res.json({
        posts: formattedPosts,
        total: totalPosts,
        page: page,
        totalPages: Math.ceil(totalPosts / limit),
        limit: limit,
      });
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
              lastName: true,
              imageUrl: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
          comments: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      let message = "More From The Same Author";
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
        message = "Recommended Read";
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

      res.json({ posts, user });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = postController;
