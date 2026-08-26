import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Copy, Check } from 'lucide-react';

interface QRModalProps {
  joinUrl: string;
  gameCode: string;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ joinUrl, gameCode, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-6 text-center border-cyan-500/30 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 rounded-full bg-cyan-500/10 text-cyan-400 mb-3">
          <QrCode className="w-8 h-8" />
        </div>

        <h3 className="font-heading text-xl font-bold text-white mb-1">SCAN TO JOIN GAME</h3>
        <p className="text-sm text-slate-400 mb-6">
          Participants can point their camera at this QR code or enter Room Code <span className="font-mono text-cyan-300 font-bold">{gameCode}</span>
        </p>

        <div className="bg-white p-5 rounded-2xl inline-block shadow-xl shadow-cyan-500/20 mb-6">
          <QRCodeSVG value={joinUrl} size={220} level="H" includeMargin={true} />
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-2 font-mono text-xs text-slate-300">
          <span className="truncate">{joinUrl}</span>
          <button
            onClick={copyUrl}
            className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5 shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};
