-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  avatar TEXT,
  roles TEXT DEFAULT '[]',
  platform TEXT DEFAULT '[]',
  staffType TEXT,
  supplierId TEXT,
  staffId TEXT,
  roleTag TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Convenience Orders
CREATE TABLE IF NOT EXISTS convenience_orders (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  serviceType TEXT NOT NULL,
  address TEXT NOT NULL,
  addressTo TEXT,
  images TEXT DEFAULT '[]',
  note TEXT DEFAULT '',
  preferredTime TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'S10',
  priceQuote REAL,
  refPrice REAL,
  payMethod TEXT,
  staffId TEXT REFERENCES staff(id) ON DELETE SET NULL,
  staffName TEXT,
  staffPhone TEXT,
  complaintId TEXT,
  paymentProof TEXT,
  completionPhotos TEXT DEFAULT '[]',
  rating INTEGER,
  ratedAt TEXT,
  completedAt TEXT,
  cancelRequested INTEGER DEFAULT 0,
  lat REAL,
  lng REAL,
  arbitrationRemark TEXT,
  -- MVP 新增字段
  orderNo TEXT,
  paymentMethod TEXT,
  paymentMethodLocked INTEGER DEFAULT 0,
  quoteAmount REAL,
  paidAmount REAL,
  arrivedAt TEXT,
  quotedAt TEXT,
  dispatchAttempts INTEGER DEFAULT 0,
  reviewStatus TEXT DEFAULT 'pending',
  beforeManualStatus TEXT,
  manualReason TEXT,
  cancelFee REAL,
  rejectQuoteReason TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON convenience_orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_staff ON convenience_orders(staffId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON convenience_orders(status);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  supplierId TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  status TEXT DEFAULT 'online',
  assignedOrders INTEGER DEFAULT 0,
  joinedAt TEXT,
  serviceTypes TEXT DEFAULT '[]',
  zoneIds TEXT DEFAULT '[]',
  lat REAL,
  lng REAL,
  -- MVP 新增字段
  staffType TEXT DEFAULT 'partner',
  idCard TEXT,
  idCardFront TEXT,
  idCardBack TEXT,
  todayOrders INTEGER DEFAULT 0,
  goodRate REAL DEFAULT 1.0,
  complaintCount INTEGER DEFAULT 0,
  penaltyScore REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  applyStatus TEXT DEFAULT 'approved',
  rejectReason TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Zones
CREATE TABLE IF NOT EXISTS zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stations TEXT DEFAULT '[]',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Dispatch Config
CREATE TABLE IF NOT EXISTS dispatch_configs (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  autoDispatchEnabled INTEGER DEFAULT 1,
  maxRetries INTEGER DEFAULT 3,
  dispatchTimeoutSeconds INTEGER DEFAULT 300,
  zoneMode TEXT DEFAULT 'prefer',
  data TEXT DEFAULT '{}',
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Income Records
CREATE TABLE IF NOT EXISTS income_records (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  staffId TEXT NOT NULL,
  staffName TEXT NOT NULL,
  serviceType TEXT NOT NULL,
  amount REAL NOT NULL,
  payMethod TEXT NOT NULL,
  completedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_income_staff ON income_records(staffId);

-- Withdrawal Requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id TEXT PRIMARY KEY,
  staffId TEXT NOT NULL,
  staffName TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewedAt TEXT,
  reviewer TEXT,
  rejectReason TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  serviceType TEXT NOT NULL,
  staffId TEXT NOT NULL,
  staffName TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  rating INTEGER NOT NULL,
  content TEXT NOT NULL,
  images TEXT DEFAULT '[]',
  replyContent TEXT,
  repliedAt TEXT,
  autoRated INTEGER DEFAULT 0,
  followUp INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Service Configs
CREATE TABLE IF NOT EXISTS service_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  emoji TEXT NOT NULL,
  unit TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  "order" INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'C10',
  targetName TEXT,
  reporterType TEXT,
  reporterName TEXT,
  reporterGender TEXT,
  reporterPhone TEXT,
  objectType TEXT,
  incidentArea TEXT,
  incidentLocation TEXT,
  doorplate TEXT,
  channelNote TEXT,
  result TEXT,
  handledAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);

-- Content: News
CREATE TABLE IF NOT EXISTS content_news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  category TEXT DEFAULT '其它',
  tag TEXT DEFAULT '',
  tagColor TEXT DEFAULT '#64748B',
  imageUrl TEXT DEFAULT '',
  date TEXT,
  heroTitle TEXT,
  body TEXT DEFAULT '[]',
  subImage TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content: Routes
CREATE TABLE IF NOT EXISTS content_routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  duration TEXT,
  difficulty TEXT DEFAULT '中等',
  stops INTEGER DEFAULT 0,
  distance TEXT,
  spotNames TEXT DEFAULT '[]',
  description TEXT DEFAULT '',
  cover TEXT DEFAULT '',
  spots TEXT DEFAULT '[]',
  hasVideo INTEGER DEFAULT 0,
  videoUrl TEXT,
  videoCoverUrl TEXT,
  videoDuration TEXT,
  contentBlocks TEXT DEFAULT '[]',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content: Courtyards
CREATE TABLE IF NOT EXISTS content_courtyards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  tags TEXT DEFAULT '[]',
  tagContent TEXT,
  summary TEXT,
  description TEXT DEFAULT '',
  location TEXT,
  hours TEXT,
  imageUrl TEXT DEFAULT '',
  phone TEXT,
  vrImageUrl TEXT,
  audioGuideUrl TEXT,
  remark TEXT,
  gallery TEXT DEFAULT '[]',
  lat REAL,
  lng REAL,
  contentBlocks TEXT DEFAULT '[]',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content: Merchants
CREATE TABLE IF NOT EXISTS content_merchants (
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
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content: POIs
CREATE TABLE IF NOT EXISTS content_pois (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'scenic_spot',
  address TEXT DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  imageUrl TEXT,
  phone TEXT,
  hours TEXT,
  description TEXT,
  tags TEXT DEFAULT '[]',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content: Housing
CREATE TABLE IF NOT EXISTS content_housing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  addr TEXT NOT NULL,
  status TEXT DEFAULT 'rented',
  statusText TEXT DEFAULT '出租',
  area TEXT DEFAULT 'gucheng',
  areaName TEXT DEFAULT '古城区',
  meta TEXT DEFAULT '[]',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  imageUrl TEXT NOT NULL,
  title TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  link TEXT DEFAULT '',
  scene TEXT DEFAULT 'home',
  enabled INTEGER DEFAULT 1,
  visible INTEGER DEFAULT 1,
  "order" INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Grid Items
CREATE TABLE IF NOT EXISTS grid_items (
  id TEXT PRIMARY KEY,
  imageUrl TEXT DEFAULT '',
  label TEXT NOT NULL,
  route TEXT DEFAULT '',
  search TEXT DEFAULT '',
  page INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  "order" INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Checkins
CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  courtyardId TEXT NOT NULL,
  imageUrl TEXT DEFAULT '',
  note TEXT DEFAULT '',
  lat REAL,
  lng REAL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins(userId);

-- Naxi Checkins
CREATE TABLE IF NOT EXISTS naxi_checkins (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  imageUrl TEXT DEFAULT '',
  note TEXT DEFAULT '',
  location TEXT,
  lat REAL,
  lng REAL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  province TEXT DEFAULT '',
  city TEXT DEFAULT '',
  district TEXT DEFAULT '',
  detail TEXT NOT NULL,
  isDefault INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(userId);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  targetType TEXT NOT NULL,
  targetId TEXT NOT NULL,
  title TEXT,
  imageUrl TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(userId);

-- Volunteers
CREATE TABLE IF NOT EXISTS volunteers (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  politicalStatus TEXT,
  workUnit TEXT,
  credentialImages TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  reviewNote TEXT,
  score INTEGER DEFAULT 0,
  reviewHistory TEXT DEFAULT '[]',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Volunteer Activities
CREATE TABLE IF NOT EXISTS volunteer_activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  startTime TEXT,
  endTime TEXT,
  timeMode TEXT DEFAULT 'single',
  dailyStartTime TEXT,
  dailyEndTime TEXT,
  maxParticipants INTEGER DEFAULT 0,
  currentParticipants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  imageUrl TEXT,
  tags TEXT DEFAULT '[]',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Volunteer Daily Records
CREATE TABLE IF NOT EXISTS volunteer_daily_records (
  id TEXT PRIMARY KEY,
  volunteerId TEXT NOT NULL,
  activityId TEXT NOT NULL,
  checkInTime TEXT,
  checkOutTime TEXT,
  durationMinutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Points Accounts
CREATE TABLE IF NOT EXISTS points_accounts (
  userId TEXT PRIMARY KEY,
  balance REAL DEFAULT 0,
  totalEarned REAL DEFAULT 0,
  totalUsed REAL DEFAULT 0,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Points Ledgers
CREATE TABLE IF NOT EXISTS points_ledgers (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  direction TEXT NOT NULL,
  delta REAL NOT NULL,
  sourceCode TEXT NOT NULL,
  sourceLabel TEXT NOT NULL,
  refId TEXT,
  balanceAfter REAL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ledgers_user ON points_ledgers(userId);

-- Points Rules
CREATE TABLE IF NOT EXISTS points_rules (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  points REAL NOT NULL,
  dailyLimit INTEGER,
  direction TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Trust Scores
CREATE TABLE IF NOT EXISTS trust_scores (
  staffId TEXT PRIMARY KEY,
  supplierId TEXT NOT NULL,
  name TEXT NOT NULL,
  roleTag TEXT DEFAULT '',
  trustScore REAL DEFAULT 100,
  status TEXT DEFAULT '正常',
  totalOrders INTEGER DEFAULT 0,
  totalRatings INTEGER DEFAULT 0,
  rating5Count INTEGER DEFAULT 0,
  rating4Count INTEGER DEFAULT 0,
  rating3Count INTEGER DEFAULT 0,
  rating2Count INTEGER DEFAULT 0,
  rating1Count INTEGER DEFAULT 0,
  complaintCount INTEGER DEFAULT 0,
  rejectionCount INTEGER DEFAULT 0,
  observationStartAt TEXT,
  lastComplaintAt TEXT,
  scoreHistory TEXT DEFAULT '[]',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Score Rules
CREATE TABLE IF NOT EXISTS score_rules (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  condition TEXT DEFAULT '',
  scoreChange REAL NOT NULL,
  enabled INTEGER DEFAULT 1,
  description TEXT DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Trust Threshold
CREATE TABLE IF NOT EXISTS trust_thresholds (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  defaultScore REAL DEFAULT 100,
  delinquentThreshold REAL DEFAULT 60,
  autoRecover INTEGER DEFAULT 1,
  recoverScore REAL DEFAULT 70,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Supplier Applications
CREATE TABLE IF NOT EXISTS supplier_applications (
  id TEXT PRIMARY KEY,
  companyName TEXT NOT NULL,
  contactName TEXT NOT NULL,
  contactPhone TEXT NOT NULL,
  businessLicense TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  remark TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Merchant Registrations
CREATE TABLE IF NOT EXISTS merchant_registrations (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  merchantName TEXT NOT NULL,
  category TEXT DEFAULT '',
  address TEXT DEFAULT '',
  contactName TEXT DEFAULT '',
  contactPhone TEXT DEFAULT '',
  images TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  remark TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Merchant Reviews
CREATE TABLE IF NOT EXISTS merchant_reviews (
  id TEXT PRIMARY KEY,
  merchantId TEXT NOT NULL,
  userId TEXT NOT NULL,
  fields TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  remark TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI Knowledge
CREATE TABLE IF NOT EXISTS ai_knowledge (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  enabled INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bookings (extended with more fields)
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  courtyardId TEXT NOT NULL,
  courtyardName TEXT,
  userName TEXT,
  userPhone TEXT,
  date TEXT NOT NULL,
  timeSlot TEXT,
  slot TEXT,
  visitors INTEGER DEFAULT 1,
  code TEXT,
  status TEXT DEFAULT 'pending',
  checkedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contactName TEXT,
  contactPhone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Dispatch Logs
CREATE TABLE IF NOT EXISTS dispatch_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId TEXT NOT NULL,
  type TEXT NOT NULL,
  staffId TEXT,
  staffName TEXT,
  reason TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Announcements (new)
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  images TEXT DEFAULT '[]',
  type TEXT DEFAULT 'system',
  publishTime TEXT,
  status TEXT DEFAULT 'published',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Flow Warnings (new)
CREATE TABLE IF NOT EXISTS flow_warnings (
  id TEXT PRIMARY KEY,
  area TEXT NOT NULL,
  level TEXT DEFAULT 'normal',
  currentCount INTEGER DEFAULT 0,
  threshold INTEGER DEFAULT 1000,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS flow_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 1000,
  current INTEGER DEFAULT 0,
  level TEXT DEFAULT 'green',
  lng REAL,
  lat REAL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
-- MVP: Order Operation Logs (审计)
CREATE TABLE IF NOT EXISTS order_operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId TEXT NOT NULL,
  operatorType TEXT,
  operatorId TEXT,
  action TEXT NOT NULL,
  fromStatus TEXT,
  toStatus TEXT,
  remark TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_oplogs_order ON order_operation_logs(orderId);

-- MVP: Payment Records (支付流水)
CREATE TABLE IF NOT EXISTS payment_records (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  originPaymentId TEXT,
  paymentMethod TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'success',
  thirdTradeNo TEXT,
  collectedByStaffId TEXT,
  paidAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pay_order ON payment_records(orderId);

-- MVP: System Configs
CREATE TABLE IF NOT EXISTS system_configs (
  id TEXT PRIMARY KEY,
  configKey TEXT UNIQUE NOT NULL,
  configValue TEXT,
  description TEXT,
  updatedBy TEXT,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ====== 迁移：新增字段 ======
ALTER TABLE content_routes ADD COLUMN isFeatured INTEGER DEFAULT 0;
ALTER TABLE content_routes ADD COLUMN subtitle TEXT DEFAULT '';
ALTER TABLE content_routes ADD COLUMN tagColor TEXT DEFAULT '#3B82F6';

-- ====== Notifications ======
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  staffId TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  orderId TEXT,
  isRead INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notif_staff ON notifications(staffId);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(staffId, isRead);
