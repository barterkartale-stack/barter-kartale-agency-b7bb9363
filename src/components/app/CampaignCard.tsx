import { useState } from 'react';
import { ArrowRight, ExternalLink, Sparkles, X } from 'lucide-react';

export type ExtraDetail = { label: string; value: string };
export type LiveCampaign = {
  id: string;
  name: string;
  platform: string;
  incentive_amount: number;
  campaign_link: string;
  is_active: boolean;
  created_at: string;
  brand: string | null;
  category: string;
  product_value: string | null;
  reward_label: string | null;
  image_url: string | null;
  badge_color: string;
  description: string | null;
  slots_left: number | null;
  extra_details: ExtraDetail[] | null;
};

export const BADGE_COLORS = ['mint', 'sky', 'peach', 'lime'];

export function CampaignCard({ campaign }: { campaign: LiveCampaign }) {
  const [open, setOpen] = useState(false);
  const brand = campaign.brand || campaign.name;
  const reward = campaign.reward_label || (campaign.incentive_amount ? `₹${campaign.incentive_amount.toLocaleString('en-IN')}` : 'Keep the product');
  const details = Array.isArray(campaign.extra_details) ? campaign.extra_details.filter((d) => d.label || d.value) : [];
  return (
    <>
      <article className={`campaign-card live-card ${campaign.badge_color}`} onClick={() => setOpen(true)}>
        <div className="campaign-image">
          {campaign.image_url ? <img className="campaign-photo" src={campaign.image_url} alt={campaign.name} loading="lazy" /> : <><div className="image-orb" /><span className="brand-mark">{brand.slice(0, 1).toUpperCase()}</span></>}
          <span className="campaign-tag">{campaign.platform}</span>
          <span className="live-chip"><i /> LIVE</span>
        </div>
        <div className="campaign-details">
          <div className="campaign-meta"><span>{campaign.category}</span>{campaign.product_value && <span>{campaign.product_value} value</span>}</div>
          <h3>{campaign.name}</h3>
          <div className="campaign-reward"><span>Partner outcome</span><strong>{reward}</strong></div>
          {campaign.slots_left !== null && <small className="slots-line">{campaign.slots_left} slots left</small>}
          <button className="card-link">View campaign <ArrowRight size={15} /></button>
        </div>
      </article>
      {open && (
        <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
          <div className="form-modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button>
            {campaign.image_url && <img className="campaign-modal-photo" src={campaign.image_url} alt={campaign.name} />}
            <div className="section-kicker">{brand.toUpperCase()} · {campaign.platform.toUpperCase()}</div>
            <h2>{campaign.name}</h2>
            {campaign.description && <p>{campaign.description}</p>}
            <div className="detail-list">
              <div><span>Category</span><strong>{campaign.category}</strong></div>
              {campaign.product_value && <div><span>Product value</span><strong>{campaign.product_value}</strong></div>}
              <div><span>Partner outcome</span><strong>{reward}</strong></div>
              {details.map((d, i) => <div key={i}><span>{d.label}</span><strong>{d.value}</strong></div>)}
            </div>
            <a className="primary-button full-button" href={campaign.campaign_link} target="_blank" rel="noopener noreferrer"><Sparkles size={16} /> Apply for this campaign <ExternalLink size={15} /></a>
          </div>
        </div>
      )}
    </>
  );
}
