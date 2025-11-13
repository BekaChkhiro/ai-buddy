"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GitBranch,
  Plus,
  Check,
  RefreshCw,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GitBranch as GitBranchType } from "@/lib/git/types";

interface BranchSelectorProps {
  projectPath: string;
  currentBranch?: string;
  onBranchChange?: (branch: string) => void;
}

export function BranchSelector({
  projectPath,
  currentBranch: initialBranch,
  onBranchChange,
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<GitBranchType[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(
    initialBranch || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        projectPath,
        includeRemote: "false",
      });

      const response = await fetch(`/api/git/branch?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch branches");
      }

      setBranches(data.branches);

      const current = data.branches.find((b: GitBranchType) => b.current);
      if (current) {
        setCurrentBranch(current.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [projectPath]);

  const handleSwitchBranch = async (branchName: string) => {
    try {
      const response = await fetch("/api/git/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectPath,
          action: "switch",
          branchName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to switch branch");
      }

      setCurrentBranch(branchName);
      onBranchChange?.(branchName);

      toast({
        title: "Branch switched",
        description: `Switched to branch: ${branchName}`,
      });

      fetchBranches();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to switch branch",
        variant: "destructive",
      });
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      toast({
        title: "Error",
        description: "Branch name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/git/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectPath,
          action: "create",
          branchName: newBranchName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create branch");
      }

      toast({
        title: "Branch created",
        description: `Created and switched to branch: ${newBranchName}`,
      });

      setShowCreateDialog(false);
      setNewBranchName("");
      setCurrentBranch(newBranchName.trim());
      onBranchChange?.(newBranchName.trim());
      fetchBranches();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create branch",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (branchName === currentBranch) {
      toast({
        title: "Error",
        description: "Cannot delete the current branch",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/git/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectPath,
          action: "delete",
          branchName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete branch");
      }

      toast({
        title: "Branch deleted",
        description: `Deleted branch: ${branchName}`,
      });

      fetchBranches();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete branch",
        variant: "destructive",
      });
    }
  };

  const localBranches = branches.filter((b) => !b.remote);
  const remoteBranches = branches.filter((b) => b.remote);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={currentBranch || undefined} onValueChange={handleSwitchBranch}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <SelectValue placeholder="Select branch" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[300px]">
              {localBranches.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Local Branches
                  </div>
                  {localBranches.map((branch) => (
                    <div key={branch.name} className="relative">
                      <SelectItem value={branch.name}>
                        <div className="flex items-center gap-2 w-full">
                          <span>{branch.name}</span>
                          {branch.current && (
                            <Check className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      </SelectItem>
                      {!branch.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBranch(branch.name);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </>
              )}

              {remoteBranches.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                    Remote Branches
                  </div>
                  {remoteBranches.map((branch) => (
                    <SelectItem key={branch.name} value={branch.name}>
                      <Badge variant="outline" className="text-xs">
                        {branch.name}
                      </Badge>
                    </SelectItem>
                  ))}
                </>
              )}
            </ScrollArea>
          </SelectContent>
        </Select>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Branch</DialogTitle>
              <DialogDescription>
                Create a new branch from the current branch
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="branchName">Branch Name</Label>
                <Input
                  id="branchName"
                  placeholder="feature/new-feature"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateBranch();
                    }
                  }}
                />
              </div>

              {currentBranch && (
                <div className="text-sm text-muted-foreground">
                  Will branch from: <span className="font-medium">{currentBranch}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateBranch} disabled={creating}>
                {creating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchBranches}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
