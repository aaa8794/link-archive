import emailjs from '@emailjs/browser';
import { Link } from '../types';

// EmailJS 설정값 - 나중에 본인 값으로 교체
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'YOUR_SERVICE_ID',
  TEMPLATE_ID: 'YOUR_TEMPLATE_ID',
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY',
};

export const sendReminder = async (toEmail: string, links: Link[]): Promise<void> => {
  const saved = links.filter((l) => l.stage === 'saved');
  const inProgress = links.filter((l) => l.stage === 'in-progress');

  const linkList = [
    saved.length > 0
      ? `📌 저장된 링크 (${saved.length}개)\n` +
        saved.map((l) => `- ${l.title}: ${l.url}`).join('\n')
      : '',
    inProgress.length > 0
      ? `🔄 진행중인 링크 (${inProgress.length}개)\n` +
        inProgress.map((l) => `- ${l.title}: ${l.url}`).join('\n')
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  await emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    EMAILJS_CONFIG.TEMPLATE_ID,
    {
      to_email: toEmail,
      link_count: saved.length + inProgress.length,
      link_list: linkList || '링크가 없어요.',
    },
    EMAILJS_CONFIG.PUBLIC_KEY
  );
};
