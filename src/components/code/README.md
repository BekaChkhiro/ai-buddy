# Code Preview and Approval System

A comprehensive code preview and approval system for AI Buddy with Monaco Editor integration, diff viewing, and workflow management.

## Features

### 1. **DiffViewer**
Side-by-side diff view with syntax highlighting and advanced features:
- Monaco Diff Editor integration
- Syntax highlighting for all languages
- Line-by-line comparison
- Search in diff
- Inline comments
- Fullscreen mode
- Collapsible sections

### 2. **CodeEditor**
Full-featured code editor with Monaco Editor:
- Syntax highlighting
- Auto-completion
- Error detection
- TypeScript/JavaScript intellisense
- Format on save
- Multiple language support
- Keyboard shortcuts (Cmd/Ctrl+S to save)

### 3. **FileChanges**
List of changed files with filtering and sorting:
- Filter by approval status
- Sort by name, type, status, or date
- Search functionality
- Quick approve/reject actions
- Visual status indicators
- Comment counts

### 4. **ChangeStats**
Statistics and analytics about code changes:
- Total files changed
- Lines added/removed
- Net change calculation
- Visual progress bars
- Breakdown by change type

### 5. **ReviewPanel**
Main UI for code review workflow:
- Integrated diff and edit views
- File navigation
- Bulk approve/reject
- Statistics overview
- Keyboard shortcuts support

### 6. **ChangeRequest**
UI for requesting modifications:
- Template suggestions
- Inline or modal modes
- Comment system
- File preview

### 7. **ApprovalHistory**
Track approval history:
- Timeline view
- Filter by action type
- Summary statistics
- Action details

### 8. **Keyboard Shortcuts**
Fast navigation and actions:
- `a` - Approve current file
- `r` - Reject current file
- `j` - Next file
- `k` - Previous file
- `v` - Toggle diff view
- `/` - Search
- `c` - Add comment
- `Cmd/Ctrl+S` - Save edit

## Usage

### Basic Example

```tsx
import {
  ReviewPanel,
  FileChange,
  useKeyboardShortcuts,
} from "@/components/code";

function MyReviewPage() {
  const [fileChanges, setFileChanges] = useState<FileChange[]>([
    {
      path: "src/components/Example.tsx",
      changeType: "modify",
      originalContent: "// old code",
      newContent: "// new code",
      timestamp: new Date().toISOString(),
      language: "typescript",
      approvalStatus: "pending",
    },
  ]);

  const handleApproveFile = (filePath: string) => {
    setFileChanges((prev) =>
      prev.map((f) =>
        f.path === filePath ? { ...f, approvalStatus: "approved" } : f
      )
    );
  };

  const handleRejectFile = (filePath: string) => {
    setFileChanges((prev) =>
      prev.map((f) =>
        f.path === filePath ? { ...f, approvalStatus: "rejected" } : f
      )
    );
  };

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    onApproveFile: () => handleApproveFile(currentFile),
    onRejectFile: () => handleRejectFile(currentFile),
    // ... other handlers
  });

  return (
    <ReviewPanel
      fileChanges={fileChanges}
      onApproveFile={handleApproveFile}
      onRejectFile={handleRejectFile}
      onApproveAll={handleApproveAll}
      onRejectAll={handleRejectAll}
    />
  );
}
```

### Using Individual Components

#### DiffViewer

```tsx
import { DiffViewer } from "@/components/code";

<DiffViewer
  originalContent={originalCode}
  modifiedContent={modifiedCode}
  language="typescript"
  fileName="Example.tsx"
  viewMode="split"
  showLineNumbers={true}
  highlightChanges={true}
/>
```

#### CodeEditor

```tsx
import { CodeEditor } from "@/components/code";

<CodeEditor
  value={code}
  language="typescript"
  onChange={setCode}
  onSave={handleSave}
  enableAutoComplete={true}
  enableErrorDetection={true}
  formatOnSave={true}
/>
```

#### FileChanges

```tsx
import { FileChanges } from "@/components/code";

<FileChanges
  changes={fileChanges}
  selectedFile={selectedFile}
  onFileSelect={setSelectedFile}
  onApprove={handleApprove}
  onReject={handleReject}
  filterByStatus="pending"
  sortBy="name"
/>
```

#### ChangeStats

```tsx
import { ChangeStats, calculateChangeStats } from "@/components/code";

const stats = calculateChangeStats(fileChanges);

<ChangeStats stats={stats} showDetails={true} />
```

### Keyboard Shortcuts

```tsx
import {
  useKeyboardShortcuts,
  KeyboardShortcutsHelp,
} from "@/components/code";

function MyComponent() {
  useKeyboardShortcuts({
    onApproveFile: handleApprove,
    onRejectFile: handleReject,
    onNextFile: goToNextFile,
    onPrevFile: goToPrevFile,
  });

  return (
    <div>
      <KeyboardShortcutsHelp />
      {/* Your content */}
    </div>
  );
}
```

## Types

All TypeScript types are exported from the package:

```tsx
import type {
  FileChange,
  ChangeStats,
  ApprovalStatus,
  DiffViewMode,
  Comment,
  ApprovalAction,
  ApprovalHistory,
} from "@/components/code";
```

## Utilities

Helper functions for working with file changes:

```tsx
import {
  calculateChangeStats,
  detectLanguage,
  areAllFilesApproved,
  hasRejectedFiles,
  filterChangesByStatus,
  sortChanges,
} from "@/components/code/utils";

// Calculate statistics
const stats = calculateChangeStats(fileChanges);

// Detect language from file path
const language = detectLanguage("src/example.tsx"); // "typescript"

// Check approval status
const allApproved = areAllFilesApproved(fileChanges);
const hasRejections = hasRejectedFiles(fileChanges);

// Filter and sort
const pendingChanges = filterChangesByStatus(fileChanges, "pending");
const sortedChanges = sortChanges(fileChanges, "name");
```

## Integration with Implementation System

The code preview system integrates seamlessly with the implementation system:

```tsx
import { ReviewPanel } from "@/components/code";
import { ImplementationModal } from "@/components/implementation";

function TaskImplementation({ taskId }) {
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);

  // Fetch implementation results and convert to FileChange format
  useEffect(() => {
    fetchImplementationResults(taskId).then((results) => {
      const changes = results.flatMap(convertToFileChanges);
      setFileChanges(changes);
    });
  }, [taskId]);

  return (
    <ReviewPanel
      fileChanges={fileChanges}
      onApproveAll={handleApproveAndApply}
      onEditFile={handleEditAndRegenerate}
      onRegenerate={handleRegenerateFile}
    />
  );
}
```

## Styling

All components use Tailwind CSS and are compatible with the application's theme system (light/dark mode).

## Dependencies

- `@monaco-editor/react` - Monaco Editor React wrapper
- `monaco-editor` - Monaco Editor core
- `diff` - Diff algorithm library
- `diff2html` - Diff to HTML converter

## Best Practices

1. **Always provide language hints** for better syntax highlighting
2. **Use keyboard shortcuts** for faster review workflow
3. **Enable error detection** in CodeEditor for code quality
4. **Provide meaningful comments** when requesting changes
5. **Review statistics** before approving all changes
6. **Test edited code** before saving changes

## Example Workflows

### Workflow 1: Review and Approve All Changes

1. Open ReviewPanel with file changes
2. Navigate through files using `j`/`k`
3. View diff for each file
4. Press `a` to approve good changes
5. Press `r` to reject problematic changes
6. Click "Approve All" when satisfied

### Workflow 2: Edit and Regenerate

1. Select file in ReviewPanel
2. Click "Edit" tab
3. Make changes in CodeEditor
4. Press `Cmd/Ctrl+S` to save
5. Or click "Regenerate" to ask AI to redo

### Workflow 3: Request Changes

1. Select file with issues
2. Click "Request Changes"
3. Enter specific feedback
4. Or select a template
5. Submit for regeneration

## Troubleshooting

### Monaco Editor not loading
- Ensure `@monaco-editor/react` is properly installed
- Check that webpack/next.js is configured to load Monaco assets

### Keyboard shortcuts not working
- Make sure focus is not in an input field
- Check that the component using `useKeyboardShortcuts` is mounted
- Verify keyboard shortcut configuration

### Diff view showing incorrectly
- Verify originalContent and modifiedContent are valid strings
- Check that the language prop matches the file type
- Ensure content encoding is UTF-8

## License

Part of the AI Buddy project.
