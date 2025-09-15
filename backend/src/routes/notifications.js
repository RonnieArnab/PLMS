// import { Router } from "express";
// import * as controller from "../controllers/notifications.js";

// const router = Router();

// // Example endpoints
// router.get("/", controller.getAll);
// router.post("/", controller.create);

// export default router;


// backend/src/routes/notifications.js
import express from "express";
import * as controller from "../controllers/notifications.js";

const router = express.Router();

// Public (or use middleware to protect)
router.get("/", controller.getAll); // admin / dev route
router.get("/user/:userId", controller.getForUser);

// CRUD
router.post("/", controller.create);
router.patch("/:id/read", controller.markRead);
router.patch("/:id/unread", controller.markUnread);
router.delete("/:id", controller.remove);

export default router;