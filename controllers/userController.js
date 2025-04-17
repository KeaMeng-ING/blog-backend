const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const userController = {
  async signUp(req, res, next) {
    try {
      const { firstName, lastName, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
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
        email: user.email,
        token,
        message: "Signup successful",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async logIn(req, res) {
    console.log("login");
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

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
        userName: user.username,
        id: user.id,
        token,
        message: "Login successful",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};

module.exports = userController;
