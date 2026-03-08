import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Users, Layers, BookOpen } from "lucide-react";

interface LimitsConfig {
  global_max: number;
  field_limits: Record<string, number>;
}

interface BatchInfo {
  id: string;
  batch_number: number;
  title: string;
  max_seats: number;
  status: string;
  current_count: number;
}

const FIELDS = ["Web Development", "Python/Backend", "Data Science", "Flutter"];

const InternLimitsPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Global limit
  const [globalMax, setGlobalMax] = useState(600);

  // Per-field limits
  const [fieldLimits, setFieldLimits] = useState<Record<string, number>>({
    "Web Development": 200,
    "Python/Backend": 150,
    "Data Science": 150,
    "Flutter": 100,
  });

  // Per-batch limits
  const [batches, setBatches] = useState<BatchInfo[]>([]);

  // Current counts
  const [totalActive, setTotalActive] = useState(0);
  const [fieldCounts, setFieldCounts] = useState<Record<string, number>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch config
      const { data: config } = await supabase
        .from("system_config")
        .select("*")
        .in("key", ["global_max_interns", "field_limits"]);

      if (config) {
        const globalConf = config.find((c) => c.key === "global_max_interns");
        const fieldConf = config.find((c) => c.key === "field_limits");
        if (globalConf) setGlobalMax(Number(globalConf.value));
        if (fieldConf) {
          try {
            setFieldLimits(JSON.parse(fieldConf.value));
          } catch {}
        }
      }

      // Fetch batches with counts
      const { data: batchData } = await supabase
        .from("batches")
        .select("id, batch_number, title, max_seats, status")
        .order("batch_number", { ascending: false });

      if (batchData) {
        const enriched = await Promise.all(
          batchData.map(async (b) => {
            const { count } = await supabase
              .from("intern_profiles")
              .select("*", { count: "exact", head: true })
              .eq("batch_id", b.id)
              .eq("status", "active");
            return { ...b, current_count: count || 0 };
          })
        );
        setBatches(enriched);
      }

      // Total active interns
      const { count: total } = await supabase
        .from("intern_profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      setTotalActive(total || 0);

      // Per-field counts
      const counts: Record<string, number> = {};
      for (const field of FIELDS) {
        const { count } = await supabase
          .from("intern_profiles")
          .select("*", { count: "exact", head: true })
          .eq("field", field)
          .eq("status", "active");
        counts[field] = count || 0;
      }
      setFieldCounts(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveGlobalAndFieldLimits = async () => {
    setSaving(true);
    try {
      // Upsert global limit
      await supabase.from("system_config").upsert(
        { key: "global_max_interns", value: String(globalMax) },
        { onConflict: "key" }
      );

      // Upsert field limits
      await supabase.from("system_config").upsert(
        { key: "field_limits", value: JSON.stringify(fieldLimits) },
        { onConflict: "key" }
      );

      toast({ title: "Saved", description: "Intern limits updated successfully" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save limits", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateBatchSeats = async (batchId: string, maxSeats: number) => {
    try {
      await supabase.from("batches").update({ max_seats: maxSeats }).eq("id", batchId);
      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, max_seats: maxSeats } : b))
      );
      toast({ title: "Updated", description: "Batch seat limit updated" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update batch", variant: "destructive" });
    }
  };

  const getUsagePercent = (current: number, max: number) =>
    max > 0 ? Math.round((current / max) * 100) : 0;

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "text-destructive";
    if (percent >= 70) return "text-yellow-500";
    return "text-emerald-500";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Limit */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Global Intern Cap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Currently <span className="font-semibold text-foreground">{totalActive}</span> / {globalMax} active interns
              </p>
              <p className={`text-xs font-medium ${getUsageColor(getUsagePercent(totalActive, globalMax))}`}>
                {getUsagePercent(totalActive, globalMax)}% capacity
              </p>
            </div>
            <Badge variant={totalActive >= globalMax ? "destructive" : "secondary"}>
              {totalActive >= globalMax ? "Full" : "Open"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[globalMax]}
              onValueChange={([v]) => setGlobalMax(v)}
              min={50}
              max={2000}
              step={50}
              className="flex-1"
            />
            <Input
              type="number"
              value={globalMax}
              onChange={(e) => setGlobalMax(Number(e.target.value))}
              className="w-24"
              min={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-Field Limits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Per-Field Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FIELDS.map((field) => {
            const current = fieldCounts[field] || 0;
            const limit = fieldLimits[field] || 150;
            const percent = getUsagePercent(current, limit);
            return (
              <div key={field} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{field}</Label>
                  <span className={`text-xs font-medium ${getUsageColor(percent)}`}>
                    {current} / {limit} ({percent}%)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[limit]}
                    onValueChange={([v]) =>
                      setFieldLimits((prev) => ({ ...prev, [field]: v }))
                    }
                    min={10}
                    max={500}
                    step={10}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) =>
                      setFieldLimits((prev) => ({
                        ...prev,
                        [field]: Number(e.target.value),
                      }))
                    }
                    className="w-20"
                    min={1}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Save Global + Field */}
      <div className="flex justify-end">
        <Button onClick={saveGlobalAndFieldLimits} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Limits"}
        </Button>
      </div>

      {/* Per-Batch Limits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5 text-primary" />
            Per-Batch Seat Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {batches.map((batch) => {
            const percent = getUsagePercent(batch.current_count, batch.max_seats);
            return (
              <div key={batch.id} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      Batch {batch.batch_number}: {batch.title}
                    </p>
                    <Badge variant={batch.status === "active" ? "default" : "secondary"} className="text-[10px]">
                      {batch.status}
                    </Badge>
                  </div>
                  <p className={`text-xs ${getUsageColor(percent)}`}>
                    {batch.current_count} / {batch.max_seats} seats ({percent}%)
                  </p>
                </div>
                <Input
                  type="number"
                  value={batch.max_seats}
                  onChange={(e) =>
                    setBatches((prev) =>
                      prev.map((b) =>
                        b.id === batch.id
                          ? { ...b, max_seats: Number(e.target.value) }
                          : b
                      )
                    )
                  }
                  className="w-24"
                  min={1}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateBatchSeats(batch.id, batch.max_seats)}
                >
                  Update
                </Button>
              </div>
            );
          })}
          {batches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No batches found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InternLimitsPanel;
