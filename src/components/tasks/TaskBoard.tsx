"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task, TaskStatus } from "@/types";
import { TaskCard } from "./TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskView?: (task: Task) => void;
}

const COLUMN_STATUS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "pending", label: "To Do", color: "bg-gray-500" },
  { status: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { status: "implementing", label: "Implementing", color: "bg-purple-500" },
  { status: "completed", label: "Completed", color: "bg-green-500" },
  { status: "blocked", label: "Blocked", color: "bg-orange-500" },
  { status: "failed", label: "Failed", color: "bg-red-500" },
];

export function TaskBoard({
  tasks,
  onTaskUpdate,
  onTaskEdit,
  onTaskDelete,
  onTaskView,
}: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      implementing: [],
      completed: [],
      failed: [],
      blocked: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    // Sort by sort_order and then by created date
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overStatus = over.data.current?.status as TaskStatus | undefined;

    if (activeTask && overStatus && activeTask.status !== overStatus) {
      // Optimistically update the UI
      // The actual update will happen in handleDragEnd
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dropped on a column
    const overStatus = over.data.current?.status as TaskStatus | undefined;
    const overTask = tasks.find((t) => t.id === over.id);

    if (overStatus && activeTask.status !== overStatus) {
      // Moved to a different column
      await onTaskUpdate(activeTask.id, { status: overStatus });
    } else if (overTask && overTask.status === activeTask.status) {
      // Reordered within the same column
      const tasksInColumn = tasksByStatus[activeTask.status];
      const oldIndex = tasksInColumn.findIndex((t) => t.id === activeTask.id);
      const newIndex = tasksInColumn.findIndex((t) => t.id === overTask.id);

      if (oldIndex !== newIndex) {
        // Update sort orders
        const newSortOrder = overTask.sortOrder;
        await onTaskUpdate(activeTask.id, { sortOrder: newSortOrder });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMN_STATUS.map((column) => (
          <div key={column.status} className="flex-shrink-0 w-80">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.color}`} />
                    <span>{column.label}</span>
                  </div>
                  <Badge variant="secondary">
                    {tasksByStatus[column.status].length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <SortableContext
                    items={tasksByStatus[column.status].map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                    id={column.status}
                  >
                    <div
                      className="space-y-3 min-h-[100px] pb-2"
                      data-status={column.status}
                    >
                      {tasksByStatus[column.status].map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={onTaskEdit}
                          onDelete={onTaskDelete}
                          onView={onTaskView}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
