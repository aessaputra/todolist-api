// CRUD Task milik user login + filter (?done=&tag=), pagination (?page=&limit=), sorting (?sort=)

const mongoose = require('mongoose');
const Task = require('../models/Task');

// Helper: parse boolean dari string
function parseBool(v) {
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase().trim();
  if (['true', '1', 'yes', 'y'].includes(s)) return true;
  if (['false', '0', 'no', 'n'].includes(s)) return false;
  return undefined; // abaikan jika tidak jelas
}

// Helper: sanitize sorting agar aman
// terima: sort=dueDate atau sort=-dueDate atau multi "createdAt,-dueDate"
function buildSort(sortParam) {
  if (!sortParam) return '-createdAt';
  const allow = new Set(['title', 'done', 'dueDate', 'createdAt', 'updatedAt']);
  const parts = String(sortParam)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('-') ? p : `+${p}`)); // tandai plus/minus eksplisit

  const cleaned = [];
  for (const p of parts) {
    const field = p.slice(1);
    if (allow.has(field)) {
      cleaned.push(p[0] === '-' ? `-${field}` : field);
    }
  }
  return cleaned.length ? cleaned.join(' ') : '-createdAt';
}

// Helper: pick field yang boleh diupdate
function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(obj || {}, k)) out[k] = obj[k];
  });
  return out;
}

// GET /api/tasks
exports.listTasks = async (req, res, next) => {
  try {
    const { done, tag, page = 1, limit = 10, sort } = req.query;

    const filter = { userId: req.user.id };
    const doneBool = parseBool(done);
    if (doneBool !== undefined) filter.done = doneBool;

    if (tag) {
      // dukung multi tag: tag=work,home → cari task yang punya salah satu
      const tags = String(tag)
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (tags.length) {
        filter.tags = { $in: tags };
      }
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const sortSpec = buildSort(sort);

    const [items, total] = await Promise.all([
      Task.find(filter).sort(sortSpec).skip(skip).limit(limitNum),
      Task.countDocuments(filter),
    ]);

    res.json({
      data: items,
      meta: {
        page: pageNum,
        limit: limitNum,
        totalItems: total,
        totalPages: Math.ceil(total / limitNum) || 1,
        sort: sortSpec,
        filter: { done: doneBool, tag: tag ?? null },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, done, dueDate, tags } = req.body || {};
    if (!title) {
      return res.status(400).json({ message: 'title wajib diisi' });
    }

    const task = await Task.create({
      title,
      done: parseBool(done) ?? false,
      dueDate: dueDate || null,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      userId: req.user.id,
    });

    res.status(201).json({ message: 'Task dibuat', data: task });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID tidak valid' });
    }

    const task = await Task.findOne({ _id: id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task tidak ditemukan' });

    res.json({ data: task });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID tidak valid' });
    }

    const updatesRaw = pick(req.body, ['title', 'done', 'dueDate', 'tags']);
    if ('done' in updatesRaw) updatesRaw.done = parseBool(updatesRaw.done);
    if ('tags' in updatesRaw && !Array.isArray(updatesRaw.tags)) {
      updatesRaw.tags = updatesRaw.tags ? [updatesRaw.tags] : [];
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updatesRaw,
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ message: 'Task tidak ditemukan' });
    res.json({ message: 'Task diperbarui', data: task });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID tidak valid' });
    }

    const task = await Task.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task tidak ditemukan' });

    res.json({ message: 'Task dihapus', data: { id: task.id } });
  } catch (err) {
    next(err);
  }
};
