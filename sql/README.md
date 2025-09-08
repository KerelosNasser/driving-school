# Database Schema Documentation

This directory contains the organized SQL schema for the Driving School application.

## File Structure

- `setup.sql` - Main setup file that runs all components in order
- `01_extensions.sql` - PostgreSQL extensions and initial configuration
- `02_tables.sql` - Core database tables
- `03_functions.sql` - Database functions and stored procedures
- `04_triggers_indexes.sql` - Triggers and performance indexes
- `05_permissions.sql` - Row Level Security policies and permissions
- `driving-school.sql` - Original monolithic schema (kept for reference)

## Usage

### Quick Setup
Run the main setup file to create the entire schema:
```sql
\i setup.sql
```

### Individual Components
You can also run individual files if needed:
```sql
\i 01_extensions.sql
\i 02_tables.sql
-- etc.
```

## Tables Overview

### Core Tables
- `users` - User profiles and contact information
- `invitation_codes` - User invitation codes for referral system
- `user_quotas` - User lesson hour quotas
- `referrals` - Referral relationships between users
- `referral_rewards` - Rewards earned from referrals

### Key Features
- Row Level Security (RLS) enabled on all tables
- Automatic `updated_at` timestamp triggers
- Optimized indexes for common queries
- Secure functions for invitation code generation
- Referral processing with reward system

## Security

All tables have Row Level Security policies that ensure:
- Users can only access their own data
- Service role has full access for API operations
- Proper authentication checks on all operations

## Functions

- `create_user_invitation_code(uuid)` - Generates invitation codes for users
- `process_referral(text, uuid)` - Processes referral relationships
- `handle_updated_at()` - Automatic timestamp updates