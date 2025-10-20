# Testing Strategy: Calendar System

## 🎯 Testing Overview

This document outlines a comprehensive testing strategy for the driving school calendar system, covering unit tests, integration tests, security tests, performance tests, and end-to-end tests.

## 📋 Testing Pyramid

```
    /\     E2E Tests (10%)
   /  \    - User workflows
  /____\   - Critical paths
 /      \  
/________\  Integration Tests (20%)
|        |  - API endpoints
|        |  - Database operations
|________|  - External services
|        |
|        |  Unit Tests (70%)
|        |  - Individual functions
|        |  - Components
|________|  - Business logic
```

## 🧪 Testing Framework Setup

### Dependencies Installation

```bash
# Core testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event jest-environment-jsdom

# API testing
npm install --save-dev supertest @types/supertest

# E2E testing
npm install --save-dev cypress @cypress/react

# Security testing
npm install --save-dev @security/eslint-plugin

# Performance testing
npm install --save-dev lighthouse artillery

# Mocking
npm install --save-dev msw @types/jest
```

### Jest Configuration

**Create `jest.config.js`:**
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'pages/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

**Create `jest.setup.js`:**
```javascript
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
```

## 🔬 Unit Testing

### Calendar Service Tests

**Create `__tests__/lib/calendar/calendar-service.test.ts`:**
```typescript
import { CalendarService } from '@/lib/calendar/calendar-service'
import { CalendarCache } from '@/lib/calendar/calendar-cache'

// Mock dependencies
jest.mock('@/lib/calendar/calendar-cache')
jest.mock('googleapis')

describe('CalendarService', () => {
  let calendarService: CalendarService
  let mockCache: jest.Mocked<CalendarCache>

  beforeEach(() => {
    mockCache = new CalendarCache() as jest.Mocked<CalendarCache>
    calendarService = new CalendarService(mockCache)
  })

  describe('getAvailableSlots', () => {
    it('should return available slots for a given date range', async () => {
      // Arrange
      const startDate = new Date('2024-01-01T09:00:00Z')
      const endDate = new Date('2024-01-01T17:00:00Z')
      const expectedSlots = [
        { start: '2024-01-01T09:00:00Z', end: '2024-01-01T10:00:00Z' },
        { start: '2024-01-01T10:00:00Z', end: '2024-01-01T11:00:00Z' },
      ]

      mockCache.get.mockResolvedValue(null)
      mockCache.set.mockResolvedValue(undefined)

      // Act
      const result = await calendarService.getAvailableSlots(startDate, endDate)

      // Assert
      expect(result).toEqual(expectedSlots)
      expect(mockCache.get).toHaveBeenCalledWith(expect.stringContaining('availability'))
      expect(mockCache.set).toHaveBeenCalled()
    })

    it('should return cached slots when available', async () => {
      // Arrange
      const startDate = new Date('2024-01-01T09:00:00Z')
      const endDate = new Date('2024-01-01T17:00:00Z')
      const cachedSlots = [
        { start: '2024-01-01T09:00:00Z', end: '2024-01-01T10:00:00Z' },
      ]

      mockCache.get.mockResolvedValue(cachedSlots)

      // Act
      const result = await calendarService.getAvailableSlots(startDate, endDate)

      // Assert
      expect(result).toEqual(cachedSlots)
      expect(mockCache.set).not.toHaveBeenCalled()
    })
  })

  describe('bookSlot', () => {
    it('should successfully book a slot', async () => {
      // Arrange
      const bookingData = {
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T10:00:00Z',
        instructorId: 'instructor-123',
        userId: 'user-123',
        lessonType: 'standard' as const,
      }

      // Act
      const result = await calendarService.bookSlot(bookingData)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result.status).toBe('confirmed')
    })

    it('should throw error for conflicting bookings', async () => {
      // Arrange
      const bookingData = {
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T10:00:00Z',
        instructorId: 'instructor-123',
        userId: 'user-123',
        lessonType: 'standard' as const,
      }

      // Mock existing booking conflict
      jest.spyOn(calendarService, 'checkConflicts').mockResolvedValue(true)

      // Act & Assert
      await expect(calendarService.bookSlot(bookingData)).rejects.toThrow('Booking conflict detected')
    })
  })
})
```

### Scheduling Constraints Tests

**Create `__tests__/lib/calendar/scheduling-constraints.test.ts`:**
```typescript
import { SchedulingValidator, SchedulingConstraints } from '@/lib/calendar/scheduling-constraints'

describe('SchedulingValidator', () => {
  let validator: SchedulingValidator
  let constraints: SchedulingConstraints

  beforeEach(() => {
    constraints = {
      weeklyLimits: {
        maxLessonsPerWeek: 5,
        maxHoursPerWeek: 10,
      },
      dailyLimits: {
        maxLessonsPerDay: 2,
        maxHoursPerDay: 4,
      },
      timeConstraints: {
        earliestStartTime: '09:00',
        latestEndTime: '17:00',
        allowedDays: [1, 2, 3, 4, 5], // Monday to Friday
      },
      bufferConstraints: {
        minimumBufferMinutes: 15,
        bufferBetweenInstructors: 30,
      },
      lessonConstraints: {
        minimumDurationMinutes: 60,
        maximumDurationMinutes: 180,
        allowedDurations: [60, 90, 120],
      },
      advanceBooking: {
        minimumAdvanceDays: 1,
        maximumAdvanceDays: 30,
      },
    }
    validator = new SchedulingValidator(constraints)
  })

  describe('validateBooking', () => {
    it('should validate a valid booking request', () => {
      // Arrange
      const bookingRequest = {
        startTime: new Date('2024-01-15T10:00:00Z'), // Monday
        endTime: new Date('2024-01-15T11:00:00Z'),
        instructorId: 'instructor-123',
        userId: 'user-123',
        lessonType: 'standard' as const,
      }
      const existingBookings = []

      // Act
      const result = validator.validateBooking(bookingRequest, existingBookings)

      // Assert
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject booking outside operating hours', () => {
      // Arrange
      const bookingRequest = {
        startTime: new Date('2024-01-15T08:00:00Z'), // Before 9 AM
        endTime: new Date('2024-01-15T09:00:00Z'),
        instructorId: 'instructor-123',
        userId: 'user-123',
        lessonType: 'standard' as const,
      }
      const existingBookings = []

      // Act
      const result = validator.validateBooking(bookingRequest, existingBookings)

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Booking is outside operating hours')
    })

    it('should reject booking on weekend', () => {
      // Arrange
      const bookingRequest = {
        startTime: new Date('2024-01-13T10:00:00Z'), // Saturday
        endTime: new Date('2024-01-13T11:00:00Z'),
        instructorId: 'instructor-123',
        userId: 'user-123',
        lessonType: 'standard' as const,
      }
      const existingBookings = []

      // Act
      const result = validator.validateBooking(bookingRequest, existingBookings)

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Booking is not allowed on this day')
    })

    it('should reject booking exceeding weekly limits', () => {
      // Arrange
      const bookingRequest = {
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        instructorId: 'instructor-123',
        userId: 'user-123',
        lessonType: 'standard' as const,
      }
      
      // Create 5 existing bookings for the same week
      const existingBookings = Array.from({ length: 5 }, (_, i) => ({
        id: `booking-${i}`,
        startTime: new Date(`2024-01-${15 + i}T10:00:00Z`),
        endTime: new Date(`2024-01-${15 + i}T11:00:00Z`),
        instructorId: 'instructor-123',
        userId: 'user-123',
        status: 'confirmed' as const,
      }))

      // Act
      const result = validator.validateBooking(bookingRequest, existingBookings)

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Weekly lesson limit exceeded')
    })
  })
})
```

### Component Tests

**Create `__tests__/components/GoogleCalendarIntegration.test.tsx`:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GoogleCalendarIntegration } from '@/components/GoogleCalendarIntegration'

// Mock the calendar service
jest.mock('@/lib/calendar/calendar-service')

describe('GoogleCalendarIntegration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
  })

  it('should render calendar integration component', () => {
    // Act
    render(<GoogleCalendarIntegration />)

    // Assert
    expect(screen.getByText('Connect Google Calendar')).toBeInTheDocument()
  })

  it('should handle calendar connection', async () => {
    // Arrange
    const mockConnect = jest.fn().mockResolvedValue({ success: true })
    
    // Act
    render(<GoogleCalendarIntegration />)
    fireEvent.click(screen.getByText('Connect Google Calendar'))

    // Assert
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled()
    })
  })

  it('should display available time slots', async () => {
    // Arrange
    const mockSlots = [
      { start: '2024-01-15T09:00:00Z', end: '2024-01-15T10:00:00Z' },
      { start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' },
    ]

    // Act
    render(<GoogleCalendarIntegration />)
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('9:00 AM - 10:00 AM')).toBeInTheDocument()
      expect(screen.getByText('10:00 AM - 11:00 AM')).toBeInTheDocument()
    })
  })

  it('should handle booking selection', async () => {
    // Arrange
    render(<GoogleCalendarIntegration />)

    // Act
    fireEvent.click(screen.getByText('9:00 AM - 10:00 AM'))

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Book This Slot')).toBeInTheDocument()
    })
  })
})
```

## 🔗 Integration Testing

### API Endpoint Tests

**Create `__tests__/api/calendar/book.test.ts`:**
```typescript
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/calendar/book'

describe('/api/calendar/book', () => {
  it('should create a booking with valid data', async () => {
    // Arrange
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        instructorId: 'instructor-123',
        lessonType: 'standard',
      },
      headers: {
        authorization: 'Bearer valid-jwt-token',
      },
    })

    // Act
    await handler(req, res)

    // Assert
    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('id')
    expect(data.status).toBe('confirmed')
  })

  it('should reject booking with invalid data', async () => {
    // Arrange
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startTime: 'invalid-date',
        endTime: '2024-01-15T11:00:00Z',
      },
      headers: {
        authorization: 'Bearer valid-jwt-token',
      },
    })

    // Act
    await handler(req, res)

    // Assert
    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Invalid booking data')
  })

  it('should reject unauthorized requests', async () => {
    // Arrange
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        instructorId: 'instructor-123',
        lessonType: 'standard',
      },
    })

    // Act
    await handler(req, res)

    // Assert
    expect(res._getStatusCode()).toBe(401)
  })
})
```

### Database Integration Tests

**Create `__tests__/integration/database.test.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js'
import { SchedulingValidator } from '@/lib/calendar/scheduling-constraints'

describe('Database Integration', () => {
  let supabase: any

  beforeAll(() => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  afterEach(async () => {
    // Clean up test data
    await supabase.from('bookings').delete().match({ user_id: 'test-user' })
  })

  it('should create and retrieve booking', async () => {
    // Arrange
    const bookingData = {
      user_id: 'test-user',
      instructor_id: 'test-instructor',
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T11:00:00Z',
      lesson_type: 'standard',
      status: 'confirmed',
    }

    // Act
    const { data: created, error: createError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()

    const { data: retrieved, error: retrieveError } = await supabase
      .from('bookings')
      .select()
      .eq('id', created.id)
      .single()

    // Assert
    expect(createError).toBeNull()
    expect(retrieveError).toBeNull()
    expect(retrieved).toMatchObject(bookingData)
  })

  it('should enforce scheduling constraints', async () => {
    // Arrange
    const constraintsData = {
      weekly_limits: { max_lessons_per_week: 5 },
      daily_limits: { max_lessons_per_day: 2 },
      time_constraints: {
        earliest_start_time: '09:00',
        latest_end_time: '17:00',
      },
    }

    // Act
    const { data, error } = await supabase
      .from('scheduling_constraints')
      .upsert(constraintsData)
      .select()

    // Assert
    expect(error).toBeNull()
    expect(data[0]).toMatchObject(constraintsData)
  })
})
```

## 🛡️ Security Testing

### Authentication Tests

**Create `__tests__/security/auth.test.ts`:**
```typescript
import { verifyJWT, generateJWT } from '@/lib/auth/jwt'
import { rateLimiter } from '@/lib/rate-limit'

describe('Security Tests', () => {
  describe('JWT Security', () => {
    it('should generate and verify valid JWT tokens', () => {
      // Arrange
      const payload = { userId: 'user-123', role: 'user' }

      // Act
      const token = generateJWT(payload)
      const verified = verifyJWT(token)

      // Assert
      expect(verified).toMatchObject(payload)
    })

    it('should reject expired tokens', () => {
      // Arrange
      const payload = { userId: 'user-123', role: 'user' }
      const expiredToken = generateJWT(payload, { expiresIn: '-1h' })

      // Act & Assert
      expect(() => verifyJWT(expiredToken)).toThrow('Token expired')
    })

    it('should reject tampered tokens', () => {
      // Arrange
      const payload = { userId: 'user-123', role: 'user' }
      const token = generateJWT(payload)
      const tamperedToken = token.slice(0, -5) + 'xxxxx'

      // Act & Assert
      expect(() => verifyJWT(tamperedToken)).toThrow('Invalid token')
    })
  })

  describe('Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      // Arrange
      const identifier = 'test-user-1'

      // Act
      const result = await rateLimiter.limit(identifier)

      // Assert
      expect(result.success).toBe(true)
      expect(result.remaining).toBeGreaterThan(0)
    })

    it('should block requests exceeding limit', async () => {
      // Arrange
      const identifier = 'test-user-2'

      // Act - Make requests up to the limit
      for (let i = 0; i < 10; i++) {
        await rateLimiter.limit(identifier)
      }
      
      // This should be blocked
      const result = await rateLimiter.limit(identifier)

      // Assert
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe('Input Validation', () => {
    it('should sanitize XSS attempts', () => {
      // Arrange
      const maliciousInput = '<script>alert("xss")</script>'
      
      // Act
      const sanitized = sanitizeInput(maliciousInput)

      // Assert
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
    })

    it('should prevent SQL injection', () => {
      // Arrange
      const maliciousInput = "'; DROP TABLE users; --"
      
      // Act & Assert
      expect(() => validateBookingInput({ notes: maliciousInput }))
        .toThrow('Invalid input detected')
    })
  })
})
```

### Penetration Testing Scripts

**Create `scripts/security-test.js`:**
```javascript
const axios = require('axios')

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'

async function testSQLInjection() {
  console.log('Testing SQL Injection...')
  
  const payloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "' UNION SELECT * FROM users --",
  ]

  for (const payload of payloads) {
    try {
      const response = await axios.post(`${BASE_URL}/api/calendar/book`, {
        notes: payload,
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
      })
      
      if (response.status === 200) {
        console.error(`❌ SQL Injection vulnerability detected with payload: ${payload}`)
      }
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`✅ SQL Injection blocked: ${payload}`)
      }
    }
  }
}

async function testXSS() {
  console.log('Testing XSS...')
  
  const payloads = [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("xss")',
  ]

  for (const payload of payloads) {
    try {
      const response = await axios.post(`${BASE_URL}/api/calendar/book`, {
        notes: payload,
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
      })
      
      if (response.data.notes && response.data.notes.includes('<script>')) {
        console.error(`❌ XSS vulnerability detected with payload: ${payload}`)
      } else {
        console.log(`✅ XSS blocked: ${payload}`)
      }
    } catch (error) {
      console.log(`✅ XSS blocked: ${payload}`)
    }
  }
}

async function testRateLimit() {
  console.log('Testing Rate Limiting...')
  
  const requests = Array.from({ length: 15 }, (_, i) => 
    axios.get(`${BASE_URL}/api/calendar/events`).catch(err => err.response)
  )

  const responses = await Promise.all(requests)
  const rateLimited = responses.filter(res => res?.status === 429)

  if (rateLimited.length > 0) {
    console.log(`✅ Rate limiting working: ${rateLimited.length} requests blocked`)
  } else {
    console.error('❌ Rate limiting not working')
  }
}

async function runSecurityTests() {
  console.log('🔒 Running Security Tests...\n')
  
  await testSQLInjection()
  await testXSS()
  await testRateLimit()
  
  console.log('\n✅ Security tests completed')
}

if (require.main === module) {
  runSecurityTests().catch(console.error)
}

module.exports = { testSQLInjection, testXSS, testRateLimit }
```

## 🚀 Performance Testing

### Load Testing with Artillery

**Create `artillery.yml`:**
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
    - duration: 60
      arrivalRate: 100
      name: "Stress test"
  defaults:
    headers:
      Authorization: 'Bearer {{ $randomString() }}'

scenarios:
  - name: "Calendar Operations"
    weight: 70
    flow:
      - get:
          url: "/api/calendar/events"
      - think: 2
      - post:
          url: "/api/calendar/book"
          json:
            startTime: "2024-01-15T10:00:00Z"
            endTime: "2024-01-15T11:00:00Z"
            instructorId: "instructor-123"
            lessonType: "standard"
      - think: 1
      - get:
          url: "/api/calendar/availability"

  - name: "Authentication Flow"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
      - get:
          url: "/api/auth/me"

  - name: "Admin Operations"
    weight: 10
    flow:
      - get:
          url: "/api/admin/scheduling-constraints"
      - put:
          url: "/api/admin/scheduling-constraints"
          json:
            weeklyLimits:
              maxLessonsPerWeek: 5
```

**Run performance tests:**
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run artillery.yml

# Generate HTML report
artillery run artillery.yml --output report.json
artillery report report.json
```

### Lighthouse Performance Testing

**Create `scripts/lighthouse-test.js`:**
```javascript
const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
  
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  }

  const runnerResult = await lighthouse(url, options)
  
  // Extract scores
  const scores = {
    performance: runnerResult.lhr.categories.performance.score * 100,
    accessibility: runnerResult.lhr.categories.accessibility.score * 100,
    bestPractices: runnerResult.lhr.categories['best-practices'].score * 100,
    seo: runnerResult.lhr.categories.seo.score * 100,
  }

  console.log('Lighthouse Scores:')
  console.log(`Performance: ${scores.performance}`)
  console.log(`Accessibility: ${scores.accessibility}`)
  console.log(`Best Practices: ${scores.bestPractices}`)
  console.log(`SEO: ${scores.seo}`)

  await chrome.kill()
  
  return scores
}

// Test multiple pages
const pages = [
  'http://localhost:3000',
  'http://localhost:3000/packages',
  'http://localhost:3000/service-center',
]

async function runAllTests() {
  for (const page of pages) {
    console.log(`\nTesting: ${page}`)
    await runLighthouse(page)
  }
}

if (require.main === module) {
  runAllTests().catch(console.error)
}
```

## 🎭 End-to-End Testing

### Cypress Configuration

**Create `cypress.config.js`:**
```javascript
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
  },
})
```

### E2E Test Scenarios

**Create `cypress/e2e/booking-flow.cy.ts`:**
```typescript
describe('Booking Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('test@example.com', 'password123')
  })

  it('should complete full booking flow', () => {
    // Navigate to booking page
    cy.visit('/packages')
    cy.get('[data-testid="book-lesson-btn"]').click()

    // Connect Google Calendar
    cy.get('[data-testid="connect-calendar-btn"]').click()
    cy.get('[data-testid="calendar-connected"]').should('be.visible')

    // Select date and time
    cy.get('[data-testid="date-picker"]').click()
    cy.get('[data-testid="date-2024-01-15"]').click()
    cy.get('[data-testid="time-slot-10-00"]').click()

    // Select instructor and lesson type
    cy.get('[data-testid="instructor-select"]').select('John Doe')
    cy.get('[data-testid="lesson-type-select"]').select('Standard Lesson')

    // Add notes
    cy.get('[data-testid="booking-notes"]').type('First driving lesson')

    // Confirm booking
    cy.get('[data-testid="confirm-booking-btn"]').click()

    // Verify success
    cy.get('[data-testid="booking-success"]').should('contain', 'Booking confirmed')
    cy.get('[data-testid="booking-id"]').should('be.visible')
  })

  it('should handle booking conflicts', () => {
    // Try to book an already booked slot
    cy.visit('/packages')
    cy.get('[data-testid="book-lesson-btn"]').click()
    
    // Select conflicting time
    cy.get('[data-testid="time-slot-10-00"]').click()
    cy.get('[data-testid="confirm-booking-btn"]').click()

    // Verify error message
    cy.get('[data-testid="booking-error"]')
      .should('contain', 'This time slot is no longer available')
  })

  it('should respect scheduling constraints', () => {
    // Try to book more than weekly limit
    cy.visit('/packages')
    
    // Book maximum allowed lessons for the week
    for (let i = 0; i < 5; i++) {
      cy.get('[data-testid="book-lesson-btn"]').click()
      cy.get(`[data-testid="time-slot-${10 + i}-00"]`).click()
      cy.get('[data-testid="confirm-booking-btn"]').click()
      cy.get('[data-testid="booking-success"]').should('be.visible')
    }

    // Try to book one more (should fail)
    cy.get('[data-testid="book-lesson-btn"]').click()
    cy.get('[data-testid="time-slot-15-00"]').click()
    cy.get('[data-testid="confirm-booking-btn"]').click()

    cy.get('[data-testid="booking-error"]')
      .should('contain', 'Weekly lesson limit exceeded')
  })
})
```

**Create `cypress/e2e/admin-panel.cy.ts`:**
```typescript
describe('Admin Panel', () => {
  beforeEach(() => {
    // Login as admin
    cy.login('admin@example.com', 'admin123')
  })

  it('should manage scheduling constraints', () => {
    // Navigate to admin panel
    cy.visit('/admin')
    cy.get('[data-testid="scheduling-constraints-tab"]').click()

    // Update weekly limits
    cy.get('[data-testid="max-lessons-per-week"]').clear().type('10')
    cy.get('[data-testid="max-hours-per-week"]').clear().type('20')

    // Update operating hours
    cy.get('[data-testid="earliest-start-time"]').clear().type('08:00')
    cy.get('[data-testid="latest-end-time"]').clear().type('18:00')

    // Save changes
    cy.get('[data-testid="save-constraints-btn"]').click()

    // Verify success message
    cy.get('[data-testid="save-success"]')
      .should('contain', 'Constraints updated successfully')
  })

  it('should view booking analytics', () => {
    cy.visit('/admin/analytics')

    // Verify analytics widgets
    cy.get('[data-testid="total-bookings"]').should('be.visible')
    cy.get('[data-testid="revenue-chart"]').should('be.visible')
    cy.get('[data-testid="instructor-performance"]').should('be.visible')

    // Filter by date range
    cy.get('[data-testid="date-range-picker"]').click()
    cy.get('[data-testid="last-30-days"]').click()

    // Verify updated data
    cy.get('[data-testid="analytics-loading"]').should('not.exist')
    cy.get('[data-testid="total-bookings"]').should('contain', 'Last 30 Days')
  })
})
```

## 📊 Test Reporting and Monitoring

### Jest Coverage Reports

**Add to `package.json`:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### Continuous Integration

**Create `.github/workflows/test.yml`:**
```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm run test:ci

    - name: Run security tests
      run: node scripts/security-test.js

    - name: Run E2E tests
      uses: cypress-io/github-action@v5
      with:
        start: npm run dev
        wait-on: 'http://localhost:3000'

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
```

### Test Metrics Dashboard

**Create `scripts/test-metrics.js`:**
```javascript
const fs = require('fs')
const path = require('path')

function generateTestReport() {
  const coverageFile = path.join(__dirname, '../coverage/coverage-summary.json')
  
  if (!fs.existsSync(coverageFile)) {
    console.error('Coverage file not found. Run tests with coverage first.')
    return
  }

  const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'))
  
  console.log('📊 Test Coverage Report')
  console.log('========================')
  
  Object.entries(coverage.total).forEach(([metric, data]) => {
    const percentage = data.pct
    const status = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌'
    console.log(`${status} ${metric}: ${percentage}%`)
  })

  // Generate HTML report
  const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Coverage Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .good { background-color: #d4edda; }
        .warning { background-color: #fff3cd; }
        .poor { background-color: #f8d7da; }
      </style>
    </head>
    <body>
      <h1>Test Coverage Report</h1>
      ${Object.entries(coverage.total).map(([metric, data]) => {
        const percentage = data.pct
        const className = percentage >= 80 ? 'good' : percentage >= 60 ? 'warning' : 'poor'
        return `<div class="metric ${className}">${metric}: ${percentage}%</div>`
      }).join('')}
    </body>
    </html>
  `

  fs.writeFileSync(path.join(__dirname, '../coverage/report.html'), htmlReport)
  console.log('\n📄 HTML report generated: coverage/report.html')
}

if (require.main === module) {
  generateTestReport()
}
```

## 🎯 Testing Checklist

### Pre-Deployment Testing

- [ ] **Unit Tests**
  - [ ] All components have tests
  - [ ] All utility functions have tests
  - [ ] Coverage > 80%
  - [ ] No failing tests

- [ ] **Integration Tests**
  - [ ] All API endpoints tested
  - [ ] Database operations tested
  - [ ] External service integrations tested
  - [ ] Error scenarios covered

- [ ] **Security Tests**
  - [ ] Authentication tests pass
  - [ ] Authorization tests pass
  - [ ] Input validation tests pass
  - [ ] Rate limiting tests pass
  - [ ] XSS prevention tests pass
  - [ ] SQL injection prevention tests pass

- [ ] **Performance Tests**
  - [ ] Load tests pass
  - [ ] API response times < 2s
  - [ ] Page load times < 3s
  - [ ] Lighthouse scores > 80

- [ ] **E2E Tests**
  - [ ] Critical user flows tested
  - [ ] Cross-browser compatibility
  - [ ] Mobile responsiveness
  - [ ] Error handling tested

### Continuous Monitoring

- [ ] **Test Automation**
  - [ ] CI/CD pipeline configured
  - [ ] Automated test runs on PR
  - [ ] Coverage reports generated
  - [ ] Test results tracked

- [ ] **Quality Gates**
  - [ ] Minimum coverage enforced
  - [ ] Security scans automated
  - [ ] Performance budgets set
  - [ ] Code quality checks enabled

---

**This comprehensive testing strategy ensures your calendar system is robust, secure, and performant. Regular testing and monitoring help maintain high quality as the system evolves.**