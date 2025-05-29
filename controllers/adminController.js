const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { formatDistanceToNow } = require("date-fns"); // Import date-fns
const adminController = {
  async dashboardData(req, res, next) {
    try {
      // Define time periods for comparison
      const currentMonthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );
      const nextMonthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        1
      );
      const lastMonthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 1,
        1
      );

      // Current month data
      const userCount = await prisma.user.count();
      const postCount = await prisma.post.count();
      const currentMonthPostCount = await prisma.post.count({
        where: {
          createdAt: {
            gte: currentMonthStart,
            lt: nextMonthStart,
          },
        },
      });

      // Previous month data
      const lastMonthPostCount = await prisma.post.count({
        where: {
          createdAt: {
            gte: lastMonthStart,
            lt: currentMonthStart,
          },
        },
      });

      const lastMonthUserCount = await prisma.user.count({
        where: {
          createdAt: {
            lt: currentMonthStart,
          },
        },
      });

      // View counts - total views for all posts
      const totalViewCount = await prisma.post.aggregate({
        _sum: {
          views: true,
        },
      });

      // Calculate total views for last month (all posts that existed as of last month)
      const lastMonthTotalViewCount = await prisma.post.aggregate({
        _sum: {
          views: true,
        },
        where: {
          createdAt: {
            lt: currentMonthStart,
          },
        },
      });

      // Current month view counts (for engagement calculation)
      const currentMonthViewCount = await prisma.post.aggregate({
        _sum: {
          views: true,
        },
        where: {
          createdAt: {
            gte: currentMonthStart,
            lt: nextMonthStart,
          },
        },
      });
      console.log(currentMonthViewCount);

      const lastMonthViewCount = await prisma.post.aggregate({
        _sum: {
          views: true,
        },
        where: {
          createdAt: {
            gte: lastMonthStart,
            lt: currentMonthStart,
          },
        },
      });

      // Calculate views for engagement metrics
      const totalViewsCurrentMonth = currentMonthViewCount._sum.views || 0;
      const totalViewsLastMonth = lastMonthViewCount._sum.views || 0;

      // Total views overall
      const totalViews = totalViewCount._sum.views || 0;
      const totalViewsAsOfLastMonth = lastMonthTotalViewCount._sum.views || 0;

      // Calculate engagement rates
      const engagementRateCurrentMonth =
        postCount > 0 ? (totalViewsCurrentMonth / postCount).toFixed(2) : 0;
      const engagementRateLastMonth =
        postCount > 0 ? (totalViewsLastMonth / postCount).toFixed(2) : 0;

      // Calculate percentage changes
      const calculatePercentChange = (current, previous) => {
        if (previous <= 0) return "N/A";
        return (((current - previous) / previous) * 100).toFixed(2);
      };

      const postCountChange = calculatePercentChange(
        postCount,
        lastMonthPostCount
      );
      const currentMonthPostCountChange = calculatePercentChange(
        currentMonthPostCount,
        lastMonthPostCount
      );
      const viewCountChange = calculatePercentChange(
        totalViews,
        totalViewsAsOfLastMonth
      );
      const userCountChange = calculatePercentChange(
        userCount,
        lastMonthUserCount
      );
      const engagementRateChange = calculatePercentChange(
        engagementRateCurrentMonth,
        engagementRateLastMonth
      );

      console.log(currentMonthViewCount);

      res.json({
        userCount,
        userCountChange: `${userCountChange}%`,
        postCount,
        postCountChange: `${postCountChange}%`,
        currentMonthPostCount,
        currentMonthPostCountChange: `${currentMonthPostCountChange}%`,
        viewCount: totalViews,
        viewCountChange: `${viewCountChange}%`,
        // engagementRate: `${engagementRateCurrentMonth}`,
        // engagementRateChange: `${engagementRateChange}%`,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async categoryData(req, res, next) {
    try {
      const categories = await prisma.category.findMany({
        include: {
          posts: {
            select: {
              title: true,
            },
          },
        },
      });

      const categoryData = categories.map((category) => ({
        name: category.name,
        value: category.posts.length,
      }));

      // Remove if category has no posts
      const filteredCategoryData = categoryData.filter(
        (category) => category.value > 0
      );

      res.json(filteredCategoryData);
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async recentUser(req, res, next) {
    try {
      const recentUsers = await prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          imageUrl: true,
        },
      });

      // Add "createdAgo" field to each user
      const usersWithCreatedAgo = recentUsers.map((user) => ({
        ...user,
        createdAgo: formatDistanceToNow(new Date(user.createdAt), {
          addSuffix: true,
        }),
      }));

      res.json(usersWithCreatedAgo);
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async recentPost(req, res, next) {
    try {
      const recentPosts = await prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
        },
      });

      res.json(recentPosts);
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};

module.exports = adminController;
