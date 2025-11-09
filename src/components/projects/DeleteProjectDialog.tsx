/**
 * DeleteProjectDialog Component
 * Confirmation dialog for deleting projects
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import { Project } from '@/types'

interface DeleteProjectDialogProps {
  project: Project
  onConfirm: () => Promise<void>
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteProjectDialog({
  project,
  onConfirm,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: DeleteProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const handleConfirm = async () => {
    if (confirmText !== project.name) {
      return
    }

    setIsDeleting(true)
    try {
      await onConfirm()
      setOpen(false)
      setConfirmText('')
    } catch (error) {
      console.error('Error deleting project:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText('')
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Project</DialogTitle>
          </div>
          <DialogDescription className="space-y-2 pt-4">
            <p>
              This action cannot be undone. This will permanently delete the project
              <span className="font-semibold"> {project.name}</span> and all of its data including:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>All tasks and their execution history</li>
              <li>All chat messages and conversations</li>
              <li>Project settings and metadata</li>
            </ul>
            <p className="pt-2">
              Your local project files will <strong>not</strong> be deleted.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="confirm">
            Type <span className="font-mono font-semibold">{project.name}</span> to confirm
          </Label>
          <Input
            id="confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={project.name}
            disabled={isDeleting}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={confirmText !== project.name || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
