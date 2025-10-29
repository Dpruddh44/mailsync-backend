-- Onebox Email Backend Database Schema
-- Created: 2025-10-25
-- PostgreSQL Database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 993,
    username VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    use_tls BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(50) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(username, host)
);

-- Emails Table
CREATE TABLE IF NOT EXISTS emails (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    uid INTEGER NOT NULL,
    folder VARCHAR(255) NOT NULL DEFAULT 'INBOX',
    message_id VARCHAR(500),
    thread_id VARCHAR(500),
    from_address TEXT NOT NULL,
    to_address TEXT,
    cc_address TEXT,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    snippet TEXT,
    date TIMESTAMP NOT NULL,
    labels JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    raw_headers JSONB,
    indexed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(account_id, folder, uid)
);

-- Sync State Table
CREATE TABLE IF NOT EXISTS sync_state (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    folder VARCHAR(255) NOT NULL DEFAULT 'INBOX',
    last_uid INTEGER NOT NULL DEFAULT 0,
    last_sync_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(account_id, folder)
);

-- Create Indexes for Performance
CREATE INDEX idx_emails_account_id ON emails(account_id);
CREATE INDEX idx_emails_date ON emails(date DESC);
CREATE INDEX idx_emails_from ON emails(from_address);
CREATE INDEX idx_emails_subject ON emails(subject);
CREATE INDEX idx_emails_labels ON emails USING GIN(labels);
CREATE INDEX idx_emails_message_id ON emails(message_id);
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE INDEX idx_sync_state_account ON sync_state(account_id);

-- Create Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Trigger to Accounts Table
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert Sample Data (Optional - for testing)
-- COMMENT OUT IN PRODUCTION
/*
INSERT INTO accounts (name, host, port, username, encrypted_password, use_tls, status)
VALUES ('Test Gmail', 'imap.gmail.com', 993, 'test@gmail.com', 'encrypted_password_here', true, 'inactive');
*/

-- View for Email Statistics
CREATE OR REPLACE VIEW email_stats AS
SELECT 
    a.id AS account_id,
    a.name AS account_name,
    COUNT(e.id) AS total_emails,
    COUNT(CASE WHEN e.labels::text LIKE '%Interested%' THEN 1 END) AS interested_count,
    COUNT(CASE WHEN e.labels::text LIKE '%Meeting Booked%' THEN 1 END) AS meeting_booked_count,
    COUNT(CASE WHEN e.labels::text LIKE '%Not Interested%' THEN 1 END) AS not_interested_count,
    COUNT(CASE WHEN e.labels::text LIKE '%Spam%' THEN 1 END) AS spam_count,
    COUNT(CASE WHEN e.labels::text LIKE '%Out of Office%' THEN 1 END) AS ooo_count,
    MAX(e.date) AS latest_email_date,
    a.last_sync_at
FROM accounts a
LEFT JOIN emails e ON a.id = e.account_id
GROUP BY a.id, a.name, a.last_sync_at;

-- Grant Permissions (Adjust based on your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;