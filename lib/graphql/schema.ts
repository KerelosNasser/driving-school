export const typeDefs = `
  # Scalar types
  scalar DateTime
  scalar JSON
  scalar UUID

  # Enums
  enum ExperienceLevel {
    BEGINNER
    INTERMEDIATE
    ADVANCED
  }

  enum ReferralStatus {
    PENDING
    COMPLETED
    EXPIRED
  }

  enum RewardType {
    DISCOUNT
    FREE_HOURS
    CASH_BACK
  }

  enum NotificationStatus {
    UNREAD
    READ
    ARCHIVED
  }

  enum BookingStatus {
    PENDING
    CONFIRMED
    COMPLETED
    CANCELLED
  }

  enum TransactionType {
    PURCHASE
    CONSUMPTION
    REFUND
    BONUS
  }

  # Core Types
  type User {
    id: UUID!
    clerkId: String
    fullName: String
    email: String
    phone: String
    address: String
    suburb: String
    experienceLevel: ExperienceLevel
    goals: String
    emergencyContact: String
    emergencyPhone: String
    invitationCode: String
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    quota: UserQuota
    referrals: [Referral!]!
    rewards: [ReferralReward!]!
    notifications: [UserNotification!]!
    bookings: [Booking!]!
    transactions: [QuotaTransaction!]!
    reviews: [Review!]!
  }

  type UserQuota {
    id: UUID!
    userId: UUID!
    totalHours: Float!
    usedHours: Float!
    remainingHours: Float!
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    user: User!
    transactions: [QuotaTransaction!]!
  }

  type Package {
    id: UUID!
    name: String!
    description: String
    price: Float!
    hours: Float!
    features: [String!]!
    isActive: Boolean!
    sortOrder: Int
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Referral {
    id: UUID!
    referrerId: UUID!
    referredId: UUID!
    invitationCode: String!
    status: ReferralStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    referrer: User!
    referred: User!
    rewards: [ReferralReward!]!
  }

  type ReferralReward {
    id: UUID!
    userId: UUID!
    referralId: UUID
    rewardType: RewardType!
    rewardValue: Float
    isUsed: Boolean!
    expiresAt: DateTime
    createdAt: DateTime!
    usedAt: DateTime
    
    # Relations
    user: User!
    referral: Referral
  }

  type Review {
    id: UUID!
    name: String!
    email: String
    rating: Int!
    comment: String!
    approved: Boolean!
    createdAt: DateTime!
    
    # Relations
    user: User
  }

  type Booking {
    id: UUID!
    userId: UUID!
    title: String!
    description: String
    startTime: DateTime!
    endTime: DateTime!
    location: String!
    lessonHours: Float!
    status: BookingStatus!
    googleEventId: String
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    user: User!
  }

  type QuotaTransaction {
    id: UUID!
    userId: UUID!
    type: TransactionType!
    hours: Float!
    description: String
    packageId: UUID
    createdAt: DateTime!
    
    # Relations
    user: User!
    package: Package
  }

  type UserNotification {
    id: UUID!
    userId: UUID!
    title: String!
    message: String!
    status: NotificationStatus!
    metadata: JSON
    createdAt: DateTime!
    readAt: DateTime
    
    # Relations
    user: User!
  }

  type InvitationCode {
    id: UUID!
    userId: UUID
    code: String!
    isActive: Boolean!
    currentUses: Int!
    maxUses: Int
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    user: User
    referrals: [Referral!]!
  }

  # Input Types
  input CreateUserInput {
    fullName: String!
    phone: String
    address: String
    suburb: String
    experienceLevel: ExperienceLevel
    goals: String
    emergencyContact: String
    emergencyPhone: String
    invitationCode: String
  }

  input UpdateUserInput {
    fullName: String
    phone: String
    address: String
    suburb: String
    experienceLevel: ExperienceLevel
    goals: String
    emergencyContact: String
    emergencyPhone: String
  }

  input CreatePackageInput {
    name: String!
    description: String
    price: Float!
    hours: Float!
    features: [String!]!
    isActive: Boolean = true
    sortOrder: Int
  }

  input UpdatePackageInput {
    name: String
    description: String
    price: Float
    hours: Float
    features: [String!]
    isActive: Boolean
    sortOrder: Int
  }

  input CreateBookingInput {
    title: String!
    description: String
    startTime: DateTime!
    endTime: DateTime!
    location: String!
    lessonHours: Float!
  }

  input UpdateBookingInput {
    title: String
    description: String
    startTime: DateTime
    endTime: DateTime
    location: String
    lessonHours: Float
    status: BookingStatus
  }

  input CreateReviewInput {
    name: String!
    email: String
    rating: Int!
    comment: String!
  }

  input QuotaTransactionInput {
    type: TransactionType!
    hours: Float!
    description: String
    packageId: UUID
  }

  input PaginationInput {
    limit: Int = 20
    offset: Int = 0
  }

  input FilterInput {
    search: String
    dateFrom: DateTime
    dateTo: DateTime
    status: String
    isActive: Boolean
  }

  # Response Types
  type PaginatedUsers {
    users: [User!]!
    total: Int!
    hasMore: Boolean!
  }

  type PaginatedPackages {
    packages: [Package!]!
    total: Int!
    hasMore: Boolean!
  }

  type PaginatedReviews {
    reviews: [Review!]!
    total: Int!
    hasMore: Boolean!
  }

  type PaginatedBookings {
    bookings: [Booking!]!
    total: Int!
    hasMore: Boolean!
  }

  type PaginatedTransactions {
    transactions: [QuotaTransaction!]!
    total: Int!
    hasMore: Boolean!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type QuotaStats {
    totalHours: Float!
    usedHours: Float!
    remainingHours: Float!
    utilizationRate: Float!
  }

  type ReferralStats {
    totalReferrals: Int!
    completedReferrals: Int!
    pendingReferrals: Int!
    totalRewards: Float!
    usedRewards: Float!
    availableRewards: Float!
  }

  type SystemStats {
    totalUsers: Int!
    activeUsers: Int!
    totalBookings: Int!
    totalReviews: Int!
    averageRating: Float!
    totalRevenue: Float!
  }

  # Queries
  type Query {
    # User queries
    me: User
    user(id: UUID!): User
    users(pagination: PaginationInput, filter: FilterInput): PaginatedUsers!
    
    # Package queries
    package(id: UUID!): Package
    packages(pagination: PaginationInput, filter: FilterInput): PaginatedPackages!
    activePackages: [Package!]!
    
    # Review queries
    review(id: UUID!): Review
    reviews(pagination: PaginationInput, filter: FilterInput): PaginatedReviews!
    approvedReviews(limit: Int): [Review!]!
    
    # Booking queries
    booking(id: UUID!): Booking
    bookings(pagination: PaginationInput, filter: FilterInput): PaginatedBookings!
    myBookings(pagination: PaginationInput): PaginatedBookings!
    
    # Quota queries
    myQuota: UserQuota
    quotaTransactions(pagination: PaginationInput): PaginatedTransactions!
    quotaStats: QuotaStats!
    
    # Referral queries
    myReferrals: [Referral!]!
    myRewards: [ReferralReward!]!
    referralStats: ReferralStats!
    
    # Notification queries
    myNotifications(pagination: PaginationInput): [UserNotification!]!
    unreadNotificationCount: Int!
    
    # Admin queries
    systemStats: SystemStats!
    allTransactions(pagination: PaginationInput, filter: FilterInput): PaginatedTransactions!
  }

  # Mutations
  type Mutation {
    # User mutations
    createUser(input: CreateUserInput!): User!
    updateUser(input: UpdateUserInput!): User!
    deleteUser(id: UUID!): Boolean!
    
    # Package mutations
    createPackage(input: CreatePackageInput!): Package!
    updatePackage(id: UUID!, input: UpdatePackageInput!): Package!
    deletePackage(id: UUID!): Boolean!
    
    # Booking mutations
    createBooking(input: CreateBookingInput!): Booking!
    updateBooking(id: UUID!, input: UpdateBookingInput!): Booking!
    cancelBooking(id: UUID!): Booking!
    
    # Review mutations
    createReview(input: CreateReviewInput!): Review!
    approveReview(id: UUID!): Review!
    deleteReview(id: UUID!): Boolean!
    
    # Quota mutations
    purchaseQuota(packageId: UUID!): QuotaTransaction!
    consumeQuota(hours: Float!, description: String): QuotaTransaction!
    refundQuota(transactionId: UUID!): QuotaTransaction!
    
    # Referral mutations
    generateInvitationCode(maxUses: Int): InvitationCode!
    useInvitationCode(code: String!): Referral!
    
    # Reward mutations
    applyReward(rewardId: UUID!): Boolean!
    
    # Notification mutations
    markNotificationRead(id: UUID!): UserNotification!
    markAllNotificationsRead: Boolean!
    deleteNotification(id: UUID!): Boolean!
  }

  # Subscriptions
  type Subscription {
    # Real-time notifications
    notificationAdded(userId: UUID!): UserNotification!
    
    # Booking updates
    bookingStatusChanged(userId: UUID!): Booking!
    
    # Quota updates
    quotaUpdated(userId: UUID!): UserQuota!
    
    # System updates
    systemStatsUpdated: SystemStats!
  }
`;