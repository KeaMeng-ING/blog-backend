// Category controller
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const categoryController = {
  async getAllCategories(req, res) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      });

      res.json({ categories });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = categoryController;
