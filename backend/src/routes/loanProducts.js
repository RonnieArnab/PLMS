// import { Router } from "express";
// import * as controller from "../controllers/loanProducts.js";

// const router = Router();

// // Example endpoints
// router.get("/", controller.getAll);
// router.post("/", controller.create);

// export default router;


import { Router } from "express";
import * as controller from "../controllers/loanProducts.js";

const router = Router();

// CRUD endpoints for loan products
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;