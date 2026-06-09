import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import pool from '../db/pool'
import { User } from '../types'
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email'

function signToken(userId: number, username: string): string {
  return jwt.sign(
    { userId, username },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  )
}

function sanitizeUser(user: User) {
  const { password, verification_token, reset_password_token, ...safe } = user as any
  return safe
}

export async function register(req: Request, res: Response) {
  const { username, email, password } = req.body
  const client = await pool.connect()
  try {
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email or username already taken.' })
    }

    const hash = await bcrypt.hash(password, 12)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const { rows } = await client.query<User>(
      `INSERT INTO users (username, email, password, is_verified)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, username, email, bio, avatar_url, is_verified, created_at, updated_at`,
      [username.toLowerCase(), email.toLowerCase(), hash]
    )
    
    const user = rows[0]
    
    const token = signToken(user.id, user.username)
    return res.status(201).json({ user: sanitizeUser(user), token })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ message: 'Server error.' })
  } finally {
    client.release()
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body
  const client = await pool.connect()
  try {
    const { rows } = await client.query<User>(
      `SELECT id, username, email, password, bio, avatar_url, is_verified, created_at, updated_at
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    )

    const user = rows[0]
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const valid = await bcrypt.compare(password, user.password as string)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = signToken(user.id, user.username)
    return res.json({ user: sanitizeUser(user), token })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ message: 'Server error.' })
  } finally {
    client.release()
  }
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query
  if (!token) return res.status(400).json({ message: 'Token is required.' })

  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
       WHERE verification_token = $1 AND verification_token_expires > NOW()
       RETURNING id, username, email`,
      [token]
    )

    if (!rows.length) {
      return res.status(400).json({ message: 'Invalid or expired verification link.' })
    }

    return res.json({ message: 'Email verified successfully.' })
  } catch (err) {
    console.error('verifyEmail error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body
  try {
    const { rows } = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    // Always return success to prevent email enumeration
    if (!rows.length) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [resetToken, expires, rows[0].id]
    )

    await sendPasswordResetEmail(email, resetToken)
    return res.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    console.error('forgotPassword error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body
  try {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [token]
    )

    if (!rows.length) {
      return res.status(400).json({ message: 'Invalid or expired reset link.' })
    }

    const hash = await bcrypt.hash(password, 12)
    await pool.query(
      `UPDATE users
       SET password = $1, reset_password_token = NULL, reset_password_expires = NULL
       WHERE id = $2`,
      [hash, rows[0].id]
    )

    return res.json({ message: 'Password reset successfully.' })
  } catch (err) {
    console.error('resetPassword error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}