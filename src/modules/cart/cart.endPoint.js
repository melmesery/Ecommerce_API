import { roles } from "../../middleware/auth.js";

export const endPoint = {
  create: [roles.User],
  remove: [roles.User],
  clear: [roles.User],
};
