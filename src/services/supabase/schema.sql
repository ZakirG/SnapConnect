-- SnapConnect Supabase Database Schema v2
-- This schema refactors the original design to support group chats, stories, per-recipient snap state, and improved RLS.
-- Run this SQL in your Supabase SQL editor.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------
-- 1. Profiles (public user profile)
-- --------------------------------------------------
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  birthday DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read basic profile data
CREATE POLICY "Public read profiles"
  ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users manage their own profile
CREATE POLICY "User manage own profile"
  ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- --------------------------------------------------
-- 2. Friendships
-- --------------------------------------------------
DROP TABLE IF EXISTS friendships CASCADE;
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status    TEXT NOT NULL CHECK (status IN ('accepted', 'blocked')) DEFAULT 'accepted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT friendship_canonical CHECK (user_id < friend_id),
  CONSTRAINT friendship_unique UNIQUE (user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage friendships"
  ON friendships
  FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Indexes
CREATE INDEX idx_friendships_user_id   ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);

-- --------------------------------------------------
-- 3. Friend Requests
-- --------------------------------------------------
DROP TABLE IF EXISTS friend_requests CASCADE;
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','accepted','declined')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT friend_request_unique UNIQUE (requester_id, recipient_id, status)
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their friend requests"
  ON friend_requests
  FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE INDEX idx_friend_requests_recipient_status ON friend_requests(recipient_id, status);

-- --------------------------------------------------
-- 4. Conversations & Participants
-- --------------------------------------------------
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('direct','group')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- Visibility derived via conversation_participants

CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member','admin')) DEFAULT 'member',
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their participant rows"
  ON conversation_participants
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage their conversations"
  ON conversation_participants
  FOR ALL
  USING (auth.uid() = user_id);

-- Conversations accessible only by participants
CREATE POLICY "Users access own conversations"
  ON conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = auth.uid()
    )
  );

CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);

-- --------------------------------------------------
-- 5. Snaps & Recipients
-- --------------------------------------------------
DROP TABLE IF EXISTS snap_recipients CASCADE;
DROP TABLE IF EXISTS snaps CASCADE;

CREATE TABLE snaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image','video')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE snap_recipients (
  snap_id UUID REFERENCES snaps(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opened_at TIMESTAMP WITH TIME ZONE,
  screenshotted_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (snap_id, recipient_id)
);

ALTER TABLE snaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE snap_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender or recipient can read snaps"
  ON snaps
  FOR SELECT
  USING (
    sender_id = auth.uid() OR EXISTS (
      SELECT 1 FROM snap_recipients sr
      WHERE sr.snap_id = snaps.id AND sr.recipient_id = auth.uid()
    )
  );

CREATE POLICY "Sender can insert snaps"
  ON snaps
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients manage snap_recipients"
  ON snap_recipients
  FOR ALL
  USING (
    recipient_id = auth.uid() OR EXISTS (
      SELECT 1 FROM snaps s
      WHERE s.id = snap_recipients.snap_id AND s.sender_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_snaps_sender_id             ON snaps(sender_id);
CREATE INDEX idx_snap_recipients_recipient_id ON snap_recipients(recipient_id);

-- --------------------------------------------------
-- 6. Messages
-- --------------------------------------------------
DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('text','image','video','audio','snap')),
  storage_url TEXT,
  snap_id UUID REFERENCES snaps(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Sender insert messages"
  ON messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);

-- --------------------------------------------------
-- 7. Stories & Views
-- --------------------------------------------------
DROP TABLE IF EXISTS story_views CASCADE;
DROP TABLE IF EXISTS stories CASCADE;

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE story_views (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (story_id, viewer_id)
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or friends read stories"
  ON stories
  FOR SELECT
  USING (
    owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM friendships f
      WHERE (
        (f.user_id = owner_id AND f.friend_id = auth.uid()) OR
        (f.friend_id = owner_id AND f.user_id = auth.uid())
      ) AND f.status = 'accepted'
    )
  );

CREATE POLICY "Owner manage their stories"
  ON stories
  FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Viewers insert story views"
  ON story_views
  FOR INSERT
  WITH CHECK (viewer_id = auth.uid());

-- Indexes
CREATE INDEX idx_stories_owner_created ON stories(owner_id, created_at);
CREATE INDEX idx_story_views_viewer   ON story_views(viewer_id);

-- --------------------------------------------------
-- 8. Storage Bucket Policy (run separately)
-- --------------------------------------------------
/*
Create a storage bucket called `snaps-bucket` in the Supabase dashboard, then execute:

-- Allow authenticated users to upload snaps
CREATE POLICY "Authenticated users can upload snaps" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'snaps-bucket' AND auth.role() = 'authenticated');

-- Allow authenticated users to read snaps
CREATE POLICY "Authenticated users can read snaps" ON storage.objects
  FOR SELECT USING (bucket_id = 'snaps-bucket' AND auth.role() = 'authenticated');
*/

-- End of SnapConnect schema v2 