'use client';

import React from 'react';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Mail, Phone } from 'lucide-react';

interface Social {
  type: string;
  url: string;
  color?: string;
}

interface BoardMember {
  name: string;
  title: string;
  image: string;
  socials: Social[];
}

interface BoardMemberCardProps {
  member: BoardMember;
  variant?: 'full' | 'compact';
}

const getSocialIcon = (type: string) => {
  switch (type) {
    case 'facebook': return <Facebook className="w-4 h-4" />;
    case 'instagram': return <Instagram className="w-4 h-4" />;
    case 'twitter': return <Twitter className="w-4 h-4" />;
    case 'youtube': return <Youtube className="w-4 h-4" />;
    case 'linkedin': return <Linkedin className="w-4 h-4" />;
    case 'email': return <Mail className="w-4 h-4" />;
    case 'phone': return <Phone className="w-4 h-4" />;
    default: return null;
  }
};

export default function BoardMemberCard({ member, variant = 'full' }: BoardMemberCardProps) {
  if (variant === 'compact') {
    return (
      <a
        href={member.socials.find(s => s.type === 'email')?.url || '#'}
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
      >
        <img src={member.image} alt={member.name} className="w-14 h-16 object-cover rounded-lg border-2 border-gray-100" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 group-hover:text-mhma-gold transition-colors truncate">{member.name}</p>
          <p className="text-xs text-mhma-gold uppercase tracking-wide truncate">{member.title}</p>
        </div>
        <Mail className="w-4 h-4 text-gray-400 group-hover:text-mhma-gold shrink-0 transition-colors" />
      </a>
    );
  }

  return (
    <div className="text-center">
      <div className="relative mb-3 mx-auto w-48 h-56 overflow-hidden rounded shadow-lg border-4 border-gray-100">
        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
      </div>
      <div className="bg-white p-6 border border-gray-100 rounded shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
        <p className="text-mhma-gold text-sm uppercase tracking-wide mb-4">{member.title}</p>
        <div className="flex justify-center space-x-3">
          {member.socials.map((social, idx) => (
            <a
              key={idx}
              href={social.url}
              target={social.type !== 'email' && social.type !== 'phone' ? '_blank' : undefined}
              rel={social.type !== 'email' && social.type !== 'phone' ? 'noopener noreferrer' : undefined}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-mhma-gold hover:text-white flex items-center justify-center transition-colors text-gray-600"
              style={{ color: social.color }}
              aria-label={social.type}
            >
              {getSocialIcon(social.type)}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
