import { Request, Response } from 'express'
import pool from '../db/pool'

// GET /api/posts — feed with pagination
export async function getFeed(req: Request, res: Response) {
  const userId = req.user!.userId
  const limit = parseInt(req.query.limit as string) || 10
  const offset = parseInt(req.query.offset as string) || 0
  try {
    const { rows } = await pool.query(
      `SELECT
         p.id,
         p.content,
         p.created_at,
         p.updated_at,
         json_build_object(
           'id', u.id,
           'username', u.username,
           'avatar_url', u.avatar_url
         ) AS author,
         COUNT(DISTINCT l.id)::int AS likes_count,
         COUNT(DISTINCT c.id)::int AS comments_count,
         BOOL_OR(l.user_id = $1) AS user_liked
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       GROUP BY p.id, u.id
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    )
    return res.json(rows)
  } catch (err) {
    console.error('getFeed error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

// POST /api/posts
export async function createPost(req: Request, res: Response) {
  const userId = req.user!.userId
  const { content } = req.body
  try {
    const { rows } = await pool.query(
      `WITH inserted AS (
         INSERT INTO posts (user_id, content) VALUES ($1, $2)
         RETURNING *
       )
       SELECT
         i.id,
         i.content,
         i.created_at,
         i.updated_at,
         json_build_object(
           'id', u.id,
           'username', u.username,
           'avatar_url', u.avatar_url
         ) AS author,
         0 AS likes_count,
         0 AS comments_count,
         false AS user_liked
       FROM inserted i
       JOIN users u ON u.id = i.user_id`,
      [userId, content]
    )
    return res.status(201).json(rows[0])
  } catch (err) {
    console.error('createPost error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

// PUT /api/posts/:id
export async function updatePost(req: Request, res: Response) {
  const userId = req.user!.userId
  const postId = parseInt(req.params.id)
  const { content } = req.body
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE posts SET content = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [content, postId, userId]
    )
    if (!rowCount) return res.status(404).json({ message: 'Post not found.' })
    return res.json(rows[0])
  } catch (err) {
    console.error('updatePost error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

// DELETE /api/posts/:id
export async function deletePost(req: Request, res: Response) {
  const userId = req.user!.userId
  const postId = parseInt(req.params.id)
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2',
      [postId, userId]
    )
    if (!rowCount) return res.status(404).json({ message: 'Post not found.' })
    return res.json({ message: 'Post deleted.' })
  } catch (err) {
    console.error('deletePost error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

// POST /api/posts/:id/like
export async function likePost(req: Request, res: Response) {
  const userId = req.user!.userId
  const postId = parseInt(req.params.id)
  try {
    await pool.query(
      'INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, userId]
    )
    return res.status(201).json({ message: 'Liked.' })
  } catch (err) {
    console.error('likePost error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

// DELETE /api/posts/:id/like
export async function unlikePost(req: Request, res: Response) {
  const userId = req.user!.userId
  const postId = parseInt(req.params.id)
  try {
    await pool.query(
      'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    )
    return res.json({ message: 'Unliked.' })
  } catch (err) {
    console.error('unlikePost error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

// GET /api/posts/:id/comments
export async function getComments(req: Request, res: Response) {
  const postId = parseInt(req.params.id)
  try {
    const { rows } = await pool.query(
      `SELECT
         c.id,
         c.content,
         c.created_at,
         c.post_id,
         json_build_object(
           'id', u.id,
           'username', u.username,
           'avatar_url', u.avatar_url
         ) AS author
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    )
    return res.json(rows)
  } catch (err) {
    console.error('getComments error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

// POST /api/posts/:id/comments
export async function createComment(req: Request, res: Response) {
  const userId = req.user!.userId
  const postId = parseInt(req.params.id)
  const { content } = req.body
  try {
    const post = await pool.query('SELECT id FROM posts WHERE id = $1', [postId])
    if (!post.rows.length) return res.status(404).json({ message: 'Post not found.' })

    const { rows } = await pool.query(
      `WITH inserted AS (
         INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3)
         RETURNING *
       )
       SELECT
         i.id,
         i.content,
         i.created_at,
         i.post_id,
         json_build_object(
           'id', u.id,
           'username', u.username,
           'avatar_url', u.avatar_url
         ) AS author
       FROM inserted i
       JOIN users u ON u.id = i.user_id`,
      [postId, userId, content]
    )
    return res.status(201).json(rows[0])
  } catch (err) {
    console.error('createComment error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}