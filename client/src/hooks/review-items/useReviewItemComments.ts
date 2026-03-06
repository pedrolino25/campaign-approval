'use client'

import { useMemo } from 'react'

import { useComments } from '@/hooks/comments/useComments'
import type { Comment as ApiComment } from '@/services/comments.service'

export interface Comment {
  id: string
  author: string
  content: string
  createdAt: string
  parentCommentId: string | null
}

export interface CommentThread extends Comment {
  replies: CommentThread[]
}

export interface UseReviewItemCommentsReturn {
  comments: Comment[]
  /** Threaded tree (roots with nested replies). API has no parent yet, so all are roots. */
  commentThreads: CommentThread[]
  isLoading: boolean
  create: ReturnType<typeof useComments>['create']
  remove: ReturnType<typeof useComments>['remove']
}

function toComment(api: ApiComment): Comment {
  return {
    id: api.id,
    author: api.actorName ?? 'Unknown',
    content: api.content,
    createdAt: api.createdAt,
    parentCommentId: (api as ApiComment & { parentCommentId?: string | null }).parentCommentId ?? null,
  }
}

function buildThreads(comments: Comment[]): CommentThread[] {
  const byParent = new Map<string | null, Comment[]>()
  for (const c of comments) {
    const key = c.parentCommentId ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(c)
  }
  // const byId = new Map(comments.map((c) => [c.id, c]))

  function toThread(c: Comment): CommentThread {
    const replies = (byParent.get(c.id) ?? []).map(toThread)
    return { ...c, replies }
  }

  const roots = byParent.get(null) ?? []
  return roots.map(toThread)
}

export function useReviewItemComments(reviewItemId: string | undefined): UseReviewItemCommentsReturn {
  const { list, create, remove } = useComments(reviewItemId ?? '')

  const comments = useMemo(() => {
    const data = list.data ?? []
    return data.map(toComment)
  }, [list.data])

  const commentThreads = useMemo(() => buildThreads(comments), [comments])

  return {
    comments,
    commentThreads,
    isLoading: list.isLoading,
    create,
    remove,
  }
}
