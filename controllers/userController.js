const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const userController = {
  async signUp(req, res, next) {
    try {
      const { firstName, lastName, username, email, password, imageUrl } =
        req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          username,
          password: hashedPassword,
          imageUrl,
        },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        token,
        message: "Signup successful",
        imageUrl: user.imageUrl,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async logIn(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      console.log(user);

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        firstName: user.firstName,
        username: user.username,
        imageUrl: user.imageUrl,
        role: user.role,
        id: user.id,
        token,
        message: "Login successfull",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};

module.exports = userController;
