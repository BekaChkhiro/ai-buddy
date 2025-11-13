# AI-Powered Task Extraction from Chat

This feature enables automatic extraction of actionable tasks from chat conversations using Claude AI. It analyzes conversation context, identifies tasks, estimates complexity, and helps organize project work.

## Features

### 1. **Intelligent Task Detection**
- Automatically detects task-like content in conversations
- Identifies action items, features, bugs, and improvements
- Suggests task extraction when appropriate

### 2. **Comprehensive Task Analysis**
Each extracted task includes:
- **Title**: Clear, action-oriented task name
- **Description**: Detailed requirements and context
- **Priority**: Low, Medium, High, or Urgent
- **Complexity**: Simple, Moderate, or Complex
- **Time Estimates**: Realistic hour estimates
- **Confidence Score**: AI's confidence in the extraction (0-100%)
- **Technical Requirements**: Technologies and skills needed
- **Dependencies**: Tasks that must be completed first
- **Suggested Labels**: Relevant tags for categorization

### 3. **Smart Dependency Detection**
- Identifies relationships between tasks
- Suggests optimal task ordering
- Detects blocking dependencies
- Provides topological sorting for execution order

### 4. **Interactive Review Process**
1. **Task Suggestions**: AI presents extracted tasks with confidence scores
2. **Review & Edit**: Modify tasks before creation
3. **Bulk Creation**: Create multiple tasks at once with progress tracking
4. **Chat Linking**: Tasks are automatically linked to source messages

## Usage

### Manual Task Extraction

1. Navigate to any conversation with task-like content
2. Click the **"Extract Tasks"** button in the chat header
3. Review the AI-extracted tasks
4. Edit, approve, or reject individual tasks
5. Create approved tasks in bulk

### Automatic Detection

The system automatically detects when conversations contain actionable items and suggests extraction:
- Monitors conversation for task indicators
- Highlights extraction opportunity with visual cue
- Waits for user confirmation before processing

### Extraction Options

Configure extraction behavior:

```typescript
{
  maxTasks: 10,              // Maximum tasks to extract
  minConfidence: 60,         // Minimum confidence score (0-100)
  focusArea: "all",          // Filter by type: "features", "bugs", "refactoring", "documentation", or "all"
  detectDependencies: true,  // Include dependency analysis
  includeTimeEstimates: true // Include time estimates
}
```

## API Endpoints

### Extract Tasks
```http
POST /api/tasks/extract
Content-Type: application/json

{
  "conversationId": "uuid",
  "options": {
    "maxTasks": 10,
    "minConfidence": 60
  }
}
```

### Get Previous Extractions
```http
GET /api/tasks/extract?conversationId=uuid
```

### Create Task Links
```http
POST /api/tasks/links

{
  "taskId": "uuid",
  "conversationId": "uuid",
  "linkType": "extracted_from"
}
```

## Components

### TaskSuggestions
Displays AI-extracted tasks with:
- Expandable task cards
- Confidence indicators
- Complexity badges
- Selection controls
- Summary statistics

### TaskReview
Interactive review dialog featuring:
- Task-by-task review
- Inline editing
- Approve/reject toggles
- Label management
- Navigation controls

### BulkTaskCreate
Bulk creation workflow with:
- Progress tracking
- Individual task status
- Error handling
- Success/failure summary

## Database Schema

### extracted_tasks
Stores AI-extracted tasks pending review:
```sql
- id: UUID (primary key)
- conversation_id: UUID (references conversations)
- user_id: UUID (references auth.users)
- title: TEXT
- description: TEXT
- priority: TEXT (low, medium, high, urgent)
- complexity: TEXT (low, medium, high)
- estimated_hours: DECIMAL
- confidence: INTEGER (0-100)
- suggested_labels: TEXT[]
- technical_requirements: TEXT[]
- dependencies: TEXT[]
- reasoning: TEXT
- status: TEXT (pending_review, approved, rejected, converted)
- converted_task_id: UUID (references tasks)
```

### task_message_links
Links tasks to chat messages:
```sql
- id: UUID (primary key)
- task_id: UUID (references tasks)
- message_id: UUID (references messages)
- conversation_id: UUID (references conversations)
- link_type: TEXT (extracted_from, referenced_in, completed_in)
- context: TEXT
```

## Advanced Features

### Task Breakdown
Break complex tasks into smaller subtasks:

```typescript
const subtasks = await breakDownComplexTask(task);
```

### Dependency Analysis
Analyze and sort tasks by dependencies:

```typescript
const dependencyMap = analyzeTaskDependencies(tasks);
const sortedTasks = sortTasksByDependencies(tasks);
```

### Context Detection
Check if content contains tasks:

```typescript
const hasTaskContent = detectTaskContent(message);
const shouldExtract = shouldSuggestExtraction(messages);
```

## Best Practices

### For Better Extraction Results

1. **Be Specific**: Clearly describe what needs to be done
2. **Include Context**: Mention technologies, requirements, constraints
3. **Separate Concerns**: Discuss different tasks in distinct messages
4. **Use Action Verbs**: Start with "implement", "create", "fix", etc.
5. **Mention Priorities**: Indicate urgency or importance

### Example Conversations

**Good for extraction:**
```
User: We need to implement user authentication with JWT tokens.
      It should include login, logout, and session management.
      Use bcrypt for password hashing and add rate limiting.