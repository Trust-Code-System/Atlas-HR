export interface Thread {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  category: string;
  region?: string;
  title: string;
  body: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  voteCount: number;
  replyCount: number;
  isLocked?: boolean;
  tags?: string[];
}

export interface Reply {
  id: string;
  threadId: string;
  parentReplyId?: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  body: string;
  isAnonymous: boolean;
  createdAt: string;
  voteCount: number;
  isAcceptedAnswer: boolean;
}

export interface Vote {
  id: string;
  userId: string;
  targetType: "thread" | "reply";
  targetId: string;
  value: 1 | -1;
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | "reply"
    | "mention"
    | "vote"
    | "accepted_answer"
    | "system"
    | "course_complete";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
