import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ExcelTaskUpload from "@/components/admin/ExcelTaskUpload";

interface Task {
id: string;
title: string;
field: string;
week_number: number;
deadline: string | null;
task_file_url: string | null;
batch_id: string | null;
}

interface Batch {
id: string;
batch_number: number;
title: string;
start_date?: string;
}

const AdminTasks = () => {

const [tasks, setTasks] = useState<Task[]>([]);
const [batches, setBatches] = useState<Batch[]>([]);
const [selectedField, setSelectedField] = useState("all");
const [loading, setLoading] = useState(true);

const { toast } = useToast();

const isValidUrl = (url: string) => {
try {
new URL(url);
return true;
} catch {
return false;
}
};

const calculateDeadline = (task: Task) => {

if (task.deadline) return new Date(task.deadline).toLocaleDateString();

const batch = batches.find((b) => b.id === task.batch_id);

if (!batch?.start_date) return "—";

const start = new Date(batch.start_date);

const deadline = new Date(start);

deadline.setDate(start.getDate() + (task.week_number - 1) * 7);

return deadline.toLocaleDateString();
};

const fetchData = async () => {

setLoading(true);

try {

const [
{ data: batchData, error: batchError },
{ data: taskData, error: taskError },
] = await Promise.all([

supabase
.from("batches")
.select("id, batch_number, title, start_date")
.order("batch_number", { ascending: false }),

supabase
.from("tasks")
.select("*")
.order("week_number", { ascending: true })
.order("field", { ascending: true }),

]);

if (batchError) throw batchError;
if (taskError) throw taskError;

setBatches(batchData || []);
setTasks(taskData || []);

} catch (err) {

console.error(err);

toast({
title: "Error",
description: "Failed to load tasks",
variant: "destructive",
});

} finally {
setLoading(false);
}

};

useEffect(() => {
fetchData();
}, []);

const fields = useMemo(() => {
return [...new Set(tasks.map((t) => t.field))];
}, [tasks]);

const filtered =
selectedField === "all"
? tasks
: tasks.filter((t) => t.field === selectedField);

return (

<AdminLayout>

<div className="space-y-6">

<div className="flex items-center justify-between">

<div>

<h1 className="text-2xl font-bold text-foreground">
Task Management
</h1>

<p className="text-muted-foreground text-sm mt-1">
{tasks.length} total tasks
</p>

</div>

<Button
variant="outline"
size="sm"
onClick={fetchData}
disabled={loading}
>

<RefreshCw
className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
/>

Refresh

</Button>

</div>

<ExcelTaskUpload batches={batches} onUploaded={fetchData} />

<Select value={selectedField} onValueChange={setSelectedField}>

<SelectTrigger className="w-48">
<SelectValue placeholder="Filter by role" />
</SelectTrigger>

<SelectContent>

<SelectItem value="all">
All Roles
</SelectItem>

{fields.map((f) => (

<SelectItem key={f} value={f}>
{f}
</SelectItem>

))}

</SelectContent>

</Select>

<Card>

<CardContent className="p-0">

{loading ? (

<div className="flex items-center justify-center h-32">
<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
</div>

) : (

<div className="overflow-x-auto">

<Table>

<TableHeader>

<TableRow>
<TableHead>Week</TableHead>
<TableHead>Title</TableHead>
<TableHead>Role</TableHead>
<TableHead>Deadline</TableHead>
<TableHead>Task File</TableHead>
</TableRow>

</TableHeader>

<TableBody>

{filtered.length === 0 ? (

<TableRow>

<TableCell
colSpan={5}
className="text-center text-muted-foreground py-8"
>

No tasks found

</TableCell>

</TableRow>

) : (

filtered.map((task) => (

<TableRow key={task.id}>

<TableCell>
<Badge variant="outline">
W{task.week_number}
</Badge>
</TableCell>

<TableCell className="font-medium text-foreground">
{task.title}
</TableCell>

<TableCell>
{task.field}
</TableCell>

<TableCell className="text-xs text-muted-foreground">
{calculateDeadline(task)}
</TableCell>

<TableCell>

{task.task_file_url &&
isValidUrl(task.task_file_url) ? (

<a
href={task.task_file_url}
target="_blank"
rel="noopener noreferrer"
className="text-xs text-primary hover:underline"
>

View

</a>

) : (
"—"
)}

</TableCell>

</TableRow>

))

)}

</TableBody>

</Table>

</div>

)}

</CardContent>

</Card>

</div>

</AdminLayout>

);

};

export default AdminTasks;
