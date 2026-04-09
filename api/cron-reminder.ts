import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

const INTERVALS = [
  { days: 3, label: '3일' },
  { days: 7, label: '7일' },
  { days: 14, label: '2주' },
  { days: 30, label: '한 달' },
];

export default async function handler(req: any, res: any) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  const now = new Date();

  // 모든 사용자 이메일 목록 가져오기
  const { data: users } = await supabase
    .from('links')
    .select('user_email')
    .neq('stage', 'done');

  if (!users || users.length === 0) return res.status(200).json({ sent: 0 });

  const uniqueEmails = [...new Set(users.map((u: any) => u.user_email))];
  let sentCount = 0;

  for (const email of uniqueEmails) {
    const { data: links } = await supabase
      .from('links')
      .select('*')
      .eq('user_email', email)
      .neq('stage', 'done');

    if (!links || links.length === 0) continue;

    // 각 인터벌에 해당하는 링크 필터링
    for (const interval of INTERVALS) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - interval.days);

      const staleLinks = links.filter((link: any) => {
        const updated = new Date(link.updated_at);
        const diffDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays === interval.days;
      });

      if (staleLinks.length === 0) continue;

      const linkListHtml = staleLinks
        .map((l: any) => `<li><a href="${l.url}">${l.title}</a></li>`)
        .join('');

      await resend.emails.send({
        from: 'Link Archive <onboarding@resend.dev>',
        to: email,
        subject: `📌 ${interval.label}째 방치된 링크가 ${staleLinks.length}개 있어요`,
        html: `
          <h2>링크를 넣어두고 또 방치하지 않았나요?👀</h2>
          <p>${interval.label}째 확인하지 않은 링크가 <strong>${staleLinks.length}개</strong> 있어요.</p>
          <ul>${linkListHtml}</ul>
          <p><a href="https://link-archive-rouge.vercel.app">Link Archive에서 확인하기 →</a></p>
        `,
      });

      sentCount++;
    }
  }

  return res.status(200).json({ sent: sentCount });
}
