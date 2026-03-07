import { useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SubmitTask = () => {
  const [taskId, setTaskId] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({
        title: "Task submitted",
        description: "Your submission is being reviewed by AI. Check back soon for your score.",
      });
      setTaskId("");
      setRepoLink("");
      setExplanation("");
      setLoading(false);
    }, 800);
  };

  return (
    <PortalLayout role="intern">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Submit Task</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit your completed work for AI grading</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Task</Label>
                <Select value={taskId} onValueChange={setTaskId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Build a responsive navigation component</SelectItem>
                    <SelectItem value="2">Implement form validation with Zod</SelectItem>
                    <SelectItem value="4">Build a custom hook for API fetching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="repo">GitHub Repository Link</Label>
                <Input
                  id="repo"
                  type="url"
                  placeholder="https://github.com/username/repo"
                  value={repoLink}
                  onChange={(e) => setRepoLink(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Upload File (optional)</Label>
                <Input id="file" type="file" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="explanation">Brief Explanation</Label>
                <Textarea
                  id="explanation"
                  placeholder="Describe your approach and what you learned..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {loading ? "Submitting..." : "Submit Task"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default SubmitTask;
