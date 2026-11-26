'use client';

import { useEffect, useState } from 'react';
import { Check, Share2, X } from 'lucide-react';

export default function ShareButton({ recipe }: { recipe?: { id: string; title: string } }) {
  const label = recipe ? '分享菜谱' : '分享网站';
  const [copied, setCopied] = useState(false);
  const [manualLink, setManualLink] = useState('');

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 3500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function share() {
    const url = new URL('/', window.location.origin);
    if (recipe) url.searchParams.set('recipe', recipe.id);
    const title = recipe ? recipe.title + ' · 食来运转' : '食来运转 · 今天一起好好吃饭';
    setManualLink('');
    if (navigator.share) {
      try {
        await navigator.share({ title, url: url.href });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
    } catch {
      setManualLink(url.href);
    }
  }

  return <div className={'site-share' + (recipe ? ' recipe-share' : ' header-share')}>
    <button type="button" className={recipe ? 'secondary-button' : 'share-trigger'} onClick={share} aria-label={label} title={label}>
      <Share2 size={18} aria-hidden="true"/><span>{label}</span>
    </button>
    <span className="share-feedback" role="status">{copied && <><Check size={14}/>已复制链接</>}</span>
    {manualLink && <div className="share-manual">
      <label>复制链接发给朋友<input readOnly value={manualLink} onFocus={event => event.currentTarget.select()}/></label>
      <button type="button" aria-label="收起分享链接" onClick={() => setManualLink('')}><X size={18}/></button>
    </div>}
  </div>;
}
