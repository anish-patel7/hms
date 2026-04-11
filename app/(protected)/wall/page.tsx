"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Empty } from '@/components/ui/empty'
import { 
  MessageSquare, 
  Heart,
  Send,
  Trash2
} from 'lucide-react'
import { getPosts, getMembers, addPost, toggleLike, deletePost } from '@/lib/storage'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import type { WallPost, Member } from '@/lib/types'

const CURRENT_USER_ID = 'current-user'

export default function WallPage() {
  const [posts, setPosts] = useState<WallPost[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setPosts(getPosts())
    setMembers(getMembers())
  }, [])

  const refreshPosts = () => {
    setPosts(getPosts())
  }

  const handleSubmitPost = async () => {
    if (!newPostContent.trim()) return
    
    setIsSubmitting(true)
    try {
      addPost({
        authorId: CURRENT_USER_ID,
        content: newPostContent
      })
      setNewPostContent('')
      refreshPosts()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = (postId: string) => {
    toggleLike(postId, CURRENT_USER_ID)
    refreshPosts()
  }

  const handleDelete = (postId: string) => {
    deletePost(postId)
    refreshPosts()
  }

  const getMemberName = (id: string) => {
    if (id === CURRENT_USER_ID) return 'You'
    return members.find(m => m.id === id)?.name || 'Unknown'
  }

  const getMemberInitials = (id: string) => {
    const name = getMemberName(id)
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Group Wall</h1>
        <p className="text-muted-foreground">Share updates with the team</p>
      </div>

      {/* Post Composer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
              Y
            </div>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitPost}
                  disabled={!newPostContent.trim() || isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map(post => {
            const isLiked = post.likes.includes(CURRENT_USER_ID)
            const isOwnPost = post.authorId === CURRENT_USER_ID
            
            return (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                      {getMemberInitials(post.authorId)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{getMemberName(post.authorId)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {isOwnPost && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="mt-2 text-foreground whitespace-pre-wrap">{post.content}</p>
                      <div className="mt-3 flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`gap-2 ${isLiked ? 'text-accent' : 'text-muted-foreground'}`}
                          onClick={() => handleLike(post.id)}
                        >
                          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                          {post.likes.length > 0 && (
                            <span>{post.likes.length}</span>
                          )}
                        </Button>
                      </div>
                      
                      {/* Show who liked */}
                      {post.likes.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Liked by {post.likes.slice(0, 3).map(id => getMemberName(id)).join(', ')}
                          {post.likes.length > 3 && ` and ${post.likes.length - 3} others`}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Empty
          icon={<MessageSquare className="h-12 w-12" />}
          title="No posts yet"
          description="Be the first to share something with the team!"
        />
      )}
    </div>
  )
}
