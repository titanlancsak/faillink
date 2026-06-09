import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db/pool'
import { User } from '../types'

function signToken(userId: number, username: string): string {
  return jwt.sign(
    { userId, username },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  )
}

function sanitizeUser(user: User) {
  const { password, ...safe } = user
  return safe
}

export async function register(req: Request, res: Response) {
  const { username, email, password } = req.body
  const client = await pool.connect()
  try {
    // Check uniqueness
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email or username already taken.' })
    }

    const hash = await bcrypt.hash(password, 12)
    const { rows } = await client.query<User>(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, bio, avatar_url, created_at, updated_at`,
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
      `SELECT id, username, email, password, bio, avatar_url, created_at, updated_at
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
