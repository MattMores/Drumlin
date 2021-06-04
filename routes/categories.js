const express = require("express");
const router = express.Router();
const { Category } = require("../db/models");
const { check, validationResult } = require('express-validator');
const { asyncHandler, csrfProtection } = require("../utils");
const { requireAuth } = require('../auth')

const catNotFoundError = (id) => {
  const err = Error(`Category ${id} not found`);
  err.title = "Category not found";
  err.status = 404;
  return err;
};


const categoryValidators = [
  check('title')
    .exists({ checkFalsy: true })
    .withMessage('Enter category')
    .isLength({ max: 50 })
    .withMessage("Category title must be less than 50 characters!")
];


router.get('/create', requireAuth, csrfProtection, asyncHandler(async (req, res) => {

  const category = Category.build()
  res.render("addCategory", {
    title: "Add Category:",
    category,
    csrfToken: req.csrfToken()
  })
}))


router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    const category = await Category.findAll();
    res.json({ category });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const id = req.params.id;
    const findCat = await Category.findByPk(id);
    if (findCat) {
      res.json({ findCat });
    } else {
      next(catNotFoundError(id));
    }
  })
);

router.post(
  "/", csrfProtection, categoryValidators,
  asyncHandler(async (req, res, next) => {
    const { userId } = req.session.auth;
    const { title } = req.body;

    let errors = [];
    const validatorErrors = validationResult(req)

    if (validatorErrors.isEmpty()) {

      await Category.create({ userId, title });
      res.redirect('/tasks')
    } else {
      errors = validatorErrors.array().map((error) => error.msg)
    }
    res.render('addCategory.pug', {
      title: "Add Category:",
      errors,
      csrfToken: req.csrfToken()
    })
    // res.json({ createCategory });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const id = req.params.id;
    const findCat = await Category.findByPk(id);
    const { userId } = req.session.auth;
    const { title } = req.body;

    if (findCat) {
      const updateCat = await findCat.update({ title });
      res.json({ updateCat });
    } else {
      next(catNotFoundError(id));
    }
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const id = req.params.id;
    const findCat = await Category.findByPk(id);

    if (findCat) {
      const deleteCat = await findCat.destroy();
      res.json({ deleteCat });
    } else {
      next(catNotFoundError(id));
    }
  })
);

// router.get('/create', requireAuth, asyncHandler(async (req, res) => {

//   const category = Category.build()
//   res.render("testAddCategory", {
//     title: "Add Category:",
//     category,
//     csrfToken: req.csrfToken()
//   })
// }))

router.post('/api/create', requireAuth, asyncHandler(async (req, res) => {

  console.log(req.body)
  const category = Category.build({
    title: req.body.value,
    userId: res.locals.user.id
  })
  console.log(category)
  if (category) {
    await category.save();
    const categories = await Category.findAll({
      where: {
        userId: res.locals.user.id
      }
    })
    await res.json({ categories })
  }
}))
router.get('/api/get', requireAuth, asyncHandler(async (req, res) => {

  const categories = await Category.findAll({
    where: {
      userId: res.locals.user.id
    }
  })
  await res.json({ categories })
}))

module.exports = router;
