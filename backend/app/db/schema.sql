-- Community App Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT UNIQUE NOT NULL, -- email or phone
  full_name TEXT,
  phone TEXT,
  pin_hash TEXT, -- bcrypt hash of PIN
  role TEXT CHECK (role IN ('HEAD', 'PERMANENT', 'NORMAL', 'ASSOCIATED', 'GENERAL')),
  member_id TEXT UNIQUE, -- Pid, Nid, Aid
  status TEXT CHECK (status IN ('PENDING', 'PAID', 'ACTIVE', 'BLOCKED')) DEFAULT 'PENDING',
  
  -- Bio-data fields
  father_guardian_name TEXT,
  age INT,
  dob DATE,
  tob TIME,
  gotram TEXT,
  sub_sect TEXT, -- For Matrimony
  occupation TEXT,
  annual_income DECIMAL(15, 2),
  star_pada TEXT,
  address TEXT,
  cell_no TEXT,
  email TEXT,
  photo_url TEXT,
  payment_proof_url TEXT,
  requirement TEXT,
  particulars TEXT,

  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Membership requests
CREATE TABLE IF NOT EXISTS membership_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  requested_role TEXT CHECK (requested_role IN ('PERMANENT', 'NORMAL', 'ASSOCIATED')),
  application_data JSONB, -- Backup of all form fields submitted
  payment_status TEXT CHECK (payment_status IN ('PENDING', 'PAID', 'EXEMPT')) DEFAULT 'PENDING',
  approval_status TEXT CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments tracking
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  membership_request_id UUID REFERENCES membership_requests(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  gateway TEXT DEFAULT 'razorpay',
  status TEXT NOT NULL,
  reference_id TEXT, -- Razorpay order/payment ID
  metadata JSONB, -- Additional payment details
  created_at TIMESTAMP DEFAULT NOW()
);

-- Channels (groups)
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('ANNOUNCEMENT', 'DISCUSSION')) DEFAULT 'DISCUSSION',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Channel members
CREATE TABLE IF NOT EXISTS channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('ADMIN', 'MEMBER')) DEFAULT 'MEMBER',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  metadata JSONB, -- For future features like attachments, reactions
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Presence tracking
CREATE TABLE IF NOT EXISTS presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  last_seen TIMESTAMP DEFAULT NOW(),
  online BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_identifier ON users(identifier);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_membership_requests_user ON membership_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_requests_status ON membership_requests(payment_status, approval_status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_presence_channel ON presence(channel_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

-- Users: Can only read their own data
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Membership requests: Users can read their own, admins can read all
CREATE POLICY "Users can read own membership requests"
ON membership_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all membership requests"
ON membership_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'HEAD'
  )
);

-- Payments: Read-only for users (their own), admins can read all
CREATE POLICY "Users can read own payments"
ON payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all payments"
ON payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'HEAD'
  )
);

-- Channels: Users can read channels they're members of
CREATE POLICY "Users can read joined channels"
ON channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_members.channel_id = channels.id
    AND channel_members.user_id = auth.uid()
  )
);

-- Channel members: Users can read their own memberships
CREATE POLICY "Users can read own channel memberships"
ON channel_members FOR SELECT
USING (auth.uid() = user_id);

-- Messages: Read messages from joined channels, send if ACTIVE
CREATE POLICY "Users can read messages from joined channels"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM channel_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.channel_id = messages.channel_id
    AND cm.user_id = auth.uid()
    AND u.status = 'ACTIVE'
  )
);

CREATE POLICY "Active users can send messages to joined channels"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM channel_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.channel_id = messages.channel_id
    AND cm.user_id = auth.uid()
    AND u.status = 'ACTIVE'
  )
);

-- Presence: Users can update their own presence
CREATE POLICY "Users can update own presence"
ON presence FOR ALL
USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_requests_updated_at BEFORE UPDATE ON membership_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presence_updated_at BEFORE UPDATE ON presence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA (OPTIONAL)
-- =====================================================

-- You can uncomment and modify these to create initial HEAD users
-- INSERT INTO users (identifier, role, status) VALUES
--   ('admin@example.com', 'HEAD', 'ACTIVE');

COMMENT ON TABLE users IS 'Application users with roles and status';
COMMENT ON TABLE membership_requests IS 'Membership requests requiring payment and approval';
COMMENT ON TABLE payments IS 'Payment transaction records';
COMMENT ON TABLE channels IS 'Chat channels/groups';
COMMENT ON TABLE channel_members IS 'User memberships in channels';
COMMENT ON TABLE messages IS 'Chat messages';
COMMENT ON TABLE presence IS 'User presence and online status';
