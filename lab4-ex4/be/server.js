// server.js - Task Manager REST API (in-memory storage) - FIXED version
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5002;

// Allow the Web UI to call this API from another origin
// FIX #1: the UI runs on Live Server (http://127.0.0.1:5500), not on localhost:3000
// FIX #2: PUT and DELETE (and the OPTIONS preflight) must be allowed too
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// FIX #3: parse JSON request bodies, otherwise req.body is undefined
app.use(express.json());

// ---------- In-memory "database" ----------
let tasks = [
  { id: 1, title: 'Read the Express routing docs', done: true, createdAt: '2026-09-20T08:00:00.000Z' },
  { id: 2, title: 'Install Postman', done: false, createdAt: '2026-09-21T09:30:00.000Z' },
  { id: 3, title: 'Finish Lab 4 exercise 3', done: false, createdAt: '2026-09-22T14:15:00.000Z' },
  { id: 4, title: 'Review HTTP status codes', done: false, createdAt: '2026-09-23T10:45:00.000Z' }
];
let nextId = 5;

// Shape a task for the API response
// FIX #4: the contract (and the UI) use "title", not "name"
const toDto = (task) => ({
  id: task.id,
  title: task.title,
  done: task.done,
  createdAt: task.createdAt
});

// ---------- Routes ----------

// GET /api/tasks?status=all|active|done
app.get('/api/tasks', (req, res) => {
  const { status } = req.query;

  if (status === 'active') {
    return res.json({ success: true, data: tasks.filter((t) => !t.done).map(toDto) });
  }

  // FIX #5: this branch only logged and never sent a response -> request stuck in (pending)
  if (status === 'done') {
    const doneTasks = tasks.filter((t) => t.done);
    console.log(`Found ${doneTasks.length} completed task(s)`);
    return res.json({ success: true, data: doneTasks.map(toDto) });
  }

  if (!status || status === 'all') {
    return res.json({ success: true, data: tasks.map(toDto) });
  }

  // any other value used to hang as well
  return res.status(400).json({ success: false, message: 'status must be all, active or done' });
});

// GET /api/tasks/stats
// FIX #6: "done" and "active" were swapped
app.get('/api/tasks/stats', (req, res) => {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const active = tasks.filter((t) => !t.done).length;
  res.json({ success: true, data: { total, active, done } });
});

// POST /api/tasks  body: { title }
app.post('/api/tasks', (req, res) => {
  const { title } = req.body;

  // FIX #7: "return" was missing, so after the 400 the code went on, created
  // a blank task and crashed with "Cannot set headers after they are sent"
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const task = {
    id: nextId++,
    title: title.trim(),
    done: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  res.status(201).json({ success: true, data: toDto(task) });
});

// PUT /api/tasks/:id  body: { title?, done? }
app.put('/api/tasks/:id', (req, res) => {
  // FIX #8: req.params.id is a string ("2") and t.id is a number (2), so === never matched
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const { title, done } = req.body;
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    task.title = title.trim();
  }
  // FIX #9: "req.body.done || task.done" can never set done back to false
  if (typeof done === 'boolean') {
    task.done = done;
  }
  res.json({ success: true, data: toDto(task) });
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  // FIX #10: splice() needs the array INDEX, not the task id
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  tasks.splice(index, 1);
  res.json({ success: true, message: 'Task deleted' });
});

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
});
