-- Performance indexes for Lotifyx
-- Run: psql -U postgres -d lotifyx -f scripts/add-indexes.sql

-- Products
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING GIN (title gin_trgm_ops);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- User profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Refresh tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Role permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Roles
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_admin ON roles(is_admin);

-- Permissions
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- Claims
CREATE INDEX IF NOT EXISTS idx_claims_order_id ON claims(order_id);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Category fields
CREATE INDEX IF NOT EXISTS idx_category_fields_category_id ON category_fields(category_id);

-- Secondary banners
CREATE INDEX IF NOT EXISTS idx_secondary_banners_type ON secondary_banners(type);
CREATE INDEX IF NOT EXISTS idx_secondary_banners_is_active ON secondary_banners(is_active);

-- Faqs
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);

-- User verifications
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_type ON user_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(verification_status);
