const db = require("../models");
const User = db.users;
const { hashPassword, getUtcDate, comparePassword } = require("../utils/util");
const otpGenerator = require("otp-generator");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/emailUtility");
const config = require("../config/email.config");

dotenv.config();

const jwtKey = process.env.JWT_KEY;

exports.register = async (req, res) => {
  const { firstname, lastname, password, email } = req.body;

  try {
    if (!firstname) {
      res.status(406).json({ message: "First Name is required" });
    } else if (!lastname) {
      res.status(406).json({ message: "Last name is required" });
    } else if (!password) {
      res.status(406).json({ message: "Password is required" });
    } else if (!email) {
      res.status(406).json({ message: "Email is required" });
    } else {
      async function checkEmailExists(email) {
        const user = await User.findOne({ where: { email } });
        return user !== null;
      }
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        res.status(400).json({
          success: false,
          msg: `this email id ${email} is already taken`,
        });
        return false;
      }
      // const checkEmailExist = await User.findOne({
      //   where: { email: email },
      //   return
      // });
      //   console.log("checkEmailExist:::", checkEmailExist.dataValues);

      // if (checkEmailExists) {
      //   res.status(400).json({
      //     success: false,
      //     msg: `this email id ${email} is already taken`,
      //   });
      //   return false;
      // }
      const hash = await hashPassword(password);
      //   console.log("hash type", typeof hash);
      let otpNumber = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      let utcDate = getUtcDate();

      let user = {
        firstName: firstname,
        lastName: lastname,
        password: hash,
        email: email,
        otpCode: otpNumber,
        otpCreateTime: utcDate,
      };

      let { delivered } = await sendEmail(
        email,
        config.email.signupSubject,
        config.email.template.emailSignupOtp(otpNumber)
      );

      if (!delivered) {
        // await session.abortTransaction()
        res.status(400).json({
          success: false,
          msg: "We are facing some network problems to send email",
        });
        return false;
      }

      await User.create(user)
        .then((data) => {
          res.status(200).json({ success: true, data: data });
        })
        .catch((err) => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while creating the Tutorial.",
          });
        });
    }
  } catch (error) {
    // console.log("Error in signup", error);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { otpCode, authValue } = req.body;
  try {
    if (!otpCode) {
      res.status(406).json({ message: "Otp code is required" });
    } else if (!authValue) {
      res.status(406).json({ message: "Email is required" });
    } else {
      // async function checkOtpExists(otpCode) {
      //   const user = await User.findOne({ where: { otpCode } });
      //   console.log("userr:::", user);
      //   return user !== null;
      // }
      const otpExists = await User.findOne({ where: { otpCode } });
      if (!otpExists) {
        // console.log("otpExists:::::", otpExists);
        res.status(400).json({
          success: false,
          msg: `Invalid Otp`,
        });
        return false;
      } else {
        // console.log("usersss:", otpExists.dataValues);
        const userdata = otpExists.dataValues;
        if (userdata.Is_OTP_Verified === true) {
          res
            .status(400)
            .json({ success: false, msg: "Your account has already verified" });
          return false;
        }
        var utcMoment = moment.utc();
        var utcDate = new Date(utcMoment.format());
        var diff =
          (utcDate.getTime() - userdata.otpCreateTime.getTime()) / 1000;
        const diffInMinute = diff / 60;

        if (diffInMinute > 90) {
          res.status(400).json({ success: false, msg: "Otp has expired" });
          return false;
        }
        await User.update(
          { isOTPVerified: true, otpCode: 0 },
          { where: { id: userdata.id } }
        )
          .then((data) => {
            return res.status(200).json({
              success: true,
              msg: "verified successfully",
              data: data,
            });
          })
          .catch((err) => {
            console.log(">> Eroor: ", err);
          });
      }
    }
  } catch (error) {
    // console.log("Error in Verify-Otp", error);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.resendOtp = async (req, res) => {
  const { authValue } = req.body;
  try {
    if (!authValue) {
      res.status(406).json({ message: "email is required" });
    }
    const authValueExists = await User.findOne({ where: { email: authValue } });
    if (!authValueExists) {
      // console.log("authValueExists:::::", authValueExists);
      res.status(400).json({
        success: false,
        msg: `Invalid user`,
      });
      return false;
    } else {
      const userdata = authValueExists.dataValues;
      if (userdata.isOTPVerified === true) {
        res
          .status(400)
          .json({ success: false, msg: "your account has already verified" });
        return false;
      }
      let otpNumber = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      let utcDate = getUtcDate();

      let { delivered } = await sendEmail(
        authValue,
        config.email.resendOtpSubject,
        config.email.template.resendOtp(otpNumber)
      );

      if (!delivered) {
        res.status(400).json({
          success: false,
          msg: "We are facing some network problems to send email.",
        });
        return false;
      }

      await User.update(
        { otpCode: otpNumber, otpCreateTime: utcDate },
        { where: { id: userdata.id } }
      )
        .then((data) => {
          return res.status(200).json({
            success: true,
            msg: "User Otp Updated",
            data: data,
          });
        })
        .catch((err) => {
          console.log(">> Eroor: ", err);
        });
    }
  } catch (error) {
    // console.log("Error in resend OtpToken", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email) {
      res.status(406).json({ message: "email is required" });
    } else if (!password) {
      res.status(406).json({ message: "password is required" });
    } else {
      const userExist = await User.findOne({ where: { email } });
      if (!userExist) {
        res
          .status(400)
          .json({ success: false, msg: "Your email is not valid" });
        return false;
      } else {
        const userdata = userExist.dataValues;
        let id = userdata.id;
        const passwordIsValid = bcrypt.compareSync(password, userdata.password);

        if (!passwordIsValid) {
          res
            .status(400)
            .json({ success: false, msg: "Your password is not valid" });
        }

        if (userdata.isOTPVerified === false) {
          res.status(400).json({
            success: false,
            msg: "Your account is not verified yet, please verify your account first",
          });
          return false;
        }

        const jwtToken = jwt.sign(
          {
            email,
            id,
            userdata,
          },
          jwtKey,
          {
            expiresIn: "1d",
          }
        );

        return res.status(200).json({
          success: true,

          msg: "Login successfully",
          accessToken: jwtToken,
          accountVerified: true,
        });
      }
    }
  } catch (error) {
    // console.log("Error in login", error);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.forgotCredential = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      res.status(406).json({ message: "email is required" });
    }
    const userExist = await User.findOne({ where: { email } });

    if (!userExist) {
      res.status(400).json({ success: false, msg: "Your email is not valid" });
      return false;
    } else {
      const userdata = userExist.dataValues;
      let otpNumber = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      let utcDate = getUtcDate();

      let { delivered } = await sendEmail(
        email,
        config.email.forgotSubject,
        config.email.template.emailForgotPassword(otpNumber)
      );
      if (!delivered) {
        res.status(400).json({
          success: false,
          msg: "We are facing some network problems to send email.",
        });
        return false;
      }

      await User.update(
        { otpCode: otpNumber, otpCreateTime: utcDate },
        { where: { id: userdata.id } }
      )
        .then((data) => {
          return res.status(200).json({
            success: true,
            msg: `We've sent you a otpCode in your ${email}.`,
            data: data,
          });
        })
        .catch((err) => {
          console.log(">> Eroor: ", err);
        });
    }
  } catch (error) {
    // console.log("Error in forgotCredential", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  const { otpCode, password } = req.body;
  try {
    if (!otpCode) {
      res.status(406).json({ message: "Otp code is required" });
    } else if (!password) {
      res.status(406).json({ message: "Password is required" });
    } else {
      const userExist = await User.findOne({ where: { otpCode: otpCode } });

      if (!userExist) {
        res.status(400).json({ success: false, msg: "Invalid Otp" });
        return false;
      } else {
        const userdata = userExist.dataValues;
        var utcMoment = moment.utc();
        var utcDate = new Date(utcMoment.format());
        var diff =
          (utcDate.getTime() - userdata.otpCreateTime.getTime()) / 1000;
        const diffInMinute = diff / 60;
        if (diffInMinute > 90) {
          res.status(400).json({
            success: false,
            msg: "Your OTP code has been expired. Click on send again to get new cod",
          });
          return false;
        }
        let hash = await hashPassword(password);

        await User.update(
          { password: hash, otpCode: 0 },
          { where: { id: userdata.id } }
        )
          .then((data) => {
            return res.status(200).json({
              success: true,
              msg: "Password updated successfully",
              data: data,
            });
          })
          .catch((err) => {
            console.log(">> Eroor: ", err);
          });
      }
    }
  } catch (error) {
    // console.log("Error in updatePassword", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.updateEmailOnProfile = async (req, res) => {
  const user = req.user.id;
  // console.log("user::", user);
  const { email } = req.body;
  try {
    if (!email) {
      res.status(406).json({ message: "email is required" });
    }

    const userExist = await User.findOne({ where: { email } });

    if (userExist) {
      res.status(400).json({ success: false, msg: "Email is already exist" });
      return false;
    } else {
      let otpNumber = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      // get utc dagte
      let utcDate = getUtcDate();

      let { delivered } = await sendEmail(
        email,
        config.email.updateEmailSubject,
        config.email.template.emailSignupOtp(otpNumber)
      );

      if (!delivered) {
        res.status(400).json({
          success: false,
          msg: "We are facing some network problems to send email.",
        });
        return false;
      } else {
        await User.update(
          { otpCode: otpNumber, otpCreateTime: utcDate },
          { where: { id: user } }
        )
          .then((data) => {
            return res.status(200).json({
              success: true,
              msg: `We've sent you a otpCode in your ${email}.`,
              data: email,
            });
          })
          .catch((err) => {
            console.log(">> Eroor: ", err);
          });
      }
    }
  } catch (error) {
    console, log("Error in update email:", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.verifyOtpOnProfile = async (req, res) => {
  const { otpCode, authValue } = req.body;
  const user = req.user.dataValues;
  // console.log("user from verify otp::", user);
  try {
    if (!otpCode) {
      res.status(406).json({ message: "Otp code is required" });
    } else if (!authValue) {
      res.status(406).json({ message: "Email is required" });
    } else {
      const userExist = await User.findOne({ where: { otpCode: otpCode } });

      if (!userExist) {
        res.status(400).json({ success: false, msg: "Invalid Otp" });
        return false;
      } else {
        const userdata = userExist.dataValues;
        var utcMoment = moment.utc();
        var utcDate = new Date(utcMoment.format());
        var diff =
          (utcDate.getTime() - userdata.otpCreateTime.getTime()) / 1000;
        const diffInMinute = diff / 60;
        if (diffInMinute > 90) {
          res.status(400).json({
            success: false,
            msg: "Your OTP code has been expired. Click on send again to get new cod",
          });
          return false;
        }
        await User.update(
          { email: authValue, otpCode: 0 },
          { where: { id: userdata.id } }
        )
          .then((data) => {
            return res.status(200).json({
              success: true,
              msg: "Email updated successfully",
              data: data,
            });
          })
          .catch((err) => {
            console.log(">> Eroor: ", err);
          });
        // console.log("update:::", update);
      }
    }
  } catch (error) {
    // console.log("Error in verify otp", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.resendOtpCodeOnProfile = async (req, res) => {
  const { authValue } = req.body;
  const user = req.user.id;
  try {
    if (!authValue) {
      res.status(406).json({ message: "email is required" });
    }

    const userExist = await User.findOne({ where: { email: authValue } });

    if (userExist) {
      res.status(400).json({ success: false, msg: "Email is already exist" });
      return false;
    } else {
      let otpNumber = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      // get utc dagte
      let utcDate = getUtcDate();

      let { delivered } = await sendEmail(
        authValue,
        config.email.resendOtpSubject,
        config.email.template.resendOtp(otpNumber)
      );

      if (!delivered) {
        res.status(400).json({
          success: false,
          msg: "We are facing some network problems to send email.",
        });
        return false;
      } else {
        await User.update(
          { otpCode: otpNumber, otpCreateTime: utcDate },
          { where: { id: user } }
        )
          .then((data) => {
            return res.status(200).json({
              success: true,
              msg: `We've sent you a otpCode in your ${authValue}. again`,
              data: data,
            });
          })
          .catch((err) => {
            console.log(">> Eroor: ", err);
          });
      }
    }
  } catch (error) {
    // console.log("Error in resend code", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.updatePasswordOnProfile = async (req, res) => {
  let id = req.user.id;
  let { oldPassword, password, confirmPassword } = req.body;
  try {
    if (!oldPassword) {
      res.status(406).json({ message: "Old password is required" });
    } else if (!password) {
      res.status(406).json({ message: "Password is required" });
    } else if (!comparePassword) {
      res.status(406).json({ message: "Confirm password is required" });
    } else if (password !== confirmPassword) {
      res
        .status(406)
        .json({ message: "Password & Confirm password are not matching" });
    } else {
      const userExist = await User.findOne({ where: { id: id } });
      if (!userExist) {
        res.status(400).json({ success: false, msg: "User not found" });
        return false;
      } else {
        const userdata = userExist.dataValues;

        let passwordCompare = await comparePassword(
          oldPassword,
          userdata.password
        );

        if (!passwordCompare) {
          res.status(400).json({
            success: false,
            msg: "You entered the wrong old password",
          });
          return false;
        }
        let hash = await hashPassword(password);

        await User.update({ password: hash }, { where: { id: id } })
          .then((data) => {
            return res.status(200).json({
              success: true,
              msg: "Password updated successfully",
              data: data,
            });
          })
          .catch((err) => {
            console.log(">> Eroor: ", err);
          });
      }
    }
  } catch (error) {
    // console.log("Error in update password", error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
};
