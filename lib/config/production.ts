// Production configuration and environment validation
export interface ProductionConfig {
  // Core application
  nodeEnv: string
  appUrl: string
  port: number

  // Database
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string

  // Authentication
  clerkPublishableKey: string
  clerkSecretKey: string
  nextAuthSecret: string
  jwtSecret: string

  // Google Services
  googleOAuthClientId: string
  googleOAuthClientSecret: string
  googleCalendarApiKey: string
  googlePlacesApiKey: string

  // Redis
  redisUrl?: string
  redisToken?: string

  // Email
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string

  // Monitoring
  sentryDsn?: string

  // Payment
  stripePublishableKey?: string
  stripeSecretKey?: string
}

// Required environment variables for production
const requiredEnvVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_CALENDAR_API_KEY',
  'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY'
]

// Optional environment variables

export function validateEnvironment(): ProductionConfig {
  const missing: string[] = []
  
  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return {
    // Core
    nodeEnv: process.env.NODE_ENV!,
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    port: parseInt(process.env.PORT || '3000'),

    // Database
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,

    // Authentication
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    clerkSecretKey: process.env.CLERK_SECRET_KEY!,
    nextAuthSecret: process.env.NEXTAUTH_SECRET!,
    jwtSecret: process.env.JWT_SECRET!,

    // Google Services
    googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    googleCalendarApiKey: process.env.GOOGLE_CALENDAR_API_KEY!,
    googlePlacesApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!,

    // Redis (optional)
    redisUrl: process.env.UPSTASH_REDIS_REST_URL,
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,

    // Email (optional)
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,

    // Monitoring (optional)
    sentryDsn: process.env.SENTRY_DSN,

    // Payment (optional)
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  }
}

// Validate configuration on module load in production
let config: ProductionConfig

try {
  config = validateEnvironment()
  
  if (config.nodeEnv === 'production') {
    console.log('✅ Production environment validation passed')
    
    // Log which optional services are configured
    const configuredServices = []
    if (config.redisUrl) configuredServices.push('Redis')
    if (config.smtpHost) configuredServices.push('Email')
    if (config.sentryDsn) configuredServices.push('Sentry')
    if (config.stripeSecretKey) configuredServices.push('Stripe')
    
    if (configuredServices.length > 0) {
      console.log(`📦 Configured services: ${configuredServices.join(', ')}`)
    }
  }
} catch (error) {
  console.error('❌ Environment validation failed:', error)
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
}

export { config }
export default config