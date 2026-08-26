import React, { useState } from 'react';
import type { Question, Option } from '../../types';
import { api } from '../../services/api';
import { Upload, Trash2 } from 'lucide-react';

interface QuestionEditorProps {
  gameId: string;
  question?: Question | null;
  onSave: () => void;
  onCancel: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ gameId, question, onSave, onCancel }) => {
  const [text, setText] = useState(question?.text || '');
  const [image, setImage] = useState(question?.image || '');
  const [points, setPoints] = useState(question?.points !== undefined ? question.points : 10);
  const [timeLimit, setTimeLimit] = useState(question?.timeLimit !== undefined ? question.timeLimit : 30);
  
  // Option Count (2 to 6)
  const initialOptions = question?.options || [
    { orderIndex: 0, text: 'Option 1', image: '' },
    { orderIndex: 1, text: 'Option 2', image: '' },
    { orderIndex: 2, text: 'Option 3', image: '' },
    { orderIndex: 3, text: 'Option 4', image: '' }
  ];
  const [options, setOptions] = useState<Partial<Option>[]>(initialOptions);
  
  // Correct Option Index
  const initialCorrectIdx = question?.correctOptionId
    ? initialOptions.findIndex(o => o.id === question.correctOptionId)
    : 0;
  const [correctIdx, setCorrectIdx] = useState<number>(initialCorrectIdx >= 0 ? initialCorrectIdx : 0);

  const [uploading, setUploading] = useState(false);

  // Dynamic Option Count Change (2 to 6)
  const handleOptionCountChange = (count: number) => {
    let newOptions = [...options];
    if (count > newOptions.length) {
      for (let i = newOptions.length; i < count; i++) {
        newOptions.push({
          orderIndex: i,
          text: `Option ${i + 1}`,
          image: ''
        });
      }
    } else if (count < newOptions.length) {
      newOptions = newOptions.slice(0, count);
      if (correctIdx >= count) {
        setCorrectIdx(0);
      }
    }
    setOptions(newOptions);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'question' | number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await api.uploadImage(file);
      if (target === 'question') {
        setImage(url);
      } else {
        const updated = [...options];
        updated[target].image = url;
        setOptions(updated);
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleOptionTextChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx].text = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Please enter question text');
      return;
    }

    try {
      const payload = {
        text: text.trim(),
        image,
        points: Number(points),
        timeLimit: Number(timeLimit),
        options,
        correctOptionIndex: correctIdx
      };

      if (question?.id) {
        await api.updateQuestion(question.id, payload);
      } else {
        await api.addQuestion(gameId, payload);
      }
      onSave();
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 border-cyan-500/30 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="font-heading text-xl font-bold text-white">
          {question ? 'EDIT QUESTION' : 'ADD NEW QUESTION'}
        </h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary text-xs">
            Cancel
          </button>
          <button type="submit" disabled={uploading} className="btn-primary text-xs">
            {question ? 'SAVE CHANGES' : 'SAVE QUESTION'}
          </button>
        </div>
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Question Text *
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Match the original image with its correct edge image."
          className="w-full text-base font-medium"
          required
        />
      </div>

      {/* Question Image Upload */}
      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Question Image (Main Preview)
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {image ? (
            <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-950 flex items-center justify-center group">
              <img src={image} alt="Question" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => setImage('')}
                className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-48 h-32 border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-colors">
              <Upload className="w-6 h-6 text-slate-500 mb-1" />
              <span className="text-xs text-slate-400">Upload Question Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'question')}
                className="hidden"
              />
            </label>
          )}
          <span className="text-xs text-slate-400">Supported: JPG, PNG, WEBP, SVG</span>
        </div>
      </div>

      {/* Question Settings: Options Count, Points, Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            Number of Options (2-6)
          </label>
          <select
            value={options.length}
            onChange={(e) => handleOptionCountChange(Number(e.target.value))}
            className="w-full font-bold"
          >
            <option value={2}>2 Options</option>
            <option value={3}>3 Options</option>
            <option value={4}>4 Options</option>
            <option value={5}>5 Options</option>
            <option value={6}>6 Options</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Points
          </label>
          <select
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="w-full"
          >
            <option value={5}>5 Points</option>
            <option value={10}>10 Points</option>
            <option value={20}>20 Points</option>
            <option value={50}>50 Points</option>
            <option value={100}>100 Points</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Time Limit
          </label>
          <select
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="w-full"
          >
            <option value={0}>No limit</option>
            <option value={10}>10 Seconds</option>
            <option value={15}>15 Seconds</option>
            <option value={20}>20 Seconds</option>
            <option value={30}>30 Seconds</option>
            <option value={60}>60 Seconds</option>
          </select>
        </div>
      </div>

      {/* Dynamic 2-6 Options Builder */}
      <div>
        <h4 className="font-heading text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
          <span>CONFIGURE ANSWER OPTIONS ({options.length})</span>
          <span className="text-xs text-slate-400 font-normal">Select correct option radio button</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.map((opt, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                correctIdx === idx
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading text-xs font-bold text-slate-300">
                  OPTION {idx + 1}
                </span>

                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-cyan-400">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctIdx === idx}
                    onChange={() => setCorrectIdx(idx)}
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                  <span>Correct</span>
                </label>
              </div>

              {/* Option Image Upload */}
              <div className="mb-3">
                {opt.image ? (
                  <div className="relative h-28 rounded-lg overflow-hidden border border-slate-700 bg-black flex items-center justify-center">
                    <img src={opt.image} alt={`Option ${idx + 1}`} className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...options];
                        updated[idx].image = '';
                        setOptions(updated);
                      }}
                      className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="h-28 border border-dashed border-slate-700 hover:border-cyan-400 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-slate-950/60 transition-colors">
                    <Upload className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-[11px] text-slate-400">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, idx)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Option Text */}
              <input
                type="text"
                value={opt.text || ''}
                onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                placeholder={`Optional text for Option ${idx + 1}`}
                className="text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={uploading} className="btn-primary">
          {question ? 'Save Changes' : 'Save Question'}
        </button>
      </div>
    </form>
  );
};
