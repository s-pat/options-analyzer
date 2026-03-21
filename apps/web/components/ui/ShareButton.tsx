'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { buildShareUrl } from '@/lib/shareUtils';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  contractSymbol: string;
  /** Extra CSS classes */
  className?: string;
  /** Compact icon-only variant */
  iconOnly?: boolean;
}

export function ShareButton({ contractSymbol, className, iconOnly = false }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');

  async function handleShare() {
    const url = buildShareUrl(contractSymbol);

    // Use native Web Share API on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({ url, title: 'Check out this option on OptionLabs' });
        return;
      } catch {
        // User cancelled or API unavailable — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      // Clipboard API unavailable (e.g. HTTP in some browsers)
      setState('idle');
    }
  }

  const isCopied = state === 'copied';

  return (
    <button
      onClick={handleShare}
      aria-label="Copy shareable link"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border transition-all duration-200 select-none',
        isCopied
          ? 'border-green-500/40 bg-green-500/10 text-green-400'
          : 'border-white/[0.1] bg-white/[0.04] text-white/50 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400',
        iconOnly ? 'p-1.5' : 'px-2.5 py-1.5 text-[11px] font-medium',
        className,
      )}
    >
      {isCopied ? (
        <Check className="h-3 w-3 shrink-0" />
      ) : iconOnly ? (
        <Share2 className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 shrink-0" />
      )}
      {!iconOnly && (isCopied ? 'Copied!' : 'Share')}
    </button>
  );
}
