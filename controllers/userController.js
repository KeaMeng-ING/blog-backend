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

      // Make sure username is unique
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }],
        },
      });
      if (existingUser) {
        return res.status(400).json({
          message:
            existingUser.username === username
              ? "Username already exists"
              : "Email already exists",
        });
      }

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
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      console.log(user);

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        firstName: user.firstName,
        lastName: user.lastName,
        bioProfile: user.bioProfile,
        username: user.username,
        imageUrl: user.imageUrl,
        role: user.role,
        id: user.id,
        token,
        email: user.email,
        message: "Login successfull",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async updateUser(req, res) {
    const { id, firstName, lastName, username, imageUrl, bioProfile } =
      req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    try {
      // Check if the user exists
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }, // Make sure id is an integer
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create update data object with only the fields we know exist
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (username !== undefined) updateData.username = username;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (bioProfile !== undefined) updateData.bioProfile = bioProfile;

      // Update the user with only the provided fields
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      res.status(200).json({
        message: "User settings updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  async changePassword(req, res) {
    const { id, oldPassword, newPassword } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    try {
      // Check if the user exists
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }, // Make sure id is an integer
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the old password matches
      const passwordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Old password is incorrect" });
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      await prisma.user.update({
        where: { id: parseInt(id) },
        data: { password: hashedNewPassword },
      });

      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
};

module.exports = userController;
