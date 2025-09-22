import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    params: { type: mongoose.Schema.Types.Mixed },
    result: { type: mongoose.Schema.Types.Mixed },
    progress: { type: Number, default: 0 }
});

// 创建索引以提高查询效率
taskSchema.index({ status: 1, createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);

export { Task };