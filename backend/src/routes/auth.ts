import { Router } from 'express'
import { body } from 'express-validator'
import { register, login } from '../controllers/authController'
import { validate } from '../middleware/validate'

const router = Router()

router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be 3–50 characters.')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username may only contain letters, numbers, and underscores.'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Valid email required.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.'),
  ],
  validate,
  register
)

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login
)

export default router
