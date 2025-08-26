# Terms & Conditions Database Setup

## Quick Fix for "Unexpected token 'I', Internal S..." Error

The error you're seeing happens because the `page_content` table doesn't exist in your database yet. Here's how to fix it:

## 🛠️ Setup Instructions

### 1. Access Supabase Dashboard
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **driving-school** project
3. Navigate to **SQL Editor** in the left sidebar

### 2. Create the Page Content Table
1. In the SQL Editor, click **+ New query**
2. Copy and paste the contents of `sql/page-content.sql` 
3. Click **Run** to execute the script

### 3. Verify Setup
The script will:
- ✅ Create the `page_content` table with proper structure
- ✅ Add indexes for performance
- ✅ Set up Row Level Security (RLS) policies
- ✅ Create auto-update timestamp triggers

### 4. Test Your Terms & Conditions
1. Navigate to `/packages` in your app
2. Enable admin edit mode
3. The Terms & Conditions section should now work properly!

## 🎯 What This Fixes

- **❌ Before**: `SyntaxError: Unexpected token 'I', "Internal S"... is not valid JSON`
- **✅ After**: Terms & Conditions load and save properly to the database

## 📊 Database Schema

The `page_content` table stores:
- **Text content** (like individual terms)
- **JSON content** (like arrays of terms & conditions)
- **File references** (for images and documents)
- **Metadata** (timestamps, active status, etc.)

## 🔧 Troubleshooting

If you still get errors after running the SQL:
1. Check the browser console for detailed error messages
2. Verify your `SUPABASE_SERVICE_ROLE_KEY` is set correctly
3. Ensure your Supabase project has the required permissions

Your Terms & Conditions will be fully functional once this table is created! 🚀