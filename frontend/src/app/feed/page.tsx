'use client'
import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Post } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import PostCard from '@/components/feed/PostCard'
import PostComposer from '@/components/feed/PostComposer'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'

export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set())

  const fetchPosts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const { data } = await api.get('/posts')
      setPosts(data)
    } catch {
      toast.error('Could not load posts.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleNewPost = (post: Post) => {
    setPosts((prev) => [post, ...prev])
  }

  const handleFriendRequest = (userId: number) => {
    setRequestedIds((prev) => new Set(prev).add(userId))
  }

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Page header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="tag block mb-1">Latest</span>
              <h1 className="font-display text-3xl text-ink">Your Feed</h1>
            </div>
            <button
              onClick={() => fetchPosts(true)}
              disabled={refreshing}
              className="btn-ghost flex items-center gap-2 text-xs"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span className="tag">Refresh</span>
            </button>
          </div>

          {/* Composer */}
          {user && (
            <div className="mb-6">
              <PostComposer username={user.username} onPost={handleNewPost} />
            </div>
          )}

          {/* Divider label */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 divider" />
            <span className="tag text-steel-400">Posts</span>
            <div className="flex-1 divider" />
          </div>

          {/* Posts */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-steel-400" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-display text-2xl text-steel-400 mb-2">Nothing here yet.</p>
              <p className="text-sm text-steel-400">Be the first to share something.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <div
                  key={post.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <PostCard
                    post={post}
                    currentUserId={user?.id}
                    onFriendRequest={handleFriendRequest}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
