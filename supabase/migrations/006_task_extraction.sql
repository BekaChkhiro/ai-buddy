-- Task Extraction and Chat-Task Linking
-- Enables AI-powered task extraction from conversations

-- =====================================================
-- EXTRACTED TASKS TABLE
-- Stores AI-extracted tasks pending user review
-- =====================================================

CREATE TABLE IF NOT EXISTS extracted_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Task details
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    complexity TEXT NOT NULL CHECK (complexity IN ('low', 'medium', 'high')),
    estimated_hours DECIMAL(10, 2),

    -- AI analysis
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    suggested_labels TEXT[] DEFAULT '{}',
    technical_requirements TEXT[] DEFAULT '{}',
    dependencies TEXT[] DEFAULT '{}',
    reasoning TEXT,

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (
        status IN ('pending_review', 'approved', 'rejected', 'converted')
    ),
    converted_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

-- Indexes for extracted_tasks
CREATE INDEX idx_extracted_tasks_conversation ON extracted_tasks(conversation_id);
CREATE INDEX idx_extracted_tasks_user ON extracted_tasks(user_id);
CREATE INDEX idx_extracted_tasks_status ON extracted_tasks(status);
CREATE INDEX idx_extracted_tasks_created ON extracted_tasks(created_at DESC);

-- RLS for extracted_tasks
ALTER TABLE extracted_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own extracted tasks"
    ON extracted_tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extracted tasks"
    ON extracted_tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extracted tasks"
    ON extracted_tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extracted tasks"
    ON extracted_tasks FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- TASK-MESSAGE LINKS TABLE
-- Links tasks to the chat messages they were extracted from
-- =====================================================

CREATE TABLE IF NOT EXISTS task_message_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Link metadata
    link_type TEXT NOT NULL DEFAULT 'extracted_from' CHECK (
        link_type IN ('extracted_from', 'referenced_in', 'completed_in')
    ),
    context TEXT, -- Optional context snippet from the message

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(task_id, message_id, link_type)
);

-- Indexes for task_message_links
CREATE INDEX idx_task_message_links_task ON task_message_links(task_id);
CREATE INDEX idx_task_message_links_message ON task_message_links(message_id);
CREATE INDEX idx_task_message_links_conversation ON task_message_links(conversation_id);

-- RLS for task_message_links
ALTER TABLE task_message_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task-message links for their tasks"
    ON task_message_links FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_message_links.task_id
            AND tasks.project_id IN (
                SELECT id FROM projects WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create task-message links for their tasks"
    ON task_message_links FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_message_links.task_id
            AND tasks.project_id IN (
                SELECT id FROM projects WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete task-message links for their tasks"
    ON task_message_links FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_message_links.task_id
            AND tasks.project_id IN (
                SELECT id FROM projects WHERE user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update extracted_tasks updated_at timestamp
CREATE OR REPLACE FUNCTION update_extracted_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_extracted_tasks_updated_at
    BEFORE UPDATE ON extracted_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_extracted_tasks_updated_at();

-- Function to automatically convert approved extracted tasks to real tasks
CREATE OR REPLACE FUNCTION convert_extracted_task_to_task(
    p_extracted_task_id UUID,
    p_project_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_extracted_task RECORD;
    v_task_id UUID;
BEGIN
    -- Fetch the extracted task
    SELECT * INTO v_extracted_task
    FROM extracted_tasks
    WHERE id = p_extracted_task_id
    AND status = 'pending_review';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Extracted task not found or already converted';
    END IF;

    -- Create the real task
    INSERT INTO tasks (
        project_id,
        title,
        description,
        status,
        priority,
        labels,
        estimated_hours,
        sort_order
    )
    VALUES (
        p_project_id,
        v_extracted_task.title,
        v_extracted_task.description,
        'pending',
        v_extracted_task.priority,
        v_extracted_task.suggested_labels,
        v_extracted_task.estimated_hours,
        (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tasks WHERE project_id = p_project_id)
    )
    RETURNING id INTO v_task_id;

    -- Update the extracted task
    UPDATE extracted_tasks
    SET
        status = 'converted',
        converted_task_id = v_task_id,
        reviewed_at = now()
    WHERE id = p_extracted_task_id;

    -- Create task-message link if conversation has messages
    INSERT INTO task_message_links (task_id, message_id, conversation_id, link_type)
    SELECT
        v_task_id,
        m.id,
        v_extracted_task.conversation_id,
        'extracted_from'
    FROM messages m
    WHERE m.conversation_id = v_extracted_task.conversation_id
    ORDER BY m.created_at DESC
    LIMIT 1
    ON CONFLICT (task_id, message_id, link_type) DO NOTHING;

    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS
-- =====================================================

-- View for extracted tasks with conversion status
CREATE OR REPLACE VIEW extracted_tasks_with_status AS
SELECT
    et.*,
    c.title as conversation_title,
    c.mode as conversation_mode,
    t.title as converted_task_title,
    t.status as converted_task_status
FROM extracted_tasks et
LEFT JOIN conversations c ON et.conversation_id = c.id
LEFT JOIN tasks t ON et.converted_task_id = t.id;

-- View for tasks with their chat context
CREATE OR REPLACE VIEW tasks_with_chat_context AS
SELECT
    t.*,
    json_agg(
        json_build_object(
            'message_id', m.id,
            'content', m.content,
            'role', m.role,
            'created_at', m.created_at,
            'link_type', tml.link_type
        ) ORDER BY m.created_at DESC
    ) FILTER (WHERE m.id IS NOT NULL) as chat_messages
FROM tasks t
LEFT JOIN task_message_links tml ON t.id = tml.task_id
LEFT JOIN messages m ON tml.message_id = m.id
GROUP BY t.id;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE extracted_tasks IS 'AI-extracted tasks from conversations pending user review';
COMMENT ON TABLE task_message_links IS 'Links between tasks and chat messages for context tracking';
COMMENT ON FUNCTION convert_extracted_task_to_task IS 'Converts an approved extracted task into a real task';
