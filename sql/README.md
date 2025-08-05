# Database Setup for Driving School Application

This directory contains SQL files needed to set up and populate the database for the Driving School application.

## Files

- `schema.sql` - Contains the database schema definition (tables, constraints, indexes)
- `seed.sql` - Contains sample data to populate the database

## How to Use

### Using the Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `schema.sql` into the editor and run it
4. Copy and paste the contents of `seed.sql` into the editor and run it

### Using the Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db execute --file=./sql/schema.sql
supabase db execute --file=./sql/seed.sql
```

## Database Structure

The database consists of the following tables:

- `users` - Stores user information linked to Clerk authentication
- `packages` - Stores driving lesson packages offered by the school
- `bookings` - Stores lesson bookings made by users
- `reviews` - Stores reviews submitted by users

## Sample Data

The seed data includes:

- 3 driving lesson packages (Starter, Standard, Premium)
- 6 sample users
- 6 reviews from different users
- 8 completed bookings
- 3 upcoming bookings

This data is useful for development and testing purposes.

## Notes

- The schema includes appropriate indexes for better query performance
- Foreign key constraints are in place to maintain data integrity
- The sample data is designed to be realistic and consistent