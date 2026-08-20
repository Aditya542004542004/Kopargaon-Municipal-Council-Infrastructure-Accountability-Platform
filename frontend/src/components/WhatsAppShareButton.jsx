import React from 'react';

export default function WhatsAppShareButton({ 
  project = {}, 
  trustIndexScore = 100, 
  physicalPercent = 0, 
  spentPercent = 0 
}) {
  const handleShare = () => {
    const projectName = project.name || project.title || 'Public Infrastructure Project';
    const wardName = project.ward || 'Kopargaon Ward';

    // Pre-formatted official WhatsApp message
    const message = 
`🏛️ *KOPARGAON MUNICIPAL COUNCIL*
*Civic Infrastructure Transparency Update*

📍 *Project:* ${projectName} (${wardName})
⭐ *Trust Index Score:* ${trustIndexScore}/100
🏗️ *Verified Progress:* ${physicalPercent}%
💰 *Budget Spent:* ${spentPercent}%

🔗 *Track Full Project Passport & Audit Trail:*
${window.location.href}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition shadow-sm"
    >
      <span>📲 Share on WhatsApp</span>
    </button>
  );
}