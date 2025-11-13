"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  GitMerge,
  Check,
  X,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GitConflict } from "@/lib/git/types";

interface ConflictResolverProps {
  projectPath: string;
  conflicts: string[];
  onResolved?: () => void;
}

export function ConflictResolver({
  projectPath,
  conflicts,
  onResolved,
}: ConflictResolverProps) {
  const [selectedConflict, setSelectedConflict] = useState<string | null>(
    conflicts[0] || null
  );
  const [resolving, setResolving] = useState(false);
  const { toast } = useToast();

  const handleResolveConflict = async (
    filePath: string,
    resolution: "ours" | "theirs" | "both"
  ) => {
    setResolving(true);

    try {
      const response = await fetch("/api/git/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectPath,
          action: "resolve-conflict",
          filePath,
          resolution,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resolve conflict");
      }

      toast({
        title: "Conflict resolved",
        description: `Resolved conflict in ${filePath}`,
      });

      onResolved?.();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to resolve conflict",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  const handleStageResolved = async (filePath: string) => {
    setResolving(true);

    try {
      const response = await fetch("/api/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectPath,
          action: "stage",
          files: [filePath],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to stage file");
      }

      toast({
        title: "File staged",
        description: `Staged ${filePath} as resolved`,
      });

      onResolved?.();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to stage file",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  if (conflicts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Merge Conflicts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="text-muted-foreground">No merge conflicts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Merge Conflicts
            <Badge variant="destructive">{conflicts.length}</Badge>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conflict Files List */}
          <div className="md:col-span-1">
            <h4 className="text-sm font-medium mb-2">Conflicted Files</h4>
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {conflicts.map((file) => (
                  <Button
                    key={file}
                    variant={selectedConflict === file ? "secondary" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => setSelectedConflict(file)}
                  >
                    <FileText className="h-4 w-4 mr-2 text-destructive" />
                    <span className="truncate" title={file}>
                      {file}
                    </span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Conflict Resolution */}
          <div className="md:col-span-2">
            {selectedConflict ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Resolving: {selectedConflict}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Choose how to resolve this conflict
                  </p>
                </div>

                <Tabs defaultValue="manual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Manual Resolution</TabsTrigger>
                    <TabsTrigger value="auto">Quick Resolution</TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="space-y-4">
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <p className="text-sm mb-4">
                        To manually resolve conflicts:
                      </p>
                      <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li>
                          Open <code className="bg-background px-1 rounded">{selectedConflict}</code> in your editor
                        </li>
                        <li>
                          Look for conflict markers ({"<<<"}, {"==="}, {">>>"})
                        </li>
                        <li>Edit the file to keep the desired changes</li>
                        <li>Remove all conflict markers</li>
                        <li>Save the file</li>
                        <li>Click &quot;Mark as Resolved&quot; below</li>
                      </ol>
                    </div>

                    <Button
                      onClick={() => handleStageResolved(selectedConflict)}
                      disabled={resolving}
                      className="w-full"
                    >
                      {resolving ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Mark as Resolved
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="auto" className="space-y-4">
                    <div className="space-y-3">
                      <Button
                        onClick={() =>
                          handleResolveConflict(selectedConflict, "ours")
                        }
                        disabled={resolving}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Check className="mr-2 h-4 w-4 text-blue-500" />
                        <div className="text-left">
                          <div className="font-medium">Accept Current Changes</div>
                          <div className="text-xs text-muted-foreground">
                            Keep changes from your current branch
                          </div>
                        </div>
                      </Button>

                      <Button
                        onClick={() =>
                          handleResolveConflict(selectedConflict, "theirs")
                        }
                        disabled={resolving}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <X className="mr-2 h-4 w-4 text-orange-500" />
                        <div className="text-left">
                          <div className="font-medium">Accept Incoming Changes</div>
                          <div className="text-xs text-muted-foreground">
                            Keep changes from the branch being merged
                          </div>
                        </div>
                      </Button>

                      <Button
                        onClick={() =>
                          handleResolveConflict(selectedConflict, "both")
                        }
                        disabled={resolving}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <GitMerge className="mr-2 h-4 w-4 text-green-500" />
                        <div className="text-left">
                          <div className="font-medium">Accept Both Changes</div>
                          <div className="text-xs text-muted-foreground">
                            Keep changes from both branches
                          </div>
                        </div>
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
                      ⚠️ Automatic resolution may not be suitable for all conflicts.
                      Review the file after resolution to ensure correctness.
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a file to resolve conflicts</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
