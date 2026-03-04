const passport = require("passport");
const { ExtractJwt, Strategy } = require("passport-jwt");
const mongoose = require("mongoose");
const config = require("../config");
const Users = require("../db/models/Users");
const UserRoles = require("../db/models/UserRoles");
const RolePrivileges = require("../db/models/RolePrivileges");
const privs = require("../config/role_privileges");
const Response = require("./Response");
const { HTTP_CODES } = require("../config/Enum");
const CustomError = require("./Error");

module.exports = function () {
  let strategy = new Strategy(
    {
      secretOrKey: config.JWT.SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    async (payload, done) => {
      try {
        const userId = new mongoose.Types.ObjectId(payload.id);

        let user = await Users.findById(userId);
        if (!user) return done(new Error("User not found"), null);

        let userRoles = await UserRoles.find({ user_id: userId });
        const roleIds = userRoles.map((ur) => ur.role_id);

        let rolePrivileges = await RolePrivileges.find({
          role_id: { $in: roleIds },
        });

        // Permission eşleştirme — trim() ile boşluk güvencesi
        let privileges = rolePrivileges
          .map((rp) => rp.permission?.trim())
          .filter(Boolean)
          .map((permission) =>
            privs.privileges.find((x) => x.key === permission),
          )
          .filter(Boolean);

        done(null, {
          id: user._id,
          roles: privileges,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          language: user.language,
          exp: parseInt(Date.now() / 1000) + config.JWT.EXPIRE_TIME,
        });
      } catch (err) {
        done(err, null);
      }
    },
  );

  passport.use(strategy);

  return {
    initialize: function () {
      return passport.initialize();
    },
    authenticate: function () {
      return passport.authenticate("jwt", { session: false });
    },
    checkRoles: (...expectedRoles) => {
      return (req, res, next) => {
        const privileges = (req.user.roles || [])
          .map((x) => x?.key?.trim())
          .filter(Boolean);

        const hasPermission = expectedRoles.some((role) =>
          privileges.includes(role),
        );

        if (!hasPermission) {
          const response = Response.errorResponse(
            new CustomError(
              HTTP_CODES.UNAUTHORIZED,
              "Need Permission",
              "Need Permission",
            ),
          );
          return res.status(response.code).json(response);
        }

        return next();
      };
    },
  };
};
