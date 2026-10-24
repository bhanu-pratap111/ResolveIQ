-- ResolveIQ Initial Schema Migration
-- Run: mysql -u root -p < migrations/001_initial_schema.sql

CREATE DATABASE IF NOT EXISTS resolveiq_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE resolveiq_db;

CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS bureaus (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cells (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bureau_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bureau_id) REFERENCES bureaus(id)
);

CREATE TABLE IF NOT EXISTS officer_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  bureau_id INT,
  cell_id INT,
  assigned_by INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (bureau_id) REFERENCES bureaus(id),
  FOREIGN KEY (cell_id) REFERENCES cells(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS institutions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(500) NOT NULL,
  code VARCHAR(100) UNIQUE,
  type ENUM('university','deemed_university','college','institute','polytechnic','other') DEFAULT 'college',
  state VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS institution_aliases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  institution_id INT NOT NULL,
  alias VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

CREATE TABLE IF NOT EXISTS student_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  institution_id INT,
  student_id VARCHAR(100),
  program VARCHAR(255),
  year_of_study INT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

CREATE TABLE IF NOT EXISTS complaint_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  keywords TEXT COMMENT 'comma-separated keywords for rule-based classification',
  default_deadline_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS category_bureau_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  bureau_id INT NOT NULL,
  priority INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES complaint_categories(id),
  FOREIGN KEY (bureau_id) REFERENCES bureaus(id),
  UNIQUE KEY uq_cat_bureau (category_id, bureau_id)
);

CREATE TABLE IF NOT EXISTS complaints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reference_number VARCHAR(30) UNIQUE NOT NULL,
  student_id INT NOT NULL,
  institution_id INT NOT NULL,
  category_id INT,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  incident_date DATE,
  status ENUM('REGISTERED','UNDER_REVIEW','UNDER_ACTION','AWAITING_RESPONSE','RESOLVED','CLOSED','REJECTED') DEFAULT 'REGISTERED',
  priority ENUM('LOW','MEDIUM','HIGH','URGENT') DEFAULT 'MEDIUM',
  current_bureau_id INT,
  current_cell_id INT,
  current_officer_id INT,
  ai_suggested_category_id INT,
  ai_suggested_bureau_id INT,
  ai_confidence DECIMAL(5,4),
  ai_suggestion_accepted BOOLEAN,
  ai_suggestion_accepted_at TIMESTAMP NULL,
  ai_suggestion_accepted_by INT,
  deadline_date DATE,
  is_overdue BOOLEAN DEFAULT FALSE,
  privacy_acknowledged BOOLEAN DEFAULT FALSE,
  declaration_acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (category_id) REFERENCES complaint_categories(id),
  FOREIGN KEY (current_bureau_id) REFERENCES bureaus(id),
  FOREIGN KEY (current_cell_id) REFERENCES cells(id),
  FOREIGN KEY (current_officer_id) REFERENCES users(id),
  FOREIGN KEY (ai_suggested_category_id) REFERENCES complaint_categories(id),
  FOREIGN KEY (ai_suggested_bureau_id) REFERENCES bureaus(id),
  INDEX idx_student (student_id),
  INDEX idx_institution (institution_id),
  INDEX idx_status (status),
  INDEX idx_category (category_id),
  INDEX idx_bureau (current_bureau_id),
  INDEX idx_created (created_at)
);

CREATE TABLE IF NOT EXISTS complaint_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  bureau_id INT,
  cell_id INT,
  officer_id INT,
  assigned_by INT,
  transfer_reason TEXT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_current BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (bureau_id) REFERENCES bureaus(id),
  FOREIGN KEY (cell_id) REFERENCES cells(id),
  FOREIGN KEY (officer_id) REFERENCES users(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS complaint_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  previous_status ENUM('REGISTERED','UNDER_REVIEW','UNDER_ACTION','AWAITING_RESPONSE','RESOLVED','CLOSED','REJECTED'),
  new_status ENUM('REGISTERED','UNDER_REVIEW','UNDER_ACTION','AWAITING_RESPONSE','RESOLVED','CLOSED','REJECTED') NOT NULL,
  changed_by INT NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS complaint_evidence (
  id INT PRIMARY KEY AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  original_filename VARCHAR(500) NOT NULL,
  stored_filename VARCHAR(500) NOT NULL,
  file_path VARCHAR(1000) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS complaint_internal_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  author_id INT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS complaint_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('INFORMATION_REQUEST','STUDENT_RESPONSE','OFFICIAL_COMMUNICATION','GENERAL') DEFAULT 'GENERAL',
  is_visible_to_student BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS related_complaints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  complaint_id_1 INT NOT NULL,
  complaint_id_2 INT NOT NULL,
  relationship_type ENUM('POTENTIALLY_RELATED','CONFIRMED_RELATED','DUPLICATE','NOT_RELATED') DEFAULT 'POTENTIALLY_RELATED',
  similarity_score DECIMAL(5,4),
  match_reasons JSON,
  ai_model_version VARCHAR(50),
  confirmed_by INT,
  confirmed_at TIMESTAMP NULL,
  confirmation_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id_1) REFERENCES complaints(id),
  FOREIGN KEY (complaint_id_2) REFERENCES complaints(id),
  FOREIGN KEY (confirmed_by) REFERENCES users(id),
  UNIQUE KEY unique_pair (complaint_id_1, complaint_id_2)
);

CREATE TABLE IF NOT EXISTS resolution_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  complaint_id INT UNIQUE NOT NULL,
  resolved_by INT NOT NULL,
  outcome ENUM('RESOLVED_IN_FAVOR','RESOLVED_PARTIALLY','RESOLVED_NOT_IN_FAVOR','COMPLAINT_WITHDRAWN','NO_FURTHER_ACTION') NOT NULL,
  findings TEXT,
  decision TEXT NOT NULL,
  action_taken TEXT,
  resolved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS escalation_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  escalated_by INT NOT NULL,
  escalated_to INT,
  reason TEXT NOT NULL,
  escalation_type ENUM('DEADLINE_BREACH','OFFICER_REQUEST','ADMIN_ESCALATION','AUTOMATIC') DEFAULT 'ADMIN_ESCALATION',
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (escalated_by) REFERENCES users(id),
  FOREIGN KEY (escalated_to) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  complaint_id INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('COMPLAINT_SUBMITTED','COMPLAINT_ASSIGNED','STATUS_CHANGE','INFORMATION_REQUEST','STUDENT_RESPONSE','RESOLUTION','DEADLINE_WARNING','OVERDUE','GENERAL') DEFAULT 'GENERAL',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  INDEX idx_user_unread (user_id, is_read)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  actor_id INT,
  actor_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  previous_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_actor (actor_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);

CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Refresh tokens table for server-side invalidation
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_token (token_hash),
  INDEX idx_user (user_id)
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_token (token)
);
