-- =====================================================
-- Enhanced Task Management Migration
-- Add fields for comprehensive task management
-- =====================================================

-- Add new fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update status enum to include 'implementing'
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('pending', 'in_progress', 'implementing', 'completed', 'failed', 'blocked'));

-- =====================================================
-- TASK_DEPENDENCIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'relates_to')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_dependency UNIQUE (task_id, depends_on_task_id),
    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);

-- Create indexes for task_dependencies
CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- Enable RLS on task_dependencies
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_dependencies (access through project ownership)
CREATE POLICY "Users can view dependencies from their tasks"
    ON task_dependencies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            JOIN projects ON projects.id = tasks.project_id
            WHERE tasks.id = task_dependencies.task_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert dependencies to their tasks"
    ON task_dependencies FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks
            JOIN projects ON projects.id = tasks.project_id
            WHERE tasks.id = task_dependencies.task_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete dependencies from their tasks"
    ON task_dependencies FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            JOIN projects ON projects.id = tasks.project_id
            WHERE tasks.id = task_dependencies.task_id
            AND projects.user_id = auth.uid()
        )
    );

-- =====================================================
-- TASK_COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for task_comments
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at DESC);

-- Enable RLS on task_comments
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments from their tasks"
    ON task_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            JOIN projects ON projects.id = tasks.project_id
            WHERE tasks.id = task_comments.task_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert comments to their tasks"
    ON task_comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM tasks
            JOIN projects ON projects.id = tasks.project_id
            WHERE tasks.id = task_comments.task_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own comments"
    ON task_comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON task_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for task_comments updated_at
CREATE TRIGGER update_task_comments_updated_at
    BEFORE UPDATE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TASK_HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for task_history
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_user_id ON task_history(user_id);
CREATE INDEX idx_task_history_created_at ON task_history(created_at DESC);

-- Enable RLS on task_history
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_history
CREATE POLICY "Users can view history from their tasks"
    ON task_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            JOIN projects ON projects.id = tasks.project_id
            WHERE tasks.id = task_history.task_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert history to their tasks"
    ON task_history FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM tasks
            JOIN projects ON projects.id = tasks.project_id
            WHERE tasks.id = task_history.task_id
            AND projects.user_id = auth.uid()
        )
    );

-- =====================================================
-- INDEXES FOR ENHANCED FEATURES
-- =====================================================

CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_tasks_labels ON tasks USING GIN(labels);
CREATE INDEX idx_tasks_sort_order ON tasks(sort_order);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE task_dependencies IS 'Dependencies between tasks for workflow management';
COMMENT ON TABLE task_comments IS 'Comments on tasks for collaboration';
COMMENT ON TABLE task_history IS 'Change history for tasks for audit trail';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
