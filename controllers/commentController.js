const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const commentController = {
  async createComment(req, res) {
    const { postSlug, content, userId } = req.body;

    try {
      const post = await prisma.post.findUnique({
        where: { slug: postSlug },
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          postId: post.id,
          userId,
        },
      });

      return res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  async getCommentsByPostSlug(req, res) {
    const { slug } = req.params;

    try {
      const post = await prisma.post.findUnique({
        where: { slug },
        include: {
          comments: {
            include: {
              user: {
                select: {
                  username: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      return res.status(200).json(post.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  async deleteComment(req, res) {
    const { id } = req.params;
    // Have to compare the id on frontend

    try {
      const comment = await prisma.comment.delete({
        where: { id: parseInt(id) },
      });

      return res.status(200).json(comment);
    } catch (error) {
      console.error("Error deleting comment:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  async updateComment(req, res) {
    const { id, content } = req.body;

    try {
      const comment = await prisma.comment.update({
        where: { id: parseInt(id) },
        data: { content },
      });

      return res.status(200).json(comment);
    } catch (error) {
      console.error("Error updating comment:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = commentController;
