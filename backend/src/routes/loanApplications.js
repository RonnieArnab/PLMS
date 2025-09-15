// import { Router } from "express";
// import * as controller from "../controllers/loanApplications.js";

// const router = Router();

// // Example endpoints
// router.get("/", controller.getAll);
// router.post("/", controller.create);

// export default router;


import { Router } from "express";
import * as controller from "../controllers/loanApplications.js";

const router = Router();

// CRUD endpoints for loan applications
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.get("/user/:userId", controller.getByUserId);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
router.post("/customer-profiles", controller.upsertCustomerProfile);

export default router;