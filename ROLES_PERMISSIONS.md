# Corporate Role & Permission System

## Role Hierarchy (Permission Levels)

| Role | Level | Can Create Action Items | Description |
|------|-------|------------------------|-------------|
| Intern | 0 | ❌ No | New team member, limited responsibilities |
| Associate | 1 | ❌ No | Individual contributor, default for new users |
| Team Lead | 2 | ✅ Yes | Leads team initiatives, can assign tasks |
| Manager | 3 | ✅ Yes | Manages teams, allocates work |
| Executive | 4 | ✅ Yes | Senior leadership, strategic decisions |
| Admin | 5 | ✅ Yes | System administrator, full access |

**Minimum Role for Action Item Creation:** Team Lead (Level 2) or higher

## Where Permissions Are Enforced

### 1. Action Item Creation (POST /actionItems)
- **Endpoint:** `POST /api/v1/action-items`
- **Authentication:** Required (authMiddleware)
- **Permission Check:** canCreateActionItems middleware
- **Behavior:** 
  - Only users with role >= team_lead can create action items
  - Returns 403 error for users with insufficient permissions
  - Returns 401 error for unauthenticated users

### 2. Meeting Roles

**Participant Roles** (in meetings):
- `attendee` - Default role, participant in discussion
- `presenter` - Leads a segment of the meeting
- `organizer` - Created/organizes the meeting

**Team Member Roles**:
- `member` - Regular team member
- `lead` - Team lead
- `manager` - Team manager
- `admin` - Full team access

## Implementation Details

### Files Modified

1. **backend/src/types/index.ts**
   - Updated UserRole type: `'intern' | 'associate' | 'team_lead' | 'manager' | 'executive' | 'admin'`
   - Added TeamMemberRole type: `'member' | 'lead' | 'manager' | 'admin'`
   - Added ParticipantRole type: `'attendee' | 'presenter' | 'organizer'`
   - Added RolePermissionLevel mapping object
   - Added MinimumRoleForActionItem constant (= 2)

2. **backend/src/middleware/permissions.ts** (NEW)
   - `canCreateActionItems()` - Checks if user has sufficient role for task creation
   - `isTeamAdmin()` - Checks if user is admin of a team
   - `isMeetingOrganizer()` - Checks if user created/organizes the meeting

3. **backend/src/routes/actionItems.ts**
   - Changed POST / from `optionalAuth` to `authMiddleware, canCreateActionItems`
   - Now requires authentication AND proper role

4. **backend/src/db/setup.ts**
   - Updated users table default role: 'associate' (was 'member')
   - Added role comments to schema for documentation
   - Updated team_members and participants with role comments

## How to Use

### Create a User (Default Role: Associate)
```typescript
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
// User is created with role = 'associate' (can't create action items)
```

### Promote User to Team Lead (Admin only)
```typescript
PUT /api/v1/users/user-id
{
  "role": "team_lead"  // Now can create action items
}
```

### Try to Create Action Item (As Associate - Should Fail)
```typescript
POST /api/v1/action-items
// Returns: 403 { error: "Only team_lead, manager, executive or higher can create action items" }
```

### Create Action Item (As Team Lead - Should Work)
```typescript
POST /api/v1/action-items
{
  "meeting_id": "...",
  "title": "Complete project",
  "assignee_id": "...",
  ...
}
// Returns: 201 { created action item }
```

## Error Responses

**Insufficient Role:**
```json
{
  "error": "Only team_lead, manager, executive or higher can create action items"
}
```

**Not Authenticated:**
```json
{
  "error": "Authentication required to create action items"
}
```

**User Not Found:**
```json
{
  "error": "User not found"
}
```
