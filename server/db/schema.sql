-- Convenience Orders
CREATE TABLE convenience_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  service_type TEXT NOT NULL,
  address TEXT NOT NULL,
  address_to TEXT,
  images TEXT DEFAULT '[]',
  note TEXT DEFAULT '',
  preferred_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'S10',
  price_quote REAL,
  ref_price REAL,
  pay_method TEXT,
  staff_id TEXT,
  staff_name TEXT,
  staff_phone TEXT,
  complaint_id TEXT,
  payment_proof TEXT,
  completion_photos TEXT DEFAULT '[]',
  rating INTEGER,
  rated_at TEXT,
  completed_at TEXT,
  cancel_requested INTEGER DEFAULT 0,
  lat REAL,
  lng REAL,
  arbitration_remark TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_orders_user ON convenience_orders(user_id);
CREATE INDEX idx_orders_staff ON convenience_orders(staff_id);
CREATE INDEX idx_orders_status ON convenience_orders(status);

-- Staff
CREATE TABLE staff (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  status TEXT DEFAULT 'online',
  assigned_orders INTEGER DEFAULT 0,
  joined_at TEXT,
  service_types TEXT DEFAULT '[]',
  zone_ids TEXT DEFAULT '[]',
  lat REAL,
  lng REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Zones
CREATE TABLE zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stations TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Dispatch Config
CREATE TABLE dispatch_configs (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  auto_dispatch_enabled INTEGER DEFAULT 1,
  max_retries INTEGER DEFAULT 3,
  dispatch_timeout_seconds INTEGER DEFAULT 300,
  zone_mode TEXT DEFAULT 'prefer',
  data TEXT DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Income Records
CREATE TABLE income_records (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  amount REAL NOT NULL,
  pay_method TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_income_staff ON income_records(staff_id);

-- Withdrawal Requests
CREATE TABLE withdrawal_requests (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewed_at TEXT,
  reviewer TEXT,
  reject_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reviews
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  service_type TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  content TEXT NOT NULL,
  images TEXT DEFAULT '[]',
  reply_content TEXT,
  replied_at TEXT,
  auto_rated INTEGER DEFAULT 0,
  follow_up INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Service Configs
CREATE TABLE service_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  emoji TEXT NOT NULL,
  unit TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Complaints
CREATE TABLE complaints (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'C10',
  target_name TEXT,
  reporter_type TEXT,
  reporter_name TEXT,
  reporter_gender TEXT,
  reporter_phone TEXT,
  object_type TEXT,
  incident_area TEXT,
  incident_location TEXT,
  doorplate TEXT,
  channel_note TEXT,
  result TEXT,
  handled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_complaints_status ON complaints(status);

-- Content: News
CREATE TABLE content_news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  category TEXT DEFAULT '其它',
  tag TEXT DEFAULT '',
  tag_color TEXT DEFAULT '#64748B',
  image_url TEXT DEFAULT '',
  date TEXT,
  hero_title TEXT,
  body TEXT DEFAULT '[]',
  sub_image TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content: Routes
CREATE TABLE content_routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  duration TEXT,
  difficulty TEXT DEFAULT '中等',
  stops INTEGER DEFAULT 0,
  distance TEXT,
  spot_names TEXT DEFAULT '[]',
  description TEXT DEFAULT '',
  cover TEXT DEFAULT '',
  spots TEXT DEFAULT '[]',
  has_video INTEGER DEFAULT 0,
  video_url TEXT,
  video_cover_url TEXT,
  video_duration TEXT,
  content_blocks TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content: Courtyards
CREATE TABLE content_courtyards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  tags TEXT DEFAULT '[]',
  tag_content TEXT,
  summary TEXT,
  description TEXT DEFAULT '',
  location TEXT,
  hours TEXT,
  image_url TEXT DEFAULT '',
  phone TEXT,
  vr_image_url TEXT,
  audio_guide_url TEXT,
  remark TEXT,
  gallery TEXT DEFAULT '[]',
  lat REAL,
  lng REAL,
  content_blocks TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content: Merchants
CREATE TABLE content_merchants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT '餐饮',
  address TEXT,
  phone TEXT,
  description TEXT DEFAULT '',
  cover TEXT DEFAULT '',
  hours TEXT,
  logo TEXT,
  images TEXT DEFAULT '[]',
  lat REAL,
  lng REAL,
  tags TEXT DEFAULT '[]',
  rating REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content: POIs
CREATE TABLE content_pois (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'scenic_spot',
  address TEXT DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  image_url TEXT,
  phone TEXT,
  hours TEXT,
  description TEXT,
  tags TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content: Housing
CREATE TABLE content_housing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  addr TEXT NOT NULL,
  status TEXT DEFAULT 'rented',
  status_text TEXT DEFAULT '出租',
  area TEXT DEFAULT 'gucheng',
  area_name TEXT DEFAULT '古城区',
  meta TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Banners
CREATE TABLE banners (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT DEFAULT '',
  link TEXT DEFAULT '',
  scene TEXT DEFAULT 'home',
  enabled INTEGER DEFAULT 1,
  "order" INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Grid Items
CREATE TABLE grid_items (
  id TEXT PRIMARY KEY,
  image_url TEXT DEFAULT '',
  label TEXT NOT NULL,
  route TEXT DEFAULT '',
  page INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  "order" INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Checkins
CREATE TABLE checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  courtyard_id TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  note TEXT DEFAULT '',
  lat REAL,
  lng REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_checkins_user ON checkins(user_id);

-- Naxi Checkins
CREATE TABLE naxi_checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  note TEXT DEFAULT '',
  lat REAL,
  lng REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  avatar TEXT,
  roles TEXT DEFAULT '[]',
  platform TEXT DEFAULT '[]',
  staff_type TEXT,
  supplier_id TEXT,
  staff_id TEXT,
  role_tag TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Addresses
CREATE TABLE addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  province TEXT DEFAULT '',
  city TEXT DEFAULT '',
  district TEXT DEFAULT '',
  detail TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_addresses_user ON addresses(user_id);

-- Favorites
CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  title TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_favorites_user ON favorites(user_id);

-- Volunteers
CREATE TABLE volunteers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  political_status TEXT,
  work_unit TEXT,
  credential_images TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  review_note TEXT,
  score INTEGER DEFAULT 0,
  review_history TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Volunteer Activities
CREATE TABLE volunteer_activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  start_time TEXT,
  end_time TEXT,
  max_participants INTEGER DEFAULT 0,
  current_participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  image_url TEXT,
  tags TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Volunteer Daily Records
CREATE TABLE volunteer_daily_records (
  id TEXT PRIMARY KEY,
  volunteer_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  check_in_time TEXT,
  check_out_time TEXT,
  duration_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Points Accounts
CREATE TABLE points_accounts (
  user_id TEXT PRIMARY KEY,
  balance REAL DEFAULT 0,
  total_earned REAL DEFAULT 0,
  total_used REAL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Points Ledgers
CREATE TABLE points_ledgers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  delta REAL NOT NULL,
  source_code TEXT NOT NULL,
  source_label TEXT NOT NULL,
  ref_id TEXT,
  balance_after REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ledgers_user ON points_ledgers(user_id);

-- Points Rules
CREATE TABLE points_rules (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  points REAL NOT NULL,
  daily_limit INTEGER,
  direction TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Trust Scores
CREATE TABLE trust_scores (
  staff_id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role_tag TEXT DEFAULT '',
  trust_score REAL DEFAULT 100,
  status TEXT DEFAULT '正常',
  total_orders INTEGER DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  rating5_count INTEGER DEFAULT 0,
  rating4_count INTEGER DEFAULT 0,
  rating3_count INTEGER DEFAULT 0,
  rating2_count INTEGER DEFAULT 0,
  rating1_count INTEGER DEFAULT 0,
  complaint_count INTEGER DEFAULT 0,
  rejection_count INTEGER DEFAULT 0,
  observation_start_at TEXT,
  last_complaint_at TEXT,
  score_history TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Score Rules
CREATE TABLE score_rules (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  condition TEXT DEFAULT '',
  score_change REAL NOT NULL,
  enabled INTEGER DEFAULT 1,
  description TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Trust Threshold
CREATE TABLE trust_thresholds (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  default_score REAL DEFAULT 100,
  delinquent_threshold REAL DEFAULT 60,
  auto_recover INTEGER DEFAULT 1,
  recover_score REAL DEFAULT 70,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Supplier Applications
CREATE TABLE supplier_applications (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  business_license TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  remark TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Merchant Registrations
CREATE TABLE merchant_registrations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  category TEXT DEFAULT '',
  address TEXT DEFAULT '',
  contact_name TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  images TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  remark TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Merchant Reviews
CREATE TABLE merchant_reviews (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  fields TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  remark TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI Knowledge
CREATE TABLE ai_knowledge (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bookings
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  courtyard_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  qr_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Suppliers
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Dispatch Logs
CREATE TABLE dispatch_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  type TEXT NOT NULL,
  staff_id TEXT,
  staff_name TEXT,
  reason TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);