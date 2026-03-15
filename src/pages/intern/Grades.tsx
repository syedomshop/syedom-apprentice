import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const InternGrades = () => {
  const { internProfile } = useAuth();

  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const profileId = internProfile?.id;

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    const fetchGrades = async () => {
      try {
        const { data: gradeData, error: gradeError } = await supabase
          .from("grades")
          .select("*, tasks(title, week_number)")
          .eq("intern_id", profileId)
          .order("graded_at", { ascending: false });

        if (gradeError) throw gradeError;

        const { data: subs, error: subError } = await supabase
          .from("submissions")
          .select("task_id, repo_link, timeliness")
          .eq("intern_id", profileId);

        if (subError) throw subError;

        const subMap = new Map(
          (subs || []).map((s: any) => [s.task_id, s])
        );

        const merged = (gradeData || []).map((g: any) => ({
          ...g,
          repo_link: subMap.get(g.task_id)?.repo_link || "",
          timeliness: subMap.get(g.task_id)?.timeliness || "on_time",
        }));

        setGrades(merged);
      } catch (err) {
        console.error("Grades fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [profileId]);

  const avgScore = grades.length
    ? Math.round(
        grades.reduce((a, g) => a + (g.score || 0), 0) / grades.length
      )
    : 0;

  const isValidRepo = (url: string) =>
    url.startsWith("https://github.com/");

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            My Grades
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Grades appear here after evaluation
          </p>
        </div>

        {avgScore > 0 && (
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="text-3xl font-bold text-primary">
                {avgScore}%
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Average Score
                </p>
                <p className="text-xs text-muted-foreground">
                  {grades.length} tasks graded
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : grades.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">
                  No grades yet. Grades will appear after evaluation.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Repo Link</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Feedback</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {grades.map((g) => (
                      <TableRow
                        key={`${g.intern_id}-${g.task_id}`}
                      >
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {g.tasks?.title || "Task"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Week {g.tasks?.week_number}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          {g.repo_link && isValidRepo(g.repo_link) ? (
                            <a
                              href={g.repo_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline break-all"
                            >
                              {g.repo_link.replace(
                                "https://github.com/",
                                ""
                              )}
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              g.timeliness === "late"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {g.timeliness === "late"
                              ? "Late"
                              : "On Time"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`text-lg font-bold ${
                              g.score >= 70
                                ? "text-success"
                                : g.score >= 50
                                ? "text-warning"
                                : "text-destructive"
                            }`}
                          >
                            {g.score}%
                          </span>
                        </TableCell>

                        <TableCell className="max-w-[300px]">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {g.feedback || "—"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default InternGrades;
