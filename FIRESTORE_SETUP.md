# Cloud Firestore Setup and Security

## Database Configuration

### Location
- **Region**: nam5 (US Central)
- **Project ID**: liquidash000
- **Database**: (default)

### Collections Structure
The database uses a user-scoped architecture:
```
/users/{userId}/
├── clients/
├── products/
├── orders/
├── expenses/
└── logs/
```

## Security Rules

### User Data Protection
- Users can only access their own data (`/users/{userId}`)
- Authentication is required for all operations
- User ID validation ensures data isolation

### Collection-Specific Rules
- **Clients**: Encrypted sensitive data (name, email, phone, address, notes, e-transfer)
- **Products**: Standard CRUD operations
- **Orders**: Full order management with status tracking
- **Expenses**: Financial data management
- **Logs**: Audit trail for user actions

### Anti-Abuse Measures
- Rate limiting considerations in place
- Anonymous sign-in providers blocked
- Admin-only access for global logs collection

## Indexes

Firestore automatically creates single-field indexes for:
- `clients.displayId` (ascending)
- `products.name` (ascending)
- `orders.date` (descending)
- `expenses.date` (descending)
- `logs.timestamp` (descending)

## Data Encryption

Sensitive client information is encrypted using Base64 encoding:
- Names, emails, phone numbers
- Addresses and notes
- E-transfer details

## Real-time Features

All collections support real-time listeners for:
- Live data synchronization
- Instant UI updates
- Collaborative features

## Backup and Disaster Recovery

- Automatic daily backups via Firebase
- Point-in-time recovery available
- Multi-region replication in nam5

## Usage Monitoring

Monitor database usage through:
- Firebase Console > Firestore > Usage
- Query performance metrics
- Storage and bandwidth costs

## Development Testing

Use the test functions in `src/lib/firestoreTest.ts`:
- `testFirestoreConnection()`: Basic connectivity test
- `testDatabaseStructure()`: Collection accessibility test

## Deployment

Deploy rules and indexes:
```bash
firebase deploy --only firestore
```

## Security Best Practices

1. **Data Validation**: All data is validated before storage
2. **Access Control**: Strict user-based access control
3. **Encryption**: Sensitive data encrypted at rest
4. **Audit Logging**: All user actions logged
5. **Rate Limiting**: Protection against abuse
6. **Regular Updates**: Security rules updated regularly

## Performance Optimization

- Use appropriate query limits
- Implement pagination for large datasets
- Cache frequently accessed data
- Monitor query performance in Firebase Console
