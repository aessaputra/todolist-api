// menyimpan tugas milik user + dukungan filter/pagination/sorting

const mongoose = require('mongoose');

const normalizeTags = (v) => {
  if (!Array.isArray(v)) return [];
  // normalisasi: trim + lowercase + unik
  const cleaned = v.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  return [...new Set(cleaned)];
};

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    done: {
      type: Boolean,
      default: false,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      set: normalizeTags,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Index komposit untuk query umum: by user + done + dueDate (dan fallback createdAt)
taskSchema.index({ userId: 1, done: 1, dueDate: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
